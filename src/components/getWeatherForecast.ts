//import { create } from "nouislider";
import { createElement, HandleUrlParameters, round } from "./helpers";
import { ResortMap } from "./../index";
import * as L from "leaflet";
import 'leaflet/dist/images/marker-icon.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

export interface IForecastResponse {
    operationalMode: string;
    srsName: string;
    creationDate: Date;
    creationDateLocal: string;
    productionCenter: string;
    credit: string;
    moreInformation: string;
    location: Location;
    time: Time;
    data: Data;
    currentobservation: Currentobservation;
}

export interface Currentobservation {
    id: string;
    name: string;
    elev: string;
    latitude: string;
    longitude: string;
    Date: string;
    Temp: string;
    Dewp: string;
    Relh: string;
    Winds: string;
    Windd: string;
    Gust: string;
    Weather: string;
    Weatherimage: string;
    Visibility: string;
    Altimeter: string;
    SLP: string;
    timezone: string;
    state: string;
    WindChill: string;
}

export interface Data {
    temperature: string[];
    pop: Array<null | string>;
    weather: string[];
    iconLink: string[];
    hazard: string[];
    hazardUrl: string[];
    text: string[];
}

export interface Location {
    region: string;
    latitude: string;
    longitude: string;
    elevation: string;
    wfo: string;
    timezone: string;
    areaDescription: string;
    radar: string;
    zone: string;
    county: string;
    firezone: string;
    metar: string;
}

export interface Time {
    layoutKey: string;
    startPeriodName: string[];
    startValidTime: Date[];
    tempLabel: TempLabel[];
}

export enum TempLabel {
    High = "High",
    Low = "Low",
}

//http://127.0.0.1:5501/dist/?lat=46.591&lng=-113.721&zoom=12&forecasts=[[46.595,-113.74],[46.5966122,-113.7523364],[46.5966122,-113.7523364],[46.5814935,-113.6871888]]

export const getWeatherForecast = async (lat:number, lng:number) => {
    console.log("fetching forecast location...")
    /*
    let getNoaaForecast = await fetch(noaaApiRespornse.properties.forecast);
    let forecast = await getNoaaForecast.json();
    */
    let getNoaaForecast = await fetch(`https://forecast.weather.gov/MapClick.php?lon=${lng}1&lat=${lat}&FcstType=json`);
    let forecast = await getNoaaForecast.json();

    //console.log(forecast)

    return forecast;
}

export const createSnowForecastArray = (forecast: IForecastResponse) => {
    let pattern = /New snow accumulation of (\w|\s)*\./gi;
    let snowAmountPattern = /(\d+ to \d+)|(around (one|an))|(of less than (\w|\s)+ inch(es)?)/gi


    interface snowForecastArrayElement {
        period: any;
        forecast: string;
        low: number;
        high: number;
        cumLow?: number;
        cumHigh?: number
    }

    let snowForecastArray: snowForecastArrayElement[] = [];
    let includeRest = false; // to keep track as we trim extraneous entries from the end

    for (let i = forecast.data.text.length - 1; i >= 0; i--) {

        let snowString: string | RegExpMatchArray = forecast.data.text[i].match(pattern);
        snowString = snowString ? snowString.toString() : "No snow expected.";
        let snowAmount: string | string[] | number[] | RegExpMatchArray = snowString.match(snowAmountPattern);
        snowAmount = snowAmount ? snowAmount.toString() : "0 to 0";

        snowAmount = snowAmount.replace(/.*one quanter of one/, ' 0 to .25');
        snowAmount = snowAmount.replace(/.*one third of one/, ' 0 to .25');
        snowAmount = snowAmount.replace(/.*(a )?half (an )?inch/, '0 to .5');
        snowAmount = snowAmount.replace(/.*around (an)|(one) inch/, '1 to 1');
        snowAmount = snowAmount.replace(/.*less than one/, '0 to 1');
        
        snowAmount = snowAmount.replace(/to/, '|');

        snowAmount = snowAmount.replace(/[a-zA-Z]+/g, '');

        snowAmount = snowAmount.split(' | ').map(x => parseFloat(x) || 0)



        if (includeRest) {

            let output = { period: forecast.time.startPeriodName[i], forecast: snowString, low: snowAmount[0], high: snowAmount[1] }

            snowForecastArray.push(output)
            continue;

        } else {
            if (snowString == "No snow expected.") continue;
            else {
                includeRest = true;


                let output = { period: forecast.time.startPeriodName[i], forecast: snowString, low: snowAmount[0], high: snowAmount[1] }

                snowForecastArray.push(output)
                continue;
            }
            continue;
        }
    }

    snowForecastArray = snowForecastArray.reverse();

    snowForecastArray.forEach((x, i, arr) => {
        if (i === 0) {
            x.cumHigh = x.high;
            x.cumLow = x.low;
        }
        else {
            x.cumHigh = arr[i - 1].cumHigh + x.high;
            x.cumLow = arr[i - 1].cumLow + x.low;
        }

    })
    return snowForecastArray;
}

export const createSnowForecastTable = (forecast: IForecastResponse) => {

    let snowForecastArray = createSnowForecastArray(forecast);

    let htmlOutput = createElement({ tag: 'div', parent: undefined, options: { className: "snow-forecast" } });
    
    
    if(snowForecastArray.length == 0){
        let noSnowMessage = createElement({ tag: 'h3', parent: htmlOutput, options: { text: '🙁 No snow in the forecast 🙁' } })
    } else {
        let maxSnow = Math.floor(snowForecastArray[snowForecastArray.length - 1].cumHigh)
        let snowEmoji = `❄️`.repeat(Math.floor(maxSnow/6) + 1);
        let snowEmojis: string;
        let snowMessage:string;
        if (maxSnow <= 2) snowMessage = '❄️ Some flurries are headed this way ❄️'
        else snowMessage = `${snowEmoji} Up to ${maxSnow} inches expected${maxSnow >= 6 ? '!' : ""} ${snowEmoji}`
        let title = createElement({ tag: 'h3', parent: htmlOutput, options: { text: snowMessage } })
        let table = createElement({ tag: 'table', parent: htmlOutput });
        let header = createElement({ tag: 'tr', parent: table });
        createElement({ tag: 'th', parent: header, options: { text: "Time" } });
        createElement({ tag: 'th', parent: header, options: { text: "Snow Forecast" } });
        createElement({ tag: 'th', parent: header, options: { text: "Cummulative Forecast" } });

        for(let period of snowForecastArray){
            //console.log(period);
            let row = createElement({ tag: 'tr', parent: table });
            createElement({ tag: 'td', parent: row, options: { text: period.period } });
            createElement({ tag: 'td', parent: row, options: { text: period.forecast } });
            createElement({ tag: 'td', parent: row, options: { text: `${period.cumLow} to ${period.cumHigh} inches`.replace('1 to 1', 'Around 1').replace('2 to 2', 'Around 2').replace('3 to 3', 'Around 3').replace('1 inches', '1 inch') } });
        }
    }

    return htmlOutput;

}

export const addForecastToMap = (data: IForecastResponse, map:L.Map, addToUrl:boolean=true, addPopup:boolean=true) => {
    //console.log(data)

    //console.log("Polygon Coordiantes: ", data.geometry.geometries[1].coordinates[0])

    /*
    let latlngs = data.geometry.geometries[1].coordinates[0];
    latlngs = latlngs.map((arr: number[]) => arr.reverse())
    */
    let htmlOutput = createSnowForecastTable(data)

    let removeForecast = createElement({ tag: 'button', parent: htmlOutput, options: { text: "Remove Forecast" } });

    removeForecast.setAttribute('type', 'button');



    let forecastLayer = L.layerGroup();
    
    let ptlatlng =  new L.LatLng(parseFloat(data.location.latitude), parseFloat(data.location.longitude)) // [data.location.latitude, data.location.longitude];
    let forecastPopup = L.popup().setLatLng(ptlatlng).setContent(htmlOutput)
    let forecastMarker = L.marker(ptlatlng)
        .bindPopup(forecastPopup, { closeOnClick: false, autoClose: false })
        //.addTo(forecastLayer);

    let urlControl = new HandleUrlParameters(map);
    let duplicate = urlControl.isForecastInUrl([ptlatlng.lat, ptlatlng.lng]);

        htmlOutput.addEventListener('click', () => {
            forecastPopup.bringToFront();
        })
    ptlatlng.toString()
    // let polygon = new L.Polygon(latlngs, { color: 'blue' }).addTo(forecastLayer);


    if (!duplicate || addPopup) {
        forecastMarker.addTo(forecastLayer);
        forecastLayer.addTo(map);

        map.openPopup(forecastPopup);

        htmlOutput.parentNode.parentNode.addEventListener('click', () => {
            forecastPopup.bringToFront();
        })

    }

    if (addToUrl && !duplicate) urlControl.addForecast([ptlatlng.lat,ptlatlng.lng])

    removeForecast.addEventListener('click', (e) => {
        let params = urlControl.get();
        urlControl.removeForecast([round(ptlatlng.lat,2), round(ptlatlng.lng,2)])
        map.removeLayer(forecastLayer);
    })

}

export const createFullForecastTable = (data:any) => {

    let cumulativeSnowForecast = createSnowForecastTable(data);

    let forecastBox = document.getElementById('full-forecast-box')

    if(forecastBox) forecastBox.parentNode.removeChild(forecastBox);

    let forecastContainer = document.createElement("div")
    forecastContainer.setAttribute('id', "full-forecast-box")

    forecastContainer.appendChild(cumulativeSnowForecast)

    let table = createElement({ tag: "table", parent: forecastContainer, options: { id: 'detailed-forecast' } })

    let header = createElement({ tag: 'tr', parent: table })

    createElement({ tag: 'th', parent: header, options: { text: "" } })
    createElement({ tag: 'th', parent: header, options: { text: "Temp" } })
    createElement({ tag: 'th', parent: header, options: { text: "Forecast" } })
    // createElement('th',header, {text: "Wind" })

    for(let i  in data.data.period){

        //console.log(i, data.time.startPeriodName[i])
        let row = createElement({ tag: "tr", parent: table }); 

        let name = createElement({ tag: "td", parent: row, options: { text: data.time.startPeriodName[i] } });

        let temp = createElement({ tag: 'td', parent: row, options: { text: data.data.temperature[i] + '&deg;F' } })

        let forecast = createElement({
            tag: 'td', parent: row, options: {
                text: data.data.text[i].replace(/((\w|\s)*?snow.*?\.|(\w|\s)*?wind chill.*?\.|gusts.*?\.)/gi, "<strong>$1</strong>")
            }
            });
    }

    return forecastContainer;
}

export const appendForecastTable = async (data: any) => {    
    let forecastContainer = await createFullForecastTable(data)

    document.body.appendChild(forecastContainer)

    return forecastContainer
}


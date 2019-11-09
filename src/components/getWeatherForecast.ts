//import { create } from "nouislider";
import { createElement, HandleUrlParameters, round, CreateElement } from "./helpers";
import { ResortMap } from "./../index";
import * as L from "leaflet";
import * as d3 from 'd3';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.min.js';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet/dist/images/marker-icon.png';
import { ScaleLinear } from "d3";

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

export class handleWeatherData {
    constructor(){
            //.domain([30, 35, 40])
            //.range(["#3303E7", "#9702F7", "#FD0202"]);
    }
    
    margin = { top: 10, right: 10, bottom: 40, left: 30 };
    width = 400 - this.margin.right;
    height = 200 - this.margin.bottom;

    tempScale = d3.scaleLinear();
    snowScale = d3.scaleLinear();

    colorScale = d3.scaleLinear<string>()
        .domain([30, 35, 45])
        .range(["#3303E7", "#82046E", "#FD0202"]);

    timeScale(firstDate:Date, 
        lastDate:Date){
        return d3.scaleTime()
            .domain([new Date(firstDate), new Date(lastDate)])
            .range([this.margin.left, this.width]);
    }

    boldImportant(text:string){
        return text.replace(/((\w|\s)*?snow.*?\.|(\w|\s)*?wind chill.*?\.|gusts?.*?\.)/gi, "<strong>$1</strong>");
    }

    async getForecast(lat: number, lng: number) {
        /*
        let getNoaaForecast = await fetch(noaaApiRespornse.properties.forecast);
        let forecast = await getNoaaForecast.json();
        */
        let getNoaaForecast = await fetch(`https://forecast.weather.gov/MapClick.php?lon=${lng}1&lat=${lat}&FcstType=json`);
        let forecast = await getNoaaForecast.json();

        // let forecastDiscussionCall = await fetch(`https://forecast.weather.gov/product.php?site=NWS&issuedby=SGX&product=AFD&format=TXT&version=1&glossary=1`)
        //let forecastDisc = await forecastDiscussionCall.json();

        //let getNoaaDevApi = await fetch(`https://api.weather.gov/points/${lat},${lng}`)
        //let noaaDevApiResponse = await getNoaaDevApi.json()



        //console.log("Dev API response: ", noaaDevApiResponse)
        console.log("Production Forecast: ", forecast)

        return forecast;
    }

    parseSnowData(forecast: IForecastResponse) {
        let pattern = /New snow accumulation of (\w|\s)*\./gi;
        let snowAmountPattern = /(\d+ to \d+)|(around (one|an))|(of less than (\w|\s)+ inch(es)?)/gi


        interface snowForecastArrayElement {
            details: string;
            period: any;
            forecast: string;
            low: number;
            high: number;
            time: Date;
            cumLow?: number;
            cumHigh?: number;
            cumAvg?: number;
            i?: number;

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

            snowAmount = snowAmount.split(' | ').map(x => parseFloat(x) || 0);
            let avg = (snowAmount[0] + snowAmount[1])/2

            let output = { period: forecast.time.startPeriodName[i], forecast: snowString, details: forecast.data.text[i], low: snowAmount[0], average: avg, high: snowAmount[1], time: forecast.time.startValidTime[i], i: i }

            snowForecastArray.push(output)
        }

        snowForecastArray = snowForecastArray.reverse();

        snowForecastArray.forEach((x, i, arr) => {
            if (i === 0) {
                x.cumHigh = x.high;
                x.cumLow = x.low;
                x.cumAvg = (x.high + x.low) / 2;
            }
            else {
                x.cumHigh = arr[i - 1].cumHigh + x.high;
                x.cumLow = arr[i - 1].cumLow + x.low;
                x.cumAvg = (x.cumHigh + x.cumLow) / 2;
            }

        })
        return snowForecastArray;
    }

    createForecastHeader(forecast: IForecastResponse) {
        let snowForecastArray = this.parseSnowData(forecast);
        let htmlOutput = createElement({ tag: 'div', parent: undefined, options: { className: "snow-forecast" } });
        let snowMessage: string;

        if (snowForecastArray[snowForecastArray.length - 1].cumHigh === 0) {
            snowMessage = '🙁 No snow in the forecast 🙁';
        } else {
            let maxSnow = Math.floor(snowForecastArray[snowForecastArray.length - 1].cumHigh)
            let minSnow = Math.floor(snowForecastArray[snowForecastArray.length - 1].cumLow)
            let snowEmoji = `❄️`.repeat(Math.floor(maxSnow / 6) + 1);
            
            snowMessage = `${snowEmoji} ${minSnow}-${maxSnow} inches expected${maxSnow >= 6 ? '!' : ""} ${snowEmoji}`
        }

        snowMessage = snowMessage
            .replace('1-1', "Around 1")
            .replace('2-2', "Around 2")
            .replace('0-0 inches', "Some flurries")
            .replace(/0-(\d)\1 inch(es)?/, "Up to $1 inches")
            .replace('1 inches', '1 inch')

        createElement({tag: 'h3', parent: htmlOutput, options: {text: snowMessage, style: "font-size: .9rem; margin: 5px;"}})
        

        return htmlOutput;

    }


    createTempGraph(selector: HTMLElement, forecast: IForecastResponse) {

        let lowData: any[] = [],
            allData: any[] = [],
            highData: any[] = [];


        for(let i =0; i<forecast.data.text.length; i++){
            let time = forecast.time.startValidTime[i],
                temp = parseInt(forecast.data.temperature[i]),
                highLow = forecast.time.tempLabel[i];
            if(highLow === "Low") lowData.push([time, temp])
            if(highLow === "High") highData.push([time, temp])
            allData.push([time,temp])
        }


        let svg = d3.select(selector)
            .append("svg")
            .attr('id', 'temp-graph')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 400 200`)
            .style("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .classed("svg-content", true);

        let maxTemp = Math.max(...highData.map(x => x[1]));
        let minTemp = Math.min(...lowData.map(x => x[1]));

        this.tempScale = d3.scaleLinear()
            .domain([minTemp, maxTemp])
            .range([this.height, this.margin.top]);
        let graph = svg.append("g")
            .attr('transform', `translate(${this.margin.left}, 0)`)
            .call(d3.axisLeft(this.tempScale).ticks(Math.round(maxTemp / 10)));

        let firstDate = forecast.time.startValidTime[0];
        let lastDate = forecast.time.startValidTime[forecast.time.startValidTime.length - 1];

        let xScale = d3.scaleTime()
            .domain([new Date(firstDate), new Date(lastDate)])
            .range([this.margin.left, this.width]);
        let xAxis = d3.axisBottom(xScale).ticks(d3.timeDay, 1).tickFormat(d3.timeFormat('%a %d'));

        svg.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        let strokeDefs = svg.append("defs");

        let gradient = strokeDefs.append("linearGradient")
            .attr("id", "strokeGradient")
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "100%");


        //console.log(yScale.invert(0), yScale.invert(height))

        gradient.append("stop")
            .attr('class', 'start')
            .attr("offset", "0%")
            .attr("stop-color", this.colorScale(this.tempScale.invert(0)))
            .attr("stop-opacity", 1);

        //console.log("domain: ",this.colorScale.domain(),"range: ", this.colorScale.range())

        gradient.append("stop")
            .attr('class', 'end')
            .attr("offset", '100%')
            .attr("stop-color", this.colorScale(this.tempScale.invert(this.height)))
            .attr("stop-opacity", 1);


        svg.append("path")
            .datum(allData)
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("d", d3.line()
                .x((d) => xScale(new Date(d[0])))
                .y((d) => this.tempScale(32))
                .curve(d3.curveCatmullRom)
            )

        svg.append("path")
            .datum(allData)
            .attr("fill", "none")
            .attr("stroke", "url(#strokeGradient)")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x((d) => xScale(new Date(d[0])))
                .y((d) => this.tempScale(d[1]))
                .curve(d3.curveCatmullRom)
            )
            
        svg.append("path")
            .datum(allData)
            .attr("fill", "none")
            .attr("stroke", "none")
            .attr("stroke-width", 1)
            .attr("d", d3.area()
                .x((d) => xScale(new Date(d[0])))
                .y0((d) => this.tempScale.invert(this.height) > 32 ? this.tempScale(this.tempScale.invert(this.height)) : this.tempScale(32))
                .y1((d) => this.tempScale(d[1]))
                .curve(d3.curveCatmullRom)
            )

        return svg;
    }

    createSnowGraph(selector: HTMLElement, forecast: IForecastResponse) {
        // set the dimensions and margins of the graph


        let snowArr = this.parseSnowData(forecast)

        let lowData = snowArr.map(x => {
            return [x.time, x.cumLow]
        })

        let highData = snowArr.map(x => {
            return [x.time, x.cumHigh]
        })

        let areaData =  snowArr.map(x => {
            return [x.time, x.cumLow, x.cumHigh]
        })

        let yMax = snowArr[snowArr.length - 1].cumHigh + 3;

        let firstDate = snowArr[0].time;
        let lastDate = snowArr[snowArr.length -1 ].time;


        // from https://www.d3-graph-gallery.com/graph/line_confidence_interval.html

        // append the svg object to the body of the page
        let svg = d3.select(selector)
            .append("svg")
            .attr('id', 'snow-graph')
            .attr("preserveAspectRatio", "xMinYMin")
           .attr("viewBox", `0 0 400 200`)
            .classed("svg-content", true);

        svg.append("g")
            .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")");

        // Add Y axis
        this.snowScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([this.height, this.margin.top]);

        svg.append("g")
            .attr("transform",
                `translate( ${this.margin.left}, 0)`)
            .call(d3.axisLeft(this.snowScale).ticks(yMax));

        // Add X axis --> it is a date format
        let x = this.timeScale(firstDate, lastDate);
        svg.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(x).ticks(d3.timeDay, 1).tickFormat(d3.timeFormat('%a %d')))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");


        // Create Stroke Gradient
        let strokeDefs = svg.append("defs");

        let gradient = strokeDefs.append("linearGradient")
            .attr("id", "snowStrokeGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

            let numPeriods = forecast.data.temperature.length;
            let eachPct = Math.round(100*1/numPeriods);

        
        // Create Fill Gradient
        let fillDefs = svg.append("defs");

        let fillGradient = fillDefs.append("linearGradient")
            .attr("id", "snowFillGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");


        forecast.data.temperature.forEach((temp, i, arr) => {
            let offset = i < arr.length / 2 ? eachPct * (i) : eachPct * (i + .5);
            console.log("gradient pct steps:", offset, " by ", eachPct)
            
            gradient.append('stop')
                .attr("offset", `${offset}%`)
                .attr('stop-color', this.colorScale(parseInt(temp)))
                .attr("stop-opacity", 1);
            fillGradient.append('stop')
                .attr("offset", `${offset}%`)
                .attr('stop-color', this.colorScale(parseInt(temp)))
                .attr("stop-opacity", 0.3);
        })

        // Show confidence interval
        svg.append("path")
            .datum(areaData)
            .attr("fill", "url(#snowFillGradient)")
            .attr("stroke", "none")
            .attr("d", d3.area()
                .y0((d: any) => this.snowScale(d[1]))
                .y1((d: any) => this.snowScale(d[2]))
                .x((d: any) => x(new Date(d[0])))
                .curve(d3.curveStepAfter)
                //.y1((d:any) => y(d[2]))
        )
        svg.append("path")
            .datum(lowData)
            .attr("fill", "none")
            .attr("stroke", "url(#snowStrokeGradient)")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x(function (d) { return x(new Date(d[0])) })
                .y((d) => { return this.snowScale(d[1]) })
                .curve(d3.curveStepAfter)
        )
        svg.append("path")
            .datum(highData)
            .attr("fill", "none")
            .attr("stroke", "url(#snowStrokeGradient)")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x(function (d) { return x(new Date(d[0])) })
                .y((d) => { return this.snowScale(d[1]) })
                .curve(d3.curveStepAfter)
            )

        return svg;
    }

    detailedForecastTable(forecast: IForecastResponse) {

        let snowForecastArray = this.parseSnowData(forecast);

        let htmlOutput = createElement({ tag: 'div', parent: undefined, options: { className: "detailed-forecast-overlay" } });

        htmlOutput.addEventListener('click', e => {
            let elem = e.target as HTMLElement;
            if (elem.classList.contains('detailed-forecast-overlay')) htmlOutput.remove()
        })

        let modal = createElement({ tag: 'div', parent: htmlOutput, options: { className: "detailed-forecast" } });
        let snowMessage: string;

        let lastForecast = snowForecastArray[snowForecastArray.length - 1];

        if (lastForecast.cumHigh === 0) {
            snowMessage = '🙁 No snow in the forecast 🙁';
        } else {
            let maxSnow = Math.floor(lastForecast.cumHigh);
            let snowEmoji = `❄️`.repeat(Math.floor(maxSnow / 6) + 1);
            if (maxSnow <= 2) snowMessage = '❄️ Some flurries are headed this way ❄️';
            else snowMessage = `${snowEmoji} Up to ${maxSnow} inches expected${maxSnow >= 6 ? '!' : ""} ${snowEmoji}`;
        }
        
        let title = createElement({ tag: 'h2', parent: modal, options: { text: snowMessage } });
       
       
        let location = createElement({ tag: 'h4', parent: modal, options: { text: `${forecast.location.areaDescription} at ${forecast.location.elevation} ft.` } });
       

        let overview = new CreateElement({tag: 'div', parentElement: modal, options: {className: 'weather-display'}})



        let graphsContainer = overview.createChild({tag: 'div', options: {className: 'weather-graph-container'}});
        let snowGraphContainer = graphsContainer.createChild({ tag: 'div', options: { id: "snow-graph", className: 'weather-graph' } });
        let tempGraphContainer = graphsContainer.createChild({ tag: 'div', options: { id: "temp-graph", className: 'weather-graph' } });

        // Create Forecast Overview info
        let infoArea = overview.createChild({tag:'div', options: {className: 'weather-info-text'}})
        
        // infoArea.createChild({ tag: 'p', options: { text: `${lastForecast.cumLow} - ${lastForecast.cumHigh} inches possible during the forecast period.` } })

        let index = 0;
        let periodName = infoArea.createChild({ tag: 'h4' });
        let newSnowText = infoArea.createChild({ tag: 'p'});
        let cumSnowText = infoArea.createChild({ tag: 'p' });
        let temperature = infoArea.createChild({ tag: 'p' });
        let forecastText = infoArea.createChild({ tag: 'p' , options: {style: 'font-size: .9em'}});


        const updateForecastOverview = (index:number) => {
            periodName.self.innerText = `${forecast.time.startPeriodName[index]}`;

            forecastText.self.innerHTML = this.boldImportant(`${forecast.data.text[index]}`);

            newSnowText.self.innerText = `New Snow: ${snowForecastArray[index].low} - ${snowForecastArray[index].high} in.`.replace('0 - 0 in.', 'none');

            cumSnowText.self.innerHTML = `Total New Snow: ${snowForecastArray[index].cumLow} - ${snowForecastArray[index].cumHigh} in.`.replace('0 - 0 in.', 'none');;

            temperature.self.innerHTML = `Temperature: ${forecast.data.temperature[index]}&deg;F`
        }

        updateForecastOverview(0)

        // Handle Graph Interactivity
        let snowgraph = this.createSnowGraph(snowGraphContainer.self, forecast);
        let highSnowTooltip = snowgraph.append('circle');
        let lowSnowTooltip = snowgraph.append('circle');

        let tempGraph = this.createTempGraph(tempGraphContainer.self, forecast);
        let temperatureTooltip = tempGraph.append('circle');

        let timeArr = forecast.time.startValidTime;

        let timeScale = this.timeScale(timeArr[0],timeArr[timeArr.length - 1])

        let snowScale = this.snowScale,
            tempScale = this.tempScale,
            colorScale = this.colorScale;

        // console.log(snowgraph.html())

        const handleHover = function() {
            let mouseTime = timeScale.invert(d3.mouse(this)[0]);

            let nearestTime = timeArr.reduce((prev, curr) => {
                let diffCurrent = Math.abs(new Date(curr).getTime() - mouseTime.getTime())
                let diffPast = Math.abs(new Date(prev).getTime() - mouseTime.getTime())
                return diffCurrent < diffPast ? curr : prev;
            })

            let nearestTimeIndex = timeArr.indexOf(nearestTime);

            updateForecastOverview(nearestTimeIndex)

            let snowForecast = snowForecastArray[nearestTimeIndex];

            let tempForecast = parseInt(forecast.data.temperature[nearestTimeIndex]);
            let activeTipSize = '7px'

            temperatureTooltip
                .transition()
                .attr('cx', timeScale(new Date(nearestTime)))
                .attr('cy', tempScale(tempForecast))
                .attr('r', activeTipSize)
                .style('fill', colorScale(tempForecast))
                .duration(50)
                .ease(d3.easeLinear)

            highSnowTooltip
                .transition()
                .attr('cx', timeScale(new Date(nearestTime)))
                .attr('cy', snowScale(snowForecast.cumHigh))
                .attr('r', activeTipSize)
                .style('fill', colorScale(tempForecast))
                .duration(100)
                .ease(d3.easeLinear)

            lowSnowTooltip
                .transition()
                .attr('cx', timeScale(new Date(nearestTime)))
                .attr('cy', snowScale(snowForecast.cumLow))
                .attr('r', activeTipSize)
                .style('fill', colorScale(tempForecast))
                .duration(100)
                .ease(d3.easeLinear)
        }

        const removeTooltips = function () {
            let mouseTime = timeScale.invert(d3.mouse(this)[0]);

            let nearestTime = timeArr.reduce((prev, curr) => {
                let diffCurrent = Math.abs(new Date(curr).getTime() - mouseTime.getTime())
                let diffPast = Math.abs(new Date(prev).getTime() - mouseTime.getTime())
                return diffCurrent < diffPast ? curr : prev;
            })

            let nearestTimeIndex = timeArr.indexOf(nearestTime);

            updateForecastOverview(nearestTimeIndex)

            let snowForecast = snowForecastArray[nearestTimeIndex];

            let tempForecast = parseInt(forecast.data.temperature[nearestTimeIndex]);

            let inactiveTipSize = '4px'
            temperatureTooltip
                .transition()
                .attr('cx', timeScale(new Date(nearestTime)))
                .attr('cy', tempScale(tempForecast))
                .attr('r', inactiveTipSize)
                .duration(300)
            lowSnowTooltip
                .transition()
                .attr('cx', timeScale(new Date(nearestTime)))
                .attr('cy', snowScale(snowForecast.cumLow))
                .attr('r', inactiveTipSize)
                .duration(300)
            highSnowTooltip
                .transition()
                .attr('cx', timeScale(new Date(nearestTime)))
                .attr('cy', snowScale(snowForecast.cumHigh))
                .attr('r', inactiveTipSize)
                .duration(300)

        }

        snowgraph.on('mousemove touchmove', handleHover);
        tempGraph.on('mousemove touchmove', handleHover);


        snowgraph.on('mouseout touchout', removeTooltips);
        tempGraph.on('mouseout touchout', removeTooltips);

        let table = createElement({ tag: 'table', parent: modal });
        /*
        let header = createElement({ tag: 'tr', parent: table });
        createElement({ tag: 'th', parent: header });
        createElement({ tag: 'th', parent: header, options: { text: "Snow" } });
        createElement({ tag: 'th', parent: header, options: { text: "Total" } });
        createElement({ tag: 'th', parent: header, options: { text: "Forecast" } });
        */

        for (let period of snowForecastArray) {
            let cummulativeForecast = `${period.cumLow} to ${period.cumHigh} in.`
                .replace('1 to 1', '~1')
                .replace('2 to 2', '~2')
                .replace('3 to 3', '~3')
                .replace('1 inches', '1 inch')
                .replace('0 to 0 in\.', '-')
                .replace('0 to', '~')

            let periodSnow = `${period.low} to ${period.high} in.`
                .replace('1 to 1', '~1')
                .replace('2 to 2', '~2')
                .replace('3 to 3', '~3')
                .replace('1 inches', '1 inch')
                .replace('0 to 0 in\.', '-')
                .replace('No snow expected.', '-')
                .replace('0 to', '~')

            let forecastDetails = this.boldImportant(period.details);

            let row = createElement({ tag: 'tr', parent: table });
            createElement({ tag: 'td', parent: row, options: { text: period.period } });
            // createElement({ tag: 'td', parent: row, options: { text: periodSnow, style: "text-align: center;"  } });
            // createElement({ tag: 'td', parent: row, options: { text: cummulativeForecast, style: "text-align: center;" } });
            createElement({ tag: 'td', parent: row, options: { text: forecastDetails} });
        }

        return htmlOutput;

    }

    addForecastToMap(data: IForecastResponse, map: L.Map, addToUrl: boolean = true, addPopup: boolean = true) {

        let blueMarker = L.AwesomeMarkers.icon({
            markerColor: 'blue',
            prefix: 'fa',
            extraClasses: 'fas',
            icon: 'snowflake'
        });


        let htmlOutput = this.createForecastHeader(data)

        let popupContainer = createElement({tag:'div', parent: htmlOutput, options: {className: 'leaflet-popup-buttons'}})

        let removeForecast = createElement({ tag: 'button', parent: popupContainer, options: { text: "Remove", className: "remove-forecast-button" } });
        removeForecast.setAttribute('type', 'button');

        let moreDetails = createElement({ tag: 'button', parent: popupContainer, options: { text: "Details", className: "forecast-details-button" } });
        moreDetails.setAttribute('type', 'button');

        moreDetails.addEventListener('click', e => {
            let detailedForecast = this.detailedForecastTable(data)
            document.body.appendChild(detailedForecast)
        })


        let forecastLayer = L.layerGroup();

        let ptlatlng = new L.LatLng(parseFloat(data.location.latitude), parseFloat(data.location.longitude)) // [data.location.latitude, data.location.longitude];
        let forecastPopup = L.popup().setLatLng(ptlatlng).setContent(htmlOutput);
        let forecastMarker = L.marker(ptlatlng, { icon: blueMarker })
            .bindPopup(forecastPopup, { closeOnClick: false, autoClose: false })
        //.addTo(forecastLayer);

        let urlControl = new HandleUrlParameters(map);
        let duplicate = urlControl.isForecastInUrl([ptlatlng.lat, ptlatlng.lng]);

        htmlOutput.addEventListener('click', () => {
            forecastPopup.bringToFront();
        })
        htmlOutput.addEventListener('mouseover', () => {
            forecastPopup.bringToFront();
        })

        forecastMarker.addEventListener('mouseover', () => {
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

        if (addToUrl && !duplicate) urlControl.addForecast([ptlatlng.lat, ptlatlng.lng])

        removeForecast.addEventListener('click', (e) => {
            let params = urlControl.get();
            urlControl.removeForecast([round(ptlatlng.lat, 2), round(ptlatlng.lng, 2)])
            map.removeLayer(forecastLayer);
        })

    }

    createFullForecastTable(data: IForecastResponse) {

        let cumulativeSnowForecast = this.detailedForecastTable(data);

        let forecastBox = document.getElementById('full-forecast-box')

        if (forecastBox) forecastBox.parentNode.removeChild(forecastBox);

        let forecastContainer = document.createElement("div")
        forecastContainer.setAttribute('id', "full-forecast-box")

        forecastContainer.appendChild(cumulativeSnowForecast)

        let table = createElement({ tag: "table", parent: forecastContainer, options: { id: 'detailed-forecast' } })

        let header = createElement({ tag: 'tr', parent: table })

        createElement({ tag: 'th', parent: header, options: { text: "" } })
        createElement({ tag: 'th', parent: header, options: { text: "Temp" } })
        createElement({ tag: 'th', parent: header, options: { text: "Forecast" } })
        // createElement('th',header, {text: "Wind" })

        for (let i in data.data.text) {

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

    appendForecastTable(data: any) {
        let forecastContainer = this.createFullForecastTable(data)

        document.body.appendChild(forecastContainer)

        return forecastContainer
    }

}


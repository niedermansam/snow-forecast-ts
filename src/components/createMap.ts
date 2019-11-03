import * as L from "leaflet";
import { Feature, Geometry } from "geojson";
import { appendForecastTable, addForecastToMap, getWeatherForecast } from "./getWeatherForecast";
import { HandleUrlParameters } from "./helpers";
import { ResortMap } from "./../index";
import { Resorts } from "./resorts";

const getBaseMaps = (map:L.Map) => {
    // Import base map
let WorldTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
}).addTo(map);

let EsriWorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
});

let HikeBike = L.tileLayer('http://{s}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

let basemaps ={"Esri World Topo Map": WorldTopo,
                "Esri World Street Map": EsriWorldStreetMap,
              "Open Street Map Hike/Bike": HikeBike}

 return basemaps;

}

const getWeatherMaps = (map:L.Map) => {
    let clouds = L.tileLayer('http://{s}.tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png?appid={accessToken}', {
	maxZoom: 19,
	attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
	accessToken: '5606fe6c8b895127844f35d6c3698fad',
	opacity: 0.5
})//.addTo(map)

let wind = L.tileLayer('http://{s}.tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid={accessToken}', {
	maxZoom: 19,
	attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
	accessToken: '5606fe6c8b895127844f35d6c3698fad',
	opacity: 1
});

let precip = L.tileLayer('http://{s}.tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={accessToken}', {
	maxZoom: 19,
	attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
	accessToken: '5606fe6c8b895127844f35d6c3698fad',
    opacity: .5,
})//.addTo(map);

let weatherMaps = {"Cloud Coverage": clouds,
                   "Wind Overlay": wind,
                   "Precipitation": precip};

return weatherMaps;

}

export const createMap = (id: string) => {
    
    let map = L.map(id)

    map.on('click', async (e:L.LeafletMouseEvent) => {
        console.log(e)
        let forecast = await getWeatherForecast(e.latlng.lat, e.latlng.lng)
        addForecastToMap(forecast, map)
    })

    let baseMaps = getBaseMaps(map);
    let weatherMaps = getWeatherMaps(map);
    let controler = L.control.layers(baseMaps,weatherMaps,{collapsed:true}).addTo(map);



    let handleUrl = new HandleUrlParameters(map)



    let params = handleUrl.get()

    let lat = params  && params.lat ? params.lat : 44,
        lng = params  && params.lng ? params.lng : -118,
        zoom = params && params.zoom ? params.zoom : 6;

    if(params && params.forecasts){
        params.forecasts.forEach(async (x: number[]) => {
            let forecast = await getWeatherForecast(x[0], x[1]);
            addForecastToMap(forecast, map, false, true)
        })
    }
    map.setView([lat, lng], zoom)

    map.addEventListener('moveend', (e) => {
        handleUrl.trackMap()
    })
    map.addEventListener('zoomend', (e) => {
        handleUrl.trackMap()
    })

    return map;
}

// Create Popups

export const resortPopups = (feature: Feature<Geometry, any>, layer:L.Layer):void =>  {
    let price= feature.properties.price ? "Adult Ticket: $" + feature.properties.price : "";
    let lifts = feature.properties.lifts ? feature.properties.lifts + " Lifts<br/>" : "";

    let acres = feature.properties.acres ? feature.properties.acres + ' Skiable Acres<br/>' : "";
    
    let vert= feature.properties.vertical ? feature.properties.vertical + " Vertical Ft.<br/>" : "";
    
    let popupContent = `<strong><a href='${feature.properties.url}' target='_blank'>${feature.properties.name}</a></strong><br/>
     ${vert} ${acres} ${lifts} <br/> <strong>${price}</strong>`;
    //'name: ' + String(feature.properties['name']) + '<br>pop_max: ' + String(feature.properties['vertical']);
    
    interface LMouseEvent extends Event {

    }

    /* 
     layer.addEventListener('click', async (e) => {
        let forecast = await getWeatherForecast(e.latlng.lat, e.latlng.lng)
        addForecastToMap(forecast, ResortMap, true, false)
        appendForecastTable(forecast)
    }) 
     */

    layer.bindTooltip(popupContent);
}



export const  resortsLayer = (geoJsonPoint: Feature<Geometry, any>, latlng:L.LatLng) => {
    return L.circleMarker(latlng, {
        radius: 10.0,
        fillColor: '#3C8DBC',
        color: '#000000',
        weight: 1,
        opacity: 1.0,
        fillOpacity: 0.8
    })
}

export const addMarkers = (map:L.Map, resorts:Resorts) => {

    let createMarkers = L.geoJSON(resorts, {pointToLayer: resortsLayer, onEachFeature: resortPopups});
    let resortsFeatureGroup= L.featureGroup();
    resortsFeatureGroup.addLayer(createMarkers);
    resortsFeatureGroup.addTo(map);
    
    return resortsFeatureGroup;
    
    }
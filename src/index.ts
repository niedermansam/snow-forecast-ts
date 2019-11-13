import 'leaflet/dist/leaflet.css';
import './app.css';


import { createElement, Toolbar, CreateElement } from "./components/helpers";
import { createMap, addMarkers } from "./components/createMap";
import { createToolBar, markerFilterSection, createBottomText } from './components/createToolbar';

import Resorts from "./components/resorts";
import * as L from 'leaflet';
import { handleWeatherData } from './components/getWeatherForecast';
import * as wNumb from 'wnumb';
import { SnotelData } from './components/getSnoTel';
import { helpModal } from './components/helpModal';

const app = document.getElementById('app')
let resorts = Resorts()

// console.log(resorts)


createElement({ tag: "div", parent: app, options: { id: 'map' } });

const forecastHandler = new handleWeatherData();

export const ResortMap = createMap('map', forecastHandler);


let markers = addMarkers(ResortMap, resorts);

export const resortsLayerGroup = new L.LayerGroup([markers]);

let headerElement = new CreateElement({ tag: 'div', parentElement: app, options: { id: 'header' } })
let menuToggle = headerElement.createChild({ tag: 'div', options: { className: "menu-icon change" } })
let headerText = headerElement.createChild({tag:'h1', options: {text: "Snow Finder"}})

let helpText = '<i class="fas fa-info-circle"></i> help'

let helpButton = headerElement.createChild({tag: 'p', 
    options: {text: helpText, style: 'margin: 0; position: absolute; right: 10px; cursor: pointer;'}})

helpButton.self.addEventListener('click', () => {
    helpModal()
})

menuToggle.createChild({tag: 'div', options: {className: "bar1"}})
    .createSibling({ tag: 'div', options: { className: "bar2" } })
    .createSibling({ tag: 'div', options: { className: "bar3" } })


let toolbar = createToolBar(markers, app, resorts);
//let filters = createFilters(markers, toolbar, resorts);

menuToggle.self.addEventListener('click',e => {
    menuToggle.self.classList.toggle('change');
    toolbar.classList.toggle('hidden');
    document.querySelector('.leaflet-control-attribution').classList.toggle('menu-hidden');
    document.querySelector('.leaflet-control-zoom').classList.toggle('menu-hidden');

})

const filterSection = markerFilterSection(toolbar, markers, resorts)

let bottomText= createBottomText(toolbar)
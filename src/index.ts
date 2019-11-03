import 'leaflet/dist/leaflet.css';
import './app.css';


import { createElement, FilterSection, CreateElement } from "./components/helpers";
import { createMap, addMarkers } from "./components/createMap";
import { createToolBar, createOptions, markerFilterSection, createBottomText } from './components/createToolbar';

import Resorts from "./components/resorts";
import * as L from 'leaflet';
import { getWeatherForecast } from './components/getWeatherForecast';
import * as wNumb from 'wnumb';

const app = document.getElementById('app')
let resorts = Resorts()

// console.log(resorts)

createElement({ tag: "div", parent: app, options: { id: 'map' } });

export const ResortMap = createMap('map');


let markers = addMarkers(ResortMap, resorts);

export const resortsLayerGroup = new L.LayerGroup([markers]);

let headerElement = createElement({ tag: 'div', parent: app, options: { id: 'header' } })

let toolbar = createToolBar(markers, app, resorts);
//let filters = createFilters(markers, toolbar, resorts);

const filterSection = markerFilterSection(toolbar, markers, resorts)

let options = createOptions(toolbar);

let bottomText= createBottomText(toolbar)
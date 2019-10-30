import 'leaflet/dist/leaflet.css';
import './app.css';


import { createElement } from "./components/helpers";
import { createMap, addMarkers } from "./components/createMap";
import { createFilters, createToolBar } from './components/createToolbar';

import Resorts from "./components/resorts";
import * as L from 'leaflet';
import { getWeatherForecast } from './components/getWeatherForecast';

const app = document.getElementById('app')
let resorts = Resorts()

console.log(resorts)

createElement("div", app, {id: 'map', style: "width: 100vw; height: 50vh;"});

export const ResortMap = createMap('map');

let markers = addMarkers(ResortMap, resorts);

export const resortsLayerGroup = new L.LayerGroup([markers]);

let toolbar = createToolBar(markers, app, resorts);
let filters = createFilters(markers, toolbar, resorts);


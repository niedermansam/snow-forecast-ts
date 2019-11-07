import { createElement, CreateElement, Toolbar, IFilter, IFilterStatus } from "./helpers";
import { resortPopups, resortsLayer } from "./createMap"; 
import * as noUiSlider from "nouislider";
import 'nouislider/distribute/nouislider.css';


import * as L from 'leaflet';
import { Feature, Geometry } from "geoJSON";


//declare function require(name:string);
//const wNumb = require("wnumb");
import * as wNumb from "wnumb";
import { Resorts } from "./resorts";

export const createToolBar = (markers: L.FeatureGroup, app: HTMLElement, resorts: Resorts) => {
    let toolbar = createElement({ tag: 'div', parent: app, options: { id: "toolbar" } });


    return toolbar;
}


export const markerFilterSection = (parent: HTMLElement, markers:L.FeatureGroup, resorts:Resorts) => {
    let newFilters = new Toolbar({ markers: markers, parentElement: parent, resorts: resorts, label: "Filters", options: { className: "toolbar-section main-toolbar" } })

    newFilters.createFilters()
    newFilters.createMarkerOptions()


}


export const createBottomText = (parent: HTMLElement) => {

    const container = new CreateElement({tag: 'div', parentElement: parent, options: {className: 'bottom-text toolbar-section'}})

    const bottomText = container.createChild({ tag: 'p', options: { text: "Created by Sam Supplee-Niederman. Ski resort information may be out of date.", className: "attribution-text" } })

    return container;
}

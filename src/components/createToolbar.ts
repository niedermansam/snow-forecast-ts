import { createElement, CreateElement, FilterSection } from "./helpers";
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


export const createOptions = (parent:HTMLElement) => {
    //let section = new MenuSection({ tag: 'div', parentElement: parent, options: {text:"Options"} }); 

    let section = new CreateElement({tag: 'div', parentElement: parent, options: {className: 'toolbar-section'} })

    let title = section.createHeader("h2", 'Options', 'options', 'menu-header');

    title.container.self.tabIndex = 0;
    title.container.self.onkeydown = (e) => {
        if (e.key === "Enter") well.self.classList.toggle('hidden')
    }

    console.log(title)

    let well = section.createChild({tag: 'div', options: {className: 'options-area'}})

    title.container.self.addEventListener('click', (e) => {
        well.self.classList.toggle('hidden')
    })

    let showMaps = well.createSwitch("Resort Markers", undefined, "stretch") 
    
    let infoOnHover = well.createSwitch("Info on Hover", undefined, "stretch")
    

    //return section
}


export const markerFilterSection = (parent: HTMLElement, markers:L.FeatureGroup, resorts:Resorts) => {
    let newFilters = new FilterSection({ markers: markers, parentElement: parent, resorts: resorts, label: "Filters", options: { className: "toolbar-section" } })

    let vertFormat = wNumb({
        decimals: 1,
        postfix: "K",
        encoder: function (value: number) {
            return value / 1000;
        },
        decoder: function (value: number) {
            return value * 1000;
        }
    })

    newFilters.header.container.self.addEventListener("click", e => {
        newFilters.toggleWell()
    })

    let priceSlider = newFilters.createSlider('Price', "price", wNumb({ decimals: 0, prefix: "$" }))
    let vertSlider = newFilters.createSlider('Vertical Feet', "vertical", vertFormat)
    let liftSlider = newFilters.createSlider("Lifts", 'lifts', wNumb({ decimals: 0 }))

    return {priceSlider: priceSlider, vertSlider: vertSlider, liftSlider: liftSlider}


}


export const createBottomText = (parent: HTMLElement) => {
    let bottomTextStyle = "text-align: center; padding: 0px 20px; font-size: .9em;"

    const container = new CreateElement({tag: 'div', parentElement: parent, options: {className: 'bottom-text toolbar-section'}})

    const bottomText = container.createChild({ tag: 'p', options: { text: "Ski Resort information may not be up to date.", className: "data-warning", style: bottomTextStyle } }).createSibling({ tag: 'p', options: { text: "Created by<br> Sam Supplee-Niederman", className: "attribution-text", style: bottomTextStyle } })

    return container;
}

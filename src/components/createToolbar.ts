import { createElement } from "./helpers";
import { resortPopups, resortsLayer } from "./createMap";

import * as noUiSlider from "nouislider";
import 'nouislider/distribute/nouislider.css';


import * as L from 'leaflet';
import { Feature, Geometry } from "geojson";

//declare function require(name:string);
//const wNumb = require("wnumb");
import * as wNumb from "wnumb";
console.log(wNumb())

export const createToolBar = (markers: L.FeatureGroup, app: HTMLElement, resorts: any) => {
    let toolbar = createElement('div', app, { id: "toolbar" });


    return toolbar;
}

export const createFilters = (markers: L.FeatureGroup, parent: HTMLElement, resorts: any) => {
    let htmlOutput = createElement('div', parent, { id: "resort-filters" });

    let filters: IFilter = { vertical: [0, 5627], price: [0, 155], lifts: [0, 28] };

    interface IFilter {
        vertical: number[];
        price: number[];
        lifts: number[];
        [key: string]: any;

    }

    interface IFilterStatus {
        vertical: boolean;
        price: boolean;
        lifts: boolean;
        filters: true;
        [key: string]: boolean;

    }

    let filterStatus: IFilterStatus = { vertical: true, price: true, lifts: true , filters: true}

    const filterResorts = (feature: Feature<Geometry, any>) => {

        if(!filterStatus.filters) return true;

        const createFilter = (filterName: string) => {
            let filter = !filterStatus[filterName] || // disable if filter is inactive
                (feature.properties[filterName] != null &&
                    feature.properties[filterName] <= filters[filterName][1] &&
                    feature.properties[filterName] >= filters[filterName][0])

            return filter;
        }

        let vertFilter = createFilter('vertical')
        let priceFilter = createFilter('price');
        let liftsFilter = createFilter('lifts');

        return vertFilter && priceFilter && liftsFilter;
    }

    const refreshMap = () => {
        markers.clearLayers();

        let newMarkers = L.geoJSON(resorts, {
            onEachFeature: resortPopups,
            filter: filterResorts,
            pointToLayer: resortsLayer
        })

        markers.addLayer(newMarkers);
    }

    interface CreateSliderProps {
        label: string;
    }

    class CreateInput {
        parent:HTMLElement;
        constructor(parent: HTMLElement) {
            this.parent = parent;
        }

        createCheckbox(tag: "p" | "h1" | "h2" | "h3" | "label" = "h3", name: string, filterName: string, parent:HTMLElement = this.parent, classPrefix:string = 'checkbox', id:string = "") {
            const container = createElement("div", parent, { className: classPrefix + "-container" });
            const labelContainer = createElement("div", container, { className: classPrefix + "-label" });
            const labelSwitch = createElement('input', labelContainer, { className: classPrefix, id: `disable-${filterName}-filter` }) as HTMLInputElement;
            labelSwitch.setAttribute("type", "checkbox");
            labelSwitch.checked = true;

            labelSwitch.addEventListener('change', (event: Event) => {
                filterStatus[filterName] = labelSwitch.checked;

                if (!filterStatus[filterName]) {
                    container.setAttribute('style', "opacity: .5;")
                } else {
                    container.setAttribute('style', "opacity: 1;")
                }

                refreshMap();
            })

            const elementLabel = createElement(tag, labelContainer, { text: `${name}:` })
            return {container: container, switch: labelSwitch};

        }

        createSlider(name: string, filterName: string, format: wNumb.Instance = wNumb({decimals: 0}), parent:HTMLElement=this.parent) {
            let head = this.createCheckbox('h3', name, filterName, parent);
            const container = head.container;
            const labelSwitch =  head.switch

            let sliderContainer = createElement("div", container, { id: filterName + "-slider" });

            let slider = noUiSlider.create(sliderContainer, {
                connect: true,
                step: 1,
                tooltips: [format, format],
                start: filters[filterName],
                range: {
                    min: filters[filterName][0],
                    max: filters[filterName][1]
                },
            });




            // return vertSlider;

            slider.on('update', function (values) {
                filters[filterName] = values.map(x => parseInt(x));
                refreshMap();

            })

            return slider;
        }

    }


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
    let Filters = new CreateInput(htmlOutput);
    let filterToggle = Filters.createCheckbox('h2', "Filters", 'filters');
    let filterSection = createElement('div', filterToggle.container, {id:'filter-sliders-section'})
    filterToggle.switch.addEventListener('change', (e) => {
        console.log(filterStatus)
    })
    let priceSlider = Filters.createSlider("Price", 'price', wNumb({ decimals: 0, prefix: "$" }), filterSection );
    let vertSlider = Filters.createSlider("Vertical Feet", 'vertical', vertFormat, filterSection );
    let liftSlider = Filters.createSlider("Lifts", 'lifts', wNumb({ decimals: 0 }), filterSection );

    filterToggle.switch.addEventListener('change', e => {
        filterSection.classList.toggle('hidden-filters')
    })


    return {
        section: htmlOutput,
        vertSlider: vertSlider,
        priceSlider: priceSlider,
        liftSlider: liftSlider,
        filters: filters
    }
}

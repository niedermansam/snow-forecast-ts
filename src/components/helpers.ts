import { Feature, Geometry } from "geojson";
import * as L from "leaflet";
import { resortPopups, resortsLayer } from "./createMap";
import * as wNumb from "wnumb";
import * as noUiSlider from "nouislider";
import { Resorts } from "./resorts";

interface createElementOptions {
    text?: string;
    className?: string;
    id?: string;
    style?: string;
}

export const createElement = ({ tag='div' , parent, options }: { tag: string; parent?: HTMLElement | Node | HTMLInputElement; options?: createElementOptions; }) => {
    
    let newElement:HTMLElement;
    
    if(parent) newElement = parent.appendChild(document.createElement(tag));
    else newElement = document.createElement(tag);
    if(!options) return newElement;

    if (options.text) newElement.innerHTML = options.text;
    if(options.id)newElement.setAttribute('id', options.id);

    if(options.className) {
        //newElement.setAttribute('class', options.className);
        let classList = options.className.split(" ")

        classList.forEach(newClass => {
            newElement.classList.add(newClass)
        })
    } 
    if(options.style) newElement.setAttribute("style", options.style);
    return newElement;
}

export class CreateElement {
    
    parent:HTMLElement;
    headerTag: string;
    self: HTMLElement;
    options: any;
    constructor({ tag, parentElement, options }: { tag?: string; parentElement?: HTMLElement; options?: createElementOptions; }){
        this.parent = parentElement;
        this.headerTag = tag;
        this.options = options;
        this.self = createElement({ tag: this.headerTag, parent: this.parent, options: this.options });
    }

    changeParent(callback:Function){
        this.parent = callback(this.parent)
        return this.parent;
    }

    createChild({ tag, options }: { tag: string; options?: createElementOptions; }){
        return new CreateElement({ tag, parentElement: this.self, options })
    }

    createSibling({ tag, options }: { tag: string; options?: createElementOptions; }) {
        return new CreateElement({ tag, parentElement: this.parent, options })
    }

    createHeader(tag: "p" | "h1" | "h2" | "h3" | "label" = "h3", 
    label: string, name: string, 
    classPrefix: string = 'menu-header',
    id: string = "",
    withSwitch: boolean = false):{container:CreateElement, label: CreateElement, uiSwitch?:any} {

        let containerClassNames = classPrefix === 'menu-header' ? "menu-header-container" : `${classPrefix}-container menu-header-container`;

        let labelClassNames = containerClassNames.replace(/container/g, 'label-container')

        const container = this.createChild({ tag: "div", options: { className: containerClassNames } });

        const elementLabel = container.createChild({ tag: tag, options: { text: label, id: `${name}-label`, className: 'option-label' } });
        
        if(withSwitch){
            let uiSwitch = container.createSwitch({ switchOnly: true }).uiSwitch;
            return { container: container, label: elementLabel, uiSwitch: uiSwitch }
        }

        return { container: container, label: elementLabel };
    }

    createSwitch({ leftText, rightText, position, checked, className, id, tag, switchOnly = false }: { leftText?: string; rightText?: string; position?: "left" | "right" | "center" | "stretch"; checked?: boolean; className?: string; id?: string; tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "p"; switchOnly?: boolean; } = {}) {

        position = position || "left";
        tag = tag || 'h3';
        if(checked === undefined) checked = true;

        // Do not remove class "switch"
        let switchClassList = className ? `${className}-switch ${className} switch switch-${position}` : `switch switch-${position}`;
        let containerClassList = switchClassList.replace(/switch/g, 'switch-container')
        let sliderClassList = switchClassList.replace(/switch/g, 'slider')

        if(switchOnly){
            let uiSwitch = this.createChild({ tag: 'label', options: { className: switchClassList, id: id ? `${id}-switch` : '' } })

            let checkbox = uiSwitch.createChild({ tag: 'input', options: { id: `${id}-checkbox` } }).self as HTMLInputElement;
            checkbox.type = "checkbox";
            checkbox.checked = checked;
            checkbox.onkeydown = (e) => {
                if (e.key === "Enter") checkbox.checked = !checkbox.checked
            }

            let slider = uiSwitch.createChild({ tag: 'span', options: { className: sliderClassList, id: id ? `${id}-slider` : '' } });

            return {uiSwitch}
        }

        let container = this.createChild({ tag: 'div', options: { className: containerClassList, id: id ? `${id}-container` : '' }})

        let leftLabel: CreateElement,
            rightLabel: CreateElement;

        if (leftText) leftLabel = container.createChild({ tag: tag, options: { text: leftText } });

        let uiSwitch = container.createChild({ tag: 'label', options: { className: switchClassList, id: id ? `${id}-switch` : '' } })

        let checkbox = uiSwitch.createChild({ tag: 'input', options: {id: `${id}-checkbox`} }).self as HTMLInputElement;
        checkbox.type = "checkbox";
        checkbox.checked = checked;

        checkbox.onkeydown = (e) => {
            if(e.key === "Enter") checkbox.checked = !checkbox.checked
        }

        let slider = uiSwitch.createChild({ tag: 'span', options: { className: sliderClassList, id: id ? `${id}-slider` : ''  } });

        if (rightText) rightLabel = container.createChild({ tag: tag, options: { text: rightText } });

        if(switchOnly) return {switch: uiSwitch, checkbox: checkbox};

        return {container: container, switch: uiSwitch};
    }

    createAlert(text: string, type: "warning" | "danger" = "warning", icon: string = "fas fa-exclamation-circle"){
        let container = this.createChild({
            tag: 'div', options: {
                text: `<i class="${icon}" style="margin-right: 10px"></i>`, 
                className: `alert alert-${type}`, 
                style: 'display: flex; align-items: center;' 
            }
        }).createChild({ tag: 'p', options: { text: text, style: 'margin: 0;' }})
        container.createChild
        //, options: { text: `<i class="fas fa-exclamation-circle" style="margin-right: 10px"></i> <div>Backcountry travel is inherently dangerous. Ski and ride safe!</div>`, className: 'alert alert-danger', style: 'display: flex; align-items: center;' } })
    }
}


export interface IHeader {
    container: CreateElement;
    label: CreateElement;
    uiSwitch?: any;
}

export interface IFilter {
    vertical: number[];
    price: number[];
    lifts: number[];
    [key: string]: any;

}

export interface IFilterStatus {
    vertical: boolean;
    price: boolean;
    lifts: boolean;
    filters: boolean;
    numShowing?: number;
    [key: string]: boolean | number;

}


export class Toolbar extends CreateElement {
    

    parent: HTMLElement;
    headerTag: "p" | "h1" | "h2" | "h3" | "label";
    self: HTMLElement;
    options: createElementOptions;
    filterHeader: IHeader;
    markers: L.FeatureGroup;
    resorts: Resorts;
    filters: IFilter;
    filterStatus: IFilterStatus 
    label: string;
    filterWell: CreateElement;
    name: "vertical" | "price" | "lifts" | "filters";
    numFiltered: CreateElement;
    markersHeader: IHeader;
    markersWell: CreateElement;
    constructor({ markers, resorts, label = "Filters", name = "filters", tag: headerTag = 'h2', parentElement, options }: { tag?: "p" | "h1" | "h2" | "h3" | "label"; parentElement?: HTMLElement; markers?: L.FeatureGroup; label?: string; name?: "vertical" | "price" | "lifts" | "filters"; resorts?:Resorts; options?: createElementOptions } = {}) {
        super({ tag: headerTag, parentElement, options })
        this.parent = parentElement;
        this.label = label;
        this.name = name;
        this.headerTag = headerTag;
        this.options = options;
        this.self = createElement({ tag: 'div', parent: this.parent, options: this.options });
        this.resorts = resorts;
        this.markers = markers;
        this.filters = { vertical: [0, 5627], price: [0, 155], lifts: [0, 28] };
        this.filterStatus = { vertical: true, price: true, lifts: true, filters: true, markers: true };
        
        this.numFiltered = this.createChild({ tag: 'div', options: { className: 'options-area resort-marker-info', style: "font-size: .9em; text-align: center" } }).createChild({ tag: 'p', options: { text: "Resorts showing" } });
        
        this.filterHeader = this.createHeader(this.headerTag, this.label, this.name, 'filter', 'filter-header', true);
        this.filterWell = this.createChild({ tag: 'div', options: { className: 'options-area filters-section' } });


        this.markersHeader = this.createHeader(this.headerTag, 'Resort Markers', "markers", "markers", 'markers-header', true)
        this.markersWell = this.createChild({ tag: 'div', options: { className: 'options-area markers-section' } });

        this.createSlider = this.createSlider.bind(this);
        this.refreshMap = this.refreshMap.bind(this);
        this.filterResorts = this.filterResorts.bind(this);
        this.refreshMap = this.refreshMap.bind(this);
        this.toggleWell = this.toggleWell.bind(this);
        this.openWell = this.openWell.bind(this);
        this.closeWell = this.closeWell.bind(this);

        this.filterHeader.container.self.tabIndex = 0;
        this.filterHeader.container.self.onkeydown = (e) => {
            if (e.key === "Enter") this.toggleWell(this.filterWell)
        }
        this.filterHeader.container.self.addEventListener("click", e => {
            let element = (e.target as Element)
            if (element.tagName != "INPUT" && element.tagName != "SPAN" && this.filterStatus.filters){
                this.toggleWell(this.filterWell);
            }
        })

        this.filterHeader.uiSwitch.self.addEventListener("click", (e: Event) => {
            let element = (e.target as Element)
            if(element.tagName === "INPUT"){
                this.filterStatus.filters = !this.filterStatus.filters
                this.refreshMap()
                if (this.filterStatus.filters) this.openWell(this.filterWell);
                else this.closeWell(this.filterWell)
            }
        })
        

        this.markersHeader.container.self.tabIndex = 0;
        this.markersHeader.container.self.onkeydown = (e) => {
            if (e.key === "Enter") this.toggleWell(this.markersWell)
        }
        this.markersHeader.container.self.addEventListener("click", e => {
            let element = (e.target as Element)
            if (element.tagName != "INPUT" && element.tagName != "SPAN" && this.filterStatus.markers) {
                this.toggleWell(this.markersWell);
            }
        })
        this.markersHeader.uiSwitch.self.addEventListener("click", (e: Event) => {
            let element = (e.target as Element)

            if (element.tagName === "INPUT") {
                this.filterStatus.markers = !this.filterStatus.markers
                this.refreshMap()
                if (this.filterStatus.markers) this.openWell(this.markersWell);
                else this.closeWell(this.markersWell)
            }
        })

    }

    filterResorts(feature: Feature<Geometry, any>) {
        if (!this.filterStatus.filters) return true;
        if (!this.filterStatus.markers) return false;

        const createFilter = (filterName: string) => {
            let filter = !this.filterStatus[filterName] || // disable if filter is inactive
                (feature.properties[filterName] != null &&
                    feature.properties[filterName] <= this.filters[filterName][1] &&
                    feature.properties[filterName] >= this.filters[filterName][0])

            return filter;
        }

        let vertFilter = createFilter('vertical')
        let priceFilter = createFilter('price');
        let liftsFilter = createFilter('lifts');

        return vertFilter && priceFilter && liftsFilter;
    }

    toggleWell(element:CreateElement) {
        let isHidden = !element.self.classList.contains('hidden');
        if (!isHidden) {
            element.self.setAttribute('style', "")

            setTimeout(() => {
                element.self.classList.toggle('hidden');
                element.parent.classList.toggle('collapsed');
            }, 100)
        }
        
        if(isHidden) {
            element.self.classList.toggle('hidden');
            element.parent.classList.toggle('collapsed');
        }
    }

    openWell(element: CreateElement) {
        element.self.classList.remove('hidden');
        element.parent.classList.remove('collapsed');
    }
    closeWell(element: CreateElement) {
        element.self.classList.add('hidden');
        element.parent.classList.add('collapsed');
    }

    toggleFilterStatus(name: string) {
        this.filterStatus[name] = !this.filterStatus[name]
        this.refreshMap()
    }

    refreshMap() {
        this.markers.clearLayers();

        let newMarkers = L.geoJSON(this.resorts, {
            onEachFeature: resortPopups,
            filter: this.filterResorts,
            pointToLayer: resortsLayer
        })

        //console.log(this.markers)
        this.markers.addLayer(newMarkers);
        let filtered = this.resorts.features.filter((value) => {
            return this.filterResorts(value as Feature)
        })

        this.numFiltered.self.innerHTML = `Showing <strong>${filtered.length}</strong> of ${this.resorts.features.length} resorts`

    }

    countVisibleResorts(){

        let filtered = this.resorts.features.filter((value) => {
            return this.filterResorts(value as Feature)
        })

        return filtered.length

    }

    createSlider(label: string, name: string, format: wNumb.Instance = wNumb({ decimals: 0 })) {
        let head = this.filterWell.createSwitch({ leftText: label, rightText: undefined, position: "stretch", checked: true, className: "filter" });
        let filterStatus = this.filterStatus;
        let refresh = this.refreshMap;

       // const labelSwitch = head.switch

        let sliderContainer = head.container.createChild({ tag: "div", options: { id: name + "-slider", className: 'noUi-filter-slider'} });

        let slider = noUiSlider.create(sliderContainer.self, {
            connect: true,
            step: 1,
            tooltips: [format, format],
            start: this.filters[name],
            range: {
                min: this.filters[name][0],
                max: this.filters[name][1]
            },
        });

        // Handle slider being deactivated
        head.switch.self.addEventListener('change', e => {
            this.toggleFilterStatus(name);
            this.refreshMap();
         //   let opacity = this.filterStatus[name] ? '1' : '0.5';
            sliderContainer.self.classList.toggle('hidden');
            head.container.self.classList.toggle('collapsed');
           // sliderContainer.self.setAttribute("style",`opacity: ${opacity}`);
        })

        // Handle user input on slider
        slider.on('update', (values) => {
            this.filters[name] = values.map(x => parseInt(x));
            this.refreshMap();
        })

        return slider;
    
    }

    createFilters(){

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

        let priceSlider = this.createSlider('Price', "price", wNumb({ decimals: 0, prefix: "$" }));
        let vertSlider = this.createSlider('Vertical Feet', "vertical", vertFormat);
        let liftSlider = this.createSlider("Lifts", 'lifts', wNumb({ decimals: 0 }));

        return { priceSlider: priceSlider, vertSlider: vertSlider, liftSlider: liftSlider }
    }

    createMarkerOptions(){
        this.markersWell.createSwitch({ leftText: "Info on Hover", rightText: undefined, position: "stretch" });
    }
}

export const round = (input:number, decimals:number) => {
    let multiplier = (10 ** (decimals))
    return Math.round( input * multiplier ) / multiplier
}

const arraysMatch = function (arr1: any[], arr2:any[]) {

    // Check if the arrays are the same length
    if (arr1.length !== arr2.length) return false;

    // Check if all items exist and are in the same order
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }

    // Otherwise, return true
    return true;

};

export class HandleUrlParameters {

   map: L.Map;
   constructor(map?:L.Map){
       this.map = map;
   }

    get() {
        interface UrlParams {
            lat?: number;
            lng?: number;
            zoom?: number;
            forecasts?: number[][]
            [key: string]: string | number | number[][];
        }
        let params: UrlParams = {};
        let search = window.location.search.replace('\?', "").split('&');

        if (search[0] === "") return {lat: 44, lng: -118, zoom: 6};


        for (let param of search) {
            let keyValueArray = param.split('=')
            let output: string | number | number[][];

            if (keyValueArray[0] === "forecasts") {
                
                output = keyValueArray[1].split(';').map(x => x.split(",").map(x => parseFloat(x)))
                //keyValueArray[1] = JSON.parse(decodeURIComponent( keyValueArray[1]))
            } else {
                output = JSON.parse(decodeURIComponent(keyValueArray[1]))
            }
            params[keyValueArray[0]] = output;
        }
        
        return params;
    }

    trackMap() {
        let {forecasts} = this.get();

        const newForecasts = this.setForecastQuery(forecasts)

        const mapState = this.getMapState()

        let newState = mapState + newForecasts;

        history.pushState(null, '', newState);

        return newState;
   }

    getMapState() {
        let {lat, lng} = this.map.getCenter()
        return `?lat=${round(lat, 3)}&lng=${round(lng, 3)}&zoom=${this.map.getZoom()}`
    }

    setForecastQuery(array:number[][]) {
        let output:string;

        if (array) {
            let roundedLatLng = array.map((x: number[]) => x.map((y) => round(y, 3)))

            let encodedForecast = roundedLatLng.map(x =>  x.join(",")).join(';')

            output = `&forecasts=${encodedForecast}`

            decodeURIComponent(output)
        }
        else output = ""

        return output;

    }

    addForecast(location:number[]) {
        let  {forecasts } = this.get(),
            center = this.map.getCenter(),
            oldForecast = forecasts,
            duplicatesExist = false;

        if(oldForecast){
            oldForecast.forEach((old:number[]) => {
                if (arraysMatch(old, location)) duplicatesExist = true;
            })
        }
        
        if(duplicatesExist) return;

        if (forecasts) forecasts.push(location)
        else forecasts = [location]
        forecasts = forecasts.map((x: number[]) => x.map((y) => round(y, 3)))

        const newForecasts = this.setForecastQuery(forecasts);

        const mapState = this.getMapState()

        let newState = mapState + newForecasts;

        history.pushState(null, '', newState);

    }

    isForecastInUrl(latlng: number[]) {
        let params = this.get(),
            center = this.map.getCenter(),
            oldForecast = params.forecasts,
            duplicatesExist = false;

        if (oldForecast) {
            oldForecast.forEach((old: number[]) => {
                if (arraysMatch(old, latlng)) duplicatesExist = true;
            })
        }

        return duplicatesExist;
    }

   removeForecast(rmLatLng:number[]) {
        let params = this.get();


       if (params.forecasts) {
           params.forecasts = params.forecasts.filter((urllatlng: number[]) => {
                let urlJson = JSON.stringify(urllatlng);
                let removeJson = JSON.stringify(rmLatLng);

                return urlJson !== removeJson
            })
       }
       let center = this.map.getCenter()

       const forecasts = this.setForecastQuery(params.forecasts);

       const mapState = this.getMapState()

       let newState = mapState + forecasts;

       history.pushState(null, '', newState);
   }

}
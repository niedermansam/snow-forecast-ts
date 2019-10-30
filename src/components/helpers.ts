interface createElementOptions {
    text?: string;
    className?: string;
    id?: string;
    style?: string;
}

export const createElement = (tag:string, parent?:HTMLElement | Node,  options?: createElementOptions) => {
    
    let newElement:HTMLElement;
    
    if(parent) newElement = parent.appendChild(document.createElement(tag));
    else newElement = document.createElement(tag);
    if(!options) return newElement;

    if (options.text) newElement.innerHTML = options.text;
    if(options.id)newElement.setAttribute('id', options.id);
    if(options.className) newElement.setAttribute('class', options.className);
    if(options.style) newElement.setAttribute("style", options.style);
    return newElement;
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
   /* window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        params[key] = value;
   });*/
   map: L.Map;
   constructor(map?:L.Map){
       this.map = map;
   }
    trackMap() {
        let params = this.get();
        //lat: "46.85", lng: "-114.02"}
        let center = this.map.getCenter();

        const forecasts = params.forecasts ? `&forecasts=${JSON.stringify(params.forecasts.map((x: number[]) => x.map((y) => round(y, 3))))}` : "";

        const mapState = `?lat=${round(center.lat, 3)}&lng=${round(center.lng, 3)}&zoom=${this.map.getZoom()}`

        let newState = mapState + forecasts;

        history.pushState(null, '', newState);

        return newState;
   }

    addForecast(location:number[]) {
        let params = this.get(),
            center = this.map.getCenter(),
            oldForecast = params.forecasts,
            duplicatesExist = false;

        if(oldForecast){
            oldForecast.forEach((old:number[]) => {
                if (arraysMatch(old, location)) duplicatesExist = true;
            })
        }
        
        if(duplicatesExist) return;

        if (params.forecasts) params.forecasts.push(location)
        else params.forecasts = [location]
        params.forecasts = params.forecasts.map((x: number[]) => x.map((y) => round(y, 3)))

        const forecasts = `&forecasts=${JSON.stringify(params.forecasts)}`;

        const mapState = `?lat=${round(center.lat, 3)}&lng=${round(center.lng, 3)}&zoom=${this.map.getZoom()}`

        let newState = mapState + forecasts;

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
           console.log(rmLatLng, params.forecasts)
           params.forecasts = params.forecasts.filter((urllatlng: number[]) => {
                let urlJson = JSON.stringify(urllatlng);
                let removeJson = JSON.stringify(rmLatLng);

                return urlJson !== removeJson
            })
       }
       let center = this.map.getCenter()

       const forecasts = `&forecasts=${JSON.stringify(params.forecasts)}`;

       const mapState = `?lat=${round(center.lat, 3)}&lng=${round(center.lng, 3)}&zoom=${this.map.getZoom()}`

       let newState = mapState + forecasts;

       history.pushState(null, '', newState);
   }

   get() {
       interface UrlParams {
           lat?: number;
           lng?: number;
           zoom?: number;
           forecasts?: number[][]
           [key:string]: string | number | number[][];
       }
       let params:UrlParams = {};
       let search = window.location.search.replace('\?', "").split('&');
       
       for(let param of search){
           let keyValueArray = param.split('=')

           if (/^\[/.test(keyValueArray[1])) keyValueArray[1] = JSON.parse(keyValueArray[1])
           params[keyValueArray[0]] = keyValueArray[1]
       }
       return params;
   }
}
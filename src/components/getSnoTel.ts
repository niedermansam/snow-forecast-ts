// Thanks to Bobby and Maura for the API
// http://powderlin.es/api.html

export interface ClosestSnotels {
    station_information: StationInformation;
    distance: number;
    data?: (DataEntity)[] | null;
}
export interface StationInformation {
    elevation: number;
    location: Location;
    name: string;
    timezone: number;
    triplet: string;
    wind: boolean;
}
export interface Location {
    lat: number;
    lng: number;
}
export interface DataEntity {
    Date: string;
    'Snow Water Equivalent(in)': string;
    'Change In Snow Water Equivalent(in)': string;
    'Snow Depth(in)': string;
    'Change In Snow Depth(in)': string;
    'Observed Air Temperature(degrees farenheit)': string;
}


export class SnotelData {
    constructor(){

    }

    async getClosest(lat:number, lng: number){
        let response = await fetch(`https://wcc.sc.egov.usda.gov/reportGenerator/view_csv/customMultiTimeSeriesGroupByStationReport/daily/start_of_period/1105:MT:SNTL%7Cid=%22%22%7Cname/CurrentWY,CurrentWYEnd/stationId,name,SNWD::value,TAVG::value,TMAX::value,TMIN::value,PREC::value,WTEQ::value?fitToScreen=false`)
        console.log(response)
        let data = response.json();
        console.log(data)

        return data;
    }

    async getAll(){
        let response = await fetch(`http://api.powderlin.es/stations`);
        let data = response.json();

        return data
    }
}
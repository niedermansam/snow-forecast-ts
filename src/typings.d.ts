import * as L from 'leaflet';
declare module 'leaflet' {
    let timeDimension: any;
    let nonTiledLayer: any;
    namespace control {
        let timeDimension: any;
    }
}

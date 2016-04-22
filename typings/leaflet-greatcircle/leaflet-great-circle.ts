// Type definitions for Leaflet.GreatCircle
// Project: https://github.com/themadcreator/Leaflet.GreatCircle
// Definitions by: themadcreator
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference path="../leaflet/leaflet.d.ts" />

declare namespace L {
  export interface GreatCircleOptions extends PolylineOptions {
    segments?                    : number,
    maxRadiusMeters?             : number,
    longitudeDeltaWrapCutoff?    : number,
    preventAntimeridianWrapping? : boolean
  }

  function greatCircle(latlng: LatLngExpression, radius: number, options?: PathOptions): Circle;

  export interface GreatCircleStatic extends ClassStatic {
    new(latlng: LatLngExpression, radius: number, options?: PathOptions): Circle;
  }
  export var GreatCircle: GreatCircleStatic;

  export interface GreatCircle extends MultiPolygon {
    getLatLng(): LatLng;
    getRadius(): number;
    setLatLng(latlng: LatLngExpression): Circle;
    setRadius(radius: number): Circle;
  }
}

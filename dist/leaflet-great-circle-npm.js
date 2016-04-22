var L = require('leaflet'); // exposed from global by browserify
var geodesy = require('geodesy');

var NORTH_POLE = new geodesy.LatLonEllipsoidal(90, -180);
var SOUTH_POLE = new geodesy.LatLonEllipsoidal(-90, 180);
var LONGITUDE_DELTA_WRAP_CUTOFF = 120;
var CIRCLE_SEGMENTS = 120;
var MAX_RADIUS_METERS = 10 * 1000 * 1000; // Max 10,000 km radius to prevent wrap-around inversion artifacts

L.GreatCircle = L.MultiPolygon.extend({
  initialize: function (latlng, radius, options) {
    this._latlng = L.latLng(latlng);
    this._mRadius = Math.min(MAX_RADIUS_METERS, radius);
    var shape = this._computeShape(this._latlng, this._mRadius);

    L.MultiPolygon.prototype.initialize.call(this, shape, options);
  },

  setLatLng: function (latlng) {
    this._latlng = L.latLng(latlng);
    var shape = this._computeShape(this._latlng, this._mRadius);
    return this.setLatLngs(shape);
  },

  getLatLng: function () {
    return this._latlng;
  },

  setRadius: function (radius) {
    this._mRadius = Math.min(MAX_RADIUS_METERS, radius);
    var shape = this._computeShape(this._latlng, this._mRadius);
    return this.setLatLngs(shape);
  },

  getRadius: function () {
    return this._mRadius;
  },

  /*
    Compute multipolygon shape that includes the points on a globe
    having a distance to "center" less than "radius".

    Do this by determining the lat/lon of each bearing around
    the compass at that distance.
  */
  _computeShape: function (center, radius) {
    var center = new geodesy.LatLonEllipsoidal(center.lat, center.lng);
    var coords = [];
    for (var i = 0; i < CIRCLE_SEGMENTS; i++) {
      var bearing = (i * 360.0 / CIRCLE_SEGMENTS);
      coords.push(center.destinationPoint(radius, bearing));
    }
    return this._correctProjectionWrapAround(coords, center, radius);
  },

  _correctProjectionWrapAround: function (coords, center, radius) {
    var multipolygon = [[]];
    var part = 0;

    for (var i = 1; i <= coords.length; i++) {
      var c0 = coords[i - 1];
      var c1 = (i === coords.length) ? coords[0] : coords[i];

      // correct the shape if we cross the anti-meridian or a pole.
      var deltaLon = c1.lon - c0.lon;
      if (deltaLon > LONGITUDE_DELTA_WRAP_CUTOFF) {
        console.log("north", center.distanceTo(NORTH_POLE), radius);
        if (center.distanceTo(NORTH_POLE) > radius) {
          // anti-meridian case
          if (part === 0) {
            multipolygon[part].push({lat: c0.lat, lon: -180});
            multipolygon.push([]);
            part = 1;
            multipolygon[part].push({lat: c1.lat, lon: 180});
          } else {
            multipolygon[part].push({lat: c0.lat, lon: -180});
            part = 0;
            multipolygon[part].push({lat: c1.lat, lon: 180});
          }
        } else {
          // north pole case
          multipolygon[part].push({lat: c0.lat, lon: -180});
          multipolygon[part].push({lat: 90, lon: -180});
          multipolygon[part].push({lat: 90, lon: 180});
          multipolygon[part].push({lat: c1.lat, lon: 180});
        }
      }

      if (deltaLon < -LONGITUDE_DELTA_WRAP_CUTOFF) {
        if (center.distanceTo(SOUTH_POLE) > radius) {
          // anti-meridian case
          if (part === 0) {
            multipolygon[part].push({lat: c0.lat, lon: 180});
            multipolygon.push([]);
            part = 1;
            multipolygon[part].push({lat: c1.lat, lon: -180});
          } else {
            multipolygon[part].push({lat: c0.lat, lon: 180});
            part = 0;
            multipolygon[part].push({lat: c1.lat, lon: -180});
          }
        } else {
          // south pole case
          multipolygon[part].push({lat: c0.lat, lon: 180});
          multipolygon[part].push({lat: -90, lon: 180});
          multipolygon[part].push({lat: -90, lon: -180});
          multipolygon[part].push({lat: c1.lat, lon: -180});
        }
      }

      // finally add the computed coordinate
      multipolygon[part].push(c1);
    }

    return multipolygon;
  }
});

L.greatCircle = function(center, radius, options) {
  return new L.GreatCircle(center, radius, options);
}

module.exports = L.GreatCircle;

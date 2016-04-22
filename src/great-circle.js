var L = require('leaflet'); // exposed from global by browserify
var geodesy = require('geodesy');

var NORTH_POLE = new geodesy.LatLonEllipsoidal(90, -180);
var SOUTH_POLE = new geodesy.LatLonEllipsoidal(-90, 180);

L.GreatCircle = L.MultiPolygon.extend({
  options : {
    // The number of line segments around the circle. Additional
    // segments may be added when wrapping around a pole or antimeridian.
    segments : 120,

    // The max circle radius. The default of 10,000 km radius
    // is to prevent wrap-around inversion artifacts. Larger maximums
    // may see these artifacts.
    maxRadiusMeters : 10 * 1000 * 1000,

    // This parameter determines how many degrees longitude a line segment
    // can jump before we consider it to be a polar or antimerdian
    // wrapping case
    longitudeDeltaWrapCutoff : 90,

    // By default, we try to avoid wrapping circles across the antimeridian
    // by performing the calculations in a shifted reference frame. To
    // ensure the shapes wrap exactly at the antimeridian, set this
    // parameter to false.
    preventAntimeridianWrapping : true
  },

  initialize: function (latlng, radius, options) {
    L.setOptions(this, options);

    this._latlng = L.latLng(latlng);
    this._mRadius = Math.min(this.options.maxRadiusMeters, radius);
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
    this._mRadius = Math.min(this.options.maxRadiusMeters, radius);
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
    for (var i = 0; i < this.options.segments; i++) {
      var bearing = (i * 360.0 / this.options.segments);
      coords.push(center.destinationPoint(radius, bearing));
    }

    var corrected = this._correctProjectionWrapAround(coords, center, radius);
    return corrected;
  },

  _correctProjectionWrapAround: function (coords, center, radius) {
    // shift and normalize original coordinates to reduce possibility of anti-meridian wrapping
    var shift = center.lon;
    if (this.options.preventAntimeridianWrapping) {
      coords.forEach(function (coord) { coord.lon = (coord.lon - shift + 540) % 360 - 180; });
    }

    var multipolygon = [[]];
    var part = 0;
    for (var i = 1; i <= coords.length; i++) {
      var c0 = coords[i - 1];
      var c1 = (i === coords.length) ? coords[0] : coords[i];

      // correct the shape if we cross the anti-meridian or a pole.
      var deltaLon = c1.lon - c0.lon;
      if (deltaLon > this.options.longitudeDeltaWrapCutoff) {
        if (center.distanceTo(NORTH_POLE) > radius) {
          // anti-meridian case
          if (part === 0) {
            multipolygon[part].push({lat: c0.lat, lon: -180});
            multipolygon.push([]);
            part = 1;
            multipolygon[part].push({lat: c1.lat, lon:  180});
          } else {
            multipolygon[part].push({lat: c0.lat, lon: -180});
            part = 0;
            multipolygon[part].push({lat: c1.lat, lon:  180});
          }
        } else {
          // north pole case
          multipolygon[part].push({lat: c0.lat, lon: -180});
          multipolygon[part].push({lat: 90,     lon: -180});
          multipolygon[part].push({lat: 90,     lon:  180});
          multipolygon[part].push({lat: c1.lat, lon:  180});
        }
      }

      if (deltaLon < -this.options.longitudeDeltaWrapCutoff) {
        if (center.distanceTo(SOUTH_POLE) > radius) {
          // anti-meridian case
          if (part === 0) {
            multipolygon[part].push({lat: c0.lat, lon:  180});
            multipolygon.push([]);
            part = 1;
            multipolygon[part].push({lat: c1.lat, lon: -180});
          } else {
            multipolygon[part].push({lat: c0.lat, lon:  180});
            part = 0;
            multipolygon[part].push({lat: c1.lat, lon: -180});
          }
        } else {
          // south pole case
          multipolygon[part].push({lat: c0.lat, lon:  180});
          multipolygon[part].push({lat: -90,    lon:  180});
          multipolygon[part].push({lat: -90,    lon: -180});
          multipolygon[part].push({lat: c1.lat, lon: -180});
        }
      }

      // finally add the original coordinate
      multipolygon[part].push(c1);
    }

    // unshift corrected coordinates
    if (this.options.preventAntimeridianWrapping) {
      multipolygon.forEach(function (part) { part.forEach(function (coord) { coord.lon += shift; }) });
    }

    return multipolygon;
  }
});

L.greatCircle = function(center, radius, options) {
  return new L.GreatCircle(center, radius, options);
}

module.exports = L.GreatCircle;

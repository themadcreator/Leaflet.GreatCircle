# Leaflet.GreatCircle
Draw accurately projected circles on Leaflet maps.

# Why?

The existing L.Circle functionality draws a plain geometric circle
on the map. However, due to the nature of map projections, this
in not an accurate way to represent a circle on a sphere.

Our shape computes the multipolygon boundary that includes the
points on a globe having a distance to "center" less than "radius".

We determine the lat/lon of each bearing around the compass at
that distance using the the `geodesy` library by Chris Veness.

# Installation

Since leaflet doesn't play well without a browser, you're likely
using bower. In this case, just `bower install Leaflet.GreatCircle`.

We do also support node, though, so you can `npm install Leaflet.GreatCircle`.

# Usage

    L.greatCircle(centerLatLng, radiusInMeters, shapeOptions).addTo(map);

# Leaflet.Draw Example

You can override the Leaflet.Draw plugin to use this library like so:

    L.Draw.Circle.prototype._drawShape = function (latlng) {
      if (!this._shape) {
        this._shape = new L.GreatCircle(this._startLatLng, this._startLatLng.distanceTo(latlng), this.options.shapeOptions);
        this._map.addLayer(this._shape);
      } else {
        this._shape.setRadius(this._startLatLng.distanceTo(latlng));
      }
    };

Then, the circles will be drawn accurately, like so:

![Simple Circle](/screenshots/sshot0.png?raw=true "Simple Circle")

![Polar Boundary](/screenshots/sshot1.png?raw=true "Polar Boundary")

![Polar Wrap](/screenshots/sshot2.png?raw=true "Polar Wrap")

![Antimeridian Wrap](/screenshots/sshot3.png?raw=true "Antimeridian Wrap")

![Shifted Antimeridian](/screenshots/sshot4.png?raw=true "Shifted Antimeridian")


# API

#### Options

L.GreatCircle can by passed an options hash in the third argument. In addition
to the options supported by L.MultiPolygon, this shape supports:

key | default | description
--- | :---: | ---
`segments` | 120 | The number of line segments around the circle. Additional segments may be added when wrapping around a pole or antimeridian.
`maxRadiusMeters` | 10 * 1000 * 1000 | The max circle radius. The default of 10,000 km radius is to prevent wrap-around inversion artifacts. Larger maximums may see these artifacts.
`longitudeDeltaWrapCutoff` | 90 | This parameter determines how many degrees longitude a line segment can jump before we consider it to be a polar or antimerdian wrapping case.

#### Methods

`getLatLng` / `setLatLng` - gets/sets the center of the circle

`getRadius` / `setRadius` - gets/sets the radius of the circle

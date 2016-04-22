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

    L.greatCircle(centerLatLng, radiusInMeters, { fill : 'red' }).addTo(map);
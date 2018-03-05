## Install
- git clone git@github.com:unicef/react-webgl-leaflet.git
- cp ./src/config-sample.js ./src/config.js
- npm install
- npm start

You need to get a mapbox token which I *think* can be gotten [here](https://www.mapbox.com/help/define-access-token/). You can also switch mapbox for open street maps tiles.

If you add your mapbox token to the config file, then this is what you should see:
![sample](../example.png)

Otherwise you might see a blank page. Only two points are displayed because we wanted all the code in a single file. However, you should be able to load a geojson object with millions of points.

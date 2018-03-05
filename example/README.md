### The example
You need to get a mapbox token which I *think* can be gotten [here](https://www.mapbox.com/help/define-access-token/). You can also switch mapbox for open street maps tiles.

Only two points are displayed because we wanted all the code in a single file. However, you should be able to load a geojson object with millions of points.

If you add your mapbox token to the config file, then this is what you should see:
![sample](./example.png)

Otherwise you might see a blank page


### Caveat
We get this pesky warning. Any advice on it appreciated:
````
index.js:2178 Warning: Failed context type: Invalid context `map` of type `NewClass` supplied to `ReactWebglLeaflet`, expected instance of `NewClass`.
    in ReactWebglLeaflet (at App.js:79)
    in div (created by Map)
    in Map (at App.js:70)
    in App (at index.js:7)
````

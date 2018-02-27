# react-webgl-leaflet

Will fill this out in depth shortly. In brief, the ReactWebglLeaflet component takes three inputs:

- A reference to the map it's embedded in
- A geojson object with an array of features of type point.
- A url to fetch data from, where feature.properties has {id: ID of datapoint in a db, color: rgb of point} 
````
    import React, { Component } from 'react';
    import ReactWebglLeaflet from 'react-webgl-leaflet'
    import {
      Map,
      ZoomControl,
      TileLayer
    } from 'react-leaflet'
    // import ReactWebglLeaflet from 'react-webgl-leaflet'
    class App extends Component {
      constructor(props) {
        super(props);
        this.state = {
          url: 'https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?' +
            'access_token=' +
            'pk.your_mapbox_key.',
          attribution: '&copy; <a href=\'http://osm.org/copyright\'>OpenStreetMap</a>' +
            ' contributors ',
          position: [0, 0],
          zoom: 4
        }
      }
      render() {
        const pointClick = (feature, map) => {
          setTimeout(function() {
            map.openPopup(feature.properties.title,
              [
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0]
              ]
            )
          }, 300)
        }
        let geojson = {
          'type': 'FeatureCollection',
          'features': [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-77.03238901390978, 38.913188059745586]
                        },
                        "properties": {
                            "title": "Washington DC",
                            id: 2,
                            size: 5,
                            color: [92, 184, 92],
                            "icon": "monument"
                        }
                      }, {
                              "type": "Feature",
                              "geometry": {
                                  "type": "Point",
                                  "coordinates": [-122.414, 37.776]
                              },
                              "properties": {
                                "title": "San Francisco",
                                id: 3,
                                size: 3,
                                color: [92, 184, 92]
                              }
                          }]
        }
        const position = [38.913188059745586, -77.03238901390978]
        return (
            <Map
              center={position}
              zoom={this.state.zoom}
              zoomControl={false}>
              <ZoomControl position='bottomleft' />
              <TileLayer
                url={this.state.url}
                attribution={this.state.attribution}
              />
              <ReactWebglLeaflet
                points={geojson}
                onClickCallback={pointClick}
              />
            </Map>
        )
      }
    }
    export default App;
````
[Demo](http://school-mapping.azurewebsites.net)
![sample](./webgl-clickable-points.jpeg)


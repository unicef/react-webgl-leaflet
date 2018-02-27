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
        'pk.eyJ1IjoiYXlhbmV6IiwiYSI6ImNqNHloOXAweTFveWwzM3A4M3FkOWUzM2UifQ.' +
        'GfClkT4QxlFDC_xiI37x3Q',
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
                        "title": "Mapbox DC",
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
                            "title": "Mapbox SF",
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

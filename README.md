# react-webgl-leaflet

Will fill this out in depth shortly. In brief, the ReactWebglLeaflet component takes three inputs:

- A reference to the map it's embedded in
- A geojson object with an array of features of type point.
- A url to fetch data from, where feature.properties has {id: ID of datapoint in a db, color: rgb of point} 

        import ReactWebglLeaflet from 'react-webgl-leaflet'
        import {
        GeoJSON,
        Map,
        ZoomControl,
        TileLayer
        } from 'react-leaflet'
        <Map ref='map'
          ref={m => {
            this.leafletMap = m;
          }
          }
          center={some_lat_lon}
          zoom = 8
          zoomControl={false}>
          <ZoomControl position='bottomleft' />
          <TileLayer
            url={}
            attribution={i_dont_remember_what_this_is}
          />
        <ReactWebglLeaflet leafletMap={this.leafletMap}
            points={geojson}
            fetchUrl={fetch_url}
            />
        </Map>
[Demo](http://school-mapping.azurewebsites.net)
![sample](./webgl-clickable-points.jpeg)


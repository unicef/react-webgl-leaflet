# react-webgl-leaflet

Will fill this out in depth shortly. In Brief, the ReactWebglLeaflet component takes three inputs:

- A reference to the map it's embedded in
- A geojson object with an array of features of type point.
- A url to fetch data from, where feature.properties has {id: ID of datapoint in a db, color: rgb of point} 

        <Map ref='map'
          ref={m => {
            this.leafletMap = m;
          }
          }
          center={position}
          zoom={this.state.zoom}
          zoomControl={false}>
          <ZoomControl position='bottomleft' />
          <TileLayer
            url={this.state.url}
            attribution={this.state.attribution}
          />
        <ReactWebglLeaflet leafletMap={this.leafletMap}
            points={this.props.activeCountry.points}
            fetchUrl={fetch_url}
            />
        </Map>

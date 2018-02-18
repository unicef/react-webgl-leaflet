import axios from 'axios';
import popUpString from './helper-popup-string';

/**
 * pointToLayer - makes point to layer
 *
 * @param  {Number} school_id
 * @param  {Obj} map
 */
export function pointToLayer(school_id, map, fetchUrl) {
  let url = fetchUrl + school_id;
  console.log(url);
  axios.get(url)
    .catch(err => {
      alert('There was an error trying to get school info')
    })
    .then(response => {
      let labels = response.data.result[0];
      let data = response.data.result[1]
      let lat_index = labels.findIndex(function(e) {
        return e.match(/^lat$/)
      })
      let lon_index = labels.findIndex(function(e) {
        return e.match(/^lon$/)
      })
      let message = popUpString(labels, data)
      window.aaa = labels;
      window.bbb= data;
      // console.log(message, 'Mmmm', lat_index, lon_index, data)
      map.openPopup(message, [data[lat_index], data[lon_index]])
    })
  // console.log(popup);
}

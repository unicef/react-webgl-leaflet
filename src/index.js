/* eslint-disable no-unused-vars */
import React, {Component} from 'react';
import L from 'leaflet'
import { MapLayer } from 'react-leaflet'
import CanvasLayer from './canvas-layer'

if (!Array.from) {
  Array.from = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike/*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError("Array.from requires an array-like object - not null or undefined");
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }());
}

Number.prototype.map = function(in_min, in_max, out_min, out_max) {
  return (((this - in_min) * (out_max - out_min)) / (in_max - in_min)) + out_min;
};
// Function to convert rgb to 0-1 for webgl
const fromRgb = n => Math.ceil((parseInt(n).map(0, 255, 0, 1)) * 1000) / 1000;

const colorLookup = {}

// Generates off screen color for data point
const gen_offscreen_colors = function(i) {
  if (i === 65535) {
    i += 1;
  } // Do not use red
  const r = ((i + 1) >> 16) & 0xff;
  const g = ((i + 1) >> 8) & 0xff;
  const b = (i + 1) & 0xff;
  return [r, g, b];
};
function doMouseOrClick(ev, canvas, gl, framebuffer, leafletMap, props, this_dupe, action) {
  if (this_dupe.className.match('leaflet-layer')) {
    let x = undefined;
    let y = undefined;
    let top = 0;
    let left = 0;
    let obj = canvas;
    while (obj && (obj.tagName !== "BODY")) {
      top += obj.offsetTop;
      left += obj.offsetLeft;
      obj = obj.offsetParent;
    }
    left += window.pageXOffset;
    top -= window.pageYOffset;
    x = ev.clientX - left;
    y = canvas.clientHeight - (ev.clientY - top);
    const pixels = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); // Load offscreen frame buffer for picking
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (colorLookup[pixels[0] + " " + pixels[1] + " " + pixels[2]]) {
      this_dupe.style.cursor = 'pointer'
      if (action.match('click')) {
        props.onClickCallback(colorLookup[pixels[0] + ' ' + pixels[1] + ' ' + pixels[2]], leafletMap)
      } else {
        this_dupe.style.cursor = 'pointer'
      }
    } else {
      this_dupe.style.cursor = 'auto'
    }
  }
}
function LatLongToPixelXY(latitude, longitude) {
  var pi_180 = Math.PI / 180.0;
  var pi_4 = Math.PI * 4;
  var sinLatitude = Math.sin(latitude * pi_180);
  var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / pi_4) * 256;
  var pixelX = (longitude + 180) / 360 * 256;

  var pixel = {
    x: pixelX,
    y: pixelY
  };

  return pixel;
}

function translateMatrix(matrix, tx, ty) {
  // translation is in last column of matrix
  matrix[12] += matrix[0] * tx + matrix[4] * ty;
  matrix[13] += matrix[1] * tx + matrix[5] * ty;
  matrix[14] += matrix[2] * tx + matrix[6] * ty;
  matrix[15] += matrix[3] * tx + matrix[7] * ty;
}

function scaleMatrix(matrix, scaleX, scaleY) {
  // scaling x and y, which is just scaling first two columns of matrix
  matrix[0] *= scaleX;
  matrix[1] *= scaleX;
  matrix[2] *= scaleX;
  matrix[3] *= scaleX;

  matrix[4] *= scaleY;
  matrix[5] *= scaleY;
  matrix[6] *= scaleY;
  matrix[7] *= scaleY;
}

const prepare_points = function(features, zoom) {
  let point_xy = new Float32Array(2 * features.length);
  let point_on_screen_color = new Float32Array(4 * features.length);
  let point_off_screen_color = new Float32Array(4 * features.length);
  let point_size = new Float32Array(features.length);
  features.forEach((f, i) => {

    var speed_value = f.properties.color
    const lat = f.geometry.coordinates[1];
    const lon = f.geometry.coordinates[0];
    // const id = f.properties.id;

    const pixel = LatLongToPixelXY(lat, lon);
    point_xy[i * 2] = pixel.x;
    point_xy[(i * 2) + 1] = pixel.y;
    point_size[i] = (f.properties.size || 1) * (zoom / 2.5);
    // if (i%100 === 0) {
    //   console.log(f)
    // }
    // i + 1
    const [r, g, b] = Array.from(gen_offscreen_colors(i));
    colorLookup[r + ' ' + g + ' ' + b] = f;

    // off screen point colors (each color unique)
    point_off_screen_color[i * 4] = fromRgb(r);
    point_off_screen_color[(i * 4) + 1] = fromRgb(g);
    point_off_screen_color[(i * 4) + 2] = fromRgb(b);
    point_off_screen_color[(i * 4) + 3] = 1;

    // on screen point colors (all red)
    point_on_screen_color[i * 4] = fromRgb(speed_value[0]);
    point_on_screen_color[(i * 4) + 1] = fromRgb(speed_value[1]);
    point_on_screen_color[(i * 4) + 2] = fromRgb(speed_value[2]);
    point_on_screen_color[(i * 4) + 3] = 0.5;
  })
  return {
    point_off_screen_color,
    point_on_screen_color,
    point_xy,
    point_size
  };
}

/* eslint-disable require-jsdoc*/
class ReactWebglLeaflet extends MapLayer {
/* eslint-disable require-jsdoc*/
  constructor(props, context) {
    super(props, context);
    this.state = {
      onDrawLayer: function(info, bind_buffers) {
        let gl = this.gl
        let canvas = info.canvas
        let leafletMap = this.leafletMap
        let program = this.program

        let pointArrayBuffer = this.pointArrayBuffer
        let sizeArrayBuffer = this.sizeArrayBuffer
        let colorArrayBuffer = this.colorArrayBuffer
        let colorArrayBufferOffScreen = this.colorArrayBufferOffScreen
        let framebuffer = this.framebuffer

        let points = prepare_points(info.points.features, this.info.zoom)
        let point_xy = points.point_xy // Typed array of x, y pairs
        let point_off_screen_color = points.point_off_screen_color // Typed array of sets of four floating points
        let point_on_screen_color = points.point_on_screen_color; // Typed array of sets of four floating points
        let point_size = points.point_size;

        if (info.points.features.length) {
          // pointArrayBuffer
          gl.bindBuffer(gl.ARRAY_BUFFER, this.pointArrayBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, points.point_xy, gl.STATIC_DRAW);

          // SizeArrayBuffer
          gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeArrayBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, points.point_size, gl.STATIC_DRAW);

          // On screen ColorArrayBuffer
          gl.bindBuffer(gl.ARRAY_BUFFER, this.colorArrayBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, points.point_on_screen_color, gl.STATIC_DRAW);

          // Off screen ColorArrayBuffer
          gl.bindBuffer(gl.ARRAY_BUFFER, this.colorArrayBufferOffScreen);
          gl.bufferData(gl.ARRAY_BUFFER, points.point_off_screen_color, gl.STATIC_DRAW);
          // end animate

          gl.viewport(0, 0, canvas.width, canvas.height);
          this.gl = gl;
        }
        if (info.points.features.length > 0) {
          gl.clear(gl.COLOR_BUFFER_BIT);
          // let mapProjection = this.leafletMap.getProjection()

          // look up the locations for the inputs to our shaders.
          let attributeLoc = gl.getUniformLocation(program, 'worldCoord');
          let attributeSize = gl.getAttribLocation(program, 'aPointSize')
          let attributeCol = gl.getAttribLocation(program, 'color');
          let pixelsToWebGLMatrix = new Float32Array(16);
          // prettier-ignore
          pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
          // Set viewport
          gl.viewport(0, 0, canvas.width, canvas.height);
          var mapMatrix = new Float32Array(16);
          mapMatrix.set(pixelsToWebGLMatrix);
          let bounds = this.leafletMap.getBounds();
          let topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
          let offset = LatLongToPixelXY(topLeft.lat, topLeft.lng);

          // Scale to current zoom
          var scale = Math.pow(2, this.leafletMap.getZoom());
          scaleMatrix(mapMatrix, scale, scale);
          translateMatrix(mapMatrix, -offset.x, -offset.y);

          // // attach matrix value to 'mapMatrix' uniform in shader
          var matrixLoc = gl.getUniformLocation(program, "mapMatrix");
          gl.uniformMatrix4fv(matrixLoc, false, mapMatrix);

          // Off SCREEN
          // Bind Shader attributes
          const height = 2048;
          const width = 2048;
          // Creating a texture to store colors
          const texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

          // Creating a Renderbuffer to store depth information
          const renderbuffer = gl.createRenderbuffer();
          gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
          gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

          // Creating a framebuffer for offscreen rendering

          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
          gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

          // Finally, we do a bit of cleaning up as usual
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.bindRenderbuffer(gl.RENDERBUFFER, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          //
          //
          // OFF SCREEN
          // Bind Shader attributes
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.bindBuffer(gl.ARRAY_BUFFER, pointArrayBuffer); // Bind world coord
          attributeLoc = gl.getAttribLocation(program, "worldCoord");

          gl.enableVertexAttribArray(1);
          gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, sizeArrayBuffer); // Bind point size
          attributeSize = gl.getAttribLocation(program, "aPointSize");
          gl.enableVertexAttribArray(attributeSize);
          gl.vertexAttribPointer(attributeSize, 1, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, colorArrayBufferOffScreen); // Bind point color
          attributeCol = gl.getAttribLocation(program, "color");
          gl.enableVertexAttribArray(attributeCol);
          gl.vertexAttribPointer(attributeCol, 4, gl.FLOAT, false, 0, 0);

          // tell webgl how buffer is laid out (pairs of x,y coords)

          //l = current_service.rawPoints.length / 2
          let l = point_xy.length / 2;

          gl.drawArrays(gl.POINTS, 0, l);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);


          // On SCREEN
          // Bind Shader attributes
          gl.bindBuffer(gl.ARRAY_BUFFER, pointArrayBuffer); // Bind world coord
          attributeLoc = gl.getAttribLocation(program, "worldCoord");
          gl.enableVertexAttribArray(attributeLoc);
          gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, sizeArrayBuffer); // Bind point size
          attributeSize = gl.getAttribLocation(program, "aPointSize");

          gl.enableVertexAttribArray(attributeSize);
          gl.vertexAttribPointer(attributeSize, 1, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, colorArrayBuffer); // Bind point color
          attributeCol = gl.getAttribLocation(program, 'color');
          gl.enableVertexAttribArray(attributeCol);
          gl.vertexAttribPointer(attributeCol, 4, gl.FLOAT, false, 0, 0);

          // tell webgl how buffer is laid out (pairs of x,y coords)

          l = point_xy.length / 2;
          gl.drawArrays(gl.POINTS, 0, l);
        }
      },
      url: 'https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?' +
        'access_token=' +
        'pk.eyJ1IjoiYXlhbmV6IiwiYSI6ImNqNHloOXAweTFveWwzM3A4M3FkOWUzM2UifQ.' +
        'GfClkT4QxlFDC_xiI37x3Q',
      attribution: '&copy; <a href=\'http://osm.org/copyright\'>OpenStreetMap</a>' +
        ' contributors ',
      lat: 0,
      lng: 0,
      zoom: 2,
      docker: false,
      value: 3,
      didUpdate: false,
      loading: false,
      onHover: false,
    }
  }
  /**
   * componentWillMount
   * @param  {Object} prevProps
   * @param  {Object} prevState
   */
  componentDidUpdate(prevProps, prevState) {
      this.state.info.points = this.props.points
      // true is for whether to bind buffers
      this.state.onDrawLayer(this.state.info, true);
  }

  createLeafletElement(props) {
    const leafletMap = this.context.map

    L.canvasLayer = function() {
      return new CanvasLayer();
    };

    let cl = L.canvasLayer()
    var glLayer = cl.delegate(this).addTo(leafletMap);
    var canvas = glLayer._canvas

    var gl = canvas.getContext('experimental-webgl', {
      antialias: true
    }) || canvas.getContext('experimental-webgl')
    var program = gl.createProgram();
    var framebuffer = gl.createFramebuffer();
    this.state.pointArrayBuffer = gl.createBuffer()
    this.state.sizeArrayBuffer = gl.createBuffer()
    this.state.colorArrayBuffer = gl.createBuffer()
    this.state.colorArrayBufferOffScreen = gl.createBuffer()
    this.state.framebuffer = framebuffer

    canvas.addEventListener('click', function(ev) {
      let this_dupe = this
      doMouseOrClick(ev, canvas, gl, framebuffer, leafletMap, props, this_dupe, 'click')
    });

    canvas.addEventListener('mousemove', function(ev) {
      let this_dupe = this
      doMouseOrClick(ev, canvas, gl, framebuffer, props, leafletMap, this_dupe, 'mouse')
    });
    var vshaderText = '\nattribute vec4  worldCoord;' +
      'attribute vec4  color;' +
      'attribute float aPointSize;' +
      'varying vec4 vColor;' +
      'uniform mat4 mapMatrix;' +
      'void main() {\n' +
      'gl_Position = mapMatrix * worldCoord;' +
      'vColor = color;' +
      'gl_PointSize = aPointSize;' +
      '}'

    var fshaderText = 'precision mediump float;' +
      'varying vec4 vColor;' +
      'void main() {' +
      'gl_FragColor = vColor;' +
      '}'
    var _shaders = shaders(gl),
      vertexShader = _shaders.vertexShader,
      fragmentShader = _shaders.fragmentShader;

    function shaders(gl) {
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vshaderText);
      gl.compileShader(vertexShader);
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fshaderText);
      gl.compileShader(fragmentShader);

      return {
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
      };
    }

    // link shaders to create our program

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    this.state.gl = gl
    this.state.program = program
    this.state.leafletMap = leafletMap
    return cl
  }

  componentDidMount() {}
}

export default ReactWebglLeaflet;

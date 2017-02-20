
"use strict"

var WebGLUtils = require('../lib/webgl/WebGLUtils');

var canvas = document.getElementById("main-canvas");

var gl = WebGLUtils.setupWebGL(canvas);

gl.viewportWidth = canvas.clientWidth;
gl.viewportHeight = canvas.clientHeight;

module.exports = gl;

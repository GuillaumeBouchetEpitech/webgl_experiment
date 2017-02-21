
"use strict"

var WebGLUtils = require('../lib/webgl/WebGLUtils');

var canvas = document.getElementById("main-canvas");

var gl = WebGLUtils.setupWebGL(canvas);

gl.viewportWidth = canvas.clientWidth;
gl.viewportHeight = canvas.clientHeight;

// EXTENSIONS

if (gl.getExtension) {

    gl._extension_vao =
        gl.getExtension('OES_vertex_array_object') ||
        gl.getExtension('MOZ_OES_vertex_array_object') ||
        gl.getExtension('WEBKIT_OES_vertex_array_object');
}

module.exports = gl;

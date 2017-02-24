
"use strict"

var WebGLUtils = require('./utils/WebGLUtils');

var canvas = document.getElementById("main-canvas");

var gl = WebGLUtils.setupWebGL(canvas);

gl.viewportWidth = canvas.clientWidth;
gl.viewportHeight = canvas.clientHeight;

// METHODS

gl.recreate = function()
{
	console.log("gl.recreate");
	return WebGLUtils.setupWebGL(canvas);
}

// EXTENSIONS

if (gl.getExtension) {

    gl._extension_vao =
        gl.getExtension('OES_vertex_array_object') ||
        gl.getExtension('MOZ_OES_vertex_array_object') ||
        gl.getExtension('WEBKIT_OES_vertex_array_object');

    gl._extension_lose_context = gl.getExtension('WEBGL_lose_context');
}

module.exports = gl;

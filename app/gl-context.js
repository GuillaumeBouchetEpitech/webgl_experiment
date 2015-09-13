
define([
        'webgl/WebGLUtils'
    ], function(
        WebGLUtils
        ) {

	var canvas = document.getElementById("main-canvas");

    gl = WebGLUtils.setupWebGL(canvas);

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    return gl;
});
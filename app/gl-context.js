
define([
        'webgl/WebGLUtils'
    ], function(
        WebGLUtils
    ) {

	var canvas = document.getElementById("main-canvas");

    gl = WebGLUtils.setupWebGL(canvas);

    gl.viewportWidth = canvas.clientWidth;
    gl.viewportHeight = canvas.clientHeight;

    return gl;
});
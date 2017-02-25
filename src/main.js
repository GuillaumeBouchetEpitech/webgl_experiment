
var createWebGLExperiment = require('./experiment/index.js');

var WebGLExperiment = new createWebGLExperiment();

WebGLExperiment.start();

var gui_toggle_start = document.getElementById("gui_toggle_start");
gui_toggle_start.addEventListener('click', function ()
{
	console.log('toggle_start');

	if (WebGLExperiment.isRunning())
		WebGLExperiment.stop();
	else
		WebGLExperiment.start();
});

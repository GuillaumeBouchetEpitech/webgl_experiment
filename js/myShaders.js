

var createShaders = function(gl, vs_id, fs_id) {

	//

	function getShader(gl, id) {

		var shaderScript = document.getElementById(id);

		if (!shaderScript) {
			alert('unknown element id');
			return null;
		}

		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3)
				str += k.textContent;

			k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == "x-shader/x-fragment")
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		else if (shaderScript.type == "x-shader/x-vertex")
			shader = gl.createShader(gl.VERTEX_SHADER);
		else {
			alert('unknown shader type');
			return null;
		}

		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}

	//

	var vertexShader = getShader(gl, vs_id);

	if (!vertexShader)
		alert("Could not initialise vertexShader");

	//

	var fragmentShader = getShader(gl, fs_id);

	if (!fragmentShader)
		alert("Could not initialise fragmentShader");

	//

	this.shaderProgram = gl.createProgram();
	gl.attachShader(this.shaderProgram, vertexShader);
	gl.attachShader(this.shaderProgram, fragmentShader);
	gl.linkProgram(this.shaderProgram);

	if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS))
	{
		alert("Could not initialise shaders");

		// An error occurred while linking
		var lastError = gl.getProgramInfoLog(this.shaderProgram);
		alert("Error in program linking:" + lastError);
	}

	return this.shaderProgram;
}


	



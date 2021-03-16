
"use strict"

class ShaderProgram {

    constructor(gl, opt) {

        if (!opt.vs_src)
            throw new Error('no vertex shader id');

        if (!opt.fs_src)
            throw new Error('no fragment shader id');

        //

        var vertexShader = this._getShader(gl, opt.vs_src, gl.VERTEX_SHADER);

        if (!vertexShader)
            throw new Error("Could not initialise vertexShader");

        //

        var fragmentShader = this._getShader(gl, opt.fs_src, gl.FRAGMENT_SHADER);

        if (!fragmentShader)
            throw new Error("Could not initialise fragmentShader");

        //

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS))
        {
            // An error occurred while linking
            var lastError = gl.getProgramInfoLog(this.shaderProgram);

            throw new Error("Failed to initialised shaders, Error linking:" + lastError);
        }


        this._getAttribAndLocation(gl, this.shaderProgram, opt.arr_attrib, opt.arr_uniform);

        return this.shaderProgram;
    }

    _getAttribAndLocation(gl, shader, arr_attrib, arr_uniform) {

        gl.useProgram(shader);

        if (arr_attrib)
            for (var i = 0; i < arr_attrib.length; ++i)
                shader[arr_attrib[i]] = gl.getAttribLocation(shader, arr_attrib[i]);

        if (arr_uniform)
            for (var i = 0; i < arr_uniform.length; ++i)
                shader[arr_uniform[i]] = gl.getUniformLocation(shader, arr_uniform[i]);

        gl.useProgram(null);
    }

    //

    _getShader(gl, src, type) {

        const shader = gl.createShader(type);

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }

        return shader;
    }
};

module.exports = ShaderProgram;

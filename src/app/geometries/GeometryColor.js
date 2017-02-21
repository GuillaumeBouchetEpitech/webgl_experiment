
"use strict"

var gl = require('../gl-context.js');

var GeometryColor = function (vertices, primitive) {

    this._primitive = primitive;

    this._vbuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    this._vbuffer.numItems = vertices.length / 6;
}

//

var proto = GeometryColor.prototype

proto.render = function(shader) {

    if (gl._extension_vao)
    {
        if (this._vao)
        {
            gl._extension_vao.bindVertexArrayOES( this._vao );

                gl.drawArrays( this._primitive, 0, this._vbuffer.numItems );

            gl._extension_vao.bindVertexArrayOES( null );
        }
        else
        {
            this._vao = gl._extension_vao.createVertexArrayOES();

            gl._extension_vao.bindVertexArrayOES( this._vao );

                this.render_backup(shader, true);

            gl._extension_vao.bindVertexArrayOES( null );
        }
    }
    else
    {
        this.render_backup(shader);
    }
};

//

proto.render_backup = function(shader, no_clear) {

    gl.enableVertexAttribArray(shader.aVertexPosition);
    gl.enableVertexAttribArray(shader.aVertexColor);

        var bpp = 4; // gl.FLOAT -> 4 bytes
        var stride = 6 * bpp;
        var index_pos    = 0 * bpp;
        var index_color  = 3 * bpp;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);
        gl.vertexAttribPointer(shader.aVertexPosition,3,gl.FLOAT,false,stride,index_pos);
        gl.vertexAttribPointer(shader.aVertexColor,3,gl.FLOAT,false,stride,index_color);

        gl.drawArrays( this._primitive, 0, this._vbuffer.numItems );

    if (!no_clear)
    {
        gl.disableVertexAttribArray(shader.aVertexPosition);
        gl.disableVertexAttribArray(shader.aVertexColor);
    }
};

//

module.exports = GeometryColor;


"use strict"

var gl = require('../context.js');

var GeometryExperimental = function (vertices, shader, vertices_is_buffer) {

    this._vbuffer = gl.createBuffer();
    this._shader = shader;

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    this._vbuffer.numItems = vertices.length / 12;
}

//

var proto = GeometryExperimental.prototype;

proto.update = function(vertices) {

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    this._vbuffer.numItems = vertices.length / 12;
}

proto.dispose = function() {

    gl.deleteBuffer(this._vbuffer);

    if (this._vao)
        gl._extension_vao.deleteVertexArrayOES( this._vao );

    // console.log('dispose called');
}

//

proto.render = function() {

    var shader = this._shader;

    if (gl._extension_vao)
    {
        if (this._vao)
        {
            gl._extension_vao.bindVertexArrayOES( this._vao );

                gl.drawArrays( gl.TRIANGLES, 0, this._vbuffer.numItems );

            gl._extension_vao.bindVertexArrayOES( null );
        }
        else
        {
            this._vao = gl._extension_vao.createVertexArrayOES();

            gl._extension_vao.bindVertexArrayOES( this._vao );

                this.render_backup(true);

            gl._extension_vao.bindVertexArrayOES( null );
        }
    }
    else
    {
        this.render_backup();
    }
};

//

proto.render_backup = function(no_clear) {

    var shader = this._shader;

    gl.enableVertexAttribArray(shader.aVertexPosition);
    gl.enableVertexAttribArray(shader.aVertexColor);
    gl.enableVertexAttribArray(shader.aVertexNormal);
    gl.enableVertexAttribArray(shader.aVertexBCenter);

        var bpp = 4; // gl.FLOAT -> 4 bytes
        var stride = 12 * bpp;
        var index_pos    = 0 * bpp;
        var index_color  = 3 * bpp;
        var index_normal  = 6 * bpp;
        var index_bcenter  = 9 * bpp;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);
        gl.vertexAttribPointer(shader.aVertexPosition,3,gl.FLOAT,false,stride,index_pos);
        gl.vertexAttribPointer(shader.aVertexColor,3,gl.FLOAT,false,stride,index_color);
        gl.vertexAttribPointer(shader.aVertexNormal,3,gl.FLOAT,false,stride,index_normal);
        gl.vertexAttribPointer(shader.aVertexBCenter,3,gl.FLOAT,false,stride,index_bcenter);

        gl.drawArrays( gl.TRIANGLES, 0, this._vbuffer.numItems );

    if (!no_clear)
    {
        gl.disableVertexAttribArray(shader.aVertexPosition);
        gl.disableVertexAttribArray(shader.aVertexColor);
        gl.disableVertexAttribArray(shader.aVertexNormal);
        gl.disableVertexAttribArray(shader.aVertexBCenter);
    }
};

module.exports = GeometryExperimental;

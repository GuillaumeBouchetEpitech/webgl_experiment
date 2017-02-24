
"use strict"

var g_data = require('../data/index.js');

var gl = require('./context.js');

var createFreeFlyCamera = require('./camera/FreeFlyCamera.js')
var createFrustumCulling = require('./camera/FrustumCulling.js')
var glm = require('./utils/gl-matrix-2.3.2.min.js');

var myShaders = require('./utils/myShaders.js');
var myTexture = require('./utils/myTexture.js');
var createShaders = myShaders.createShaders

var createGeometryColor = require('./geometries/GeometryColor.js');
var createGeometryExperimental = require('./geometries/GeometryExperimental.js');
var createCubeVertices = require('./geometries/createCubeVertices.js');
var createFrustumVertices = require('./geometries/createFrustumVertices.js');


var glhProject = require('./camera/glhProject.js')


//

function RendererWebGL ()
{
	this.FreeFlyCamera = new createFreeFlyCamera();
	this.FreeFlyCamera.activate();
	this.FreeFlyCamera.setPosition( g_data.logic.k_chunk_size/4*3, g_data.logic.k_chunk_size/4*3, 0 );

	this.FrustumCulling = new createFrustumCulling();

	this.pMatrix = glm.mat4.create();
	this.mvMatrix = glm.mat4.create();

    gl.canvas.addEventListener('webglcontextlost', function(event)
    {
        event.preventDefault();
        console.log('context is lost');

        if (self.on_context_lost)
            self.on_context_lost();
    }, false);

    self = this;
    gl.canvas.addEventListener('webglcontextrestored', function()
    {
        console.log('context is restored');

        gl = gl.recreate();

        if (self.on_context_restored)
            self.on_context_restored();
    }, false);
}

//

var proto = RendererWebGL.prototype;

proto.chunk_is_visible = function (pos)
{
    var hsize = g_data.logic.k_chunk_size / 2;

    return this.FrustumCulling.cubeInFrustum( pos[0]+hsize, pos[1]+hsize, pos[2]+hsize, hsize );
}

proto.point_is_visible = function (pos)
{
    return this.FrustumCulling.pointInFrustum( pos[0], pos[1], pos[2] );
}

proto.add_geom = function (buffer)
{
    var geom = new createGeometryExperimental(gl, buffer, this.shader_exp);

    return (geom.isValid() ? geom : null);
}

proto.update_geom = function (geom, buffer)
{
    geom.update(gl, buffer);
}


proto.getCameraPosition = function ()
{
	return [
        this.FreeFlyCamera._Position[0],
        this.FreeFlyCamera._Position[1],
        this.FreeFlyCamera._Position[2]
	];
}

proto.resize = function (width, height)
{
    gl.viewportWidth = width;
    gl.viewportHeight = height;

    this.aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

    // TODO: dispose the previous geometry
    var vertices = createFrustumVertices(70, this.aspectRatio, 0.1, 40);
    this.geom_frustum = new createGeometryColor(gl, vertices, gl.LINES);
}

//

proto.toggle_context_loss = function ()
{
    if (gl._extension_lose_context)
    {
        if (gl.isContextLost())
            gl._extension_lose_context.restoreContext(); // restores the context
        else
            gl._extension_lose_context.loseContext(); // trigger a context loss
    }
}

proto.context_is_lost = function ()
{
    return gl.isContextLost();
}

proto.set_on_context_lost = function (callback)
{
    this.on_context_lost = callback;
}

proto.set_on_context_restored = function (callback)
{
    this.on_context_restored = callback;
}

//

proto.init = function (onFinish)
{
	//
	//
	// shaders

	var shader_opt = {
	    vs_id: "shader-vs-color",
	    fs_id: "shader-fs-color",
	    arr_attrib: ['aVertexPosition','aVertexColor'],
	    arr_uniform: ['uMVMatrix','uPMatrix']
	}
	this.shader_color = new createShaders( gl, shader_opt );

	var shader_opt = {
	    vs_id: "shader-vs-experimental",
	    fs_id: "shader-fs-experimental",
	    arr_attrib: ['aVertexPosition','aVertexColor','aVertexNormal','aVertexBCenter'],
	    arr_uniform: ['uMVMatrix','uPMatrix','uCameraPos','uSampler']
	}

	this.shader_exp = new createShaders( gl, shader_opt );

	//
	//
	// create axis geometry

	var vertices = [];

	var axis_size = 20;

	vertices.push(0,0,0,  1,0,0,  axis_size,0,0,  1,0,0)
	vertices.push(0,0,0,  0,1,0,  0,axis_size,0,  0,1,0)
	vertices.push(0,0,0,  0,0,1,  0,0,axis_size,  0,0,1)

	this.geom_axis = new createGeometryColor(gl, vertices, gl.LINES);

	//
	//
	// create coss geometry

	var vertices = [];

	var cross_size = 5;

	vertices.push(0-cross_size,0,0,  1,1,1);
	vertices.push(0+cross_size*5,0,0,  1,1,1);
	vertices.push(0,0-cross_size,0,  1,1,1);
	vertices.push(0,0+cross_size,0,  1,1,1);
	vertices.push(0,0,0-cross_size,  1,1,1);
	vertices.push(0,0,0+cross_size,  1,1,1);

	this.geom_cross = new createGeometryColor(gl, vertices, gl.LINES);

	//
	//
	// geoms

	var vertices = createCubeVertices(g_data.logic.k_chunk_size, [1,0,0]);
	this.geom_cubeR = new createGeometryColor(gl, vertices, gl.LINES);

	var vertices = createCubeVertices(g_data.logic.k_chunk_size, [1,1,1]);
	this.geom_cubeW = new createGeometryColor(gl, vertices, gl.LINES);

	var vertices = createCubeVertices(g_data.logic.k_chunk_size, [0,1,0]);
	this.geom_cubeG = new createGeometryColor(gl, vertices, gl.LINES);


	this.aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

	var vertices = createFrustumVertices(35, this.aspectRatio, 0.1, 40);
	this.geom_frustum = new createGeometryColor(gl, vertices, gl.LINES);

	//
	//
	// init

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);


	var img_texture = new Image();
	var crateTexture = gl.createTexture();
	img_texture.onload = function ()
	{
		var buf_texture = myTexture.imageToUint8Array(img_texture);
		buf_texture = myTexture.flipYImageArray(buf_texture, img_texture.width, img_texture.height);

	    gl.useProgram(this.shader_exp);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, crateTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img_texture.width, img_texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf_texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	    gl.useProgram(null);

		// starting point
		onFinish();
	}

	// TODO : handle the an onerror on the texture loading here

	img_texture.src = "textures/texture.png";
}

proto.update = function (elapsed)
{
    this.FreeFlyCamera.handleKeys();
    this.FreeFlyCamera.update( elapsed / 1000.0 );

    glm.mat4.perspective( this.pMatrix, 70, this.aspectRatio, 0.1, 70);

    this.FreeFlyCamera.updateViewMatrix( this.mvMatrix );
    this.FrustumCulling.calculateFrustum( this.pMatrix, this.mvMatrix );

	var viewport = [0, 0, gl.viewportWidth*0.75, gl.viewportHeight];

	var arr_chunks = g_data.logic.ChunkGenerator._chunks;

    for (var i = 0; i < arr_chunks.length; ++i)
    {
    	var pos = arr_chunks[i].pos;

        arr_chunks[i].visible = this.chunk_is_visible(pos);

        if (!this.point_is_visible(pos))
        	continue;

		var tmp_2d_position = glhProject(
		    pos[0],pos[1],pos[2],
		    this.mvMatrix,
		    this.pMatrix,
		    viewport
		);

		// flip the 'y' value
		tmp_2d_position[1] = viewport[3] - tmp_2d_position[1];

        arr_chunks[i].coord2d = tmp_2d_position;
    }
}

proto.render = function ()
{
	var arr_chunks = g_data.logic.ChunkGenerator._chunks;

	gl.viewport(0, 0, gl.viewportWidth*0.75, gl.viewportHeight);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.shader_exp);

	    // send the texture to the shader
	    gl.uniform1i(this.shader_exp.uSampler, 0);

	    gl.uniformMatrix4fv(this.shader_exp.uMVMatrix, false, this.mvMatrix);
	    gl.uniformMatrix4fv(this.shader_exp.uPMatrix, false, this.pMatrix);

	    var p = this.FreeFlyCamera._Position;
	    gl.uniform3f(this.shader_exp.uCameraPos, p[0],p[1],p[2]);

	    for (var i = 0; i < arr_chunks.length; ++i)
	        if (arr_chunks[i].visible)
	            arr_chunks[i].geom.render(gl);


    gl.useProgram(this.shader_color);

        gl.uniformMatrix4fv(this.shader_color.uPMatrix, false, this.pMatrix);
        gl.uniformMatrix4fv(this.shader_color.uMVMatrix, false, this.mvMatrix);

        // this.geom_axis.render(this.shader_color);

        var tmp_mvMatrix2 = glm.mat4.create();

        for (var i = 0; i < arr_chunks.length; ++i)
        {
	        if (!arr_chunks[i].visible)
                continue;

            var pos = arr_chunks[i].pos;

            glm.mat4.translate(tmp_mvMatrix2, this.mvMatrix, pos);

            gl.uniformMatrix4fv(this.shader_color.uMVMatrix, false, tmp_mvMatrix2);

            ///

            this.geom_cubeW.render(gl, this.shader_color);
        }

    gl.useProgram(null);
}

proto.renderHUD = function ()
{
	var arr_chunks = g_data.logic.ChunkGenerator._chunks;

    gl.useProgram(this.shader_color);

	    // rendered 3 times with a different viewport and point of view

	    var w = gl.viewportWidth*0.25;
	    var w2 = gl.viewportWidth*0.75;
	    var h = gl.viewportHeight*0.33;

	    gl.clear(gl.DEPTH_BUFFER_BIT);

	    var self = this;
	    render_hud( [w2,h*0,w,h], [1.0, 1.2, 1.0], [0,0,1] );
	    render_hud( [w2,h*1,w,h], [0.0, 1.0, 0.0], [0,0,1] );
	    render_hud( [w2,h*2,w,h], [0.0, 0.0, 1.0], [0,1,0] );

    //

    function render_hud(arr_viewport, arr_target, arr_up)
    {
        gl.viewport(arr_viewport[0], arr_viewport[1], arr_viewport[2], arr_viewport[3]);

            var tmp_pMatrix = glm.mat4.create();
            var aspectRatio2 = arr_viewport[2]/arr_viewport[3];
            var ortho_size = 65;
            glm.mat4.ortho(tmp_pMatrix,
                -ortho_size*aspectRatio2,ortho_size*aspectRatio2,
                -ortho_size,ortho_size,
                -200,200);

            var cpos = self.FreeFlyCamera._Position;

            var tmp_mvMatrix = glm.mat4.create();
            glm.mat4.lookAt(
                tmp_mvMatrix,
                [   cpos[0]+arr_target[0],
                    cpos[1]+arr_target[1],
                    cpos[2]+arr_target[2] ],
                cpos,
                arr_up
            );


            gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix);
            gl.uniformMatrix4fv(self.shader_color.uPMatrix, false, tmp_pMatrix);

        self.geom_axis.render(gl, self.shader_color)

            var tmp_mvMatrix2 = glm.mat4.create();

            for (var i = 0; i < arr_chunks.length; ++i)
            {
                var pos = arr_chunks[i].pos;

                ///

                glm.mat4.identity(tmp_mvMatrix2);

                if (arr_chunks[i].visible)
                {
                    // render white cube

                    glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

                    gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix2);
                    self.geom_cubeW.render(gl, self.shader_color);
                }
                else
                {
                    // render red cube (smaller -> scalled)

                    glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                        pos[0] + g_data.logic.k_chunk_size*0.15,
                        pos[1] + g_data.logic.k_chunk_size*0.15,
                        pos[2] + g_data.logic.k_chunk_size*0.15
                    ]);
                    glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.7,0.7,0.7]);

                    gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix2);
                    self.geom_cubeR.render(gl, self.shader_color);
                }
            }

            if (g_data.logic.ChunkGenerator.is_processing_chunk)
            {
                var pos = g_data.logic.ChunkGenerator.processing_pos

                glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                    pos[0] + g_data.logic.k_chunk_size*0.2,
                    pos[1] + g_data.logic.k_chunk_size*0.2,
                    pos[2] + g_data.logic.k_chunk_size*0.2
                ]);
                glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.6,0.6,0.6]);

                gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix2);
                self.geom_cubeG.render(gl, self.shader_color);
            }



                glm.mat4.translate(tmp_mvMatrix,tmp_mvMatrix, self.FreeFlyCamera._Position);
                glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, self.FreeFlyCamera._theta*3.14/180, [0,0,1]);
                glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, self.FreeFlyCamera._phi*3.14/180, [0,-1,0]);

                gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix);

            self.geom_cross.render(gl, self.shader_color);
            gl.lineWidth(3);
            self.geom_frustum.render(gl, self.shader_color);
            gl.lineWidth(1);

    }

    gl.useProgram(null);
}

//

module.exports = RendererWebGL;

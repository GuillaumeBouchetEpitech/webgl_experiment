
// define(function (require) {

//     var WebGLUtils = require('webgl/WebGLUtils');
//     var glm = require('webgl/gl-matrix-2.1.0');
//     var createShaders = require('webgl/myShaders').createShaders;
//     var createWireframeCube = require('./geometries/WireframeCube.js');

define(
    [
          './gl-context.js'

        , 'webgl/gl-matrix-2.1.0'
        , 'webgl/myShaders'

        , './geometries/geometryColor.js'
        , './geometries/createCubeVertices.js'
        , './geometries/createFrustumVertices.js'

        , './camera/freeFlyCamera.js'
        , './camera/frustumCulling.js'

        , './generation/chunkGenerator.js'
    ],
    function(
          gl

        , glm
        , myShaders

        , createGeometryColor
        , createCubeVertices
        , createFrustumVertices

        , createFreeFlyCamera
        , createFrustumCulling

        , chunkGenerator
        )
{



    var createShaders = myShaders.createShaders

    //
    //
    // shader

    var shader_opt = {
        vs_id: "shader-vs-color",
        fs_id: "shader-fs-color",
        arr_attrib: ['aVertexPosition','aVertexColor'],
        arr_uniform: ['uMVMatrix','uPMatrix']
    }
    g_shaderProgram_color = new createShaders( gl, shader_opt );

    //

    var shader_opt = {
        vs_id: "shader-vs-experimental",
        fs_id: "shader-fs-experimental",
        arr_attrib: ['aVertexPosition','aVertexColor','aVertexNormal','aVertexBCenter'],
        arr_uniform: ['uMVMatrix','uPMatrix']
    }
    g_shaderProgram_experimental = new createShaders( gl, shader_opt );

    //

    var shader_color = g_shaderProgram_color;
    var shader_exp = g_shaderProgram_experimental;

    // shader
    //
    //

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);







    //
    // create axis geometry

    var vertices = [];

    var axis_size = 20;

    vertices.push(0,0,0,  1,0,0,  axis_size,0,0,  1,0,0)
    vertices.push(0,0,0,  0,1,0,  0,axis_size,0,  0,1,0)
    vertices.push(0,0,0,  0,0,1,  0,0,axis_size,  0,0,1)

    var axis_geom = new createGeometryColor(vertices, gl.LINES);

    // create axis geometry
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

    var cross_geom = new createGeometryColor(vertices, gl.LINES);

    // create coss geometry
    //










    var k_chunk_size = 15;


    var vertices = createCubeVertices(k_chunk_size,[1,0,0], true);
    var cubeR_geom = new createGeometryColor(vertices, gl.LINES);

    // var vertices = createCubeVertices(k_chunk_size,[0.5,0.5,0.5]);
    var vertices = createCubeVertices(k_chunk_size,[1,1,1]);
    var cubeW_geom = new createGeometryColor(vertices, gl.LINES);

    var vertices = createCubeVertices(k_chunk_size,[0,1,0], true);
    var cubeG_geom = new createGeometryColor(vertices, gl.LINES);


    // var aspectRatio = gl.viewportWidth / gl.viewportHeight;
    var aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

    var vertices = createFrustumVertices(70, aspectRatio, 0.1, 40);
    var frustum_geom = new createGeometryColor(vertices, gl.LINES);



    var my_chunkGenerator = new chunkGenerator( k_chunk_size, shader_exp );









    //

    var last_time = 0

    //

    g_FreeFlyCamera = new createFreeFlyCamera();
    g_FreeFlyCamera.activate();

    g_FrustumCulling = new createFrustumCulling();
    function chunk_is_visible(pos) {

        return g_FrustumCulling.cubeInFrustum(
            pos[0] + k_chunk_size/2,
            pos[1] + k_chunk_size/2,
            pos[2] + k_chunk_size/2,
            k_chunk_size/2
        );
    }

    var saved_index = [1,0,0]




    var gui_reset = document.getElementById("gui_reset");
    gui_reset.addEventListener('click', function () {

        //
        // reset all the chunks in use and queued

        my_chunkGenerator._chunks.length = 0;
        my_chunkGenerator._chunk_queue.length = 0;
        my_chunkGenerator = null;

        //
        // retrieve the values

        var tmp_octave = document.getElementById("range_octaves").value;
        var tmp_frequency = document.getElementById("range_frequency").value / 100;
        var tmp_amplitude = 0.5;

        var tmp_tetra = document.getElementById("check_tetra").checked || false;

        //
        // set the new values

        my_chunkGenerator = new chunkGenerator(
            k_chunk_size, shader_exp,
            tmp_octave, tmp_frequency, tmp_amplitude,
            tmp_tetra
        );

        //
        // this part is like saying "the user have moved, generate your stuff now"

        var curr_index_x = Math.floor(g_FreeFlyCamera._Position[0] / k_chunk_size);
        saved_index = [curr_index_x +1,0,0]
    })







    tick();

    function tick(in_event) {

        window.requestAnimFrame( tick ); // webgl-utils.js

            var current_time = performance.now() || (new Date()).getTime();

            if (!last_time)
                last_time = current_time;

            var elapsed = current_time - last_time;

            last_time = current_time;

        ///

            g_FreeFlyCamera.handleKeys();

            g_FreeFlyCamera.update( elapsed / 1000.0 );





            //  check if move to ask chunks
            //      -> if yes
            //          exclude chunk out of range
            //          include chunk in range


        var curr_index = [
            Math.floor(g_FreeFlyCamera._Position[0] / k_chunk_size)|0,
            Math.floor(g_FreeFlyCamera._Position[1] / k_chunk_size)|0,
            Math.floor(g_FreeFlyCamera._Position[2] / k_chunk_size)|0
        ];

        if (curr_index[0] != saved_index[0] ||
            curr_index[1] != saved_index[1] ||
            curr_index[2] != saved_index[2])
        {
            saved_index[0] = curr_index[0];
            saved_index[1] = curr_index[1];
            saved_index[2] = curr_index[2];

            my_chunkGenerator._chunk_queue.length = 0;

            var range = 2|0;

            var min_index = new Int32Array([
                (curr_index[0] - range)|0,
                (curr_index[1] - range)|0,
                (curr_index[2] - range)|0,
            ]);
            var max_index = new Int32Array([
                (curr_index[0] + range)|0,
                (curr_index[1] + range)|0,
                (curr_index[2] + range)|0,
            ]);

            //

            for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
            {
                var curr_pos = [
                    (my_chunkGenerator._chunks[i].pos[0]/k_chunk_size)|0,
                    (my_chunkGenerator._chunks[i].pos[1]/k_chunk_size)|0,
                    (my_chunkGenerator._chunks[i].pos[2]/k_chunk_size)|0
                ]

                if (curr_pos[0] < min_index[0] || curr_pos[0] > max_index[0] ||
                    curr_pos[1] < min_index[1] || curr_pos[1] > max_index[1] ||
                    curr_pos[2] < min_index[2] || curr_pos[2] > max_index[2])
                {
                    my_chunkGenerator._chunks[i].geom.dispose();
                    my_chunkGenerator._chunks.splice(i, 1);
                    i--;
                }
            }

            //

            for (var z = min_index[2]; z <= max_index[2]; ++z)
            for (var y = min_index[1]; y <= max_index[1]; ++y)
            for (var x = min_index[0]; x <= max_index[0]; ++x)
            {
                my_chunkGenerator._chunk_queue.push([
                    x * k_chunk_size,
                    y * k_chunk_size,
                    z * k_chunk_size
                ]);
            }

        }






        //
        //
        ////// matrices

        // set the projection matrix

        var tmp_pMatrix = glm.mat4.create();
        glm.mat4.perspective(tmp_pMatrix, 70, aspectRatio, 0.1, 40);

        // set the modelview matrix

        var tmp_mvMatrix = glm.mat4.create();
        g_FreeFlyCamera.updateViewMatrix( tmp_mvMatrix );

        //

        g_FrustumCulling.calculateFrustum( tmp_pMatrix, tmp_mvMatrix );

        ////// /matrices
        //
        //





        //
        //
        ////// generation

        {
            var p = g_FreeFlyCamera._Position;
            var f = g_FreeFlyCamera._Forward;

            var camera_pos = [
                p[0] + f[0] * k_chunk_size / 4,
                p[1] + f[1] * k_chunk_size / 4,
                p[2] + f[2] * k_chunk_size / 4
            ];

            my_chunkGenerator.update(camera_pos, function (try_pos, best_pos) {

                if (chunk_is_visible(try_pos))
                    return true;

                return false;
            });
        }

        ////// /generation
        //
        //




        //
        //
        ////// render 3d scene

        // gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.viewport(0, 0, gl.viewportWidth*0.75, gl.viewportHeight);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        /// render chunks

            // this part is already setting up a shader
            my_chunkGenerator.render(tmp_mvMatrix, tmp_pMatrix, chunk_is_visible);

        /// render cubes

        gl.useProgram(shader_color);

            gl.uniformMatrix4fv(shader_color.uPMatrix, false, tmp_pMatrix);
            gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix);

            axis_geom.render(shader_color);

            var tmp_mvMatrix2 = glm.mat4.create();

            for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
            {
                var pos = my_chunkGenerator._chunks[i].pos;

                glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

                gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);

                ///

                var visible = chunk_is_visible(pos);

                if (visible)
                    cubeW_geom.render(shader_color);
                else
                    cubeR_geom.render(shader_color);
            }

            if (my_chunkGenerator.is_processing_chunk)
            {
                var pos = my_chunkGenerator.processing_pos

                glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

                gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
                cubeG_geom.render(shader_color);
            }

        gl.useProgram(null);

        ////// /render 3d scene
        //
        //







        //
        //
        //
        // HUD

        gl.useProgram(shader_color);

        // rendered 3 times with a different viewport and point of view

        var w = gl.viewportWidth*0.25;
        var w2 = gl.viewportWidth*0.75;
        var h = gl.viewportHeight*0.33;

        render_hud( [w2,h*0,w,h], [1.0, 1.2, 1.0], [0,0,1] );
        render_hud( [w2,h*1,w,h], [0.0, 1.0, 0.0], [0,0,1] );
        render_hud( [w2,h*2,w,h], [0.0, 0.0, 1.0], [0,1,0] );

        //

        function render_hud(arr_viewport, arr_target, arr_up) {

            gl.viewport(arr_viewport[0], arr_viewport[1], arr_viewport[2], arr_viewport[3]);

            gl.clear(gl.DEPTH_BUFFER_BIT);

                var tmp_pMatrix = glm.mat4.create();
                var aspectRatio2 = 1;
                var ortho_size = 65;
                glm.mat4.ortho(tmp_pMatrix,
                    -ortho_size*aspectRatio2,ortho_size*aspectRatio2,
                    -ortho_size,ortho_size,
                    -200,200);

                var cpos = g_FreeFlyCamera._Position;

                var tmp_mvMatrix = glm.mat4.create();
                glm.mat4.lookAt(
                    tmp_mvMatrix,
                    [   cpos[0]+arr_target[0],
                        cpos[1]+arr_target[1],
                        cpos[2]+arr_target[2] ],
                    cpos,
                    arr_up
                );


                gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix);
                gl.uniformMatrix4fv(shader_color.uPMatrix, false, tmp_pMatrix);

            axis_geom.render(shader_color)

                var tmp_mvMatrix2 = glm.mat4.create();

                for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
                {
                    var pos = my_chunkGenerator._chunks[i].pos;

                    ///

                    var visible = chunk_is_visible(pos);

                    ///

                    glm.mat4.identity(tmp_mvMatrix2);

                    if (visible)
                    {
                        // render white cube

                        glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

                        gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
                        cubeW_geom.render(shader_color);
                    }
                    else
                    {
                        // render red cube (smaller -> scalled)

                        glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                            pos[0] + k_chunk_size*0.15,
                            pos[1] + k_chunk_size*0.15,
                            pos[2] + k_chunk_size*0.15
                        ]);
                        glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.7,0.7,0.7]);

                        gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
                        cubeR_geom.render(shader_color);
                    }
                }

                if (my_chunkGenerator.is_processing_chunk)
                {
                    var pos = my_chunkGenerator.processing_pos

                    glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                        pos[0] + k_chunk_size*0.2,
                        pos[1] + k_chunk_size*0.2,
                        pos[2] + k_chunk_size*0.2
                    ]);
                    glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.6,0.6,0.6]);

                    gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
                    cubeG_geom.render(shader_color);
                }



                    glm.mat4.translate(tmp_mvMatrix,tmp_mvMatrix, g_FreeFlyCamera._Position);
                    glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, g_FreeFlyCamera._theta*3.14/180, [0,0,1]);
                    glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, g_FreeFlyCamera._phi*3.14/180, [0,-1,0]);

                    gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix);

                cross_geom.render(shader_color);
                frustum_geom.render(shader_color);

        }

        gl.useProgram(null);

        // HUD
        //
        //
        //











        gl.useProgram(null);
    }

});


define(
    [
          './gl-context.js'

        , 'webgl/gl-matrix-2.1.0'
        , 'webgl/myShaders'
        , 'webgl/texture'

        , 'fpsmeter' // in /lib

        , './geometries/geometryColor.js'
        , './geometries/createCubeVertices.js'
        , './geometries/createFrustumVertices.js'

        , './camera/freeFlyCamera.js'
        , './camera/frustumCulling.js'
        , './camera/glhProject.js'

        , './generation/chunkGenerator.js'
    ],
    function(
          gl

        , glm
        , myShaders
        , textureHelper

        , unused_fpsmeter // <- use window.FPSMeter

        , createGeometryColor
        , createCubeVertices
        , createFrustumVertices

        , createFreeFlyCamera
        , createFrustumCulling
        , glhProject

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
        arr_uniform: ['uMVMatrix','uPMatrix','uCameraPos','uSampler']
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

    var vertices = createCubeVertices(k_chunk_size,[1,1,1]);
    var cubeW_geom = new createGeometryColor(vertices, gl.LINES);

    var vertices = createCubeVertices(k_chunk_size,[0,1,0], true);
    var cubeG_geom = new createGeometryColor(vertices, gl.LINES);


    var aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

    var vertices = createFrustumVertices(70, aspectRatio, 0.1, 40);
    var frustum_geom = new createGeometryColor(vertices, gl.LINES);



    var my_chunkGenerator = new chunkGenerator( k_chunk_size, shader_exp );









    //
    //
    // CAMERA

    var time_last = 0

    //

    g_FreeFlyCamera = new createFreeFlyCamera();
    g_FreeFlyCamera.activate();

    g_FreeFlyCamera.setPosition(
        k_chunk_size/4*3,
        k_chunk_size/4*3,
        0
    );


    g_FrustumCulling = new createFrustumCulling();
    function chunk_is_visible(pos) {

        return g_FrustumCulling.cubeInFrustum(
            pos[0] + k_chunk_size/2,
            pos[1] + k_chunk_size/2,
            pos[2] + k_chunk_size/2,
            k_chunk_size/2
        );
    }

    // CAMERA
    //
    //



    // position used to detect a move in the current chunk
    var saved_index = [1,0,0]; // <- currently 1/0/0 but any other value than 0/0/0 will work



    //
    //
    // GUI (touch supported indicator)

    if ('ontouchstart' in window) {
        document.getElementById("touch_id").innerHTML += 'Supported';
    } else {
        document.getElementById("touch_id").innerHTML += 'Not Supported';
    }

    // GUI (touch supported indicator)
    //
    //



    //
    //
    // GUI (fullscreen button)

    var gui_fullscreen = document.getElementById("gui_fullscreen");
    gui_fullscreen.addEventListener('click', function () {

        var elem = document.getElementById("canvasesdiv");

        // go full-screen
        if (elem.requestFullscreen)
            elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen)
            elem.webkitRequestFullscreen();
        else if (elem.mozRequestFullScreen)
            elem.mozRequestFullScreen();
        else if (elem.msRequestFullscreen)
            elem.msRequestFullscreen();
    });

    function on_fullscreen_change() {

        var elem = document.getElementById("canvasesdiv");
        var canvas = document.getElementById("main-canvas");
        var s_canvas = document.getElementById("second-canvas");

        var tmp_width = null;
        var tmp_height = null;

        if (document.fullscreen ||
            document.mozFullScreen ||
            document.webkitIsFullScreen ||
            document.msFullscreenElement)
        {
            elem.style.position = "absolute";

            tmp_width = window.innerWidth;
            tmp_height = window.innerHeight;
        }
        else
        {
            elem.style.position = "relative";

            tmp_width = 800;
            tmp_height = 600;
        }

        elem.style.left = "0px";
        elem.style.top = "0px";

        canvas.width = s_canvas.width = tmp_width;
        canvas.height = s_canvas.height = tmp_height;

        gl.viewportWidth = gl.canvas.clientWidth;
        gl.viewportHeight = gl.canvas.clientHeight;

        //

        aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

        var vertices = createFrustumVertices(70, aspectRatio, 0.1, 40);
        frustum_geom = new createGeometryColor(vertices, gl.LINES);
    }

    document.addEventListener('fullscreenchange',       on_fullscreen_change, false);
    document.addEventListener('mozfullscreenchange',    on_fullscreen_change, false);
    document.addEventListener('webkitfullscreenchange', on_fullscreen_change, false);
    document.addEventListener('msfullscreenchange',     on_fullscreen_change, false);

    // GUI (fullscreen button)
    //
    //



    // //
    // //
    // // GUI (reset button)

    // var gui_reset = document.getElementById("gui_reset");
    // gui_reset.addEventListener('click', function () {

    //     //
    //     // reset all the chunks in use and queued

    //     my_chunkGenerator._chunks.length = 0;
    //     my_chunkGenerator._chunk_queue.length = 0;
    //     my_chunkGenerator = null;

    //     //
    //     // retrieve the values

    //     var tmp_octave = document.getElementById("range_octaves").value;
    //     var tmp_frequency = document.getElementById("range_frequency").value / 100;
    //     var tmp_amplitude = 0.5;

    //     var tmp_tetra = document.getElementById("check_tetra").checked || false;

    //     //
    //     // set the new values

    //     my_chunkGenerator = new chunkGenerator(
    //         k_chunk_size, shader_exp,
    //         tmp_octave, tmp_frequency, tmp_amplitude,
    //         tmp_tetra
    //     );

    //     //
    //     // this part is like saying "the user have moved, generate your stuff now"

    //     var curr_index_x = Math.floor(g_FreeFlyCamera._Position[0] / k_chunk_size);
    //     saved_index = [curr_index_x +1,0,0]
    // })

    // // GUI (reset button)
    // //
    // //



    //
    // FPS METER

    // var myFpsmeter_elem = document.getElementById('canvasesdiv');
    // var myFpsmeter = new window.FPSMeter(
    //     myFpsmeter_elem,
    //     window.FPSMeter.theme.transparent
    // );


    //
    // FPS METER

    var myFpsmeter_elem = document.getElementById('fpsmeter1');
    var myFpsmeter = new window.FPSMeter(
        myFpsmeter_elem,
        window.FPSMeter.theme.transparent
    );

    var myFpsmeter2_elem = document.getElementById('fpsmeter2');
    var myFpsmeter2 = new window.FPSMeter(
        myFpsmeter2_elem,
        window.FPSMeter.theme.transparent
    );

    // FPS METER
    //


    // FPS METER
    //



    //
    //
    // HUD (touch positions recorder)

    var elem = document.getElementById("canvasesdiv");

    var arr_touches = [];

    function update_touches(e) { try{

        var touches = e.targetTouches;

        arr_touches.length = 0; // clear array
        for (var i = 0; i < touches.length; ++i)
            arr_touches.push({ x:touches[i].pageX, y:touches[i].pageY });

    }catch(e){alert(e);} }

    elem.addEventListener('touchstart', update_touches);
    elem.addEventListener('touchend', function(e) {arr_touches.length = 0;}); // clear array
    elem.addEventListener('touchmove', update_touches);

    // HUD (touch positions recorder)
    //
    //



    //
    //
    // CANVAS HUD

    var second_canvas = document.getElementById("second-canvas");
    var ctx = second_canvas.getContext("2d");

    // CANVAS HUD
    //
    //



    //
    //
    // TEXTURE (load and startup)

    var crateImage = new Image();
    var crateTexture = gl.createTexture();
    crateImage.onload = function () {

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip vertically the texture

        var buf = textureHelper.imageToUint8Array(crateImage);
        buf = textureHelper.flipYImageArray(buf, crateImage.width, crateImage.height);

        gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, crateTexture);
                // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, crateImage);
                // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buf);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, crateImage.width, crateImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            // // send the texture to the shader
            // gl.uniform1i(g_shaderProgram_experimental.uSampler, 0);

        // starting point
        tick();
    }

    crateImage.src = "textures/texture.png";

    // TEXTURE (load and startup)
    //
    //


    // tick();

    function tick(in_event) {

        // plan the next frame
        window.requestAnimFrame( tick ); // webgl-utils.js


            //
            // obtain the elapsed time

            var time_current = performance.now() || (new Date()).getTime();

            if (!time_last)
                time_last = time_current;

            var elapsed = time_current - time_last;

            time_last = time_current;

            // obtain the elapsed time
            //

        ///

            //
            // update the camera

            g_FreeFlyCamera.handleKeys();

            g_FreeFlyCamera.update( elapsed / 1000.0 );

            // update the camera
            //


        myFpsmeter.tickStart();


            //  check if move to ask chunks
            //      -> if yes
            //          exclude chunk out of range
            //          include chunk in range


        // compute the current chunk in use
        var curr_index = [
            Math.floor(g_FreeFlyCamera._Position[0] / k_chunk_size)|0,
            Math.floor(g_FreeFlyCamera._Position[1] / k_chunk_size)|0,
            Math.floor(g_FreeFlyCamera._Position[2] / k_chunk_size)|0
        ];

        // did we move to another chunk?
        if (curr_index[0] != saved_index[0] ||
            curr_index[1] != saved_index[1] ||
            curr_index[2] != saved_index[2])
        {
            // yes -> save as the new current chunk
            saved_index[0] = curr_index[0];
            saved_index[1] = curr_index[1];
            saved_index[2] = curr_index[2];

            // clear the generation queue
            my_chunkGenerator._chunk_queue.length = 0;

            // the range of chunk generation/exclusion
            var range = 3|0;

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
            // exclude the chunks that are too far away

            for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
            {
                var curr_pos = [
                    (my_chunkGenerator._chunks[i].pos[0]/k_chunk_size)|0,
                    (my_chunkGenerator._chunks[i].pos[1]/k_chunk_size)|0,
                    (my_chunkGenerator._chunks[i].pos[2]/k_chunk_size)|0
                ];

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
            // include in the generation queue the close enough chunks

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
        glm.mat4.perspective(tmp_pMatrix, 70, aspectRatio, 0.1, 70);

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

            // here we do not use the true position of the camera but just a bit forward instead
            var camera_pos = [
                p[0],
                p[1],
                p[2]
            ];

            // this callback simply prioritise visible and unprocessed chunks
            function priority_callback (try_pos, best_pos) {

                if (chunk_is_visible(try_pos))
                    return true;

                return false;
            }

            my_chunkGenerator.update(camera_pos, priority_callback);
        }

        ////// /generation
        //
        //


        myFpsmeter.tick();


        myFpsmeter2.tickStart();


        //
        //
        ////// render 3d scene

        gl.viewport(0, 0, gl.viewportWidth*0.75, gl.viewportHeight);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        /// render chunks

            var p = g_FreeFlyCamera._Position;

            // this part is already setting up a shader
            my_chunkGenerator.render(tmp_mvMatrix, tmp_pMatrix, p, chunk_is_visible);

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
                var pos = my_chunkGenerator.processing_pos;

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
                var aspectRatio2 = arr_viewport[2]/arr_viewport[3];
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



        //
        //
        //
        // CANVAS STUFF (in fact, this still the HUD...)

        ctx.clearRect(0, 0, second_canvas.width, second_canvas.height);

        //
        // make a rectangle around the viewport
        // -> was a debug for the fullscreen, but I still like it <3
        //

        ctx.beginPath();
        ctx.lineWidth="5";
        ctx.strokeStyle="green"; // Green path
        ctx.moveTo(0,0);
        ctx.lineTo(0,second_canvas.height);
        ctx.lineTo(second_canvas.width,second_canvas.height);
        ctx.lineTo(second_canvas.width,0);
        ctx.lineTo(0,0);
        ctx.stroke(); // Draw it

        //
        // render text
        //

        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "white";

        ctx.lineWidth="10";
        ctx.strokeStyle="green";

        for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
        {
            var pos = my_chunkGenerator._chunks[i].pos;

            // 

            if (!g_FrustumCulling.pointInFrustum(pos[0],pos[1],pos[2]))
                continue;

            // 

            var viewport = [0, 0, gl.viewportWidth*0.75, gl.viewportHeight];

            var tmp_2d_position = glhProject(
                pos[0],pos[1],pos[2],
                tmp_mvMatrix,
                tmp_pMatrix,
                viewport
            );

            // flip the 'y' value
            tmp_2d_position[1] = viewport[3] - tmp_2d_position[1];

            // 

            {
                var x = tmp_2d_position[0];
                var y = tmp_2d_position[1];
        
                ctx.beginPath();

                ctx.moveTo(x,y-15);
                ctx.lineTo(x,y+15);
                ctx.stroke();

                ctx.moveTo(x-15,y);
                ctx.lineTo(x+15,y);
                ctx.stroke();


                var str = '';
                str += pos[0]/k_chunk_size + '/'
                str += pos[1]/k_chunk_size + '/'
                str += pos[2]/k_chunk_size

                ctx.fillText(str,x,y);
            }
        }

        //
        // render touches
        //

        ctx.beginPath();
        ctx.lineWidth="5";
        ctx.strokeStyle="red";

        for (var i = 0; i < arr_touches.length; ++i)
        {
            var x = arr_touches[i].x;
            var y = arr_touches[i].y;

            ctx.moveTo(x,y-150);
            ctx.lineTo(x,y+150);
            ctx.stroke();

            ctx.moveTo(x-150,y);
            ctx.lineTo(x+150,y);
            ctx.stroke();

            if (g_FreeFlyCamera._force_forward)
            {
                ctx.moveTo(x-100,y-100);
                ctx.lineTo(x+100,y+100);
                ctx.stroke();

                ctx.moveTo(x-100,y+100);
                ctx.lineTo(x+100,y-100);
                ctx.stroke();
            }
        }

        ctx.stroke(); // Draw it

        // CANVAS STUFF (in fact, this still the HUD...)
        //
        //
        //

        myFpsmeter2.tick();

    } // function tick(in_event)

});

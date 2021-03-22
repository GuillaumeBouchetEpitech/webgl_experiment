
"use strict"

import chunk_size from '../../constants';

import WebGLContext from './WebGLContext';

import FreeFlyCamera from './camera/FreeFlyCamera';
import FrustumCulling from './camera/FrustumCulling';

import ShaderProgram from './utils/ShaderProgram';
import * as TextureUtils from './utils/TextureUtils';

import * as ShaderSrc from './ShaderSrc';

import { GeometryWrapper } from "./utils/Geometry"
import generateCubeVertices from './utils/generateCubeVertices';
import generateFrustumVertices from './utils/generateFrustumVertices';

import glhProject from './camera/glhProject';

import * as glm from 'gl-matrix';

import { Chunks } from '../generation/ChunkGenerator';

//

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];

class RendererWebGL {

    private _free_fly_camera: FreeFlyCamera;
    private _frustum_culling: FrustumCulling;

    private _projection_matrix: glm.mat4;
    private _modelview_matrix: glm.mat4;

    private on_context_lost: (() => void) | null = null;
    private on_context_restored: (() => void) | null = null;

    private _shader_color: ShaderProgram;
    private _shader_exp: ShaderProgram;

    private _aspectRatio: number;

    private _exp_geom_def: GeometryWrapper.GeometryDefinition;
    private _color_geom_def: GeometryWrapper.GeometryDefinition;
    private _geom_frustum: GeometryWrapper.Geometry;
    private _geom_axis: GeometryWrapper.Geometry;
    private _geom_cross: GeometryWrapper.Geometry;
    private _geom_cubeR: GeometryWrapper.Geometry;
    private _geom_cubeW: GeometryWrapper.Geometry;
    private _geom_cubeG: GeometryWrapper.Geometry;

    private _geom_stack_rendering: GeometryWrapper.Geometry;

    constructor() {

        const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
        if (!canvas)
            throw new Error("canvas not found");

        // initialise_webgl_context(canvas);
        WebGLContext.initialise(canvas);

        const gl = WebGLContext.getContext();

        const viewportSize = WebGLContext.getViewportSize();


        this._free_fly_camera = new FreeFlyCamera();
        this._free_fly_camera.activate();
        this._free_fly_camera.setPosition( chunk_size/4*3, chunk_size/4*3, 0 );

        this._frustum_culling = new FrustumCulling();

        this._projection_matrix = glm.mat4.create();
        this._modelview_matrix = glm.mat4.create();

        canvas.addEventListener('webglcontextlost', (event) => {

            event.preventDefault();
            console.log('context is lost');

            if (this.on_context_lost)
                this.on_context_lost();

        }, false);

        canvas.addEventListener('webglcontextrestored', () => {

            console.log('context is restored');

            // recreate();
            // initialise_webgl_context(canvas);
            WebGLContext.initialise(canvas);

            if (this.on_context_restored)
                this.on_context_restored();

        }, false);

        //
        //
        // shaders

        this._shader_color = new ShaderProgram({
            vs_src: ShaderSrc.color_vert,
            fs_src: ShaderSrc.color_frag,
            arr_attrib: ['a_vertexPosition','a_vertexColor'],
            arr_uniform: ['u_modelviewMatrix','u_projMatrix']
        });

        this._shader_exp = new ShaderProgram({
            vs_src: ShaderSrc.experimental_vert,
            fs_src: ShaderSrc.experimental_frag,
            arr_attrib: ['a_vertexPosition','a_vertexColor','a_vertexNormal','a_vertexBCenter'],
            arr_uniform: ['u_modelviewMatrix','u_projMatrix','u_cameraPos','u_sampler']
        });


        this._exp_geom_def = {
            vbos: [
                {
                    attrs: [
                        { name: "a_vertexPosition", type: GeometryWrapper.AttributeType.vec3f, index: 0 },
                        { name: "a_vertexColor",    type: GeometryWrapper.AttributeType.vec3f, index: 3 },
                        { name: "a_vertexNormal",   type: GeometryWrapper.AttributeType.vec3f, index: 6 },
                        { name: "a_vertexBCenter",  type: GeometryWrapper.AttributeType.vec3f, index: 9 },
                    ],
                    stride: 12 * 4,
                    instanced: false,
                }
            ],
            primitiveType: GeometryWrapper.PrimitiveType.triangles,
        };

        this._color_geom_def = {
            vbos: [
                {
                    attrs: [
                        { name: "a_vertexPosition", type: GeometryWrapper.AttributeType.vec3f, index: 0 },
                        { name: "a_vertexColor", type: GeometryWrapper.AttributeType.vec3f, index: 3 },
                    ],
                    stride: 6 * 4,
                    instanced: false,
                }
            ],
            primitiveType: GeometryWrapper.PrimitiveType.lines,
        };


        //
        //
        // create axis geometry

        let vertices = [];

        var axis_size = 20;

        vertices.push(0,0,0,  1,0,0,  axis_size,0,0,  1,0,0)
        vertices.push(0,0,0,  0,1,0,  0,axis_size,0,  0,1,0)
        vertices.push(0,0,0,  0,0,1,  0,0,axis_size,  0,0,1)

        this._geom_axis = new GeometryWrapper.Geometry(this._shader_color, this._color_geom_def);
        this._geom_axis.updateBuffer(0, vertices);
        this._geom_axis.setPrimitiveCount(vertices.length / 6);

        //
        //
        // create coss geometry

        vertices.length = 0;

        var cross_size = 5;

        vertices.push(0-cross_size,0,0,  1,1,1);
        vertices.push(0+cross_size*5,0,0,  1,1,1);
        vertices.push(0,0-cross_size,0,  1,1,1);
        vertices.push(0,0+cross_size,0,  1,1,1);
        vertices.push(0,0,0-cross_size,  1,1,1);
        vertices.push(0,0,0+cross_size,  1,1,1);

        this._geom_cross = new GeometryWrapper.Geometry(this._shader_color, this._color_geom_def);
        this._geom_cross.updateBuffer(0, vertices);
        this._geom_cross.setPrimitiveCount(vertices.length / 6);

        //
        //
        // geoms

        vertices = generateCubeVertices(chunk_size, [1,0,0]);
        this._geom_cubeR = new GeometryWrapper.Geometry(this._shader_color, this._color_geom_def);
        this._geom_cubeR.updateBuffer(0, vertices);
        this._geom_cubeR.setPrimitiveCount(vertices.length / 6);

        vertices = generateCubeVertices(chunk_size, [1,1,1]);
        this._geom_cubeW = new GeometryWrapper.Geometry(this._shader_color, this._color_geom_def);
        this._geom_cubeW.updateBuffer(0, vertices);
        this._geom_cubeW.setPrimitiveCount(vertices.length / 6);

        vertices = generateCubeVertices(chunk_size, [0,1,0]);
        this._geom_cubeG = new GeometryWrapper.Geometry(this._shader_color, this._color_geom_def);
        this._geom_cubeG.updateBuffer(0, vertices);
        this._geom_cubeG.setPrimitiveCount(vertices.length / 6);

        this._geom_stack_rendering = new GeometryWrapper.Geometry(this._shader_color, this._color_geom_def);

        this._aspectRatio = viewportSize[0] * 0.75 / viewportSize[1];

        vertices = generateFrustumVertices(70, this._aspectRatio, 0.1, 40);
        this._geom_frustum = new GeometryWrapper.Geometry(this._shader_color, this._color_geom_def);
        this._geom_frustum.updateBuffer(0, vertices);
        this._geom_frustum.setPrimitiveCount(vertices.length / 6);

    }

    chunk_is_visible(pos: Vec3) {

        var hsize = chunk_size / 2;

        return this._frustum_culling.cubeInFrustum( pos[0]+hsize, pos[1]+hsize, pos[2]+hsize, hsize );
    }

    point_is_visible(pos: Vec3) {
        return this._frustum_culling.pointInFrustum( pos[0], pos[1], pos[2] );
    }

    add_geom(buffer: Float32Array) {

        const geom = new GeometryWrapper.Geometry(this._shader_exp, this._exp_geom_def);
        geom.updateBuffer(0, buffer);
        geom.setPrimitiveCount(buffer.length / 12);

        return geom;
    }

    update_geom(geom: GeometryWrapper.Geometry, buffer: Float32Array) {

        geom.updateBuffer(0, buffer);
    }


    getCameraPosition() {
        return this._free_fly_camera.getPosition();
    }

    getFreeFlyCamera() {
        return this._free_fly_camera;
    }

    resize(width: number, height: number) {

        const viewportSize = WebGLContext.getViewportSize();

        viewportSize[0] = width;
        viewportSize[1] = height;

        this._aspectRatio = viewportSize[0] * 0.75 / viewportSize[1];

        const vertices = generateFrustumVertices(70, this._aspectRatio, 0.1, 40);
        this._geom_frustum.updateBuffer(0, vertices);
        this._geom_frustum.setPrimitiveCount(vertices.length / 6);
    }

    //

    toggle_context_loss() {

        const gl = WebGLContext.getContext();
        const extensionLoseContext = WebGLContext.getExtensionLoseContext();

        if (extensionLoseContext) {

            if (gl.isContextLost()) {
                extensionLoseContext.restoreContext(); // restores the context
            }
            else {
                extensionLoseContext.loseContext(); // trigger a context loss
            }
        }
    }

    context_is_lost() {
        const gl = WebGLContext.getContext();

        return gl.isContextLost();
    }

    set_on_context_lost(callback: () => void) {
        this.on_context_lost = callback;
    }

    set_on_context_restored(callback: () => void) {
        this.on_context_restored = callback;
    }

    //

    init(onFinish: () => void) {

        const gl = WebGLContext.getContext();

        //
        //
        // init

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);


        const img_texture = new Image();
        const textureObj = gl.createTexture();
        img_texture.onload = () => {

            let buf_texture = TextureUtils.imageToUint8Array(img_texture);
            buf_texture = TextureUtils.flipYImageArray(buf_texture, img_texture.width, img_texture.height);

            this._shader_exp.bind();

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureObj);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img_texture.width, img_texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf_texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            ShaderProgram.unbind();

            // starting point
            onFinish();
        }

        // TODO : handle the an onerror on the texture loading here

        img_texture.src = "assets/texture.png";
    }

    getSize(): [number, number] {

        const viewportSize = WebGLContext.getViewportSize();
        return [
            viewportSize[0],
            viewportSize[1],
        ];
    }


    update(chunks: Chunks) {

        const viewportSize = WebGLContext.getViewportSize();

        this._free_fly_camera.handleKeys();
        this._free_fly_camera.update( 1.0 / 60.0 );

        glm.mat4.perspective( this._projection_matrix, 70, this._aspectRatio, 0.1, 70);

        this._free_fly_camera.updateViewMatrix( this._modelview_matrix );
        this._frustum_culling.calculateFrustum( this._projection_matrix, this._modelview_matrix );

        const viewport = [0, 0, viewportSize[0]*0.75, viewportSize[1]];

        for (let ii = 0; ii < chunks.length; ++ii) {

            const pos = chunks[ii].pos;

            chunks[ii].visible = this.chunk_is_visible(pos);
            chunks[ii].coord2d = null;

            if (!this.point_is_visible(pos))
                continue;

            const tmp_2d_position = glhProject(
                pos[0],pos[1],pos[2],
                this._modelview_matrix,
                this._projection_matrix,
                viewport
            );

            if (!tmp_2d_position)
                continue;

            // // flip the 'y' value
            // tmp_2d_position[1] = viewport[3] - tmp_2d_position[1];

            chunks[ii].coord2d = tmp_2d_position;
        }
    }

    renderScene(chunks: Chunks) {

        const gl = WebGLContext.getContext();
        const viewportSize = WebGLContext.getViewportSize();

        gl.viewport(0, 0, viewportSize[0]*0.75, viewportSize[1]);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //
        //
        //

        this._shader_exp.bind();

        // send the texture to the shader
        gl.uniform1i(this._shader_exp.getUniform("u_sampler"), 0);

        gl.uniformMatrix4fv(this._shader_exp.getUniform("u_modelviewMatrix"), false, this._modelview_matrix);
        gl.uniformMatrix4fv(this._shader_exp.getUniform("u_projMatrix"), false, this._projection_matrix);

        const p = this._free_fly_camera.getPosition();
        gl.uniform3f(this._shader_exp.getUniform("u_cameraPos"), p[0],p[1],p[2]);

        for (var ii = 0; ii < chunks.length; ++ii)
            if (chunks[ii].visible)
                chunks[ii].geom.render();

        //
        //
        //

        this._shader_color.bind();

        gl.uniformMatrix4fv(this._shader_color.getUniform("u_projMatrix"), false, this._projection_matrix);
        gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, this._modelview_matrix);

        const tmp_modelview_matrix2 = glm.mat4.create();

        for (let ii = 0; ii < chunks.length; ++ii) {

            if (!chunks[ii].visible)
                continue;

            var pos = chunks[ii].pos;

            glm.mat4.translate(tmp_modelview_matrix2, this._modelview_matrix, pos);

            gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);

            ///

            this._geom_cubeW.render();
        }

        ShaderProgram.unbind();
    }

    renderHUD(chunks: Chunks, processing_pos: Vec3 | null, touches: [number, number][]) {

        const gl = WebGLContext.getContext();
        const viewportSize = WebGLContext.getViewportSize();

        this._shader_color.bind();

        // rendered 3 times with a different viewport and point of view

        const w = viewportSize[0]*0.25;
        const w2 = viewportSize[0]*0.75;
        const h = viewportSize[1]*0.33;

        gl.clear(gl.DEPTH_BUFFER_BIT);








        { // PROTOTYPE HUD

            const width = viewportSize[0] * 0.75;
            const height = viewportSize[1];

            gl.viewport(0, 0, width, height);


            const tmp_projection_matrix = glm.mat4.create();
            glm.mat4.ortho(
                tmp_projection_matrix,
                -width * 0.5, +width * 0.5,
                -height * 0.5, +height * 0.5,
                -200, 200
            );

            const tmp_modelview_matrix = glm.mat4.create();
            glm.mat4.lookAt(
                tmp_modelview_matrix,
                [ +width * 0.5, +height * 0.5, 1 ],
                [ +width * 0.5, +height * 0.5, 0 ],
                [ 0, 1, 0 ]
            );


            gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix);
            gl.uniformMatrix4fv(this._shader_color.getUniform("u_projMatrix"), false, tmp_projection_matrix);



            const vertices: number[] = [
                // 10,10,0, 1,0,0,
                // 1000,1000,0, 1,0,0,
            ];


            //
            //
            // not mature as it is


            // for (let ii = 0; ii < chunks.length; ++ii) {

            //     if (!chunks[ii].visible)
            //         continue;

            //     const coord2d = chunks[ii].coord2d;

            //     if (!coord2d)
            //         continue;

            //     const cross_hsize = 20;

            //     vertices.push(coord2d[0]-cross_hsize,coord2d[1]-cross_hsize,0, 1,1,1);
            //     vertices.push(coord2d[0]+cross_hsize,coord2d[1]+cross_hsize,0, 1,1,1);

            //     vertices.push(coord2d[0]+cross_hsize,coord2d[1]-cross_hsize,0, 1,1,1);
            //     vertices.push(coord2d[0]-cross_hsize,coord2d[1]+cross_hsize,0, 1,1,1);
            // }


            // not mature as it is
            //
            //


            for (const touch of touches) {

                const cross_hsize = 200;

                vertices.push(touch[0]-cross_hsize,touch[1]-cross_hsize,0, 1,0,0);
                vertices.push(touch[0]+cross_hsize,touch[1]+cross_hsize,0, 1,0,0);

                vertices.push(touch[0]+cross_hsize,touch[1]-cross_hsize,0, 1,0,0);
                vertices.push(touch[0]-cross_hsize,touch[1]+cross_hsize,0, 1,0,0);

                if (this._free_fly_camera.getForceForward()) {

                    vertices.push(touch[0]-cross_hsize,touch[1],0, 1,0,0);
                    vertices.push(touch[0]+cross_hsize,touch[1],0, 1,0,0);

                    vertices.push(touch[0],touch[1]-cross_hsize,0, 1,0,0);
                    vertices.push(touch[0],touch[1]+cross_hsize,0, 1,0,0);
                }
            }


            this._geom_stack_rendering.updateBuffer(0, vertices);
            this._geom_stack_rendering.setPrimitiveCount(vertices.length / 6);

            this._geom_stack_rendering.render();

        } // PROTOTYPE HUD







        this._render_hud( chunks, processing_pos, [w2,h*0,w,h], [1.0, 1.2, 1.0], [0,0,1] );
        this._render_hud( chunks, processing_pos, [w2,h*1,w,h], [0.0, 1.0, 0.0], [0,0,1] );
        this._render_hud( chunks, processing_pos, [w2,h*2,w,h], [0.0, 0.0, 1.0], [0,1,0] );

        ShaderProgram.unbind();
    }

    private _render_hud(chunks: Chunks, processing_pos: Vec3 | null, arr_viewport: Vec4, arr_target: Vec3, arr_up: Vec3) {

        const gl = WebGLContext.getContext();

        gl.viewport(arr_viewport[0], arr_viewport[1], arr_viewport[2], arr_viewport[3]);

        const tmp_projection_matrix = glm.mat4.create();
        const _aspectRatio2 = arr_viewport[2]/arr_viewport[3];
        const ortho_size = 65;

        glm.mat4.ortho(
            tmp_projection_matrix,
            -ortho_size * _aspectRatio2, ortho_size * _aspectRatio2,
            -ortho_size, ortho_size,
            -200, 200);

        const cpos = this._free_fly_camera.getPosition();

        const tmp_modelview_matrix = glm.mat4.create();
        glm.mat4.lookAt(
            tmp_modelview_matrix,
            [ cpos[0] + arr_target[0], cpos[1] + arr_target[1], cpos[2] + arr_target[2] ],
            [ cpos[0], cpos[1], cpos[2] ],
            arr_up
        );


        gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix);
        gl.uniformMatrix4fv(this._shader_color.getUniform("u_projMatrix"), false, tmp_projection_matrix);

        this._geom_axis.render();

        const tmp_modelview_matrix2 = glm.mat4.create();

        for (let ii = 0; ii < chunks.length; ++ii) {

            const pos = chunks[ii].pos;

            ///

            glm.mat4.identity(tmp_modelview_matrix2);

            if (chunks[ii].visible) {

                // render white cube

                glm.mat4.translate(tmp_modelview_matrix2, tmp_modelview_matrix, pos);

                gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);
                this._geom_cubeW.render();
            }
            else {

                // render red cube (smaller -> scalled)

                glm.mat4.translate(tmp_modelview_matrix2, tmp_modelview_matrix, [
                    pos[0] + chunk_size * 0.15,
                    pos[1] + chunk_size * 0.15,
                    pos[2] + chunk_size * 0.15
                ]);
                glm.mat4.scale(tmp_modelview_matrix2, tmp_modelview_matrix2, [0.7,0.7,0.7]);

                gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);
                this._geom_cubeR.render();
            }
        }

        if (processing_pos) {

            glm.mat4.translate(tmp_modelview_matrix2,tmp_modelview_matrix, [
                processing_pos[0] + chunk_size*0.2,
                processing_pos[1] + chunk_size*0.2,
                processing_pos[2] + chunk_size*0.2
            ]);
            glm.mat4.scale(tmp_modelview_matrix2,tmp_modelview_matrix2, [0.6,0.6,0.6]);

            gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);
            this._geom_cubeG.render();
        }

        glm.mat4.translate(tmp_modelview_matrix,tmp_modelview_matrix, this._free_fly_camera.getPosition());
        glm.mat4.rotate(tmp_modelview_matrix,tmp_modelview_matrix, this._free_fly_camera.getTheta() * Math.PI / 180, [0,0,1]);
        glm.mat4.rotate(tmp_modelview_matrix,tmp_modelview_matrix, this._free_fly_camera.getPhi() * Math.PI / 180, [0,-1,0]);

        gl.uniformMatrix4fv(this._shader_color.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix);

        this._geom_cross.render();
        this._geom_frustum.render();
    };

};

export default RendererWebGL;

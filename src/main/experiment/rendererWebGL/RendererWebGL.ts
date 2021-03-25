
"use strict"

import chunk_size from '../../constants';

import WebGLContext from './WebGLContext';

import FreeFlyCamera from './camera/FreeFlyCamera';
import FrustumCulling from './camera/FrustumCulling';

import ShaderProgram from './utils/ShaderProgram';
import Texture from './utils/Texture';

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

interface IChunkRendering {
    texture: Texture;
    shader: ShaderProgram;
    geometryDefinition: GeometryWrapper.GeometryDefinition;
};

interface IWireframeRendering {
    shader: ShaderProgram;

    geometry_frustum: GeometryWrapper.Geometry;
    geometry_axis: GeometryWrapper.Geometry;
    geometry_cross: GeometryWrapper.Geometry;
    geometry_cubeR: GeometryWrapper.Geometry;
    geometry_cubeW: GeometryWrapper.Geometry;
    geometry_cubeG: GeometryWrapper.Geometry;
    geometry_stack_rendering: GeometryWrapper.Geometry;
};

interface ITextRendering {
    texture: Texture;
    shader: ShaderProgram;
    geometry: GeometryWrapper.Geometry;
    TexCoordMap: Map<string, number[]>;
    stack_vertices: number[];
};

class RendererWebGL {

    private _free_fly_camera: FreeFlyCamera;
    private _frustum_culling: FrustumCulling;

    private _projection_matrix: glm.mat4;
    private _modelview_matrix: glm.mat4;

    private _aspectRatio: number;

    private on_context_lost: (() => void) | null = null;
    private on_context_restored: (() => void) | null = null;

    private _chunkRendering: IChunkRendering;
    private _wireframeRendering: IWireframeRendering;
    private _textRendering: ITextRendering;

    constructor(main_element: HTMLElement, canvas_element: HTMLCanvasElement) {

        WebGLContext.initialise(canvas_element);

        canvas_element.addEventListener('webglcontextlost', (event) => {

            event.preventDefault();
            console.log('context is lost');

            if (this.on_context_lost)
                this.on_context_lost();

        }, false);

        canvas_element.addEventListener('webglcontextrestored', () => {

            console.log('context is restored');

            WebGLContext.initialise(canvas_element);

            if (this.on_context_restored)
                this.on_context_restored();

        }, false);

        const viewportSize = WebGLContext.getViewportSize();

        this._free_fly_camera = new FreeFlyCamera(main_element);
        this._free_fly_camera.activate();
        this._free_fly_camera.setPosition( chunk_size/4*3, chunk_size/4*3, 0 );

        this._frustum_culling = new FrustumCulling();

        this._projection_matrix = glm.mat4.create();
        this._modelview_matrix = glm.mat4.create();

        this._aspectRatio = viewportSize[0] * 0.75 / viewportSize[1];

        { // chunk rendering

            const shader = new ShaderProgram({
                vs_src: ShaderSrc.experimental_vert,
                fs_src: ShaderSrc.experimental_frag,
                arr_attrib: ['a_vertexPosition','a_vertexColor','a_vertexNormal','a_vertexBCenter'],
                arr_uniform: ['u_modelviewMatrix','u_projMatrix','u_cameraPos','u_sampler']
            });

            const geometryDefinition = {
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

            this._chunkRendering = {
                texture: new Texture(),
                shader: shader,
                geometryDefinition: geometryDefinition,
            };

        } // chunk rendering

        { // wireframe rendering

            const shader = new ShaderProgram({
                vs_src: ShaderSrc.color_vert,
                fs_src: ShaderSrc.color_frag,
                arr_attrib: ['a_vertexPosition','a_vertexColor'],
                arr_uniform: ['u_modelviewMatrix','u_projMatrix']
            });

            const geometryDefinition = {
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

            const geom_axis = new GeometryWrapper.Geometry(shader, geometryDefinition);
            geom_axis.updateBuffer(0, vertices);
            geom_axis.setPrimitiveCount(vertices.length / 6);

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

            const geom_cross = new GeometryWrapper.Geometry(shader, geometryDefinition);
            geom_cross.updateBuffer(0, vertices);
            geom_cross.setPrimitiveCount(vertices.length / 6);

            //
            //
            // geoms

            vertices = generateCubeVertices(chunk_size, [1,0,0]);
            const geom_cubeR = new GeometryWrapper.Geometry(shader, geometryDefinition);
            geom_cubeR.updateBuffer(0, vertices);
            geom_cubeR.setPrimitiveCount(vertices.length / 6);

            vertices = generateCubeVertices(chunk_size, [1,1,1]);
            const geom_cubeW = new GeometryWrapper.Geometry(shader, geometryDefinition);
            geom_cubeW.updateBuffer(0, vertices);
            geom_cubeW.setPrimitiveCount(vertices.length / 6);

            vertices = generateCubeVertices(chunk_size, [0,1,0]);
            const geom_cubeG = new GeometryWrapper.Geometry(shader, geometryDefinition);
            geom_cubeG.updateBuffer(0, vertices);
            geom_cubeG.setPrimitiveCount(vertices.length / 6);

            const geom_stack_rendering = new GeometryWrapper.Geometry(shader, geometryDefinition);

            vertices = generateFrustumVertices(70, this._aspectRatio, 0.1, 40);
            const geom_frustum = new GeometryWrapper.Geometry(shader, geometryDefinition);
            geom_frustum.updateBuffer(0, vertices);
            geom_frustum.setPrimitiveCount(vertices.length / 6);


            this._wireframeRendering = {
                shader,
                geometry_frustum: geom_frustum,
                geometry_axis: geom_axis,
                geometry_cross: geom_cross,
                geometry_cubeR: geom_cubeR,
                geometry_cubeW: geom_cubeW,
                geometry_cubeG: geom_cubeG,
                geometry_stack_rendering: geom_stack_rendering,
            };

        } // wireframe rendering








        { // text rendering

            const textureLetterShader = new ShaderProgram({
                vs_src: ShaderSrc.letters_vert,
                fs_src: ShaderSrc.letters_frag,
                arr_uniform: ["u_modelviewMatrix", "u_projectionMatrix", "u_texture"],
                arr_attrib: ["a_position", "a_texCoord", "a_offsetPosition", "a_offsetTexCoord", "a_offsetScale"],
            });

            const textureLetterGeometryDef = {
                vbos: [
                    {
                        attrs: [
                            { name: "a_position", type: GeometryWrapper.AttributeType.vec2f, index: 0 },
                            { name: "a_texCoord", type: GeometryWrapper.AttributeType.vec2f, index: 2 },
                        ],
                        stride: 4 * 4,
                        instanced: false,
                    },
                    {
                        attrs: [
                            { name: "a_offsetPosition", type: GeometryWrapper.AttributeType.vec2f, index: 0 },
                            { name: "a_offsetTexCoord", type: GeometryWrapper.AttributeType.vec2f, index: 2 },
                            { name: "a_offsetScale", type: GeometryWrapper.AttributeType.float, index: 4 },
                        ],
                        stride: 5 * 4,
                        instanced: true,
                    },
                ],
                primitiveType: GeometryWrapper.PrimitiveType.triangles,
            } as GeometryWrapper.GeometryDefinition;

            const textureLetterGeometry = new GeometryWrapper.Geometry(textureLetterShader, textureLetterGeometryDef);


            const textureSize = [ 256, 256 ];
            const gridSize = [ 16, 16 ];

            const letterSize = [ textureSize[0] / gridSize[0], textureSize[1] / gridSize[1] ];
            const texCoord = [ letterSize[0] / textureSize[0], letterSize[1] / textureSize[1] ];

            const vertices = [
                [ [ +letterSize[0],              0 ], [ texCoord[0], texCoord[1] ] ],
                [ [              0,              0 ], [           0, texCoord[1] ] ],
                [ [ +letterSize[0], +letterSize[1] ], [ texCoord[0],           0 ] ],
                [ [              0, +letterSize[1] ], [           0,           0 ] ],
            ];

            const indices = [ 1,0,2,  1,3,2 ];

            const letterVertices: number[] = [];
            for (const index of indices) {
                const vertex = vertices[index];
                letterVertices.push(vertex[0][0], vertex[0][1], vertex[1][0], vertex[1][1]);
            }

            textureLetterGeometry.updateBuffer(0, letterVertices);
            textureLetterGeometry.setPrimitiveCount(letterVertices.length / 4);


            const lettersTexCoordMap = new Map<string, number[]>([

                [ ' ',  [  0 * texCoord[0], 0 * texCoord[1] ] ],
                [ '!',  [  1 * texCoord[0], 0 * texCoord[1] ] ],
                [ '\"', [  2 * texCoord[0], 0 * texCoord[1] ] ],
                [ '#',  [  3 * texCoord[0], 0 * texCoord[1] ] ],
                [ '$',  [  4 * texCoord[0], 0 * texCoord[1] ] ],
                [ '%',  [  5 * texCoord[0], 0 * texCoord[1] ] ],
                [ '&',  [  6 * texCoord[0], 0 * texCoord[1] ] ],
                [ '\'', [  7 * texCoord[0], 0 * texCoord[1] ] ],
                [ '(',  [  8 * texCoord[0], 0 * texCoord[1] ] ],
                [ ')',  [  9 * texCoord[0], 0 * texCoord[1] ] ],
                [ '*',  [ 10 * texCoord[0], 0 * texCoord[1] ] ],
                [ '+',  [ 11 * texCoord[0], 0 * texCoord[1] ] ],
                [ ',',  [ 12 * texCoord[0], 0 * texCoord[1] ] ],
                [ '-',  [ 13 * texCoord[0], 0 * texCoord[1] ] ],
                [ '.',  [ 14 * texCoord[0], 0 * texCoord[1] ] ],
                [ '/',  [ 15 * texCoord[0], 0 * texCoord[1] ] ],

                [ '0',  [  0 * texCoord[0], 1 * texCoord[1] ] ],
                [ '1',  [  1 * texCoord[0], 1 * texCoord[1] ] ],
                [ '2',  [  2 * texCoord[0], 1 * texCoord[1] ] ],
                [ '3',  [  3 * texCoord[0], 1 * texCoord[1] ] ],
                [ '4',  [  4 * texCoord[0], 1 * texCoord[1] ] ],
                [ '5',  [  5 * texCoord[0], 1 * texCoord[1] ] ],
                [ '6',  [  6 * texCoord[0], 1 * texCoord[1] ] ],
                [ '7',  [  7 * texCoord[0], 1 * texCoord[1] ] ],
                [ '8',  [  8 * texCoord[0], 1 * texCoord[1] ] ],
                [ '9',  [  9 * texCoord[0], 1 * texCoord[1] ] ],
                [ ':',  [ 10 * texCoord[0], 1 * texCoord[1] ] ],
                [ ';',  [ 11 * texCoord[0], 1 * texCoord[1] ] ],
                [ '<',  [ 12 * texCoord[0], 1 * texCoord[1] ] ],
                [ '=',  [ 13 * texCoord[0], 1 * texCoord[1] ] ],
                [ '>',  [ 14 * texCoord[0], 1 * texCoord[1] ] ],
                [ '?',  [ 15 * texCoord[0], 1 * texCoord[1] ] ],

                [ '@',  [  0 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'A',  [  1 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'B',  [  2 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'C',  [  3 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'D',  [  4 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'E',  [  5 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'F',  [  6 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'G',  [  7 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'H',  [  8 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'I',  [  9 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'J',  [ 10 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'K',  [ 11 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'L',  [ 12 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'M',  [ 13 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'N',  [ 14 * texCoord[0], 2 * texCoord[1] ] ],
                [ 'O',  [ 15 * texCoord[0], 2 * texCoord[1] ] ],

                [ 'P',  [  0 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'Q',  [  1 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'R',  [  2 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'S',  [  3 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'T',  [  4 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'U',  [  5 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'V',  [  6 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'W',  [  7 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'X',  [  8 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'Y',  [  9 * texCoord[0], 3 * texCoord[1] ] ],
                [ 'Z',  [ 10 * texCoord[0], 3 * texCoord[1] ] ],
                [ '[',  [ 11 * texCoord[0], 3 * texCoord[1] ] ],
                [ '\\', [ 12 * texCoord[0], 3 * texCoord[1] ] ],
                [ ']',  [ 13 * texCoord[0], 3 * texCoord[1] ] ],
                [ '^',  [ 14 * texCoord[0], 3 * texCoord[1] ] ],
                [ '_',  [ 15 * texCoord[0], 3 * texCoord[1] ] ],

                [ '`',  [  0 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'a',  [  1 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'b',  [  2 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'c',  [  3 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'd',  [  4 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'e',  [  5 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'f',  [  6 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'g',  [  7 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'h',  [  8 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'i',  [  9 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'j',  [ 10 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'k',  [ 11 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'l',  [ 12 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'm',  [ 13 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'n',  [ 14 * texCoord[0], 4 * texCoord[1] ] ],
                [ 'o',  [ 15 * texCoord[0], 4 * texCoord[1] ] ],

                [ 'p',  [  0 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'q',  [  1 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'r',  [  2 * texCoord[0], 5 * texCoord[1] ] ],
                [ 's',  [  3 * texCoord[0], 5 * texCoord[1] ] ],
                [ 't',  [  4 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'u',  [  5 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'v',  [  6 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'w',  [  7 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'x',  [  8 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'y',  [  9 * texCoord[0], 5 * texCoord[1] ] ],
                [ 'z',  [ 10 * texCoord[0], 5 * texCoord[1] ] ],
                [ '{',  [ 11 * texCoord[0], 5 * texCoord[1] ] ],
                [ '|',  [ 12 * texCoord[0], 5 * texCoord[1] ] ],
                [ '}',  [ 13 * texCoord[0], 5 * texCoord[1] ] ],
                [ '~',  [ 14 * texCoord[0], 5 * texCoord[1] ] ],

            ]);

            this._textRendering = {
                texture: new Texture(),
                shader: textureLetterShader,
                geometry: textureLetterGeometry,
                TexCoordMap: lettersTexCoordMap,
                stack_vertices: [],
            };

        } // text rendering

    }

    chunk_is_visible(pos: Vec3) {

        var hsize = chunk_size / 2;

        return this._frustum_culling.cubeInFrustum( pos[0]+hsize, pos[1]+hsize, pos[2]+hsize, hsize );
    }

    point_is_visible(pos: Vec3) {
        return this._frustum_culling.pointInFrustum( pos[0], pos[1], pos[2] );
    }

    add_geom(buffer: Float32Array) {

        const geom = new GeometryWrapper.Geometry(this._chunkRendering.shader, this._chunkRendering.geometryDefinition);
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
        this._wireframeRendering.geometry_frustum.updateBuffer(0, vertices);
        this._wireframeRendering.geometry_frustum.setPrimitiveCount(vertices.length / 6);
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

    async init() {

        const gl = WebGLContext.getContext();

        //
        //
        // init

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);



        gl.activeTexture(gl.TEXTURE0);

        await this._chunkRendering.texture.load("assets/texture.png");
        await this._textRendering.texture.load("assets/ascii_font.png");
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

    pushText(message: string, position: number[], scale: number) {

        const textureSize = [ 256, 256 ];
        const gridSize = [ 16, 16 ];

        const letterSize = [ textureSize[0] / gridSize[0], textureSize[1] / gridSize[1] ];

        const currPos = [ position[0], position[1] ];

        for (const letter of message) {

            if (letter == '\n') {

                currPos[0] = position[0];
                currPos[1] -= letterSize[1] * scale;
                continue;
            }

            const texCoord = this._textRendering.TexCoordMap.get(letter);

            if (!texCoord)
                throw new Error(`fail to find a letter, letter=${letter}`);

            this._textRendering.stack_vertices.push(currPos[0], currPos[1], texCoord[0], texCoord[1], scale);

            currPos[0] += letterSize[0] * scale;
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

        this._chunkRendering.shader.bind();

        this._chunkRendering.texture.bind();

        // send the texture to the shader
        gl.uniform1i(this._chunkRendering.shader.getUniform("u_sampler"), 0);

        gl.uniformMatrix4fv(this._chunkRendering.shader.getUniform("u_modelviewMatrix"), false, this._modelview_matrix);
        gl.uniformMatrix4fv(this._chunkRendering.shader.getUniform("u_projMatrix"), false, this._projection_matrix);

        const p = this._free_fly_camera.getPosition();
        gl.uniform3f(this._chunkRendering.shader.getUniform("u_cameraPos"), p[0],p[1],p[2]);

        for (var ii = 0; ii < chunks.length; ++ii)
            if (chunks[ii].visible)
                chunks[ii].geom.render();

        //
        //
        //

        this._wireframeRendering.shader.bind();

        gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_projMatrix"), false, this._projection_matrix);
        gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, this._modelview_matrix);

        const tmp_modelview_matrix2 = glm.mat4.create();

        for (let ii = 0; ii < chunks.length; ++ii) {

            if (!chunks[ii].visible)
                continue;

            var pos = chunks[ii].pos;

            glm.mat4.translate(tmp_modelview_matrix2, this._modelview_matrix, pos);

            gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);

            ///

            this._wireframeRendering.geometry_cubeW.render();
        }

        ShaderProgram.unbind();
    }

    renderHUD(chunks: Chunks, processing_pos: Vec3 | null, touches: [number, number][]) {

        const gl = WebGLContext.getContext();
        const viewportSize = WebGLContext.getViewportSize();

        this._wireframeRendering.shader.bind();

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


            gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix);
            gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_projMatrix"), false, tmp_projection_matrix);



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


            this._wireframeRendering.geometry_stack_rendering.updateBuffer(0, vertices);
            this._wireframeRendering.geometry_stack_rendering.setPrimitiveCount(vertices.length / 6);

            this._wireframeRendering.geometry_stack_rendering.render();



            // this._renderTexturedHudText();

            {
                // const gl = WebGLContext.getContext();

                this._textRendering.shader.bind();

                this._textRendering.texture.bind();

                gl.uniformMatrix4fv(this._textRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix);
                gl.uniformMatrix4fv(this._textRendering.shader.getUniform("u_projectionMatrix"), false, tmp_projection_matrix);

                this._textRendering.geometry.updateBuffer(1, this._textRendering.stack_vertices, true);
                this._textRendering.geometry.setInstancedCount(this._textRendering.stack_vertices.length / 5);

                this._textRendering.geometry.render();

                Texture.unbind();

                // reset vertices
                this._textRendering.stack_vertices.length = 0;
            }



        } // PROTOTYPE HUD





        this._wireframeRendering.shader.bind();

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


        gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix);
        gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_projMatrix"), false, tmp_projection_matrix);

        this._wireframeRendering.geometry_axis.render();

        const tmp_modelview_matrix2 = glm.mat4.create();

        for (let ii = 0; ii < chunks.length; ++ii) {

            const pos = chunks[ii].pos;

            ///

            glm.mat4.identity(tmp_modelview_matrix2);

            if (chunks[ii].visible) {

                // render white cube

                glm.mat4.translate(tmp_modelview_matrix2, tmp_modelview_matrix, pos);

                gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);
                this._wireframeRendering.geometry_cubeW.render();
            }
            else {

                // render red cube (smaller -> scalled)

                glm.mat4.translate(tmp_modelview_matrix2, tmp_modelview_matrix, [
                    pos[0] + chunk_size * 0.15,
                    pos[1] + chunk_size * 0.15,
                    pos[2] + chunk_size * 0.15
                ]);
                glm.mat4.scale(tmp_modelview_matrix2, tmp_modelview_matrix2, [0.7,0.7,0.7]);

                gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);
                this._wireframeRendering.geometry_cubeR.render();
            }
        }

        if (processing_pos) {

            glm.mat4.translate(tmp_modelview_matrix2,tmp_modelview_matrix, [
                processing_pos[0] + chunk_size*0.2,
                processing_pos[1] + chunk_size*0.2,
                processing_pos[2] + chunk_size*0.2
            ]);
            glm.mat4.scale(tmp_modelview_matrix2,tmp_modelview_matrix2, [0.6,0.6,0.6]);

            gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix2);
            this._wireframeRendering.geometry_cubeG.render();
        }

        glm.mat4.translate(tmp_modelview_matrix,tmp_modelview_matrix, this._free_fly_camera.getPosition());
        glm.mat4.rotate(tmp_modelview_matrix,tmp_modelview_matrix, this._free_fly_camera.getTheta() * Math.PI / 180, [0,0,1]);
        glm.mat4.rotate(tmp_modelview_matrix,tmp_modelview_matrix, this._free_fly_camera.getPhi() * Math.PI / 180, [0,-1,0]);

        gl.uniformMatrix4fv(this._wireframeRendering.shader.getUniform("u_modelviewMatrix"), false, tmp_modelview_matrix);

        this._wireframeRendering.geometry_cross.render();
        this._wireframeRendering.geometry_frustum.render();
    }

};

export default RendererWebGL;

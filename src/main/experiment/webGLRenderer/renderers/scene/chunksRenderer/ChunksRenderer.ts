import * as shaders from './shaders';

import {
  GeometryWrapper,
  ShaderProgram,
  Texture
} from '../../../wrappers';

import { Camera } from '../../../camera/Camera';

import * as glm from 'gl-matrix';

export interface ILiveGeometry {
  update(inBuffer: Float32Array, inSize: number): void;
  setVisibility(isVisible: boolean): void;
}

class LiveGeometry implements ILiveGeometry {
  private _geometry: GeometryWrapper.Geometry;
  private _isVisible: boolean = false;

  constructor(
    inShader: ShaderProgram,
    inGeometryDefinition: GeometryWrapper.GeometryDefinition,
    preAllocatedSize: number
  ) {
    this._geometry = new GeometryWrapper.Geometry(
      inShader,
      inGeometryDefinition
    );
    this._geometry.setFloatBufferSize(0, preAllocatedSize);
  }

  update(inBuffer: Float32Array, inSize: number): void {
    this._geometry.updateBuffer(0, inBuffer, inSize);
    this._geometry.setPrimitiveCount(inSize / 6);
  }

  // dispose(): void {
  //   this._geometry.dispose();
  // }

  render() {
    if (!this._isVisible) {
      return;
    }

    this._geometry.render();
  }

  setVisibility(isVisible: boolean): void {
    this._isVisible = isVisible;
  }
}

export interface IChunksRenderer {
  acquireGeometry(size: number): ILiveGeometry;
  releaseGeometry(geom: ILiveGeometry): void;
}

export class ChunksRenderer implements IChunksRenderer {
  private _shader: ShaderProgram;
  private _texture = new Texture();
  private _geometryDefinition: GeometryWrapper.GeometryDefinition;

  private _unusedGeometries: LiveGeometry[] = [];
  private _inUseGeometries: LiveGeometry[] = [];

  constructor() {
    this._shader = new ShaderProgram({
      vertexSrc: shaders.chunksRenderer.vertex,
      fragmentSrc: shaders.chunksRenderer.fragment,
      attributes: ['a_vertex_position', 'a_vertex_normal'],
      uniforms: [
        'u_composedMatrix',
        'u_eyePosition',
        'u_sceneOrigin',
        'u_texture'
      ]
    });

    this._geometryDefinition = {
      vbos: [
        {
          attrs: [
            {
              name: 'a_vertex_position',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 0
            },
            {
              name: 'a_vertex_normal',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 3
            }
          ],
          stride: 6 * 4,
          instanced: false
        }
      ],
      primitiveType: GeometryWrapper.PrimitiveType.triangles
    };
  }

  async initialize() {
    await this._texture.load('assets/texture.png');
  }

  acquireGeometry(inSize: number): ILiveGeometry {
    if (this._unusedGeometries.length > 0) {
      const reusedGeom = this._unusedGeometries.pop()!;
      this._inUseGeometries.push(reusedGeom);
      return reusedGeom;
    }

    const newGeom = new LiveGeometry(
      this._shader,
      this._geometryDefinition,
      inSize
    );
    this._inUseGeometries.push(newGeom);
    return newGeom;
  }

  releaseGeometry(geom: ILiveGeometry): void {
    const index = this._inUseGeometries.indexOf(geom as LiveGeometry);
    if (index < 0) return;

    this._unusedGeometries.push(geom as LiveGeometry);
    this._inUseGeometries.splice(index, 1);
  }

  render(inCamera: Camera, inChunkSize: number) {

    const eyePos = inCamera.getEye();

    // the chunks textures coordinates are deduced from the vertices positions
    // and when exploring far from the origin of the simulation, the vertices
    // positions will reach higher and higher values, this will affect the
    // decimal value precision of the vertices positions, and then in turn will
    // affect the deduced textures coordinates decimal value precision, that
    // create graphic artifacts since the textures precision become is very low
    // this is mostly an issue on mobile phone and similar lower end hardware
    // ---
    // to fix this growing loss of precision the rendering of the chunks
    // vertices is offset to keep it near the origin of the simulation, and in
    // order for the chunks to remain visible the camera is also offset of the
    // same value
    // ---
    // the chosen offset is the value of the chunk size, so in effect, if the
    // chunk size is 15, the chunks and the camera used while rendering the
    // chunks are both within the 3d space of [0..15] on X/Y/Z

    const offsetSceneOrigin = glm.vec3.fromValues(
      Math.floor(eyePos[0] / inChunkSize) * inChunkSize,
      Math.floor(eyePos[1] / inChunkSize) * inChunkSize,
      Math.floor(eyePos[2] / inChunkSize) * inChunkSize
    );

    inCamera.subOffset(offsetSceneOrigin);
    inCamera.computeMatrices();

    this._shader.bind();
    this._shader.setInteger1Uniform('u_texture', 0);
    this._shader.setMatrix4Uniform(
      'u_composedMatrix',
      inCamera.getComposedMatrix()
    );
    this._shader.setFloat3Uniform(
      'u_eyePosition',
      eyePos[0],
      eyePos[1],
      eyePos[2]
    );

    this._shader.setFloat3Uniform(
      'u_sceneOrigin',
      offsetSceneOrigin[0],
      offsetSceneOrigin[1],
      offsetSceneOrigin[2]
    );

    this._texture.bind();

    this._inUseGeometries.forEach((geometry) => geometry.render());

    inCamera.addOffset(offsetSceneOrigin);
    inCamera.computeMatrices();
  }
}

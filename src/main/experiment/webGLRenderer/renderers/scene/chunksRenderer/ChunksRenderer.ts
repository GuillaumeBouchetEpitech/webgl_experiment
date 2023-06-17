import * as shaders from './shaders';

import {
  GeometryWrapper,
  ShaderProgram,
  Texture
} from '../../../../../browser/webgl2';

import { ICamera } from '../../../camera/Camera';

import * as glm from 'gl-matrix';

export interface ILiveGeometry {
  update(
    inOrigin: glm.ReadonlyVec3,
    inBuffer: Float32Array,
    inSize: number
  ): void;
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

  update(
    inOrigin: glm.ReadonlyVec3,
    inBuffer: Float32Array,
    inSize: number
  ): void {
    this._geometry.updateBuffer(0, inBuffer, inSize);
    this._geometry.setPrimitiveCount(inSize / 6);

    const newBuffer = new Float32Array([inOrigin[0], inOrigin[1], inOrigin[2]]);
    this._geometry.updateBuffer(1, newBuffer, newBuffer.length);
    this._geometry.setInstancedCount(1);
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
  private _textureDirt = new Texture();
  private _textureGrass = new Texture();
  private _textureStoneWall = new Texture();
  private _textureStoneWallBump = new Texture();

  private _geometryDefinition: GeometryWrapper.GeometryDefinition;

  private _unusedGeometries: LiveGeometry[] = [];
  private _inUseGeometries: LiveGeometry[] = [];

  constructor() {
    this._shader = new ShaderProgram('ChunksRenderer', {
      vertexSrc: shaders.chunksRenderer.vertex,
      fragmentSrc: shaders.chunksRenderer.fragment,
      attributes: ['a_vertex_position', 'a_vertex_normal', 'a_offset_origin'],
      uniforms: [
        'u_composedMatrix',
        'u_eyePosition',
        'u_sceneScale',
        'u_tileRepeat',
        'u_texture_dirt',
        'u_texture_grass',
        'u_texture_stoneWall',
        'u_texture_stoneWallBump'
      ]
    });

    const geoBuilder = new GeometryWrapper.GeometryBuilder();
    geoBuilder
      .reset()
      .setPrimitiveType('triangles')
      .addVbo()
      .addVboAttribute('a_vertex_position', 'vec3f')
      .addVboAttribute('a_vertex_normal', 'vec3f')
      .setStride(6 * 4)
      .addVbo()
      .setVboAsDynamic()
      .setVboAsInstanced()
      .addVboAttribute('a_offset_origin', 'vec3f')
      .setStride(3 * 4);

    this._geometryDefinition = geoBuilder.getDef();
  }

  async initialize() {
    await Promise.all([
      this._textureDirt.load('assets/dirt.png'),
      this._textureGrass.load('assets/grass.png'),
      this._textureStoneWall.load('assets/stone-wall.png'),
      this._textureStoneWallBump.load('assets/stone-wall-bump.png')
    ]);
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

  render(inCamera: ICamera, inChunkSize: number) {
    const eyePos = inCamera.getEye();

    this._shader.bind(() => {
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

      this._shader.setFloat1Uniform('u_sceneScale', inChunkSize);
      this._shader.setFloat1Uniform('u_tileRepeat', 2);

      this._shader.setTextureUniform('u_texture_dirt', this._textureDirt, 0);
      this._shader.setTextureUniform('u_texture_grass', this._textureGrass, 1);
      this._shader.setTextureUniform(
        'u_texture_stoneWall',
        this._textureStoneWall,
        2
      );
      this._shader.setTextureUniform(
        'u_texture_stoneWallBump',
        this._textureStoneWallBump,
        3
      );

      this._inUseGeometries.forEach((geometry) => geometry.render());
    });
  }
}

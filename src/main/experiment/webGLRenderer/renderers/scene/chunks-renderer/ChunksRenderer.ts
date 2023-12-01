import { graphics } from '@local-framework';



import { ICamera } from '../../../camera/Camera';

import * as glm from 'gl-matrix';
import { IFrustumCulling } from 'main/experiment/webGLRenderer/camera/FrustumCulling';

// @ts-ignore
import chunksRendererVertex from './shaders/chunks-renderer.glsl.vert';
// @ts-ignore
import chunksRendererFragment from './shaders/chunks-renderer.glsl.frag';

const {
  GeometryWrapper,
  ShaderProgram,
  Texture,
} = graphics.webgl2;

type IUnboundShader = graphics.webgl2.IUnboundShader
type IUnboundTexture = graphics.webgl2.IUnboundTexture
type Geometry = graphics.webgl2.GeometryWrapper.Geometry
type GeometryDefinition = graphics.webgl2.GeometryWrapper.GeometryDefinition

export interface ILiveGeometry {
  update(
    inOrigin: glm.ReadonlyVec3,
    inSize: number,
    inBuffer: Float32Array,
    inBufferLength: number
  ): void;
  getOrigin(): glm.ReadonlyVec3;
  getSize(): number;
}

class LiveGeometry implements ILiveGeometry {
  private _origin: glm.vec3 = glm.vec3.fromValues(0, 0, 0);
  private _size: number = 0;
  private _geometry: Geometry;

  constructor(
    inShader: IUnboundShader,
    inGeometryDefinition: GeometryDefinition,
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
    inSize: number,
    inBuffer: Float32Array,
    inBufferLength: number
  ): void {
    glm.vec3.copy(this._origin, inOrigin);
    this._size = inSize;

    this._geometry.updateBuffer(0, inBuffer, inBufferLength);
    this._geometry.setPrimitiveCount(inBufferLength / 6);

    const newBuffer = new Float32Array([inOrigin[0], inOrigin[1], inOrigin[2]]);
    this._geometry.updateBuffer(1, newBuffer, newBuffer.length);
    this._geometry.setInstancedCount(1);
  }

  render() {
    this._geometry.render();
  }

  getOrigin(): glm.ReadonlyVec3 {
    return this._origin;
  }
  getSize(): number {
    return this._size;
  }
}

export interface IChunksRenderer {
  acquireGeometry(size: number): ILiveGeometry;
  releaseGeometry(geom: ILiveGeometry): void;
}

export class ChunksRenderer implements IChunksRenderer {
  private _shader: IUnboundShader;
  private _textureDirt: IUnboundTexture = new Texture();
  private _textureGrass: IUnboundTexture = new Texture();
  private _textureStoneWall: IUnboundTexture = new Texture();
  private _textureStoneWallBump: IUnboundTexture = new Texture();

  private _geometryDefinition: GeometryDefinition;

  private _unusedGeometries: LiveGeometry[] = [];
  private _inUseGeometries: LiveGeometry[] = [];

  constructor() {
    this._shader = new ShaderProgram('ChunksRenderer', {
      vertexSrc: chunksRendererVertex,
      fragmentSrc: chunksRendererFragment,
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
    const images = await Promise.all([
      Texture.getImageFromUrl('assets/dirt.png'),
      Texture.getImageFromUrl('assets/grass.png'),
      Texture.getImageFromUrl('assets/stone-wall.png'),
      Texture.getImageFromUrl('assets/stone-wall-bump.png')
    ]);

    this._textureDirt.initialize();
    this._textureGrass.initialize();
    this._textureStoneWall.initialize();
    this._textureStoneWallBump.initialize();

    this._textureDirt.bind((bound) => bound.load(images[0]));
    this._textureGrass.bind((bound) => bound.load(images[1]));
    this._textureStoneWall.bind((bound) => bound.load(images[2]));
    this._textureStoneWallBump.bind((bound) => bound.load(images[3]));
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

  render(
    inCamera: ICamera,
    inFrustumCulling: IFrustumCulling,
    inChunkSize: number
  ) {
    const eyePos = inCamera.getEye();

    this._shader.bind((boundShader) => {
      boundShader.setMatrix4Uniform(
        'u_composedMatrix',
        inCamera.getComposedMatrix()
      );
      boundShader.setFloat3Uniform(
        'u_eyePosition',
        eyePos[0],
        eyePos[1],
        eyePos[2]
      );

      boundShader.setFloat1Uniform('u_sceneScale', inChunkSize);
      boundShader.setFloat1Uniform('u_tileRepeat', 2);

      boundShader.setTextureUniform('u_texture_dirt', this._textureDirt, 0);
      boundShader.setTextureUniform('u_texture_grass', this._textureGrass, 1);
      boundShader.setTextureUniform(
        'u_texture_stoneWall',
        this._textureStoneWall,
        2
      );
      boundShader.setTextureUniform(
        'u_texture_stoneWallBump',
        this._textureStoneWallBump,
        3
      );

      interface SortableLiveGeometry {
        geometry: LiveGeometry;
        center: glm.ReadonlyVec3;
        distance: number;
      }

      const toRender: SortableLiveGeometry[] = this._inUseGeometries
        .map((geometry): SortableLiveGeometry => {
          const k_size = geometry.getSize();
          const k_hSize = k_size * 0.5;
          const centerX = geometry.getOrigin()[0] + k_hSize;
          const centerY = geometry.getOrigin()[1] + k_hSize;
          const centerZ = geometry.getOrigin()[2] + k_hSize;
          return {
            geometry,
            center: [centerX, centerY, centerZ],
            distance: 0
          };
        })
        .filter(({ center, geometry }) =>
          inFrustumCulling.cubeInFrustumVec3(center, geometry.getSize())
        )
        .map((sortableGeo): SortableLiveGeometry => {
          sortableGeo.distance = glm.vec3.distance(
            sortableGeo.center,
            inCamera.getEye()
          );
          return sortableGeo;
        })
        .sort((a, b) => a.distance - b.distance);
      toRender.forEach((sortableGeo) => sortableGeo.geometry.render());

      // this._inUseGeometries.forEach((geometry) => geometry.render());
    });
  }
}

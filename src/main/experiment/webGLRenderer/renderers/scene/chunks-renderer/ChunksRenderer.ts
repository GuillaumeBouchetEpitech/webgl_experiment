import { graphics } from '@local-framework';

import * as glm from 'gl-matrix';

// @ts-ignore
import chunksRendererVertex from './shaders/chunks-renderer.glsl.vert';
// @ts-ignore
import chunksRendererFragment from './shaders/chunks-renderer.glsl.frag';

const { GeometryWrapper, ShaderProgram, TextureArray, FenceSync } =
  graphics.webgl2;
// const { checkError } = graphics.webgl2;

type IUnboundShader = graphics.webgl2.IUnboundShader;
type IUnboundTextureArray = graphics.webgl2.IUnboundTextureArray;
type Geometry = graphics.webgl2.GeometryWrapper.Geometry;
type GeometryDefinition = graphics.webgl2.GeometryWrapper.GeometryDefinition;

export interface ILiveGeometry {
  update(
    inOrigin: glm.ReadonlyVec3,
    inBufferLength: number,
    inBuffer: Float32Array
  ): void;
  getOrigin(): glm.ReadonlyVec3;
  getSize(): number;
}

class LiveGeometry implements ILiveGeometry {
  private _origin: glm.vec3 = glm.vec3.fromValues(0, 0, 0);
  private _size: number = 0;
  private _geometry: Geometry;
  private _fence = new FenceSync();

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
    this._geometry.setFloatBufferSize(1, 3 * 4); // vec3 => 3 float => 3 * 4 bytes
  }

  update(
    inOrigin: glm.ReadonlyVec3,
    inBufferLength: number,
    inBuffer: Float32Array
  ): void {
    glm.vec3.copy(this._origin, inOrigin);
    this._size = inBufferLength;

    this._geometry.updateBuffer(0, inBuffer.slice(0, inBufferLength), inBufferLength);
    this._geometry.setPrimitiveCount(inBufferLength / 6);

    const newBuffer = new Float32Array([inOrigin[0], inOrigin[1], inOrigin[2]]);
    this._geometry.updateBuffer(1, newBuffer, newBuffer.length);
    this._geometry.setInstancedCount(1);

    // we want to know when the current command queue wil be completed
    this._fence.start();
  }

  render() {
    // are we waiting for the geometry buffers to get uploaded?
    if (this._fence.isStarted()) {
      // yes we're waiting

      // is the geometry buffers ready?
      if (this._fence.isSignaled()) {
        // yes it's ready, let's render it from now on
        this._fence.dispose();
      } else {
        // no
        // -> do not render
        // ---> it would force us to wait for the buffer to finish uploading
        // ---> which in turn could trigger a freeze, and lower the overall fps
        return;
      }
    }

    // checkError();

    this._geometry.render();
  }

  reuse(): void {
    this._fence.dispose();
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
  render(
    inCamera: graphics.camera.ICamera,
    inFrustumCulling: graphics.camera.IFrustumCulling,
    inChunkSize: number
  ): void;
}

export class ChunksRenderer implements IChunksRenderer {
  private _shader: IUnboundShader;
  private _textureArray: IUnboundTextureArray = new TextureArray();

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
        'u_textureArray'
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
      .setVboAsInstanced()
      .addVboAttribute('a_offset_origin', 'vec3f')
      .setStride(3 * 4);

    this._geometryDefinition = geoBuilder.getDef();
  }

  async initialize() {
    const image = await graphics.images.getImageFromUrl('assets/composed.png');

    this._textureArray.initialize();
    this._textureArray.bind((bound) => {
      bound.loadFromImage(512, 512, 4, image);
    });

    this._shader.bind((boundShader) => {
      boundShader.setTextureUniform('u_textureArray', this._textureArray, 1);
    });
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
    const geomImpl = geom as LiveGeometry;
    const index = this._inUseGeometries.indexOf(geomImpl);
    if (index < 0) {
      return;
    }

    geomImpl.reuse();

    this._unusedGeometries.push(geomImpl);
    this._inUseGeometries.splice(index, 1);
  }

  render(
    inCamera: graphics.camera.ICamera,
    inFrustumCulling: graphics.camera.IFrustumCulling,
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
    });
  }
}

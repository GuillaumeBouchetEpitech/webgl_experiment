import * as webgl2 from '../../../webgl2';

// @ts-ignore
import vertexShader from './shaders/hud-texture-renderer.glsl.vert';
// @ts-ignore
import fragmentShader from './shaders/hud-texture-renderer.glsl.frag';

import * as glm from 'gl-matrix';

export class RenderHudTexture {
  private _width: number = 0;
  private _height: number = 0;

  private _shader: webgl2.ShaderProgram;
  private _geometry: webgl2.GeometryWrapper.Geometry;

  constructor(width: number, height: number) {
    this._shader = new webgl2.ShaderProgram('RenderHudTexture', {
      vertexSrc: vertexShader,
      fragmentSrc: fragmentShader,
      attributes: ['a_vertex_position', 'a_vertex_texCoord'],
      uniforms: ['u_composedMatrix', 'u_texture']
    });

    const geoBuilder = new webgl2.GeometryWrapper.GeometryBuilder();
    geoBuilder
      .reset()
      .setPrimitiveType('triangleStrip')
      .addVbo()
      .addVboAttribute('a_vertex_position', 'vec3f')
      .addVboAttribute('a_vertex_texCoord', 'vec2f');

    this._geometry = new webgl2.GeometryWrapper.Geometry(
      this._shader,
      geoBuilder.getDef()
    );

    this.resize(width, height);
  }

  resize(width: number, height: number) {
    this._width = width;
    this._height = height;

    const tmpVertices: { pos: glm.ReadonlyVec3; tex: glm.ReadonlyVec2 }[] = [
      { pos: [this._width * 0, this._height * 0, -1], tex: [0, 0] },
      { pos: [this._width * 1, this._height * 0, -1], tex: [1, 0] },
      { pos: [this._width * 0, this._height * 1, -1], tex: [0, 1] },
      { pos: [this._width * 1, this._height * 1, -1], tex: [1, 1] }
    ];

    const vertArr = tmpVertices
      .map((vertex) => {
        return [
          vertex.pos[0],
          vertex.pos[1],
          vertex.pos[2],
          vertex.tex[0],
          vertex.tex[1]
        ];
      })
      .flat();

    this._geometry.allocateBuffer(0, vertArr, vertArr.length);
    this._geometry.setPrimitiveCount(vertArr.length / 5);
  }

  flush(composedMatrix: glm.ReadonlyMat4, cubeMap: webgl2.IUnboundTexture) {
    this._shader.bind((boundShader) => {
      boundShader.setMatrix4Uniform('u_composedMatrix', composedMatrix);
      boundShader.setTextureUniform('u_texture', cubeMap, 0);

      this._geometry.render();
    });
  }
}

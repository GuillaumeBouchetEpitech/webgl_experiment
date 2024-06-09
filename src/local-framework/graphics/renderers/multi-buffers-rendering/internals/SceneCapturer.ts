import * as webgl2 from '../../../webgl2';

export class SceneCapturer {
  private _width: number = 0;
  private _height: number = 0;

  private _frameBuffer: webgl2.IUnboundFrameBuffer = new webgl2.FrameBuffer();
  private _renderBuffer: webgl2.IUnboundRenderBuffer = new webgl2.RenderBuffer();
  private _colorTextures: webgl2.IUnboundTexture[] = [];
  private _currentIndex: number = 0;

  constructor(width: number, height: number) {

    this._colorTextures.push(new webgl2.Texture());
    this._colorTextures.push(new webgl2.Texture());
    this._colorTextures.forEach(texture => texture.initialize());

    this.resize(width, height);
  }

  resize(width: number, height: number) {
    this._width = width;
    this._height = height;

    this._renderBuffer.bind((boundBuffer) => {
      boundBuffer.setSize('depth32f', this._width, this._height);
    });

    this._colorTextures.forEach((texture) => {
      texture.bind((boundTexture) => {
        boundTexture.allocate(this._width, this._height);
      });
    });

    this._frameBuffer.bind((boundFrameBuffer) => {
      this._renderBuffer.bind((boundBuffer) => {
        boundFrameBuffer.attachRenderBuffer(boundBuffer);
      });
    });
  }

  captureScene(renderCallback: () => void): void {
    this._frameBuffer.bind((boundFrameBuffer) => {

      this._colorTextures[this._currentIndex].bind((boundTexture) => {
        boundFrameBuffer.attachTexture(boundTexture);
      });

      const gl = webgl2.WebGLContext.getContext();
      gl.viewport(0, 0, this._width, this._height);
      gl.clearColor(0, 0, 0, 0);

      renderCallback();
    });

    this._currentIndex = (this._currentIndex + 1) % this._colorTextures.length;
  }

  get colorTexture(): webgl2.IUnboundTexture {
    return this._colorTextures[this._currentIndex];
  }
}

import { SceneCapturer } from './internals/SceneCapturer';
import { RenderHudTexture } from './internals/RenderHudTexture';

import * as glm from 'gl-matrix';

export class MultiBuffersRendering {
  private _sceneCapturer: SceneCapturer;
  private _renderHudTexture: RenderHudTexture;

  constructor(width: number, height: number) {
    this._sceneCapturer = new SceneCapturer(width, height);
    this._renderHudTexture = new RenderHudTexture(width, height);
  }

  resize(width: number, height: number) {
    this._sceneCapturer.resize(width, height);
    this._renderHudTexture.resize(width, height);
  }

  captureScene(renderCallback: () => void): void {
    this._sceneCapturer.captureScene(renderCallback);
  }

  renderHud(composedMat4: glm.ReadonlyMat4): void {
    this._renderHudTexture.flush(
      composedMat4,
      this._sceneCapturer.colorTexture
    );
  }
}

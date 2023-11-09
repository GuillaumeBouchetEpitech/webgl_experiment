import {
  isWebGL2Supported,
  isWebWorkerSupported,
  GlobalFullScreenManager
} from '@browser';
import { WebGLExperiment } from './experiment/WebGLExperiment';

const onPageLoad = async () => {
  let mainDemo: WebGLExperiment | null = null;
  const onPageError = async () => {
    if (mainDemo) {
      mainDemo.stop();
    }
  };
  window.addEventListener('error', onPageError);

  //
  // HTML elements check
  //

  const canvasElement =
    document.querySelector<HTMLCanvasElement>('#main-canvas');
  if (!canvasElement) {
    throw new Error('main-canvas not found');
  }
  const guiToggleStart =
    document.querySelector<HTMLButtonElement>('#gui_toggle_start');
  if (!guiToggleStart) {
    throw new Error('guiToggleStart not found');
  }

  const guiFullscreen =
    document.querySelector<HTMLButtonElement>('#gui_fullscreen');
  if (!guiFullscreen) {
    throw new Error('guiFullscreen not found');
  }

  //
  // browser features check
  //

  if (!isWebGL2Supported()) {
    throw new Error('missing WebGL2 feature (unsupported)');
  }
  if (!isWebWorkerSupported()) {
    throw new Error('missing WebWorker feature (unsupported)');
  }

  //
  // setup start/stop support
  //

  guiToggleStart.addEventListener('click', () => {
    if (!mainDemo) {
      return;
    }

    if (mainDemo.isRunning()) {
      mainDemo.stop();
    } else {
      mainDemo.start();
    }
  });

  //
  // setup fullscreen support
  //

  guiFullscreen.addEventListener('click', () => {
    if (!mainDemo) {
      return;
    }

    GlobalFullScreenManager.requestFullScreen(canvasElement);
  });

  GlobalFullScreenManager.addOnFullScreenChange(() => {
    if (!mainDemo) {
      return;
    }

    let currentWidth = 800;
    let currentHeight = 600;

    const isFullScreen = GlobalFullScreenManager.isFullScreen(canvasElement);

    if (isFullScreen) {
      canvasElement.style.position = 'absolute';

      currentWidth = window.innerWidth;
      currentHeight = window.innerHeight;
    } else {
      canvasElement.style.position = 'relative';
    }

    canvasElement.style.left = '0px';
    canvasElement.style.top = '0px';
    canvasElement.style.width = `${currentWidth}px`;
    canvasElement.style.height = `${currentHeight}px`;
    canvasElement.width = currentWidth;
    canvasElement.height = currentHeight;

    mainDemo.resize(currentWidth, currentHeight, isFullScreen);
  });

  //
  // setup application
  //

  mainDemo = new WebGLExperiment(canvasElement);

  await mainDemo.init();

  mainDemo.start();
};

window.addEventListener('load', onPageLoad);

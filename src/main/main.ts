import { system } from '@local-framework';
import { WebGLExperiment } from './experiment/WebGLExperiment';
import * as utilities from './utilities';

const { isWebGL2Supported, isWebWorkerSupported, GlobalFullScreenManager } =
  system.browser;

const _queryDomElement = <T extends Element>(inName: string): T => {
  const newElement = document.querySelector<T>(inName);
  if (!newElement) {
    throw new Error(`html element "${inName}" not found`);
  }
  return newElement;
};

const onPageLoad = async () => {
  //
  // HTML elements check
  //

  const canvasElement = _queryDomElement<HTMLCanvasElement>('#main-canvas')!;
  const guiToggleStart =
    _queryDomElement<HTMLButtonElement>('#gui_toggle_start')!;
  const buttonFullscreen =
    _queryDomElement<HTMLButtonElement>('#gui_fullscreen')!;
  const errorText = _queryDomElement<HTMLParagraphElement>('#error-text')!;

  //
  //
  //

  let mainDemo: WebGLExperiment | null = null;

  const _onPageError = (err: WindowEventMap['error']) => {
    if (mainDemo) {
      console.log('onPageError', err);

      // stop the app
      mainDemo.stop();
      mainDemo = null;

      // stop the browser helpers
      system.browser.GlobalKeyboardManager.deactivate();
      system.browser.GlobalMouseManager.deactivate(canvasElement);
      system.browser.GlobalTouchManager.deactivate(canvasElement);
      system.browser.GlobalFullScreenManager.removeAllCallbacks();
      system.browser.GlobalPointerLockManager.removeAllCallbacks();
      system.browser.GlobalVisibilityManager.removeAllCallbacks();
      system.browser.GlobalVisibilityManager.deactivate();

      // setup the error message
      errorText.style.width = '800px';
      errorText.style.height = '600px';
      errorText.innerHTML = err.message;

      // swap the canvas with the error message
      canvasElement.style.display = 'none';
      errorText.style.display = 'block';

      // disable the user interface
      buttonFullscreen.disabled = true;
      guiToggleStart.disabled = true;

      document.title += ' (ERR)';
    }
  };
  window.addEventListener('error', _onPageError);

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
  // setup application
  //

  mainDemo = new WebGLExperiment(canvasElement);

  await mainDemo.init();

  mainDemo.start();

  //
  //
  //

  const pageMaxTimeInvisible = 60 * 1000; // 60sec
  utilities.setupOutdatedPage(pageMaxTimeInvisible, () => {
    throw new Error(
      '<br/><br/><br/>The page was inactive for too long<br/><br/>please reload'
    );
  });

  utilities.setupFullScreenFeature(mainDemo, buttonFullscreen, canvasElement);
};

window.addEventListener('load', onPageLoad);

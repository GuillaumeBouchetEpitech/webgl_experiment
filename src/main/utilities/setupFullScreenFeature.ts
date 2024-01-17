import { system } from '@local-framework';

type Resizable = { resize: (width: number, height: number) => void };

export const setupFullScreenFeature = (app: Resizable, button: HTMLButtonElement, canvasElement: HTMLCanvasElement) => {

  if (!system.browser.GlobalFullScreenManager.isCompatible(canvasElement)) {
    return;
  }

  button.addEventListener('click', () => {
    system.browser.GlobalFullScreenManager.requestFullScreen(canvasElement);
  });

  system.browser.GlobalFullScreenManager.addOnFullScreenChange(() => {

    let currentWidth = null;
    let currentHeight = null;

    const isInFullScreen =
      system.browser.GlobalFullScreenManager.isFullScreen(canvasElement);

    if (isInFullScreen) {
      canvasElement.style.position = 'absolute';

      currentWidth = window.innerWidth;
      currentHeight = window.innerHeight;
    } else {
      canvasElement.style.position = 'relative';

      currentWidth = 800;
      currentHeight = 600;
    }

    canvasElement.style.left = '0px';
    canvasElement.style.top = '0px';

    canvasElement.width = currentWidth;
    canvasElement.height = currentHeight;

    app.resize(currentWidth, currentHeight);
  });
};

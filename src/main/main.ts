window.onerror = (...args: any[]) => {
  alert(JSON.stringify(args));
};

import { WebGLExperiment } from './experiment/WebGLExperiment';
import { GlobalTouchManager } from './experiment/inputManagers';

const run = async () => {
  const canvasElement =
    document.querySelector<HTMLCanvasElement>('#main-canvas');
  if (!canvasElement) throw new Error('main-canvas not found');

  const demo = new WebGLExperiment(canvasElement);

  await demo.init();

  demo.start();

  {
    // UI

    const gui_toggle_start = document.getElementById('gui_toggle_start');
    if (!gui_toggle_start) throw new Error('gui_toggle_start not found');

    gui_toggle_start.addEventListener('click', () => {
      console.log('toggle_start');

      if (demo.isRunning()) {
        demo.stop();
      } else {
        demo.start();
      }
    });
  } // UI
};
run();

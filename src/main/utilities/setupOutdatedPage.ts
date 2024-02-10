import { system } from '@local-framework';

export const setupOutdatedPage = (
  maxDuration: number,
  onTimeout: () => void
) => {
  if (!system.browser.GlobalVisibilityManager.isSupported()) {
    return;
  }

  let timeoutHandle: number = -1;

  system.browser.GlobalVisibilityManager.addVisibilityChange((isVisible) => {
    if (isVisible) {
      if (timeoutHandle >= 0) {
        clearTimeout(timeoutHandle);
        timeoutHandle = -1;
      }
    } else {
      timeoutHandle = window.setTimeout(onTimeout, maxDuration);
    }
  });
  system.browser.GlobalVisibilityManager.activate();
};

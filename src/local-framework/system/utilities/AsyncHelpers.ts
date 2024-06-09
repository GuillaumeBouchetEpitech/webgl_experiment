export const sleep = async (delay: number): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, delay));
};

export const cancellableSleep = (
  delay: number
): {
  promise: Promise<void>;
  cancel: () => void;
} => {
  let timeoutHandle: number = -1;
  let resolveCallback: (() => void) | undefined = undefined;

  const promise = new Promise<void>((resolve) => {
    resolveCallback = resolve;
    timeoutHandle = window.setTimeout(resolve, delay);
  });

  return {
    promise,
    cancel: () => {
      if (timeoutHandle >= 0) {
        window.clearTimeout(timeoutHandle);
      }
      if (resolveCallback) {
        resolveCallback();
      }
    }
  };
};

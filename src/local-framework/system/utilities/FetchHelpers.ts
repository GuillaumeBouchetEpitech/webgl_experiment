export const progressFetch = async (
  url: string,
  onProgress?: (total: number) => void
): Promise<Response> => {
  const response = await fetch(url);

  const reader = response.body!.getReader();

  let totalProgress = 0;
  const stream = new ReadableStream({
    start(controller) {
      return pump();
      function pump(): any {
        return reader.read().then(({ done, value }) => {
          // When no more data needs to be consumed, close the stream
          if (done) {
            controller.close();
            return;
          }

          if (onProgress) {
            totalProgress += value.length;
            onProgress(totalProgress);
          }

          // Enqueue the next data chunk into our target stream
          controller.enqueue(value);
          return pump();
        });
      }
    }
  });
  await stream;
  return new Response(stream);
};

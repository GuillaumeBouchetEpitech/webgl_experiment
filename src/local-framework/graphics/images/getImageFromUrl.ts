export const getImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      resolve(image);
    };
    image.src = url;
  });
};

export const fetchImageBuffer = async (
  url: string,
  onProgress?: (received: number, total: number) => void
): Promise<{ buffer: Uint8Array; type: string }> => {
  // Step 1: start the fetch and obtain a reader
  const response = await fetch(url);
  const reader = response.body!.getReader();

  // Step 2: get total length
  const contentLength = +response.headers.get('Content-Length')!;
  const contentType = response.headers.get('Content-Type')!;

  let lastPercent = 0;

  // Step 3: read the data
  let receivedLength = 0; // received that many bytes at the moment
  let chunks = []; // array of received binary chunks (comprises the body)
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (onProgress) {
      // const currentPercent = Math.floor(receivedLength / contentLength * 100);
      // if (lastPercent !== currentPercent) {
      //   lastPercent = currentPercent;
      onProgress(receivedLength, contentLength);
      // }
    }

    // console.log(`Received ${receivedLength} of ${contentLength}`);
  }

  // Step 4: concatenate chunks into single Uint8Array
  const chunksAll = new Uint8Array(receivedLength); // (4.1)
  let position = 0;
  for (let chunk of chunks) {
    chunksAll.set(chunk, position); // (4.2)
    position += chunk.length;
  }

  return {
    buffer: chunksAll,
    type: contentType
  };

  // // Step 5: decode into a string
  // let result = new TextDecoder("utf-8").decode(chunksAll);

  // // We're done!
  // let commits = JSON.parse(result);
  // alert(commits[0].author.login);
};

export const getImageFromBuffer = async (buffer: Uint8Array, type: string): Promise<HTMLImageElement> => {
  // fetchImageBuffer();
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      resolve(image);
    };
    image.src = URL.createObjectURL(new Blob([buffer], { type } /* (1) */));
  });

  // const tmpImage = new Image();
  // tmpImage.src = URL.createObjectURL(
  //   new Blob([buffer], { type } /* (1) */)
  // );

  // return tmpImage;
};

// // Small red dot image
// const content = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 5, 0, 0, 0, 5, 8, 6, 0, 0, 0, 141, 111, 38, 229, 0, 0, 0, 28, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 195, 127, 6, 32, 5, 195, 32, 18, 132, 208, 49, 241, 130, 88, 205, 4, 0, 14, 245, 53, 203, 209, 142, 14, 31, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

// document.getElementById('my-img').src = URL.createObjectURL(
//   new Blob([content.buffer], { type: 'image/png' } /* (1) */)
// );

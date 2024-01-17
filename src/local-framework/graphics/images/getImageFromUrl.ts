
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

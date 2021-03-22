
const imageToUint8Array = (image: HTMLImageElement) => {

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error("could not create a canvas");

    canvas.width = image.width,
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, image.width, image.height);
    var buff = new Uint8Array(imageData.data.buffer);
    return buff;
}

const flipYImageArray = (image: Uint8Array, width: number, height: number) => {

    const buff = new Uint8Array(image.length);

    let ii = 0;
    for (var yy = height - 1; yy >= 0; yy--)
    for (var xx = 0; xx < width * 4; xx += 4)
    for (var cc = 0; cc < 4; cc++) {

        buff[ii] = image[width * 4 * yy + xx + cc];
        ++ii;
    }

    return buff;
}

export {
    imageToUint8Array,
    flipYImageArray
};

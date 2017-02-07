
function imageToUint8Array(image) {
	var canvas = document.createElement('canvas'),
	ctx = canvas.getContext('2d');
	canvas.width = image.width,
	canvas.height = image.height;
	ctx.drawImage(image, 0, 0);
	var imageData = ctx.getImageData(0, 0, image.width, image.height);
	var buff = new Uint8Array(imageData.data.buffer);
	return buff;
}

function flipYImageArray(image, width, height) {
	var buff = new Uint8Array(image.length);
	var i = 0;
	for (var y = height - 1; y >= 0; y--) {
		for (var x = 0; x < width * 4; x += 4) {
			for (var c = 0; c < 4; c++) {
				buff[i] = image[width * 4 * y + x + c];
				i++;
			}
		}
	}
	return buff;
}

module.exports = {
	imageToUint8Array: imageToUint8Array,
	flipYImageArray: flipYImageArray
};

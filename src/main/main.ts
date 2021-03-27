
window.onerror = (...args: any[]) => {
	alert(JSON.stringify(args));
};

import WebGLExperiment from "./experiment/WebGLExperiment";

const run = async () => {

	const demo = new WebGLExperiment();

	await demo.init();

	demo.start();

	{ // GUI (touch supported indicator)

		const touch_id_elem = document.getElementById("touch_id");
		if (touch_id_elem) {

			if ('ontouchstart' in window) {
				touch_id_elem.innerHTML += 'Supported';
			}
			else {
				touch_id_elem.innerHTML += 'Not Supported';
			}
		}

	} // GUI (touch supported indicator)

	{ // UI

		const gui_toggle_start = document.getElementById("gui_toggle_start");
		if (!gui_toggle_start)
			throw new Error("gui_toggle_start not found");

		gui_toggle_start.addEventListener('click', () => {

			console.log('toggle_start');

			if (demo.isRunning()) {
				demo.stop();
			}
			else {
				demo.start();
			}
		});

	} // UI
};
run();

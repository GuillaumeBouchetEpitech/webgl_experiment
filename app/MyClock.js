
function createMyClock() {

	this._last_time = performance.now() || (new Date()).getTime();


	createMyClock.prototype.getTime = function () {

		return performance.now() || (new Date()).getTime();
	}

	createMyClock.prototype.getElapsedTime = function () {

		return (this.getTime() - this._last_time);
	}

	createMyClock.prototype.restart = function () {

		var current_time = this.getTime();

		var elapsed = current_time - this._last_time;
		this._last_time = current_time;

		return elapsed;
	}
}

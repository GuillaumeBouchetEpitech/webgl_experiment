

var getTime;
(function () {
    var perf = performance;
    if (perf && (perf.now || perf.webkitNow)) {
        var perfNow = perf.now ? 'now' : 'webkitNow';
        getTime = perf[perfNow].bind(perf);
    } else {
        getTime = function () {
            return (new Date());
        };
    }
}());

module.exports = getTime;

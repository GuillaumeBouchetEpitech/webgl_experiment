
var Randomiser = function() {

    this.RAND_MAX = 2147483648|0;

    this.s_seed = 1|0;


    Randomiser.prototype.random = function() {

        var hi,lo,x;

        if (this.s_seed == 0)
            this.s_seed = 123459876;

        hi = (this.s_seed / 127773)|0;
        lo = (this.s_seed % 127773)|0;
        x = (16807 * lo - 2836 * hi)|0;

        if (x < 0)
            x += 0x7fffffff;

        this.s_seed = x;

        var tmp_value = ( x % (this.RAND_MAX + 1) )|0;

        return (tmp_value / -this.RAND_MAX);
    };

    Randomiser.prototype.srandom = function(seed) {
        this.s_seed = seed|0;
    }
}

module.exports = Randomiser

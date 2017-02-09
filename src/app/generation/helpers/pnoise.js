
"use strict"

var ClassicalNoise = function(r, octaves, freq, amp) {

    this._octaves       = octaves || 1;
    this._frequency     = freq || 1.0;
    this._amplitude     = amp || 0.5;

    if (r == undefined) r = Math;

    this.grad3 = [ [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                   [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
                   [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1] ];

    this.p = new Uint8Array(256);

    for (var i = 0; i < 256; ++i)
        this.p[i] = Math.floor(r.random()*256)|0;

    // To remove the need for index wrapping, double the permutation table length
    this.perm = new Uint8Array(512);
    for (var i = 0; i < 512; ++i)
        this.perm[i] = this.p[i & 255]|0;
};

///

ClassicalNoise.prototype.noise_ex = function(x2, y2, z2) { 

    var result = 0.0;
    var amp = this._amplitude;

    var x = x2 * this._frequency;
    var y = y2 * this._frequency;
    var z = z2 * this._frequency;

    for (var i = 0; i < this._octaves; ++i)
    {
        result += this.noise(x,y,z) * amp;

        x *= 2.0;
        y *= 2.0;
        z *= 2.0;

        amp *= 0.5;
    }

    return (result);
}

///

ClassicalNoise.prototype.dot = function(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; }; 
ClassicalNoise.prototype.mix = function(a, b, t) { return (1.0-t)*a + t*b; };
ClassicalNoise.prototype.fade = function(t) {  return t*t*t*(t*(t*6.0-15.0)+10.0); };
 
// Classic Perlin noise, 3D version 
ClassicalNoise.prototype.noise = function(x, y, z) { 

    // Find unit grid cell containing point 
    var X = Math.floor(x)|0;
    var Y = Math.floor(y)|0;
    var Z = Math.floor(z)|0;

    // Get relative xyz coordinates of point within that cell 
    x = x - X;
    y = y - Y;
    z = z - Z;

    // Wrap the integer cells at 255 (smaller integer period can be introduced here) 
    X = (X & 255)|0; 
    Y = (Y & 255)|0; 
    Z = (Z & 255)|0;

    // Calculate a set of eight hashed gradient indices 
    var gi000 = (this.perm[X  +this.perm[Y  +this.perm[Z  ]]] % 12)|0;
    var gi001 = (this.perm[X  +this.perm[Y  +this.perm[Z+1]]] % 12)|0;
    var gi010 = (this.perm[X  +this.perm[Y+1+this.perm[Z  ]]] % 12)|0;
    var gi011 = (this.perm[X  +this.perm[Y+1+this.perm[Z+1]]] % 12)|0;
    var gi100 = (this.perm[X+1+this.perm[Y  +this.perm[Z  ]]] % 12)|0;
    var gi101 = (this.perm[X+1+this.perm[Y  +this.perm[Z+1]]] % 12)|0;
    var gi110 = (this.perm[X+1+this.perm[Y+1+this.perm[Z  ]]] % 12)|0;
    var gi111 = (this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12)|0;

    // Calculate noise contributions from each of the eight corners
    var n000 = this.dot(this.grad3[gi000], x  , y  , z  );
    var n100 = this.dot(this.grad3[gi100], x-1, y  , z  );
    var n010 = this.dot(this.grad3[gi010], x  , y-1, z  );
    var n110 = this.dot(this.grad3[gi110], x-1, y-1, z  );
    var n001 = this.dot(this.grad3[gi001], x  , y  , z-1);
    var n101 = this.dot(this.grad3[gi101], x-1, y  , z-1);
    var n011 = this.dot(this.grad3[gi011], x  , y-1, z-1);
    var n111 = this.dot(this.grad3[gi111], x-1, y-1, z-1);

    // Compute the fade curve value for each of x, y, z
    var u = this.fade(x);
    var v = this.fade(y);
    var w = this.fade(z);

    // Interpolate along x the contributions from each of the corners
    var nx00 = this.mix(n000, n100, u);
    var nx01 = this.mix(n001, n101, u);
    var nx10 = this.mix(n010, n110, u);
    var nx11 = this.mix(n011, n111, u);

    // Interpolate the four results along y
    var nxy0 = this.mix(nx00, nx10, v);
    var nxy1 = this.mix(nx01, nx11, v);

    // Interpolate the two last results along z
    var nxyz = this.mix(nxy0, nxy1, w);

    return nxyz;
};

///

module.exports = ClassicalNoise

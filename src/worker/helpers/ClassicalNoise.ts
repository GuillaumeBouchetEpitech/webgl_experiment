
"use strict"

interface IRandomiser {
    random: () => number;
}

class ClassicalNoise {

    private _octaves: number = 1;
    private _frequency: number = 1.0;
    private _amplitude: number = 0.5;
    private _grad3: [number, number, number][];
    private _p: Uint8Array;
    private _perm: Uint8Array;

    constructor(randomiser: IRandomiser, octaves: number = 1, freq: number = 1, amp: number = 0.5) {

        this._octaves       = octaves;
        this._frequency     = freq;
        this._amplitude     = amp;

        if (randomiser == undefined)
            randomiser = Math;

        this._grad3 = [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ];

        this._p = new Uint8Array(256);

        for (let ii = 0; ii < 256; ++ii)
            this._p[ii] = Math.floor(randomiser.random() * 256)|0;

        // To remove the need for index wrapping, double the permutation table length
        this._perm = new Uint8Array(512);
        for (let ii = 0; ii < 512; ++ii)
            this._perm[ii] = this._p[ii & 255]|0;
    }

    noise_ex(x2: number, y2: number, z2: number) {

        let result = 0.0;
        let amp = this._amplitude;

        let x = x2 * this._frequency;
        let y = y2 * this._frequency;
        let z = z2 * this._frequency;

        for (let ii = 0; ii < this._octaves; ++ii) {

            result += this.noise(x, y, z) * amp;

            x *= 2.0;
            y *= 2.0;
            z *= 2.0;

            amp *= 0.5;
        }

        return result;
    }

    private _dot(g: number[], x: number, y: number, z: number) {
        return g[0] * x + g[1] * y + g[2] * z;
    }

    private _mix(a: number, b: number, t: number) {
        return (1 - t) * a + t * b;
    }

    private _fade(t: number) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    noise(x: number, y: number, z: number) {

        // Find unit grid cell containing point
        let X = Math.floor(x)|0;
        let Y = Math.floor(y)|0;
        let Z = Math.floor(z)|0;

        // Get relative xyz coordinates of point within that cell
        x = x - X;
        y = y - Y;
        z = z - Z;

        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = (X & 255)|0;
        Y = (Y & 255)|0;
        Z = (Z & 255)|0;

        // Calculate a set of eight hashed gradient indices
        const gi000 = (this._perm[X  +this._perm[Y  +this._perm[Z  ]]] % 12)|0;
        const gi001 = (this._perm[X  +this._perm[Y  +this._perm[Z+1]]] % 12)|0;
        const gi010 = (this._perm[X  +this._perm[Y+1+this._perm[Z  ]]] % 12)|0;
        const gi011 = (this._perm[X  +this._perm[Y+1+this._perm[Z+1]]] % 12)|0;
        const gi100 = (this._perm[X+1+this._perm[Y  +this._perm[Z  ]]] % 12)|0;
        const gi101 = (this._perm[X+1+this._perm[Y  +this._perm[Z+1]]] % 12)|0;
        const gi110 = (this._perm[X+1+this._perm[Y+1+this._perm[Z  ]]] % 12)|0;
        const gi111 = (this._perm[X+1+this._perm[Y+1+this._perm[Z+1]]] % 12)|0;

        // Calculate noise contributions from each of the eight corners
        const n000 = this._dot(this._grad3[gi000], x  , y  , z  );
        const n100 = this._dot(this._grad3[gi100], x-1, y  , z  );
        const n010 = this._dot(this._grad3[gi010], x  , y-1, z  );
        const n110 = this._dot(this._grad3[gi110], x-1, y-1, z  );
        const n001 = this._dot(this._grad3[gi001], x  , y  , z-1);
        const n101 = this._dot(this._grad3[gi101], x-1, y  , z-1);
        const n011 = this._dot(this._grad3[gi011], x  , y-1, z-1);
        const n111 = this._dot(this._grad3[gi111], x-1, y-1, z-1);

        // Compute the fade curve value for each of x, y, z
        const u = this._fade(x);
        const v = this._fade(y);
        const w = this._fade(z);

        // Interpolate along x the contributions from each of the corners
        const nx00 = this._mix(n000, n100, u);
        const nx01 = this._mix(n001, n101, u);
        const nx10 = this._mix(n010, n110, u);
        const nx11 = this._mix(n011, n111, u);

        // Interpolate the four results along y
        const nxy0 = this._mix(nx00, nx10, v);
        const nxy1 = this._mix(nx01, nx11, v);

        // Interpolate the two last results along z
        const nxyz = this._mix(nxy0, nxy1, w);

        return nxyz;
    }
};

///

export default ClassicalNoise;

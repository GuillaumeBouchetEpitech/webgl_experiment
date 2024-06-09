const RAND_MAX = 2147483648 | 0;

export class DeterministicRng {
  private _seed: number = 1 | 0;

  random(): number {
    if (this._seed == 0) {
      this._seed = 123459876 | 0;
    }

    const hi = (this._seed / 127773) | 0;
    const lo = this._seed % 127773 | 0;
    let x = (16807 * lo - 2836 * hi) | 0;

    if (x < 0) {
      x += 0x7fffffff | 0;
    }

    this._seed = x;

    return (x % (RAND_MAX + 1)) / -RAND_MAX;
  }

  setSeed(inSeed: number): void {
    this._seed = inSeed | 0;
  }
}

type Vec3 = [number, number, number];

export class Vec3HashSet {
  private _hashSet = new Set<string>();

  clear() {
    this._hashSet.clear();
  }

  add(inVec3: Readonly<Vec3>) {
    this._hashSet.add(Vec3HashSet._getName(inVec3));
  }

  delete(inVec3: Readonly<Vec3>) {
    this._hashSet.delete(Vec3HashSet._getName(inVec3));
  }

  has(inVec3: Readonly<Vec3>) {
    this._hashSet.has(Vec3HashSet._getName(inVec3));
  }

  private static _getName(inVec3: Readonly<Vec3>) {
    return `${inVec3[0]}/${inVec3[1]}/${inVec3[2]}`;
  }
}

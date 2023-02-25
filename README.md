
# WebGL Experiment: Simplex Noise 3D Cave Explorer

---

## Online Demo Link

**`/!\ important /!\`**

http://guillaumebouchetepitech.github.io/webgl_experiment/

**`/!\ important /!\`**

---

## Description

Deterministic Procedurally Generated Cave:
* The "cave" is generated on the fly
  * That's because the "cave" is (pseudo) infinite
    * which is (near) impossible to keep in memory
  * The "cave" is divided in "cave chunks"
    * The most likely visible "cave chunks" are generated in priority
    * The "cave chunks" that are too far (not visible anymore) are discarded.
      * when discarded, they are kept in a cache, as unused
      * unused cached "cave chunks" are reused for newly visible chunk
* Deterministic:
  * Reloading the page will always generate the exact same "cave".
  * it also handle this scenario:
    * The user explore the "cave" and remember a location: "coordinate 1/2/3"
      * or any specific shape in the "cave" really
    * The user then navigate very far
      * by doing so, the data of "coordinate 1/2/3" are discarded/reused for any newly visible "cache chunks"
    * The user then come back to "coordinate 1/2/3"
    * by doing so the "coordinate 1/2/3" data will be re-generated
    * the now visible again "cave chunks" of the "coordinate 1/2/3" should be the same as before

---

## Credits :


| technology |  author | website |
| ---- | ---- | ---- |
| Marching cube (polygonisation) | Dr. Klaus Miltenberger | [Link](http://paulbourke.net/geometry/polygonise/) |
| Perlin noise 3d | Sean McCullough, banksean | [Link](https://gist.github.com/banksean/304522) |


---

# Thanks for watching !

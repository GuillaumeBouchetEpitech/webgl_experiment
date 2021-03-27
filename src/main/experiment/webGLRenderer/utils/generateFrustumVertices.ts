
"use strict"

const generateFrustumVertices = (fovY: number, aspect: number, zNear: number, zFar: number) => {

    const fH = Math.tan( fovY / 360.0 * Math.PI ) * zNear;
    const fW = fH * aspect;

    const left = -fW;
    const right = +fW;

    const top = +fH;
    const bottom = -fH;

    const half_z = zFar * Math.sin(fovY * Math.PI / 180.0);
    const half_y = half_z * aspect;

    const vertices = [

        zNear, left,  top,
        zNear, right, top,
        zNear, left,  bottom,
        zNear, right, bottom,

        zFar, -half_y, +half_z,
        zFar, +half_y, +half_z,
        zFar, -half_y, -half_z,
        zFar, +half_y, -half_z

        , zFar, -half_y*1.66, -half_z
        , zFar, -half_y*1.66, +half_z
    ];

    //

    const indices = [
        0,1,  1,3,  3,2,  2,0,
        0,4,  1,5,  2,6,  3,7,
        4,5,  5,7,  7,6,  6,4,
        8,9,
        7,8,
        5,9,
    ];

    //

    const fvertices = [];

    for (let ii = 0; ii < indices.length; ++ii) {

        const curr_index = indices[ii] * 3;

        for (let jj = 0; jj < 3; ++jj)
            fvertices.push( vertices[curr_index + jj] );

        fvertices.push(1, 1, 0);
    }

    return fvertices;
}

export default generateFrustumVertices;

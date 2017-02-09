
"use strict"

function createCubeVertices(fovY, aspect, zNear, zFar) {

    var left, right, bottom, top;


    var fovy = fovY;
    var nearval = zNear;
    var farval = zFar;


    var pi = 3.1415926;
    var fW, fH;

    fH = Math.tan( fovY / 360.0 * pi ) * zNear;
    fW = fH * aspect;

    left = -fW;
    right = +fW;

    top = +fH;
    bottom = -fH;

    var half_z = farval * Math.sin(fovy * 3.14 / 180.0);
    var half_y = half_z * aspect;

    var vertices = [

        nearval, left,  top,
        nearval, right, top,
        nearval, left,  bottom,
        nearval, right, bottom,

        farval, -half_y, +half_z,
        farval, +half_y, +half_z,
        farval, -half_y, -half_z,
        farval, +half_y, -half_z

        , farval, -half_y*1.66, -half_z
        , farval, -half_y*1.66, +half_z
    ];

    //

    var indices = [
        0,1,  1,3,  3,2,  2,0,
        0,4,  1,5,  2,6,  3,7,
        4,5,  5,7,  7,6,  6,4,
        8,9,
        7,8,
        5,9,
    ];

    //

    var fvertices = [];

    for (var i = 0; i < indices.length; ++i)
    {
        var curr_index = indices[i] * 3;

        for (var j = 0; j < 3; ++j)
            fvertices.push( vertices[curr_index + j] );

        fvertices.push( 1,1,1 );
    }

    return fvertices;
}

module.exports = createCubeVertices

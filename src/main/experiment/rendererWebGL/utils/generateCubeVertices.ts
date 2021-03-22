
"use strict"

const generateCubeVertices = (size: number, arr_color: [number, number, number], no_inside: boolean = false) => {

    const outer_side = size / 2;
    const inner_side = size / 2.1;

    const vertices = [
         outer_side,  outer_side,  outer_side, // 0
        -outer_side,  outer_side,  outer_side,
         outer_side, -outer_side,  outer_side,
        -outer_side, -outer_side,  outer_side,

         outer_side,  outer_side, -outer_side, // 4
        -outer_side,  outer_side, -outer_side,
         outer_side, -outer_side, -outer_side,
        -outer_side, -outer_side, -outer_side,

         inner_side,  inner_side,  inner_side, // 8
        -inner_side,  inner_side,  inner_side,
         inner_side, -inner_side,  inner_side,
        -inner_side, -inner_side,  inner_side,

         inner_side,  inner_side, -inner_side, // 12
        -inner_side,  inner_side, -inner_side,
         inner_side, -inner_side, -inner_side,
        -inner_side, -inner_side, -inner_side
    ];

    //

    const indices = [
        0,1,  1,3,  3,2,  2,0,
        4,5,  5,7,  7,6,  6,4,
        0,4,  1,5,  3,7,  2,6,

         8, 9,   9,11,  11,10,  10, 8,
        12,13,  13,15,  15,14,  14,12,
         8,12,   9,13,  11,15,  10,14
    ];

    //

    if (no_inside)
        indices.length /= 2;

    //

    const fvertices = [];

    for (let ii = 0; ii < indices.length; ++ii)  {

        const curr_index = indices[ii] * 3;

        for (let jj = 0; jj < 3; ++jj)
            fvertices.push( vertices[curr_index + jj] + outer_side );

        for (let jj = 0; jj < 3; ++jj)
            fvertices.push( arr_color[jj] );
    }

    return fvertices;
}

export default generateCubeVertices;

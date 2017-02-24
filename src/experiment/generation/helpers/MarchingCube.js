
"use strict"

var MarchingCube = function(in_chunk_size, in_fTv, in_sample_cb, tetra) {

    this.chunk_size = in_chunk_size
    this.fTv = in_fTv;
    this.sample = in_sample_cb;

    // this.tetra = tetra || false;
    this.tetra = true;


    this.current_index = 0;


    this.step_size = 1.0 / this.chunk_size;



    this.a2fVertexOffset = [
        [0,0,0],[1,0,0],[1,1,0],[0,1,0],
        [0,0,1],[1,0,1],[1,1,1],[0,1,1]
    ];

    this.a2iEdgeConnection = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
    ];

    this.a2fEdgeDirection = [
        [1,0,0],[0,1,0],[-1,0,0],[0,-1,0],
        [1,0,0],[0,1,0],[-1,0,0],[0,-1,0],
        [0,0,1],[0,0,1],[ 0,0,1],[0, 0,1]
    ];

    this.a2iTetrahedronEdgeConnection = [
        [0,1], [1,2], [2,0], [0,3], [1,3], [2,3]
    ];

    this.a2iTetrahedronsInACube = [
        [0,5,1,6], [0,1,2,6], [0,2,3,6],
        [0,3,7,6], [0,7,4,6], [0,4,5,6]
    ];

    this.aiTetrahedronEdgeFlags = [
        0x00, 0x0d, 0x13, 0x1e, 0x26, 0x2b, 0x35, 0x38,
        0x38, 0x35, 0x2b, 0x26, 0x1e, 0x13, 0x0d, 0x00
    ];

    this.a2iTetrahedronTriangles = [
        [-1, -1, -1, -1, -1, -1, -1],
        [ 0,  3,  2, -1, -1, -1, -1],
        [ 0,  1,  4, -1, -1, -1, -1],
        [ 1,  4,  2,  2,  4,  3, -1],

        [ 1,  2,  5, -1, -1, -1, -1],
        [ 0,  3,  5,  0,  5,  1, -1],
        [ 0,  2,  5,  0,  5,  4, -1],
        [ 5,  4,  3, -1, -1, -1, -1],

        [ 3,  4,  5, -1, -1, -1, -1],
        [ 4,  5,  0,  5,  2,  0, -1],
        [ 1,  5,  0,  5,  3,  0, -1],
        [ 5,  2,  1, -1, -1, -1, -1],

        [ 3,  4,  2,  2,  4,  1, -1],
        [ 4,  1,  0, -1, -1, -1, -1],
        [ 2,  3,  0, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1]
    ];




    this.aiCubeEdgeFlags = [
        0x000, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
        0x190, 0x099, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
        0x230, 0x339, 0x033, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
        0x3a0, 0x2a9, 0x1a3, 0x0aa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
        0x460, 0x569, 0x663, 0x76a, 0x066, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
        0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0x0ff, 0x3f5, 0x2fc, 0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
        0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x055, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
        0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0x0cc, 0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
        0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0x0cc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
        0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x055, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
        0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0x0ff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
        0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x066, 0x76a, 0x663, 0x569, 0x460,
        0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0x0aa, 0x1a3, 0x2a9, 0x3a0,
        0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x033, 0x339, 0x230,
        0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x099, 0x190,
        0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x000
    ];

    this.a2iTriangleConnectionTable = [
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 8, 3, 9, 8, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 1, 2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 2,10, 0, 2, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 8, 3, 2,10, 8,10, 9, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 3,11, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0,11, 2, 8,11, 0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 9, 0, 2, 3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1,11, 2, 1, 9,11, 9, 8,11,-1,-1,-1,-1,-1,-1,-1],
        [ 3,10, 1,11,10, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0,10, 1, 0, 8,10, 8,11,10,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 9, 0, 3,11, 9,11,10, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 8,10,10, 8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 7, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 3, 0, 7, 3, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 1, 9, 4, 7, 1, 7, 3, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 4, 7, 3, 0, 4, 1, 2,10,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 2,10, 9, 0, 2, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 2,10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4,-1,-1,-1,-1],
        [ 8, 4, 7, 3,11, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 4, 7,11, 2, 4, 2, 0, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 0, 1, 8, 4, 7, 2, 3,11,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 7,11, 9, 4,11, 9,11, 2, 9, 2, 1,-1,-1,-1,-1],
        [ 3,10, 1, 3,11,10, 7, 8, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 1,11,10, 1, 4,11, 1, 0, 4, 7,11, 4,-1,-1,-1,-1],
        [ 4, 7, 8, 9, 0,11, 9,11,10,11, 0, 3,-1,-1,-1,-1],
        [ 4, 7,11, 4,11, 9, 9,11,10,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 4, 0, 8, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 5, 4, 1, 5, 0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 5, 4, 8, 3, 5, 3, 1, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 9, 5, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 8, 1, 2,10, 4, 9, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 2,10, 5, 4, 2, 4, 0, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 2,10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8,-1,-1,-1,-1],
        [ 9, 5, 4, 2, 3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0,11, 2, 0, 8,11, 4, 9, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 5, 4, 0, 1, 5, 2, 3,11,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 1, 5, 2, 5, 8, 2, 8,11, 4, 8, 5,-1,-1,-1,-1],
        [10, 3,11,10, 1, 3, 9, 5, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 5, 0, 8, 1, 8,10, 1, 8,11,10,-1,-1,-1,-1],
        [ 5, 4, 0, 5, 0,11, 5,11,10,11, 0, 3,-1,-1,-1,-1],
        [ 5, 4, 8, 5, 8,10,10, 8,11,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 7, 8, 5, 7, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 3, 0, 9, 5, 3, 5, 7, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 7, 8, 0, 1, 7, 1, 5, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 5, 3, 3, 5, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 7, 8, 9, 5, 7,10, 1, 2,-1,-1,-1,-1,-1,-1,-1],
        [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3,-1,-1,-1,-1],
        [ 8, 0, 2, 8, 2, 5, 8, 5, 7,10, 5, 2,-1,-1,-1,-1],
        [ 2,10, 5, 2, 5, 3, 3, 5, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 9, 5, 7, 8, 9, 3,11, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7,11,-1,-1,-1,-1],
        [ 2, 3,11, 0, 1, 8, 1, 7, 8, 1, 5, 7,-1,-1,-1,-1],
        [11, 2, 1,11, 1, 7, 7, 1, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 8, 8, 5, 7,10, 1, 3,10, 3,11,-1,-1,-1,-1],
        [ 5, 7, 0, 5, 0, 9, 7,11, 0, 1, 0,10,11,10, 0,-1],
        [11,10, 0,11, 0, 3,10, 5, 0, 8, 0, 7, 5, 7, 0,-1],
        [11,10, 5, 7,11, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [10, 6, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 5,10, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 0, 1, 5,10, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 8, 3, 1, 9, 8, 5,10, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 6, 5, 2, 6, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 6, 5, 1, 2, 6, 3, 0, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 6, 5, 9, 0, 6, 0, 2, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8,-1,-1,-1,-1],
        [ 2, 3,11,10, 6, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 0, 8,11, 2, 0,10, 6, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9, 2, 3,11, 5,10, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 5,10, 6, 1, 9, 2, 9,11, 2, 9, 8,11,-1,-1,-1,-1],
        [ 6, 3,11, 6, 5, 3, 5, 1, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8,11, 0,11, 5, 0, 5, 1, 5,11, 6,-1,-1,-1,-1],
        [ 3,11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9,-1,-1,-1,-1],
        [ 6, 5, 9, 6, 9,11,11, 9, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 5,10, 6, 4, 7, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 3, 0, 4, 7, 3, 6, 5,10,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 9, 0, 5,10, 6, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1],
        [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4,-1,-1,-1,-1],
        [ 6, 1, 2, 6, 5, 1, 4, 7, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7,-1,-1,-1,-1],
        [ 8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6,-1,-1,-1,-1],
        [ 7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9,-1],
        [ 3,11, 2, 7, 8, 4,10, 6, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 5,10, 6, 4, 7, 2, 4, 2, 0, 2, 7,11,-1,-1,-1,-1],
        [ 0, 1, 9, 4, 7, 8, 2, 3,11, 5,10, 6,-1,-1,-1,-1],
        [ 9, 2, 1, 9,11, 2, 9, 4,11, 7,11, 4, 5,10, 6,-1],
        [ 8, 4, 7, 3,11, 5, 3, 5, 1, 5,11, 6,-1,-1,-1,-1],
        [ 5, 1,11, 5,11, 6, 1, 0,11, 7,11, 4, 0, 4,11,-1],
        [ 0, 5, 9, 0, 6, 5, 0, 3, 6,11, 6, 3, 8, 4, 7,-1],
        [ 6, 5, 9, 6, 9,11, 4, 7, 9, 7,11, 9,-1,-1,-1,-1],
        [10, 4, 9, 6, 4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4,10, 6, 4, 9,10, 0, 8, 3,-1,-1,-1,-1,-1,-1,-1],
        [10, 0, 1,10, 6, 0, 6, 4, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1,10,-1,-1,-1,-1],
        [ 1, 4, 9, 1, 2, 4, 2, 6, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4,-1,-1,-1,-1],
        [ 0, 2, 4, 4, 2, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 3, 2, 8, 2, 4, 4, 2, 6,-1,-1,-1,-1,-1,-1,-1],
        [10, 4, 9,10, 6, 4,11, 2, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 2, 2, 8,11, 4, 9,10, 4,10, 6,-1,-1,-1,-1],
        [ 3,11, 2, 0, 1, 6, 0, 6, 4, 6, 1,10,-1,-1,-1,-1],
        [ 6, 4, 1, 6, 1,10, 4, 8, 1, 2, 1,11, 8,11, 1,-1],
        [ 9, 6, 4, 9, 3, 6, 9, 1, 3,11, 6, 3,-1,-1,-1,-1],
        [ 8,11, 1, 8, 1, 0,11, 6, 1, 9, 1, 4, 6, 4, 1,-1],
        [ 3,11, 6, 3, 6, 0, 0, 6, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 6, 4, 8,11, 6, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7,10, 6, 7, 8,10, 8, 9,10,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 7, 3, 0,10, 7, 0, 9,10, 6, 7,10,-1,-1,-1,-1],
        [10, 6, 7, 1,10, 7, 1, 7, 8, 1, 8, 0,-1,-1,-1,-1],
        [10, 6, 7,10, 7, 1, 1, 7, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7,-1,-1,-1,-1],
        [ 2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9,-1],
        [ 7, 8, 0, 7, 0, 6, 6, 0, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 3, 2, 6, 7, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 3,11,10, 6, 8,10, 8, 9, 8, 6, 7,-1,-1,-1,-1],
        [ 2, 0, 7, 2, 7,11, 0, 9, 7, 6, 7,10, 9,10, 7,-1],
        [ 1, 8, 0, 1, 7, 8, 1,10, 7, 6, 7,10, 2, 3,11,-1],
        [11, 2, 1,11, 1, 7,10, 6, 1, 6, 7, 1,-1,-1,-1,-1],
        [ 8, 9, 6, 8, 6, 7, 9, 1, 6,11, 6, 3, 1, 3, 6,-1],
        [ 0, 9, 1,11, 6, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 8, 0, 7, 0, 6, 3,11, 0,11, 6, 0,-1,-1,-1,-1],
        [ 7,11, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 8,11, 7, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9,11, 7, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 1, 9, 8, 3, 1,11, 7, 6,-1,-1,-1,-1,-1,-1,-1],
        [10, 1, 2, 6,11, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 3, 0, 8, 6,11, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 9, 0, 2,10, 9, 6,11, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 6,11, 7, 2,10, 3,10, 8, 3,10, 9, 8,-1,-1,-1,-1],
        [ 7, 2, 3, 6, 2, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 0, 8, 7, 6, 0, 6, 2, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 7, 6, 2, 3, 7, 0, 1, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6,-1,-1,-1,-1],
        [10, 7, 6,10, 1, 7, 1, 3, 7,-1,-1,-1,-1,-1,-1,-1],
        [10, 7, 6, 1, 7,10, 1, 8, 7, 1, 0, 8,-1,-1,-1,-1],
        [ 0, 3, 7, 0, 7,10, 0,10, 9, 6,10, 7,-1,-1,-1,-1],
        [ 7, 6,10, 7,10, 8, 8,10, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 6, 8, 4,11, 8, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 6,11, 3, 0, 6, 0, 4, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 6,11, 8, 4, 6, 9, 0, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 4, 6, 9, 6, 3, 9, 3, 1,11, 3, 6,-1,-1,-1,-1],
        [ 6, 8, 4, 6,11, 8, 2,10, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 3, 0,11, 0, 6,11, 0, 4, 6,-1,-1,-1,-1],
        [ 4,11, 8, 4, 6,11, 0, 2, 9, 2,10, 9,-1,-1,-1,-1],
        [10, 9, 3,10, 3, 2, 9, 4, 3,11, 3, 6, 4, 6, 3,-1],
        [ 8, 2, 3, 8, 4, 2, 4, 6, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 4, 2, 4, 6, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8,-1,-1,-1,-1],
        [ 1, 9, 4, 1, 4, 2, 2, 4, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 1, 3, 8, 6, 1, 8, 4, 6, 6,10, 1,-1,-1,-1,-1],
        [10, 1, 0,10, 0, 6, 6, 0, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 6, 3, 4, 3, 8, 6,10, 3, 0, 3, 9,10, 9, 3,-1],
        [10, 9, 4, 6,10, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 5, 7, 6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 4, 9, 5,11, 7, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 0, 1, 5, 4, 0, 7, 6,11,-1,-1,-1,-1,-1,-1,-1],
        [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5,-1,-1,-1,-1],
        [ 9, 5, 4,10, 1, 2, 7, 6,11,-1,-1,-1,-1,-1,-1,-1],
        [ 6,11, 7, 1, 2,10, 0, 8, 3, 4, 9, 5,-1,-1,-1,-1],
        [ 7, 6,11, 5, 4,10, 4, 2,10, 4, 0, 2,-1,-1,-1,-1],
        [ 3, 4, 8, 3, 5, 4, 3, 2, 5,10, 5, 2,11, 7, 6,-1],
        [ 7, 2, 3, 7, 6, 2, 5, 4, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7,-1,-1,-1,-1],
        [ 3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0,-1,-1,-1,-1],
        [ 6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8,-1],
        [ 9, 5, 4,10, 1, 6, 1, 7, 6, 1, 3, 7,-1,-1,-1,-1],
        [ 1, 6,10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4,-1],
        [ 4, 0,10, 4,10, 5, 0, 3,10, 6,10, 7, 3, 7,10,-1],
        [ 7, 6,10, 7,10, 8, 5, 4,10, 4, 8,10,-1,-1,-1,-1],
        [ 6, 9, 5, 6,11, 9,11, 8, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 6,11, 0, 6, 3, 0, 5, 6, 0, 9, 5,-1,-1,-1,-1],
        [ 0,11, 8, 0, 5,11, 0, 1, 5, 5, 6,11,-1,-1,-1,-1],
        [ 6,11, 3, 6, 3, 5, 5, 3, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 9, 5,11, 9,11, 8,11, 5, 6,-1,-1,-1,-1],
        [ 0,11, 3, 0, 6,11, 0, 9, 6, 5, 6, 9, 1, 2,10,-1],
        [11, 8, 5,11, 5, 6, 8, 0, 5,10, 5, 2, 0, 2, 5,-1],
        [ 6,11, 3, 6, 3, 5, 2,10, 3,10, 5, 3,-1,-1,-1,-1],
        [ 5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2,-1,-1,-1,-1],
        [ 9, 5, 6, 9, 6, 0, 0, 6, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8,-1],
        [ 1, 5, 6, 2, 1, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 3, 6, 1, 6,10, 3, 8, 6, 5, 6, 9, 8, 9, 6,-1],
        [10, 1, 0,10, 0, 6, 9, 5, 0, 5, 6, 0,-1,-1,-1,-1],
        [ 0, 3, 8, 5, 6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [10, 5, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 5,10, 7, 5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 5,10,11, 7, 5, 8, 3, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 5,11, 7, 5,10,11, 1, 9, 0,-1,-1,-1,-1,-1,-1,-1],
        [10, 7, 5,10,11, 7, 9, 8, 1, 8, 3, 1,-1,-1,-1,-1],
        [11, 1, 2,11, 7, 1, 7, 5, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2,11,-1,-1,-1,-1],
        [ 9, 7, 5, 9, 2, 7, 9, 0, 2, 2,11, 7,-1,-1,-1,-1],
        [ 7, 5, 2, 7, 2,11, 5, 9, 2, 3, 2, 8, 9, 8, 2,-1],
        [ 2, 5,10, 2, 3, 5, 3, 7, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 2, 0, 8, 5, 2, 8, 7, 5,10, 2, 5,-1,-1,-1,-1],
        [ 9, 0, 1, 5,10, 3, 5, 3, 7, 3,10, 2,-1,-1,-1,-1],
        [ 9, 8, 2, 9, 2, 1, 8, 7, 2,10, 2, 5, 7, 5, 2,-1],
        [ 1, 3, 5, 3, 7, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 7, 0, 7, 1, 1, 7, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 0, 3, 9, 3, 5, 5, 3, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 8, 7, 5, 9, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 8, 4, 5,10, 8,10,11, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 0, 4, 5,11, 0, 5,10,11,11, 3, 0,-1,-1,-1,-1],
        [ 0, 1, 9, 8, 4,10, 8,10,11,10, 4, 5,-1,-1,-1,-1],
        [10,11, 4,10, 4, 5,11, 3, 4, 9, 4, 1, 3, 1, 4,-1],
        [ 2, 5, 1, 2, 8, 5, 2,11, 8, 4, 5, 8,-1,-1,-1,-1],
        [ 0, 4,11, 0,11, 3, 4, 5,11, 2,11, 1, 5, 1,11,-1],
        [ 0, 2, 5, 0, 5, 9, 2,11, 5, 4, 5, 8,11, 8, 5,-1],
        [ 9, 4, 5, 2,11, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 5,10, 3, 5, 2, 3, 4, 5, 3, 8, 4,-1,-1,-1,-1],
        [ 5,10, 2, 5, 2, 4, 4, 2, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 3,10, 2, 3, 5,10, 3, 8, 5, 4, 5, 8, 0, 1, 9,-1],
        [ 5,10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2,-1,-1,-1,-1],
        [ 8, 4, 5, 8, 5, 3, 3, 5, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 4, 5, 1, 0, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5,-1,-1,-1,-1],
        [ 9, 4, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4,11, 7, 4, 9,11, 9,10,11,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 4, 9, 7, 9,11, 7, 9,10,11,-1,-1,-1,-1],
        [ 1,10,11, 1,11, 4, 1, 4, 0, 7, 4,11,-1,-1,-1,-1],
        [ 3, 1, 4, 3, 4, 8, 1,10, 4, 7, 4,11,10,11, 4,-1],
        [ 4,11, 7, 9,11, 4, 9, 2,11, 9, 1, 2,-1,-1,-1,-1],
        [ 9, 7, 4, 9,11, 7, 9, 1,11, 2,11, 1, 0, 8, 3,-1],
        [11, 7, 4,11, 4, 2, 2, 4, 0,-1,-1,-1,-1,-1,-1,-1],
        [11, 7, 4,11, 4, 2, 8, 3, 4, 3, 2, 4,-1,-1,-1,-1],
        [ 2, 9,10, 2, 7, 9, 2, 3, 7, 7, 4, 9,-1,-1,-1,-1],
        [ 9,10, 7, 9, 7, 4,10, 2, 7, 8, 7, 0, 2, 0, 7,-1],
        [ 3, 7,10, 3,10, 2, 7, 4,10, 1,10, 0, 4, 0,10,-1],
        [ 1,10, 2, 8, 7, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 1, 4, 1, 7, 7, 1, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1,-1,-1,-1,-1],
        [ 4, 0, 3, 7, 4, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 8, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9,10, 8,10,11, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 9, 3, 9,11,11, 9,10,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1,10, 0,10, 8, 8,10,11,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 1,10,11, 3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,11, 1,11, 9, 9,11, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 9, 3, 9,11, 1, 2, 9, 2,11, 9,-1,-1,-1,-1],
        [ 0, 2,11, 8, 0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 3, 8, 2, 8,10,10, 8, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 9,10, 2, 0, 9, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 3, 8, 2, 8,10, 0, 1, 8, 1,10, 8,-1,-1,-1,-1],
        [ 1,10, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 3, 8, 9, 1, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 9, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 3, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
    ];


}


///

function fgetOffset( fValue1, fValue2, fValueDesired ) {

    var fDelta = fValue2 - fValue1;

    if (fDelta == 0)
        return 0.5;

    return (fValueDesired - fValue1) / fDelta;
}

//vgetColor generates a color from a given position and normal of a point
function vgetColor( rfNormal ) {

    var fX = rfNormal[0];
    var fY = rfNormal[1];
    var fZ = rfNormal[2];

    return [
          ( (fX > 0 ? fX : 0) + (fY < 0 ? -0.5 * fY : 0.0) + (fZ < 0 ? -0.5 * fZ : 0) )
        , ( (fY > 0 ? fY : 0) + (fZ < 0 ? -0.5 * fZ : 0.0) + (fX < 0 ? -0.5 * fX : 0) )
        , ( (fZ > 0 ? fZ : 0) + (fX < 0 ? -0.5 * fX : 0.0) + (fY < 0 ? -0.5 * fY : 0) )
    ];
}

function vNormalizeVector( vec ) {

    var fOldLength = Math.sqrt( (vec[0] * vec[0]) + (vec[1] * vec[1]) + (vec[2] * vec[2]) );

    if (fOldLength == 0.0)
        return vec;

    var tmp_scale = 1.0 / fOldLength;

    return [
        vec[0] * tmp_scale,
        vec[1] * tmp_scale,
        vec[2] * tmp_scale
    ];
}

var proto = MarchingCube.prototype;

proto.getNormal = function( fX, fY, fZ ) {

    var step_dec = this.step_size * 0.1;

    var vec = [
        this.sample( fX - step_dec, fY, fZ ) - this.sample( fX + step_dec, fY, fZ ),
        this.sample( fX, fY - step_dec, fZ ) - this.sample( fX, fY + step_dec, fZ ),
        this.sample( fX, fY, fZ - step_dec ) - this.sample( fX, fY, fZ + step_dec )
    ];

    return vNormalizeVector( vec );
}

proto.getNormal2 = function( t1, t2, t3 ) {
 
    var Ux = t2[0] - t1[0];
    var Uy = t2[1] - t1[1];
    var Uz = t2[2] - t1[2];
    var Vx = t3[0] - t1[0];
    var Vy = t3[1] - t1[1];
    var Vz = t3[2] - t1[2];

    var normal2 = [
        Uy*Vz - Uz*Vy,
        Uz*Vx - Ux*Vz,
        Ux*Vy - Uy*Vx
    ];

    var len = Math.sqrt(
        normal2[0]*normal2[0]+
        normal2[1]*normal2[1]+
        normal2[2]*normal2[2]
    );

    return normal2
}

proto.marchCube = function( pos, geom_callback ) {

    this.current_geom_callback = geom_callback;

    for (var iX = 0; iX <= this.chunk_size; ++iX)
    for (var iY = 0; iY <= this.chunk_size; ++iY)
    for (var iZ = 0; iZ <= this.chunk_size; ++iZ)
        this.marchCube_single( pos[0] + iX, pos[1] + iY, pos[2] + iZ );
        // this.vMarchCube2( pos[0] + iX, pos[1] + iY, pos[2] + iZ );

    this.current_geom_callback = null;
}

proto.marchCube_single = function( iX, iY, iZ ) {

    var iCorner,
        iVertex,
        iVertexTest,
        iEdge,
        iTriangle,
        iFlagIndex,
        iEdgeFlags;

    var fOffset = 0.0;
    var afCubeValue = [ 0.0,0.0,0.0,0.0, 0.0,0.0,0.0,0.0 ];
    var asEdgeVertex =  [
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0]
    ];
    var asEdgeNorm =  [
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0]
    ];

    /// add chunk pos here
    var fX = iX * this.step_size,
        fY = iY * this.step_size,
        fZ = iZ * this.step_size;

    /// Make a local copy of the values at the cube's corners
    for (iVertex = 0; iVertex < 8; ++iVertex)
        afCubeValue[iVertex] = this.sample( fX + this.a2fVertexOffset[iVertex][0] * this.step_size,
                                            fY + this.a2fVertexOffset[iVertex][1] * this.step_size,
                                            fZ + this.a2fVertexOffset[iVertex][2] * this.step_size );

    //Find which vertices are inside of the surface and which are outside
    iFlagIndex = 0|0;
    for (iVertexTest = 0|0; iVertexTest < 8; ++iVertexTest)
        if (afCubeValue[iVertexTest] <= this.fTv)
            iFlagIndex |= (1 << iVertexTest);

    //Find which edges are intersected by the surface
    iEdgeFlags = this.aiCubeEdgeFlags[iFlagIndex];

    //If the cube is entirely inside or outside of the surface, then there will be no intersections
    if (iEdgeFlags == 0)
        return;

    //Find the point of intersection of the surface with each edge
    //Then find the normal to the surface at those points
    for (iEdge = 0; iEdge < 12; ++iEdge) {

        //if there is an intersection on this edge
        if (iEdgeFlags & (1 << iEdge)) {

            fOffset = fgetOffset(
                afCubeValue[ this.a2iEdgeConnection[iEdge][0] ],
                afCubeValue[ this.a2iEdgeConnection[iEdge][1] ],
                this.fTv
            );

            asEdgeVertex[iEdge][0] = fX + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][0] + fOffset * this.a2fEdgeDirection[iEdge][0] ) * this.step_size;
            asEdgeVertex[iEdge][1] = fY + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][1] + fOffset * this.a2fEdgeDirection[iEdge][1] ) * this.step_size;
            asEdgeVertex[iEdge][2] = fZ + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][2] + fOffset * this.a2fEdgeDirection[iEdge][2] ) * this.step_size;

            asEdgeNorm[iEdge] = this.getNormal( asEdgeVertex[iEdge][0], asEdgeVertex[iEdge][1], asEdgeVertex[iEdge][2] );
        }
    }


    //Draw the triangles that were found.  There can be up to five per cube
    for (iTriangle = 0; iTriangle < 5; ++iTriangle) {

        if (this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle ] < 0)
            break;



        for (var iCorner = 0; iCorner < 3; ++iCorner) {

            iVertex = this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle + iCorner ];

            var color = vgetColor( asEdgeNorm[iVertex] );

            //

            var vertex = [
                asEdgeVertex[iVertex][0] * this.chunk_size,
                asEdgeVertex[iVertex][1] * this.chunk_size,
                asEdgeVertex[iVertex][2] * this.chunk_size
            ];

            var normal = asEdgeNorm[iVertex];

            //

            if (this.current_geom_callback)
                this.current_geom_callback( vertex, color, normal );

        } // for (iCorner = [...]



        // var t_positions = [];
        // var t_colors = [];


        // for (var iCorner = 0; iCorner < 3; ++iCorner) {

        //  iVertex = this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle + iCorner ];

        //  // var color = vgetColor( asEdgeNorm[iVertex] );

        //  //

        //  var vertex = [
        //      asEdgeVertex[iVertex][0] * this.chunk_size,
        //      asEdgeVertex[iVertex][1] * this.chunk_size,
        //      asEdgeVertex[iVertex][2] * this.chunk_size
        //  ];

        //  //

        //  t_positions.push(vertex)
        //  // t_colors.push(color)

        // } // for (iCorner = [...]

        // var t_normal = this.getNormal2( t_positions[0], t_positions[1], t_positions[2] );
        // var t_color = vgetColor( t_normal );
        // // console.log(t_normal);

        // for (var i = 0; i < 3; ++i) {


        //  if (this.current_geom_callback)
        //      // this.current_geom_callback( t_positions[i], t_colors[i], t_normal );
        //      this.current_geom_callback( t_positions[i], t_color, t_normal );

        // } // for (iCorner = [...]



    } // for (iTriangle = [...]

}




























proto.vMarchCube2 = function(iX, iY, iZ) {

    /// add chunk pos here
    var fX = iX * this.step_size,
        fY = iY * this.step_size,
        fZ = iZ * this.step_size;

    var asCubePosition = [
        [0,0,0],[0,0,0],[0,0,0],[0,0,0],
        [0,0,0],[0,0,0],[0,0,0],[0,0,0]
    ];

    // Make a local copy of the cube's corner positions
    for (var iVertex = 0; iVertex < 8; iVertex++)
    {
        asCubePosition[iVertex][0] = fX + this.a2fVertexOffset[iVertex][0]*this.step_size;
        asCubePosition[iVertex][1] = fY + this.a2fVertexOffset[iVertex][1]*this.step_size;
        asCubePosition[iVertex][2] = fZ + this.a2fVertexOffset[iVertex][2]*this.step_size;
    }

    var  afCubeValue = [0,0,0,0,0,0,0,0];

    // Make a local copy of the cube's corner values
    for (var iVertex = 0; iVertex < 8; iVertex++)
        afCubeValue[iVertex] = this.sample( asCubePosition[iVertex][0],
                                            asCubePosition[iVertex][1],
                                            asCubePosition[iVertex][2]);

    var asTetrahedronPosition =  [ [0,0,0],[0,0,0],[0,0,0],[0,0,0] ];
    var afTetrahedronValue = [0,0,0,0];

    for (var iTetrahedron = 0; iTetrahedron < 6; iTetrahedron++)
    {
        for(var iVertex = 0; iVertex < 4; iVertex++)
        {
            var iVertexInACube = this.a2iTetrahedronsInACube[iTetrahedron][iVertex];

            asTetrahedronPosition[iVertex][0] = asCubePosition[iVertexInACube][0];
            asTetrahedronPosition[iVertex][1] = asCubePosition[iVertexInACube][1];
            asTetrahedronPosition[iVertex][2] = asCubePosition[iVertexInACube][2];

            afTetrahedronValue[iVertex] = afCubeValue[iVertexInACube];
        }

        this.vMarchTetrahedron( asTetrahedronPosition, afTetrahedronValue );
    }
}

proto.vMarchTetrahedron = function(pasTetrahedronPosition, pafTetrahedronValue) {

    var iEdge, iVert0, iVert1, iEdgeFlags, iTriangle, iCorner, iVertex, iFlagIndex = 0;
    var fOffset, fInvOffset, fValue = 0.0;
    var asEdgeVertex = [ [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0] ];
    var asEdgeNorm = [ [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0] ];
    var sColor = [0,0,0];

    //Find which vertices are inside of the surface and which are outside
    for (iVertex = 0; iVertex < 4; iVertex++)
    {
        if(pafTetrahedronValue[iVertex] <= this.fTv) 
            iFlagIndex |= 1<<iVertex;
    }

    //Find which edges are intersected by the surface
    iEdgeFlags = this.aiTetrahedronEdgeFlags[iFlagIndex];

    //If the tetrahedron is entirely inside or outside of the surface, then there will be no intersections
    if (iEdgeFlags == 0)
        return;

    for (iEdge = 0; iEdge < 6; iEdge++)
    {
        if (iEdgeFlags & (1<<iEdge))
        {
            iVert0 = this.a2iTetrahedronEdgeConnection[iEdge][0];
            iVert1 = this.a2iTetrahedronEdgeConnection[iEdge][1];
            fOffset = fgetOffset(
                pafTetrahedronValue[iVert0],
                pafTetrahedronValue[iVert1],
                this.fTv
            );
            fInvOffset = 1.0 - fOffset;

            asEdgeVertex[iEdge][0] = fInvOffset*pasTetrahedronPosition[iVert0][0]  +  fOffset*pasTetrahedronPosition[iVert1][0];
            asEdgeVertex[iEdge][1] = fInvOffset*pasTetrahedronPosition[iVert0][1]  +  fOffset*pasTetrahedronPosition[iVert1][1];
            asEdgeVertex[iEdge][2] = fInvOffset*pasTetrahedronPosition[iVert0][2]  +  fOffset*pasTetrahedronPosition[iVert1][2];

            asEdgeNorm[iEdge] = this.getNormal( asEdgeVertex[iEdge][0], asEdgeVertex[iEdge][1], asEdgeVertex[iEdge][2] );
        }
    }

    for (iTriangle = 0; iTriangle < 2; iTriangle++)
    {
        if (this.a2iTetrahedronTriangles[iFlagIndex][3*iTriangle] < 0)
            break;


        for (iCorner = 0; iCorner < 3; iCorner++)
        {
            iVertex = this.a2iTetrahedronTriangles[iFlagIndex][3*iTriangle+iCorner];

            var color = vgetColor( asEdgeNorm[iVertex] );

            var vertex = [
                asEdgeVertex[iVertex][0] * this.chunk_size,
                asEdgeVertex[iVertex][1] * this.chunk_size,
                asEdgeVertex[iVertex][2] * this.chunk_size
                // asEdgeVertex[iVertex][0],
                // asEdgeVertex[iVertex][1],
                // asEdgeVertex[iVertex][2]
            ];

            var normal = asEdgeNorm[iVertex];

            if (this.current_geom_callback)
                this.current_geom_callback( vertex, color, normal );

        }
    }
}



module.exports = MarchingCube
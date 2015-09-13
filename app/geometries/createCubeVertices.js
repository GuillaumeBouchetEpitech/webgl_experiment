
define(function() {

    function createCubeVertices(size, arr_color) {

        var outer_side = size / 2;
        var inner_side = size / 2.5;

        var vertices = [
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

        var indices = [
            0,1,  1,3,  3,2,  2,0,
            4,5,  5,7,  7,6,  6,4,
            0,4,  1,5,  3,7,  2,6,

             8, 9,   9,11,  11,10,  10, 8,
            12,13,  13,15,  15,14,  14,12,
             8,12,   9,13,  11,15,  10,14
        ];

        //

        var fvertices = [];

        for (var i = 0; i < indices.length; ++i)
        {
            var curr_index = indices[i] * 3;

            for (var j = 0; j < 3; ++j)
                fvertices.push( vertices[curr_index + j] + outer_side );

            for (var j = 0; j < 3; ++j)
                fvertices.push( arr_color[j] );            
        }

        return fvertices;
    }

    return createCubeVertices;
});
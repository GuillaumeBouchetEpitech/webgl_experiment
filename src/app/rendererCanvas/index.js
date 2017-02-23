
"use strict"

var g_data = require('../data/index.js');

var ctx = require('./context.js');

//

function RendererCanvas ()
{
}

//

var proto = RendererCanvas.prototype;

proto.resize = function (width, height)
{
    ctx.width = width;
    ctx.height = height;
}

proto.render = function ()
{
    ctx.clearRect(0, 0, ctx.width, ctx.height);

    //
    // make a rectangle around the viewport
    // -> was a debug for the fullscreen, but I still like it <3
    //

    ctx.beginPath();
    ctx.lineWidth="5";
    ctx.strokeStyle="green"; // Green path
    ctx.moveTo(0,0);
    ctx.lineTo(0,ctx.height);
    ctx.lineTo(ctx.width,ctx.height);
    ctx.lineTo(ctx.width,0);
    ctx.lineTo(0,0);
    ctx.stroke(); // Draw it

    //
    // render text
    //

    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";

    ctx.lineWidth="7";
    ctx.strokeStyle="green";

    var arr_chunks = g_data.logic.ChunkGenerator._chunks;

    for (var i = 0; i < arr_chunks.length; ++i)
    {
        var pos = arr_chunks[i].pos;

        //

        if (!arr_chunks[i].visible)
        	continue;

        if (!g_data.point_is_visible(pos))
            continue;

        var coord2d = arr_chunks[i].coord2d;

        if (!coord2d)
        	continue;

        //

        {
            var x = coord2d[0];
            var y = coord2d[1];

            ctx.beginPath();

            ctx.moveTo(x,y-15);
            ctx.lineTo(x,y+15);
            ctx.stroke();

            ctx.moveTo(x-15,y);
            ctx.lineTo(x+15,y);
            ctx.stroke();


            var str = '';
            str += pos[0]/g_data.logic.k_chunk_size + '/'
            str += pos[1]/g_data.logic.k_chunk_size + '/'
            str += pos[2]/g_data.logic.k_chunk_size

            ctx.fillText(str,x,y);
        }
    }

	// 

    ctx.beginPath();
    ctx.lineWidth="5";
    ctx.strokeStyle="red";

    for (var i = 0; i < g_data.arr_touches.length; ++i)
    {
        var x = arr_touches[i].x;
        var y = arr_touches[i].y;

        ctx.moveTo(x,y-150);
        ctx.lineTo(x,y+150);
        ctx.stroke();

        ctx.moveTo(x-150,y);
        ctx.lineTo(x+150,y);
        ctx.stroke();

        if (g_data.FreeFlyCamera._force_forward)
        {
            ctx.moveTo(x-100,y-100);
            ctx.lineTo(x+100,y+100);
            ctx.stroke();

            ctx.moveTo(x-100,y+100);
            ctx.lineTo(x+100,y-100);
            ctx.stroke();
        }
    }
}

//

module.exports = RendererCanvas;


"use strict"

// https://www.opengl.org/wiki/GluProject_and_gluUnProject_code


function glhProject( objx, objy, objz, modelview, projection, arr_viewport )
{
    //Transformation vectors
    var fTempo = [];

    //Modelview transform
    fTempo[0]=modelview[0]*objx+modelview[4]*objy+modelview[8]*objz+modelview[12];  //w is always 1
    fTempo[1]=modelview[1]*objx+modelview[5]*objy+modelview[9]*objz+modelview[13];
    fTempo[2]=modelview[2]*objx+modelview[6]*objy+modelview[10]*objz+modelview[14];
    fTempo[3]=modelview[3]*objx+modelview[7]*objy+modelview[11]*objz+modelview[15];

    //Projection transform, the final row of projection matrix is always [0 0 -1 0]
    //so we optimize for that.
    fTempo[4]=projection[0]*fTempo[0]+projection[4]*fTempo[1]+projection[8]*fTempo[2]+projection[12]*fTempo[3];
    fTempo[5]=projection[1]*fTempo[0]+projection[5]*fTempo[1]+projection[9]*fTempo[2]+projection[13]*fTempo[3];
    fTempo[6]=projection[2]*fTempo[0]+projection[6]*fTempo[1]+projection[10]*fTempo[2]+projection[14]*fTempo[3];
    fTempo[7]=-fTempo[2];

    //The result normalizes between -1 and 1
    if (fTempo[7]==0.0) //The w value
        return null;

    fTempo[7]=1.0/fTempo[7];
    //Perspective division
    fTempo[4]*=fTempo[7];
    fTempo[5]*=fTempo[7];
    fTempo[6]*=fTempo[7];

    //Window coordinates
    //Map x, y to range 0-1
    return [
        (fTempo[4]*0.5+0.5)*arr_viewport[2]+arr_viewport[0],
        (fTempo[5]*0.5+0.5)*arr_viewport[3]+arr_viewport[1]
    ];
}

module.exports = glhProject;

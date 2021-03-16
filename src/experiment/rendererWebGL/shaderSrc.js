
const color_vert = `

attribute vec3 aVertexPosition;
attribute vec3 aVertexColor;

varying vec4 vColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void)
{
    vColor = vec4(aVertexColor,1.0);

    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
`;

const color_frag = `

precision mediump float;

varying vec4 vColor;

void main(void)
{
    gl_FragColor = vColor;
}
`;

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

const experimental_vert = `

attribute vec3 aVertexPosition, aVertexColor, aVertexNormal, aVertexBCenter;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uCameraPos;

varying vec3 vColor;
varying vec3 vBCenter;

varying vec3 vNormalInterp;
varying vec3 vVertPos;
varying float vDistance;

varying vec3 vPureVertexPos;
varying vec3 vPureNormalInterp;

const float k_range_min = 20.0;
const float k_range_max = 23.0;


void main(void)
{
    vec4 vertPos4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vVertPos = vec3(vertPos4) / vertPos4.w;
    vNormalInterp = vec3( uMVMatrix * vec4(aVertexNormal, 0.0) );

    vPureVertexPos = aVertexPosition;
    vPureNormalInterp = aVertexNormal;

    //

    float tmp_dist = length( aVertexPosition - uCameraPos );

    vDistance = tmp_dist;

    vColor = aVertexColor;
    vBCenter = aVertexBCenter;

    if (tmp_dist < k_range_min ||
        tmp_dist > k_range_max)
    {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    }
    else
    {
        // bump effect -> bump in the direction of the normal

        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition + aVertexNormal, 1.0);
    }

    //

}
`;

const experimental_frag = `

precision mediump float;

uniform sampler2D uSampler;

varying vec3 vColor;
varying vec3 vBCenter;

varying vec3 vNormalInterp;
varying vec3 vVertPos;
varying float vDistance;

varying vec3 vPureVertexPos;
varying vec3 vPureNormalInterp;

const vec3 k_lightPos = vec3(0.0,0.0,0.0);
const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

const float k_range_min = 20.0;
const float k_range_max = 23.0;

void main(void)
{

    { // wireframe

        if (gl_FrontFacing)
        {
            // "bumped wireframe" effect on the front facing

            if (vDistance > k_range_min &&
                vDistance < k_range_max)
            {

                if (all(greaterThan(vBCenter, vec3(0.03))) &&
                    any(lessThan(vBCenter, vec3(0.08))))
                {
                    gl_FragColor = vec4(vColor, 1.0);
                    return;
                }

            }

        }
        else
        {
            // normal wireframe effect on the back facing

            if (any(lessThan(vBCenter, vec3(0.06))))
            {
                gl_FragColor = vec4(1);
                return;
            }
        }

        // wireframe only for the backface
        if (!gl_FrontFacing)
            discard;

    } // /wireframe

    vec3 tmp_color = vColor;

    { // texture

        // current 3d texture coordinate
        vec3 flooredPos = vec3(
            vPureVertexPos.x - floor(vPureVertexPos.x),
            vPureVertexPos.y - floor(vPureVertexPos.y),
            vPureVertexPos.z - floor(vPureVertexPos.z)
        );

        vec3 blend_weights = abs( normalize( vPureNormalInterp.xyz ) );
        blend_weights = max( ( blend_weights - 0.2 ) * 7., 0. );
        blend_weights /= ( blend_weights.x + blend_weights.y + blend_weights.z );

        // horizontal texture coordinates -> shoudl be a wall
        vec2 texcoord1 = flooredPos.yz * 0.5 + 0.5;
        vec2 texcoord2 = flooredPos.xz * 0.5 + 0.5;
        // vertical texture coord -> should be green grass
        vec2 texcoord3 = flooredPos.xy * 0.5;

        if (vPureNormalInterp.z < 0.0)
            texcoord3.y += 0.5; // switch the texture Y -> dirt on the ceilling instead of grass

        // horizontal color
        vec3 texColor1 = texture2D( uSampler, texcoord1 ).rgb;
        vec3 texColor2 = texture2D( uSampler, texcoord2 ).rgb;
        // vertical color
        vec3 texColor3 = texture2D( uSampler, texcoord3 ).rgb;

        tmp_color = texColor1 * blend_weights.xxx +
                    texColor2 * blend_weights.yyy +
                    texColor3 * blend_weights.zzz;

    } // texture

    { // lighting

        vec3 normal = normalize(vNormalInterp);
        vec3 lightDir = normalize(k_lightPos - vVertPos);

        float lambertian = max(dot(lightDir,vNormalInterp.xyz), 0.0);
        float specular = 0.0;

        // lighting specular
        if (lambertian > 0.0)
        {
            vec3 reflectDir = reflect(-lightDir, normal);
            vec3 viewDir = normalize(-vVertPos);

            float specAngle = max(dot(reflectDir, viewDir), 0.0);
            specular = pow(specAngle, 16.0);
        }

        // lighting output
        tmp_color = tmp_color.xyz*0.05 + tmp_color.xyz*lambertian + specular*k_specColor;

    } // lighting

    gl_FragColor = vec4(tmp_color, 1.0);
}
`;

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

module.exports = {
    color: {
        vertex: color_vert,
        fragment: color_frag,
    },
    experimental: {
        vertex: experimental_vert,
        fragment: experimental_frag,
    }
};

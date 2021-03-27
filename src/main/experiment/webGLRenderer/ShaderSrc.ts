
const color_vert = `

attribute vec3 a_vertexPosition;
attribute vec3 a_vertexColor;

varying vec4 v_color;

uniform mat4 u_modelviewMatrix;
uniform mat4 u_projMatrix;

void main(void)
{
    v_color = vec4(a_vertexColor,1.0);

    gl_Position = u_projMatrix * u_modelviewMatrix * vec4(a_vertexPosition, 1.0);
}
`;

const color_frag = `

precision mediump float;

varying vec4 v_color;

void main(void)
{
    gl_FragColor = v_color;
}
`;

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

const experimental_vert = `

attribute vec3 a_vertexPosition;
attribute vec3 a_vertexColor;
attribute vec3 a_vertexNormal;
attribute vec3 a_vertexBCenter;

uniform mat4 u_modelviewMatrix;
uniform mat4 u_projMatrix;
uniform vec3 u_cameraPos;

varying vec3 v_color;
varying vec3 v_bCenter;

varying vec3 v_normalInterp;
varying vec3 v_vertPos;
varying float v_distance;

varying vec3 v_pureVertexPos;
varying vec3 v_pureNormalInterp;

const float k_range_min = 20.0;
const float k_range_max = 23.0;

void main(void)
{
    vec4 vertPos4 = u_modelviewMatrix * vec4(a_vertexPosition, 1.0);
    v_vertPos = vec3(vertPos4) / vertPos4.w;
    v_normalInterp = vec3(u_modelviewMatrix * vec4(a_vertexNormal, 0.0));

    v_pureVertexPos = a_vertexPosition;
    v_pureNormalInterp = a_vertexNormal;

    float tmp_dist = length(a_vertexPosition - u_cameraPos);

    v_distance = tmp_dist;

    v_color = a_vertexColor;
    v_bCenter = a_vertexBCenter;

    if (tmp_dist < k_range_min ||
        tmp_dist > k_range_max)
    {
        gl_Position = u_projMatrix * u_modelviewMatrix * vec4(a_vertexPosition, 1.0);
    }
    else
    {
        // bump effect -> bump in the direction of the normal

        gl_Position = u_projMatrix * u_modelviewMatrix * vec4(a_vertexPosition + a_vertexNormal, 1.0);
    }
}
`;

const experimental_frag = `

precision mediump float;

uniform sampler2D u_sampler;

varying vec3 v_color;
varying vec3 v_bCenter;

varying vec3 v_normalInterp;
varying vec3 v_vertPos;
varying float v_distance;

varying vec3 v_pureVertexPos;
varying vec3 v_pureNormalInterp;

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

            if (v_distance > k_range_min &&
                v_distance < k_range_max)
            {

                if (all(greaterThan(v_bCenter, vec3(0.03))) &&
                    any(lessThan(v_bCenter, vec3(0.08))))
                {
                    gl_FragColor = vec4(v_color, 1.0);
                    return;
                }

            }

        }
        else
        {
            // normal wireframe effect on the back facing

            if (any(lessThan(v_bCenter, vec3(0.06))))
            {
                gl_FragColor = vec4(1);
                return;
            }
        }

        // wireframe only for the backface
        if (!gl_FrontFacing)
            discard;

    } // /wireframe

    vec3 tmp_color = v_color;

    { // texture

        // current 3d texture coordinate
        vec3 flooredPos = vec3(
            v_pureVertexPos.x - floor(v_pureVertexPos.x),
            v_pureVertexPos.y - floor(v_pureVertexPos.y),
            v_pureVertexPos.z - floor(v_pureVertexPos.z)
        );

        vec3 blend_weights = abs( normalize( v_pureNormalInterp.xyz ) );
        blend_weights = max( ( blend_weights - 0.2 ) * 7., 0. );
        blend_weights /= ( blend_weights.x + blend_weights.y + blend_weights.z );

        // horizontal texture coordinates -> should be a wall
        vec2 texcoord1 = vec2(flooredPos.y * 0.5 + 0.5, flooredPos.z * 0.5);
        vec2 texcoord2 = vec2(flooredPos.x * 0.5 + 0.5, flooredPos.z * 0.5);

        // vertical texture coord -> should be green grass
        vec2 texcoord3 = vec2(flooredPos.x * 0.5, flooredPos.y * 0.5 + 0.5);

        if (v_pureNormalInterp.z < 0.0)
        {
            // switch the texture Y -> dirt on the ceilling instead of grass
            texcoord3.y -= 0.5;
        }

        // horizontal color
        vec3 texColor1 = texture2D( u_sampler, texcoord1 ).rgb;
        vec3 texColor2 = texture2D( u_sampler, texcoord2 ).rgb;

        // vertical color
        vec3 texColor3 = texture2D( u_sampler, texcoord3 ).rgb;

        tmp_color = texColor1 * blend_weights.xxx +
                    texColor2 * blend_weights.yyy +
                    texColor3 * blend_weights.zzz;

    } // texture

    { // lighting

        vec3 normal = normalize(v_normalInterp);
        vec3 lightDir = normalize(k_lightPos - v_vertPos);

        float lambertian = max(dot(lightDir,v_normalInterp.xyz), 0.0);
        float specular = 0.0;

        if (lambertian > 0.0)
        {
            // lighting specular

            vec3 reflectDir = reflect(-lightDir, normal);
            vec3 viewDir = normalize(-v_vertPos);

            float specAngle = max(dot(reflectDir, viewDir), 0.0);
            specular = pow(specAngle, 16.0);
        }

        // lighting output

        vec3 ambiant_color = tmp_color.xyz * 0.05;
        vec3 diffuse_color = tmp_color.xyz * lambertian;
        vec3 specular_color = specular * k_specColor;

        tmp_color = ambiant_color + diffuse_color + specular_color;

    } // lighting

    gl_FragColor = vec4(tmp_color, 1.0);
}
`;

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

const letters_vert = `

precision mediump float;

uniform mat4 u_modelviewMatrix;
uniform mat4 u_projectionMatrix;


attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec2 a_offsetPosition;
attribute vec2 a_offsetTexCoord;
attribute float a_offsetScale;

varying vec2 v_texCoord;

void main(void)
{
    vec2 position = a_position * a_offsetScale + a_offsetPosition;

    gl_Position = u_projectionMatrix * u_modelviewMatrix * vec4(position, 0.0, 1.0);

    v_texCoord = a_texCoord + a_offsetTexCoord;
}
`;

const letters_frag = `

precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;

void main(void)
{
    gl_FragColor = texture2D(u_texture, v_texCoord);
}

`;

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

export {
    color_vert,
    color_frag,
    experimental_vert,
    experimental_frag,
    letters_vert,
    letters_frag,
};

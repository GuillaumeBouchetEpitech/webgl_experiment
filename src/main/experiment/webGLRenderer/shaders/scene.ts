
const vertex = `

attribute vec3 a_vertexPosition;
attribute vec3 a_vertexColor;
attribute vec3 a_vertexNormal;
attribute vec3 a_vertexBCenter;

uniform mat4 u_modelviewMatrix;
uniform mat4 u_projMatrix;
uniform vec3 u_cameraPos;

varying vec3 v_color;
varying vec3 v_baryCenter;

varying vec3 v_normalInterp;
varying vec3 v_vertPos;
varying float v_distanceToCamera;

varying vec3 v_pureVertexPos;
varying vec3 v_pureNormalInterp;

const float k_rangeMin = 20.0;
const float k_rangeMax = 23.0;

void main(void)
{
    vec4 vertPos4 = u_modelviewMatrix * vec4(a_vertexPosition, 1.0);
    v_vertPos = vec3(vertPos4) / vertPos4.w;
    v_normalInterp = vec3(u_modelviewMatrix * vec4(a_vertexNormal, 0.0));

    v_pureVertexPos = a_vertexPosition;
    v_pureNormalInterp = a_vertexNormal;

    float distanceToCamera = length(a_vertexPosition - u_cameraPos);

    v_distanceToCamera = distanceToCamera;

    v_color = a_vertexColor;
    v_baryCenter = a_vertexBCenter;

    if (distanceToCamera < k_rangeMin ||
        distanceToCamera > k_rangeMax)
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

const fragment = `

precision mediump float;

uniform sampler2D u_sampler;

varying vec3 v_color;
varying vec3 v_baryCenter;

varying vec3 v_normalInterp;
varying vec3 v_vertPos;
varying float v_distanceToCamera;

varying vec3 v_pureVertexPos;
varying vec3 v_pureNormalInterp;

const vec3 k_lightPos = vec3(0.0,0.0,0.0);
const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

const float k_rangeMin = 20.0;
const float k_rangeMax = 23.0;

void main(void)
{

    { // wireframe

        if (gl_FrontFacing)
        {
            // "bumped wireframe" effect on the front facing

            if (v_distanceToCamera > k_rangeMin &&
                v_distanceToCamera < k_rangeMax)
            {

                if (all(greaterThan(v_baryCenter, vec3(0.03))) &&
                    any(lessThan(v_baryCenter, vec3(0.08))))
                {
                    gl_FragColor = vec4(v_color, 1.0);
                    return;
                }

            }

        }
        else
        {
            // normal wireframe effect on the back facing

            if (any(lessThan(v_baryCenter, vec3(0.06))))
            {
                gl_FragColor = vec4(1);
                return;
            }
        }

        // wireframe only for the backface
        if (!gl_FrontFacing)
            discard;

    } // /wireframe

    vec3 currentColor = v_color;

    { // texture

        // current 3d texture coordinate
        vec3 flooredPos = vec3(
            v_pureVertexPos.x - floor(v_pureVertexPos.x),
            v_pureVertexPos.y - floor(v_pureVertexPos.y),
            v_pureVertexPos.z - floor(v_pureVertexPos.z)
        );

        vec3 blend_weights = abs( normalize( v_pureNormalInterp.xyz ) );
        blend_weights = max( ( blend_weights - 0.2 ) * 7.0, 0.0 );
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

        currentColor = texColor1 * blend_weights.xxx +
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

        vec3 ambiant_color = currentColor.xyz * 0.05;
        vec3 diffuse_color = currentColor.xyz * lambertian;
        vec3 specular_color = k_specColor * specular;

        currentColor = ambiant_color + diffuse_color + specular_color;

    } // lighting

    gl_FragColor = vec4(currentColor, 1.0);
}
`;

export { vertex, fragment };

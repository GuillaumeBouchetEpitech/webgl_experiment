
const vertex = `

attribute vec3 a_vertexPosition;
attribute vec3 a_vertexColor;
attribute vec3 a_vertexNormal;
attribute vec3 a_vertexBCenter;

uniform mat4 u_modelviewMatrix;
uniform mat4 u_projMatrix;
uniform vec3 u_cameraPos;

varying vec3 v_color;

// lighting
varying vec3 v_normalInterp;
varying vec3 v_vertPos;
// lighting

// wireframe
varying float v_distanceToCamera;
varying vec3  v_baryCenter;
// wireframe

// texturing
varying vec3 v_pureVertexPos;
varying vec3 v_pureNormalInterp;
// texturing

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

// lighting
varying vec3 v_normalInterp;
varying vec3 v_vertPos;
// lighting

// wireframe
varying float v_distanceToCamera;
varying vec3  v_baryCenter;
// wireframe

// texturing
varying vec3 v_pureVertexPos;
varying vec3 v_pureNormalInterp;
// texturing

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
            else
            {
                // discard what is not part fo the wireframe
                discard;
            }
        }

    } // /wireframe

    vec3 currentColor = vec3(1);

    { // texture

        // current 3d texture coordinate
        vec3 flooredPos = vec3(
            v_pureVertexPos.x - floor(v_pureVertexPos.x),
            v_pureVertexPos.y - floor(v_pureVertexPos.y),
            v_pureVertexPos.z - floor(v_pureVertexPos.z)
        );

        vec3 blendWeights = abs( normalize( v_pureNormalInterp.xyz ) );
        blendWeights = max( ( blendWeights - 0.2 ) * 7.0, 0.0 );
        blendWeights /= ( blendWeights.x + blendWeights.y + blendWeights.z );

        // horizontal texture coordinates -> should be a wall
        vec2 texCoordX = vec2(flooredPos.y * 0.5 + 0.5, flooredPos.z * 0.5);
        vec2 texCoordY = vec2(flooredPos.x * 0.5 + 0.5, flooredPos.z * 0.5);

        // vertical texture coord -> should be green grass
        vec2 texCoordZ = vec2(flooredPos.x * 0.5, flooredPos.y * 0.5 + 0.5);

        if (v_pureNormalInterp.z < 0.0)
        {
            // switch the texture Y -> dirt on the ceilling instead of grass
            texCoordZ.y -= 0.5;
        }

        // horizontal color
        vec3 texColorX = texture2D( u_sampler, texCoordX ).rgb;
        vec3 texColorY = texture2D( u_sampler, texCoordY ).rgb;

        // vertical color
        vec3 texColorZ = texture2D( u_sampler, texCoordZ ).rgb;

        currentColor = texColorX * blendWeights.xxx +
                       texColorY * blendWeights.yyy +
                       texColorZ * blendWeights.zzz;

    } // texture

    { // lighting

        vec3 normal = normalize(v_normalInterp);
        vec3 lightDir = normalize(k_lightPos - v_vertPos);

        float lambertian = max(dot(lightDir,v_normalInterp.xyz), 0.0);
        float specular = 0.0;

        if (lambertian > 0.0)
        {
            // specular

            vec3 reflectDir = reflect(-lightDir, normal);
            vec3 viewDir = normalize(-v_vertPos);

            float specAngle = max(dot(reflectDir, viewDir), 0.0);
            specular = pow(specAngle, 16.0);
        }

        vec3 ambiantColor = currentColor.xyz * 0.05;
        vec3 diffuseColor = currentColor.xyz * lambertian;
        vec3 specularColor = k_specColor * specular;

        currentColor = ambiantColor + diffuseColor + specularColor;

    } // lighting

    gl_FragColor = vec4(currentColor, 1.0);
}
`;

export { vertex, fragment };

export const vertex = `
#version 300 es

precision highp float;

in vec3 a_vertex_position;
in vec3 a_vertex_normal;

uniform mat4 u_viewMatrix;
uniform mat4 u_projMatrix;

// lighting
out vec3 v_worldSpaceNormal;
out vec3 v_worldSpacePosition;
// lighting

// texturing
out vec3 v_rawPosition;
out vec3 v_rawNormal;
// texturing

void main(void)
{
  vec4 transformedPosition = u_viewMatrix * vec4(a_vertex_position, 1.0);

  v_worldSpacePosition = a_vertex_position;
  v_worldSpaceNormal = a_vertex_normal;

  v_rawPosition = a_vertex_position;
  v_rawNormal = a_vertex_normal;

  gl_Position = u_projMatrix * u_viewMatrix * vec4(a_vertex_position, 1.0);
}
`.trim();

export const fragment = `
#version 300 es

precision lowp float;

uniform sampler2D u_texture;
uniform vec3 u_eyePosition;

// lighting
in vec3 v_worldSpaceNormal;
in vec3 v_worldSpacePosition;
// lighting

// texturing
in vec3 v_rawPosition;
in vec3 v_rawNormal;
// texturing

out vec4 o_color;

const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

void main(void)
{

  vec3 currentColor = vec3(1);

  { // texture

    // current 3d texture coordinate
    vec3 flooredPos = vec3(
      v_rawPosition.x - floor(v_rawPosition.x),
      v_rawPosition.y - floor(v_rawPosition.y),
      v_rawPosition.z - floor(v_rawPosition.z)
    );

    vec3 blendWeights = abs( normalize( v_rawNormal.xyz ) );
    blendWeights = max( ( blendWeights - 0.2 ) * 7.0, 0.0 );
    blendWeights /= ( blendWeights.x + blendWeights.y + blendWeights.z );

    // horizontal texture coordinates -> should be a wall
    vec2 texCoordX = vec2(flooredPos.y * 0.5 + 0.5, flooredPos.z * 0.5);
    vec2 texCoordY = vec2(flooredPos.x * 0.5 + 0.5, flooredPos.z * 0.5);

    // vertical texture coord -> should be green grass
    vec2 texCoordZ = vec2(flooredPos.x * 0.5, flooredPos.y * 0.5 + 0.5);

    if (v_rawNormal.z < 0.0)
    {
      // switch the texture Y -> dirt on the ceiling instead of grass
      texCoordZ.y -= 0.5;
    }

    // horizontal color
    vec3 texColorX = texture( u_texture, texCoordX ).rgb;
    vec3 texColorY = texture( u_texture, texCoordY ).rgb;

    // vertical color
    vec3 texColorZ = texture( u_texture, texCoordZ ).rgb;

    currentColor = texColorX * blendWeights.xxx +
                    texColorY * blendWeights.yyy +
                    texColorZ * blendWeights.zzz;

  } // texture

  { // lighting

    vec3 normal = normalize(v_worldSpaceNormal);
    vec3 lightDir = normalize(u_eyePosition - v_worldSpacePosition);

    float diffuseCoef = max(dot(lightDir,v_worldSpaceNormal.xyz), 0.0);
    float specularCoef = 0.0;

    if (diffuseCoef > 0.0) {
      // specular

      vec3 reflectDir = reflect(-lightDir, normal);
      vec3 viewDir = normalize(u_eyePosition - v_worldSpacePosition);

      float specAngle = max(dot(reflectDir, viewDir), 0.0);
      specularCoef = pow(specAngle, 16.0);
    }

    vec3 ambiantColor = currentColor.xyz * 0.05;
    vec3 diffuseColor = currentColor.xyz * diffuseCoef;
    vec3 specularColor = k_specColor * specularCoef;

    currentColor = ambiantColor + diffuseColor + specularColor;

  } // lighting

  o_color = vec4(currentColor, 1.0);

}
`.trim();

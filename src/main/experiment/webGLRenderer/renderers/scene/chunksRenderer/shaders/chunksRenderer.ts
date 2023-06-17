export const vertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;
uniform float u_sceneScale;
uniform float u_tileRepeat;

in vec3 a_vertex_position;
in vec3 a_vertex_normal;
in vec3 a_offset_origin;

out vec3 v_chunkSpacePosition;
out vec3 v_worldSpacePosition;
out vec3 v_worldSpaceNormal;

void main(void)
{
  vec3 chunkSpacePosition = a_vertex_position * u_sceneScale;

  v_chunkSpacePosition = a_vertex_position * u_tileRepeat;
  v_worldSpacePosition = a_offset_origin + chunkSpacePosition;
  v_worldSpaceNormal = a_vertex_normal;

  gl_Position = u_composedMatrix * vec4(v_worldSpacePosition, 1.0);
}
`.trim();

export const fragment = `
#version 300 es

precision lowp float;

const float k_ambiantCoef = 0.1;
const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

uniform sampler2D u_texture_dirt;
uniform sampler2D u_texture_grass;
uniform sampler2D u_texture_stoneWall;
uniform sampler2D u_texture_stoneWallBump;
uniform vec3 u_eyePosition;

in vec3 v_chunkSpacePosition;
in vec3 v_worldSpacePosition;
in vec3 v_worldSpaceNormal;

out vec4 o_color;

vec4 _getColorValue()
{

  // current 3d texture coordinate
  vec3 flooredPos = vec3(
    v_chunkSpacePosition.x - floor(v_chunkSpacePosition.x),
    v_chunkSpacePosition.y - floor(v_chunkSpacePosition.y),
    v_chunkSpacePosition.z - floor(v_chunkSpacePosition.z)
  );

  vec3 blendWeights = abs( normalize( v_worldSpaceNormal.xyz ) );
  blendWeights = max( ( blendWeights - 0.2 ) * 7.0, 0.0 );
  blendWeights /= ( blendWeights.x + blendWeights.y + blendWeights.z );

  // horizontal texture coordinates -> should be a wall
  vec2 texCoordX = vec2(flooredPos.y, flooredPos.z);
  vec2 texCoordY = vec2(flooredPos.x, flooredPos.z);

  // vertical texture coord -> should be green grass
  vec2 texCoordZ = vec2(flooredPos.x, flooredPos.y);

  // horizontal color
  vec3 texColorX = texture( u_texture_stoneWall, texCoordX ).rgb;
  vec3 texColorY = texture( u_texture_stoneWall, texCoordY ).rgb;

  float specularRatioX = texture( u_texture_stoneWallBump, texCoordX ).r * blendWeights.x;
  float specularRatioY = texture( u_texture_stoneWallBump, texCoordY ).r * blendWeights.y;
  float specularRatio = max( specularRatioX, specularRatioY );

  // vertical color
  vec3 texColorZ = vec3(0.0);
  if (v_worldSpaceNormal.z < 0.0)
  {
    texColorZ = texture( u_texture_dirt, texCoordZ ).rgb;
  }
  else
  {
    texColorZ = texture( u_texture_grass, texCoordZ ).rgb;
  }

  return vec4(
    texColorX * blendWeights.xxx +
    texColorY * blendWeights.yyy +
    texColorZ * blendWeights.zzz,
    specularRatio
  );
}

vec3 _getLightColor(vec4 currentColor)
{
  vec3 normal = normalize(v_worldSpaceNormal);
  vec3 lightDir = normalize(u_eyePosition - v_worldSpacePosition);

  float diffuseCoef = max(dot(lightDir,v_worldSpaceNormal.xyz), 0.0);
  float specularCoef = 0.0;

  if (diffuseCoef > 0.0)
  {
    // specular

    vec3 reflectDir = reflect(-lightDir, normal);
    vec3 viewDir = normalize(u_eyePosition - v_worldSpacePosition);

    float specAngle = max(dot(reflectDir, viewDir), 0.0);
    specularCoef = pow(specAngle, 16.0);
  }

  vec3 diffuseColor = currentColor.rgb * (k_ambiantCoef + diffuseCoef);
  vec3 specularColor = k_specColor * specularCoef * currentColor.a;

  return diffuseColor + specularColor;
}

void main(void)
{
  o_color = vec4(_getLightColor(_getColorValue()), 1.0);
}
`.trim();

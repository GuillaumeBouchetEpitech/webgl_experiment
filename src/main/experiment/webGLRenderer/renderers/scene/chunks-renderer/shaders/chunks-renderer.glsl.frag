
#version 300 es

precision lowp float;
precision highp sampler2DArray;

const float k_ambiantCoef = 0.1;
const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

uniform sampler2DArray u_textureArray;

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
  vec3 texColorX = texture( u_textureArray, vec3(texCoordX, 2) ).rgb;
  vec3 texColorY = texture( u_textureArray, vec3(texCoordY, 2) ).rgb;

  float specularRatioX = texture( u_textureArray, vec3(texCoordX, 3) ).r * blendWeights.x;
  float specularRatioY = texture( u_textureArray, vec3(texCoordY, 3) ).r * blendWeights.y;
  float specularRatio = max( specularRatioX, specularRatioY );

  // vertical color
  vec3 texColorZ = vec3(0.0);
  if (v_worldSpaceNormal.z < 0.0)
  {
    texColorZ = texture( u_textureArray, vec3(texCoordZ, 0) ).rgb;
  }
  else
  {
    texColorZ = texture( u_textureArray, vec3(texCoordZ, 1) ).rgb;
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

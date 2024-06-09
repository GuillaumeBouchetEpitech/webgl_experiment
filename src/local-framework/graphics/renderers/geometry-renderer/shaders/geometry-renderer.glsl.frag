
#version 300 es

precision lowp float;

uniform vec3 u_lightPos;

flat in vec4 v_color;
in vec3 v_worldSpacePosition;
in vec3 v_worldSpaceNormal;

out vec4 o_color;

//
//
//

const float k_ambiantCoef = 0.1;

const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

vec3 _getLightColor(vec4 currentColor)
{
  vec3 normal = normalize(v_worldSpaceNormal);
  vec3 lightDir = normalize(u_lightPos - v_worldSpacePosition);

  float diffuseCoef = max(dot(lightDir, v_worldSpaceNormal.xyz), 0.0);
  float specularCoef = 0.0;

  // if (diffuseCoef > 0.0 && v_skipSpecular < 0.5)
  // {
  //   // specular

  //   vec3 reflectDir = reflect(-lightDir, normal);
  //   vec3 viewDir = normalize(u_lightPos - v_worldSpacePosition);

  //   float specAngle = max(dot(reflectDir, viewDir), 0.0);
  //   specularCoef = pow(specAngle, 32.0);
  // }

  vec3 diffuseColor = currentColor.rgb * (k_ambiantCoef + diffuseCoef);
  vec3 specularColor = k_specColor * specularCoef * currentColor.a;

  return diffuseColor + specularColor;
}

//
//
//

void main(void)
{
  o_color = vec4(_getLightColor(v_color), 1.0);
}

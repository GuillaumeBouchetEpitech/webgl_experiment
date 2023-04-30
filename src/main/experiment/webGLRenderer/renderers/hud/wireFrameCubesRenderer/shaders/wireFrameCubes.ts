export const vertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3  a_vertex_position;

in vec3  a_offset_center;
in float a_offset_scale;
in vec3  a_offset_color;

flat out vec3 v_color;
out vec3 v_worldSpacePosition;

void main(void)
{
  vec3 position = a_offset_center + a_vertex_position * a_offset_scale;

  gl_Position = u_composedMatrix * vec4(position, 1.0);

  v_color = a_offset_color;
  v_worldSpacePosition = position;
}
`.trim();

export const fragment = `
#version 300 es

precision lowp float;

flat in vec3 v_color;
in vec3 v_worldSpacePosition;
in vec3 v_worldSpaceNormal;

layout(location = 0) out vec4 out_color;
layout(location = 1) out vec4 out_position;
layout(location = 2) out vec4 out_normal;

void main(void)
{
  out_color = vec4(v_color, 1.0);
  out_position = vec4(v_worldSpacePosition, 1.0);
  out_normal = vec4(0.0);
}

`.trim();

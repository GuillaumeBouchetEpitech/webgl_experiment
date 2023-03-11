const vertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3  a_vertex_position;

in vec3  a_offset_center;
in float a_offset_scale;
in vec3  a_offset_color;

flat out vec3 v_color;

void main(void)
{
  vec3 position = a_offset_center + a_vertex_position * a_offset_scale;

  gl_Position = u_composedMatrix * vec4(position, 1.0);

  v_color = a_offset_color;
}
`.trim();

const fragment = `
#version 300 es

precision lowp float;

flat in vec3 v_color;

out vec4 o_color;

void main(void)
{
  o_color = vec4(v_color, 1.0);
}

`.trim();

export { vertex, fragment };

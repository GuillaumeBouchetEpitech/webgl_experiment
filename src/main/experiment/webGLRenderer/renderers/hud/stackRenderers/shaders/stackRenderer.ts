const vertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3 a_vertex_position;
in vec4 a_vertex_color;

flat out vec4 v_color;

void main(void)
{
  gl_Position = u_composedMatrix * vec4(a_vertex_position, 1.0);

  v_color = a_vertex_color;
}
`.trim();

const fragment = `
#version 300 es

precision lowp float;

flat in vec4 v_color;

out vec4 o_color;

void main(void)
{
  o_color = v_color;
}

`.trim();

export { vertex, fragment };

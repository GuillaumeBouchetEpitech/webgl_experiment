
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3  a_vertex_position;
in vec2  a_vertex_texCoord;

out vec2 v_texCoord;

void main(void)
{
  v_texCoord = a_vertex_texCoord;
  gl_Position = u_composedMatrix * vec4(a_vertex_position, 1.0);
}


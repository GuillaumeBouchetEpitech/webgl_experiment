
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

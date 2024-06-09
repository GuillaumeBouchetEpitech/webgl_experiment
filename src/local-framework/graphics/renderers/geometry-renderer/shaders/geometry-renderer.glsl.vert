
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3 a_vertex_position;
in vec3 a_vertex_normal;

in vec3 a_offset_center;
in vec4 a_offset_orientation;
in vec3 a_offset_color;
in vec3 a_offset_scale;

flat out vec4 v_color;
out vec3 v_worldSpacePosition;
out vec3 v_worldSpaceNormal;


vec3 apply_quat_to_vec3(vec3 position, vec4 q)
{
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main(void)
{
	vec3 worldSpacePosition = a_offset_center + apply_quat_to_vec3(a_vertex_position * a_offset_scale, a_offset_orientation);
	vec3 worldSpaceNormal = apply_quat_to_vec3(a_vertex_normal, a_offset_orientation);

  gl_Position = u_composedMatrix * vec4(worldSpacePosition, 1.0);

  v_color = vec4(a_offset_color, 1.0);
  v_worldSpacePosition = worldSpacePosition;
  v_worldSpaceNormal = worldSpaceNormal;
}

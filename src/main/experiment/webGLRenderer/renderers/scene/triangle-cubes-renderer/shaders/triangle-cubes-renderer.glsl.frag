
#version 300 es

precision lowp float;

flat in vec4 v_color;

out vec4 out_color;

void main(void)
{
  out_color = v_color;
}

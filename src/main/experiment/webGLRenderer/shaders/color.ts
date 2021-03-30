
const vertex = `

attribute vec3 a_vertexPosition;
attribute vec3 a_vertexColor;

varying vec4 v_color;

uniform mat4 u_modelviewMatrix;
uniform mat4 u_projMatrix;

void main(void)
{
    v_color = vec4(a_vertexColor,1.0);

    gl_Position = u_projMatrix * u_modelviewMatrix * vec4(a_vertexPosition, 1.0);
}
`;

const fragment = `

precision mediump float;

varying vec4 v_color;

void main(void)
{
    gl_FragColor = v_color;
}
`;

export { vertex, fragment };

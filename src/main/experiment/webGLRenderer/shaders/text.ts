
const vertex = `

precision mediump float;

uniform mat4 u_modelviewMatrix;
uniform mat4 u_projectionMatrix;


attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec2 a_offsetPosition;
attribute vec2 a_offsetTexCoord;
attribute float a_offsetScale;

varying vec2 v_texCoord;

void main(void)
{
    vec2 position = a_position * a_offsetScale + a_offsetPosition;

    gl_Position = u_projectionMatrix * u_modelviewMatrix * vec4(position, 0.0, 1.0);

    v_texCoord = a_texCoord + a_offsetTexCoord;
}
`;

const fragment = `

precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;

void main(void)
{
    gl_FragColor = texture2D(u_texture, v_texCoord);
}

`;

export { vertex, fragment };

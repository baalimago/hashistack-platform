export const VertexShader = `
precision highp float;

attribute vec3 a_position;
varying vec4 v_color;

void main() {
    gl_Position = vec4(a_position, 1.);
    gl_PointSize = 1.2;

    v_color = vec4(a_position * 0.5 + 0.5, 1.);
}
`
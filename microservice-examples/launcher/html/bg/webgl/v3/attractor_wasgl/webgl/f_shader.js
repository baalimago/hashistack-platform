export const FragmentShader = `
precision highp float;

varying vec4 v_color;

void main() {
    float strength = 0.8;
    gl_FragColor = vec4(v_color.x * strength, v_color.y * strength, v_color.z * strength, 1.);
}
`
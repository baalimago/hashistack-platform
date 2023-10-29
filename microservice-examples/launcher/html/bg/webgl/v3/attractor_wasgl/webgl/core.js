import {
    VertexShader
} from "./v_shader.js";

import {
    FragmentShader
} from "./f_shader.js";


export class WebglCore {
    canvasReadyResolver;
    canvasReady = new Promise(r => {
        this.canvasReadyResolver = r;
    });
    shadersReadyResolver;
    shadersReady = new Promise(r => {
        this.shadersReadyResolver = r;
    });
    bufferReadyResolver;
    bufferReady = new Promise(r => {
        this.bufferReadyResolver = r;
    });

    configReadyResolver;
    configReady = new Promise(r => {
        this.configReadyResolver = r;
    });

    constructor() {
        this.initiateCanvas();
        this.initiateShaders();
    }

    isReady() {
        return new Promise(async resolve => {
            Promise.all([this.canvasReady, this.shadersReady, this.bufferReady, this.configReady])
            resolve();
        });
    }

    destroy() {

    }

    async updateConfig(conf) {
        this.conf = conf;
        this.configReadyResolver();
    }

    async bindSharedBuffer(sb) {
        await this.shadersReady;
        this.sharedBuffer = sb;
        await this.canvasReady;
        await this.shadersReady;
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.sharedBuffer.byteLength, this.gl.DYNAMIC_DRAW);
        const posAtrbLoc = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.vertexAttribPointer(posAtrbLoc, 3, this.gl.SHORT, true, 0, 0);
        this.gl.enableVertexAttribArray(posAtrbLoc);
        this.bufferReadyResolver();
    }

    async initiateShaders() {
        await this.canvasReady
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, VertexShader, "vertex");
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, FragmentShader, "fragment");

        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error('Unable to initiate webgl shaders. Breaking.');
        }
        this.program = shaderProgram;
        this.gl.useProgram(this.program);
        this.shadersReadyResolver();
    }

    render() {
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.sharedBuffer);
        this.gl.drawArrays(this.gl.POINTS, 0, this.conf.runtime.amParticles);
    }

    initiateCanvas() {
        const canvas = document.createElement('canvas');
        canvas.classList.add("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.getElementsByClassName("bg-container")[0].appendChild(canvas);

        this.gl = canvas.getContext("webgl");

        if (this.gl === null || this.gl === undefined) {
            throw new Error('Unable to initiate webgl context');
        }

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.canvasReadyResolver();
    }


    loadShader(type, source, typeStr) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const errStr = `Unable to compile shader of type: ${typeStr}. Error: ${this.gl.getShaderInfoLog(shader)}`;
            this.gl.deleteShader(shader);
            throw new Error(errStr);
        }

        return shader;
    }


}
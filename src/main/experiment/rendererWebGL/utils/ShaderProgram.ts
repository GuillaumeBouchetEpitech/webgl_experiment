
import WebGLContext from "../WebGLContext";

export interface IShaderProgramOpts {
    vs_src: string;
    fs_src: string;
    arr_attrib: string[];
    arr_uniform: string[];
};

class ShaderProgram {

    private _program: WebGLProgram | null;

    private _attributes = new Map<string, number>();
    private _uniforms = new Map<string, WebGLUniformLocation>();

    constructor(opt: IShaderProgramOpts) {

        const gl = WebGLContext.getContext();

        const vertexShader = this._getShader(opt.vs_src, gl.VERTEX_SHADER);
        const fragmentShader = this._getShader(opt.fs_src, gl.FRAGMENT_SHADER);

        //

        this._program = gl.createProgram();
        if (!this._program)
            throw new Error("could not create a shader program");

        gl.attachShader(this._program, vertexShader);
        gl.attachShader(this._program, fragmentShader);
        gl.linkProgram(this._program);

        if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {

            // An error occurred while linking
            const lastError = gl.getProgramInfoLog(this._program);

            throw new Error("Failed to initialised shaders, Error linking:" + lastError);
        }

        this._getAttribAndLocation(opt.arr_attrib, opt.arr_uniform);
    }

    bind() {
        const gl = WebGLContext.getContext();

        gl.useProgram(this._program);
    }

    static unbind() {
        const gl = WebGLContext.getContext();

        gl.useProgram(null);
    }

    hasAttribute(name: string) {
        return this._attributes.has(name);
    }

    getAttribute(name: string) {
        const attribute = this._attributes.get(name);
        if (attribute === undefined)
            throw new Error(`attribute not found: ${name}`);

        return attribute;
    }

    getUniform(name: string) {
        const uniform = this._uniforms.get(name);
        if (uniform === undefined)
            throw new Error(`uniform not found: ${name}`);

        return uniform;
    }

    private _getAttribAndLocation(arr_attrib: string[], arr_uniform: string[]) {

        const gl = WebGLContext.getContext();

        if (!this._program)
            throw new Error("shader program not initialised");

        gl.useProgram(this._program);

        for (let ii = 0; ii < arr_attrib.length; ++ii) {

            const value = gl.getAttribLocation(this._program, arr_attrib[ii]);

            if (value < 0)
                throw new Error(`attribute not found => ${arr_attrib[ii]}`);

            this._attributes.set(arr_attrib[ii], value);
        }

        for (let ii = 0; ii < arr_uniform.length; ++ii) {

            const value = gl.getUniformLocation(this._program, arr_uniform[ii]);

            if (value === null)
                throw new Error(`uniform not found => ${arr_uniform[ii]}`);

            this._uniforms.set(arr_uniform[ii], value);
        }

        gl.useProgram(null);
    }

    //

    private _getShader(src: string, type: number) {

        const gl = WebGLContext.getContext();

        const shader = gl.createShader(type);
        if (!shader)
            throw new Error("could not create a shader");

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

            let error_str = gl.getShaderInfoLog(shader);
            if (!error_str)
                error_str = "failed to compile a shader";

            throw new Error(error_str);
        }

        return shader;
    }
};

export default ShaderProgram;


import WebGLContext from "./WebGLContext";

export interface IShaderProgramOpts {
    vertexSrc: string;
    fragmentSrc: string;
    attributes: string[];
    uniforms: string[];
};

class ShaderProgram {

    private _program: WebGLProgram;

    private _attributes = new Map<string, number>();
    private _uniforms = new Map<string, WebGLUniformLocation>();

    constructor(opt: IShaderProgramOpts) {

        const gl = WebGLContext.getContext();

        const vertexShader = this._getShader(opt.vertexSrc, gl.VERTEX_SHADER);
        const fragmentShader = this._getShader(opt.fragmentSrc, gl.FRAGMENT_SHADER);

        //

        const program = gl.createProgram();
        if (!program)
            throw new Error("could not create a shader program");

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader); // free up now unused memory
        gl.deleteShader(fragmentShader); // free up now unused memory

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

            // An error occurred while linking
            const lastError = gl.getProgramInfoLog(program);

            throw new Error("Failed to initialised shaders, Error linking:" + lastError);
        }

        this._program = program;

        // this._getAttribAndLocation(opt.attributes, opt.uniforms);

        this.bind();

        this._getAttributes(opt.attributes);
        this._getUniforms(opt.uniforms);

        ShaderProgram.unbind();
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

    private _getAttributes(attributes: string[]) {

        const gl = WebGLContext.getContext();

        for (let ii = 0; ii < attributes.length; ++ii) {

            const value = gl.getAttribLocation(this._program, attributes[ii]);

            if (value < 0)
                throw new Error(`attribute not found => ${attributes[ii]}`);

            this._attributes.set(attributes[ii], value);
        }
    }

    private _getUniforms(uniforms: string[]) {

        const gl = WebGLContext.getContext();

        for (let ii = 0; ii < uniforms.length; ++ii) {

            const value = gl.getUniformLocation(this._program, uniforms[ii]);

            if (value === null)
                throw new Error(`uniform not found => ${uniforms[ii]}`);

            this._uniforms.set(uniforms[ii], value);
        }
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

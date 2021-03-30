
import WebGLContext from "./WebGLContext";
import ShaderProgram from "./ShaderProgram";

namespace GeometryWrapper {

    export const BytesPerPixel = 4; // float (float32 = 4 bytes)

    export enum AttributeType {
        float,
        vec2f,
        vec3f,
        vec4f,
        mat3f,
        mat4f
    };

    export enum PrimitiveType {
        lines,
        triangles,
    };

    export interface VboAttr {
        name: string;
        type: AttributeType;
        index: number;
    };

    export interface VboDefinition {
        attrs: VboAttr[];
        stride?: number;
        instanced: boolean;
    };

    export interface GeometryDefinition {
        vbos: VboDefinition[];
        primitiveType: PrimitiveType;
    };

    export class Geometry {

        private _def: GeometryDefinition;
        private _vao: WebGLVertexArrayObjectOES;
        private _vbos: WebGLBuffer[];
        private _primitiveType: number;
        private _primitiveStart: number = 0;
        private _primitiveCount: number = 0;
        private _instanceCount: number = 0;
        private _isInstanced: boolean = false;

        constructor(shader: ShaderProgram, def: GeometryDefinition) {

            // if (this._def)
            //     throw new Error("geometry already initialised");

            const gl = WebGLContext.getContext();

            if (def.vbos.length === 0)
                throw new Error("empty vbo defintion");

            for (const vbo of def.vbos) {

                if (vbo.attrs.length === 0)
                    throw new Error("empty vbo attribute defintion");

                for (const attr of vbo.attrs)
                    if (!shader.hasAttribute(attr.name))
                        throw new Error(`attribute not found, name="${attr.name}"`);
            }

            this._def = def;

            switch (def.primitiveType) {
                case PrimitiveType.lines:
                    this._primitiveType = gl.LINES;
                    break;
                case PrimitiveType.triangles:
                    this._primitiveType = gl.TRIANGLES;
                    break;
                default:
                    throw new Error("primitive type not found");
            }

            const vaoExtension = WebGLContext.getExtensionVaoStrict();
            const instancing_extension = WebGLContext.getExtensionInstancingStrict();

            const vao = vaoExtension.createVertexArrayOES();
            if (!vao)
                throw new Error("fail o create a vao unit");

            this._vao = vao;
            vaoExtension.bindVertexArrayOES(this._vao);

            //

            this._vbos = [];
            for (const vboDef of this._def.vbos) {

                const vbo = gl.createBuffer();
                if (!vbo)
                    throw new Error("fail o create a vbo unit");

                this._vbos.push(vbo);

                gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

                let stride = vboDef.stride || 0;
                if (!stride) {
                    // auto determine stride value
                    for (const attr of vboDef.attrs) {
                        switch (attr.type) {
                            case AttributeType.float: stride += 1; break;
                            case AttributeType.vec2f: stride += 2; break;
                            case AttributeType.vec3f: stride += 3; break;
                            case AttributeType.vec4f: stride += 4; break;
                            case AttributeType.mat3f: stride += 9; break;
                            case AttributeType.mat4f: stride += 16; break;
                        }
                    }
                    stride *= BytesPerPixel;
                }

                for (const attr of vboDef.attrs) {

                    let rowSize = 1;
                    let totalRows = 1;
                    switch (attr.type) {
                        case AttributeType.float: rowSize = 1; totalRows = 1; break;
                        case AttributeType.vec2f: rowSize = 2; totalRows = 1; break;
                        case AttributeType.vec3f: rowSize = 3; totalRows = 1; break;
                        case AttributeType.vec4f: rowSize = 4; totalRows = 1; break;
                        case AttributeType.mat3f: rowSize = 3; totalRows = 3; break;
                        case AttributeType.mat4f: rowSize = 4; totalRows = 4; break;
                    }

                    const attrLocation = shader.getAttribute(attr.name);

                    // TODO: check if the index is 0 on k>0 and assert/throw on it

                    for (let ii = 0; ii < totalRows; ++ii) {

                        const attrId = attrLocation + ii;
                        const rowIndex = (attr.index + ii * rowSize) * BytesPerPixel;

                        gl.enableVertexAttribArray(attrId);
                        gl.vertexAttribPointer(attrId, rowSize, gl.FLOAT, false, stride, rowIndex);

                        if (vboDef.instanced === true) {
                            instancing_extension.vertexAttribDivisorANGLE(attrId, 1)
                            this._isInstanced = true;
                        }
                    }
                }
            }

            //

            vaoExtension.bindVertexArrayOES(null);
        }

        dispose() {

            const gl = WebGLContext.getContext();
            const vaoExtension = WebGLContext.getExtensionVaoStrict();

            for (let ii = 0; ii < this._vbos.length; ++ii)
                gl.deleteBuffer(this._vbos[ii]);

            vaoExtension.deleteVertexArrayOES( this._vao );
        }

        updateBuffer(index: number, vertices: number[] | Float32Array, dynamic: boolean = false)  {

            if (index < 0 || index >= this._vbos.length)
                throw new Error("no buffer avaialble to tha index");

            const gl = WebGLContext.getContext();

            const vbo = this._vbos[index];
            const buffer = (vertices instanceof Float32Array) ? vertices : new Float32Array(vertices);
            const usage = (dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, buffer, usage);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        render() {

            if (this._primitiveCount == 0 || (this._isInstanced && this._instanceCount == 0))
                return;

            const gl = WebGLContext.getContext();

            const vaoExtension = WebGLContext.getExtensionVaoStrict();
            const instancing_extension = WebGLContext.getExtensionInstancingStrict();

            vaoExtension.bindVertexArrayOES(this._vao);

            if (this._isInstanced === true) {
                instancing_extension.drawArraysInstancedANGLE(this._primitiveType, this._primitiveStart, this._primitiveCount, this._instanceCount);
            }
            else {
                gl.drawArrays(this._primitiveType, this._primitiveStart, this._primitiveCount);
            }

            vaoExtension.bindVertexArrayOES(null);
        }

        setPrimitiveStart(start: number) {
            this._primitiveStart = start;
        }

        setPrimitiveCount(count: number) {
            this._primitiveCount = count;
        }

        setInstancedCount(count: number) {
            this._instanceCount = count;
        }
    };
};

export default GeometryWrapper

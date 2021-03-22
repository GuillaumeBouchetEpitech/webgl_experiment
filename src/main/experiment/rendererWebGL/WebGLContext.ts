
class WebGLContext {

    private static _gl: WebGLRenderingContext | null = null;
    private static _extension_vao: OES_vertex_array_object | null = null;
    private static _extension_lose_context: WEBGL_lose_context | null = null;
    private static _instancing_extension: ANGLE_instanced_arrays | null = null;
    private static _viewportSize = [ 0, 0 ];

    static initialise(canvas: HTMLCanvasElement) {

        WebGLContext._gl = canvas.getContext("webgl");

        if (!WebGLContext._gl)
            throw new Error("could not create webgl context");

        WebGLContext._extension_vao = (
            WebGLContext._gl.getExtension('OES_vertex_array_object') ||
            WebGLContext._gl.getExtension('MOZ_OES_vertex_array_object') ||
            WebGLContext._gl.getExtension('WEBKIT_OES_vertex_array_object')
        );
        WebGLContext._extension_lose_context = WebGLContext._gl.getExtension('WEBGL_lose_context');
        WebGLContext._instancing_extension = WebGLContext._gl.getExtension("ANGLE_instanced_arrays");

        WebGLContext._viewportSize[0] = canvas.clientWidth;
        WebGLContext._viewportSize[1] = canvas.clientHeight;
    }

    //
    //
    //

    static getContext() {
        if (!WebGLContext._gl)
            throw new Error("webgl context not initialised");
        return WebGLContext._gl;
    }

    //
    //
    //

    static getExtensionVao() {
        return WebGLContext._extension_vao;
    }

    static getExtensionLoseContext() {
        return WebGLContext._extension_lose_context;
    }

    static getExtensionInstancing() {
        return WebGLContext._instancing_extension;
    }

    //
    //
    //

    static getExtensionVaoStrict() {

        if (!WebGLContext._extension_vao)
            throw new Error("vao extension not available");

        return WebGLContext._extension_vao;
    }

    static getExtensionLoseContextStrict() {

        if (!WebGLContext._extension_lose_context)
            throw new Error("lose context extension not available");

        return WebGLContext._extension_lose_context;
    }

    static getExtensionInstancingStrict() {

        if (!WebGLContext._instancing_extension)
            throw new Error("instancing extension not available");

        return WebGLContext._instancing_extension;
    }

    //
    //
    //

    static getViewportSize() {
        return WebGLContext._viewportSize;
    }
};

export default WebGLContext;

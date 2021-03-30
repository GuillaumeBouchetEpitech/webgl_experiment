
class WebGLContext {

    private static _gl: WebGLRenderingContext | null = null;
    private static _extensionVAO: OES_vertex_array_object | null = null;
    private static _extensionLoseContext: WEBGL_lose_context | null = null;
    private static _extensionInstancing: ANGLE_instanced_arrays | null = null;
    private static _viewportSize = [ 0, 0 ];

    static initialise(canvas: HTMLCanvasElement) {

        const renderingContextAttribs: WebGLContextAttributes = {
            // Boolean that indicates if the canvas contains an alpha buffer.
            alpha: true,

            // Boolean that indicates whether or not to perform anti-aliasing.
            antialias: false,

            // Boolean that indicates that the drawing buffer has a depth
            // buffer of at least 16 bits.
            depth: true,

            // Boolean that indicates if a context will be created if the
            // system performance is low.
            failIfMajorPerformanceCaveat: false,

            // A hint to the user agent indicating what configuration of GPU is
            // suitable for the WebGL context. Possible values are:
            // "default":
            //     Let the user agent decide which GPU configuration is most
            //     suitable. This is the default value.
            // "high-performance":
            //     Prioritizes rendering performance over power consumption.
            // "low-power":
            //     Prioritizes power saving over rendering performance.
            powerPreference: "high-performance",

            // Boolean that indicates that the page compositor will assume the
            // drawing buffer contains colors with pre-multiplied alpha.
            premultipliedAlpha: true,

            // If the value is true the buffers will not be cleared and will
            // preserve their values until cleared or overwritten by the author.
            preserveDrawingBuffer: true,

            // Boolean that indicates that the drawing buffer has a
            // stencil buffer of at least 8 bits.
            stencil: false,
        };

        WebGLContext._gl = canvas.getContext("webgl", renderingContextAttribs);

        if (!WebGLContext._gl)
            throw new Error("could not create webgl context");

        WebGLContext._extensionVAO = (
            WebGLContext._gl.getExtension('OES_vertex_array_object') ||
            WebGLContext._gl.getExtension('MOZ_OES_vertex_array_object') ||
            WebGLContext._gl.getExtension('WEBKIT_OES_vertex_array_object')
        );
        WebGLContext._extensionLoseContext = WebGLContext._gl.getExtension('WEBGL_lose_context');
        WebGLContext._extensionInstancing = WebGLContext._gl.getExtension("ANGLE_instanced_arrays");

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
        return WebGLContext._extensionVAO;
    }

    static getExtensionLoseContext() {
        return WebGLContext._extensionLoseContext;
    }

    static getExtensionInstancing() {
        return WebGLContext._extensionInstancing;
    }

    //
    //
    //

    static getExtensionVaoStrict() {

        if (!WebGLContext._extensionVAO)
            throw new Error("vao extension not available");

        return WebGLContext._extensionVAO;
    }

    static getExtensionLoseContextStrict() {

        if (!WebGLContext._extensionLoseContext)
            throw new Error("lose context extension not available");

        return WebGLContext._extensionLoseContext;
    }

    static getExtensionInstancingStrict() {

        if (!WebGLContext._extensionInstancing)
            throw new Error("instancing extension not available");

        return WebGLContext._extensionInstancing;
    }

    //
    //
    //

    static getViewportSize() {
        return WebGLContext._viewportSize;
    }
};

export default WebGLContext;

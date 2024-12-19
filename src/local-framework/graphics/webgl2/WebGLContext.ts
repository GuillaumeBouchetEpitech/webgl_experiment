export class WebGLContext {
  private static _gl: WebGL2RenderingContext | null = null;
  private static _extensionLoseContext: WEBGL_lose_context | null = null;

  static initialize(canvas: HTMLCanvasElement) {
    const renderingContextAttribs: WebGLContextAttributes = {
      // Boolean that indicates if the canvas contains an alpha buffer.
      alpha: false,

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
      powerPreference: 'high-performance',

      // Boolean that indicates that the page compositor will assume the
      // drawing buffer contains colors with pre-multiplied alpha.
      premultipliedAlpha: true, // slower framerate when false

      // If the value is true the buffers will not be cleared and will
      // preserve their values until cleared or overwritten by the author.
      preserveDrawingBuffer: true,

      desynchronized: true,

      // Boolean that indicates that the drawing buffer has a
      // stencil buffer of at least 8 bits.
      stencil: false
    };

    WebGLContext._gl = canvas.getContext('webgl2', renderingContextAttribs);

    if (!WebGLContext._gl) throw new Error('could not create webgl context');

    WebGLContext._extensionLoseContext =
      WebGLContext._gl.getExtension('WEBGL_lose_context');

    WebGLContext._gl.getExtension('EXT_color_buffer_float');
    WebGLContext._gl.getExtension('EXT_float_blend');
  }

  //
  //
  //

  static getContext() {
    if (!WebGLContext._gl) {
      throw new Error('webgl context not initialized');
    }
    return WebGLContext._gl;
  }

  //
  //
  //

  static getExtensionLoseContext() {
    return WebGLContext._extensionLoseContext;
  }

  static getExtensionLoseContextStrict() {
    if (!WebGLContext._extensionLoseContext) {
      throw new Error('lose context extension not available');
    }

    return WebGLContext._extensionLoseContext;
  }
}

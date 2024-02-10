import { WebGLContext } from './WebGLContext';

export const checkError = () => {
  const gl = WebGLContext.getContext();
  const errorId = gl.getError();

  switch (errorId) {
    // GL_NO_ERROR
    //   No error has been recorded. The value of this symbolic constant is guaranteed to be 0.
    case gl.INVALID_ENUM:
      throw new Error(
        'gl.INVALID_ENUM\nAn unacceptable value is specified for an enumerated argument. The offending command is ignored and has no other side effect than to set the error flag.'
      );
    case gl.INVALID_VALUE:
      throw new Error(
        'gl.INVALID_VALUE\nA numeric argument is out of range. The offending command is ignored and has no other side effect than to set the error flag.'
      );
    case gl.INVALID_OPERATION:
      throw new Error(
        'gl.INVALID_OPERATION\nThe specified operation is not allowed in the current state. The offending command is ignored and has no other side effect than to set the error flag.'
      );
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      throw new Error(
        'gl.INVALID_FRAMEBUFFER_OPERATION\nThe framebuffer object is not complete. The offending command is ignored and has no other side effect than to set the error flag.'
      );
    case gl.OUT_OF_MEMORY:
      throw new Error(
        'gl.OUT_OF_MEMORY\nThere is not enough memory left to execute the command. The state of the GL is undefined, except for the state of the error flags, after this error is recorded.'
      );
    case gl.CONTEXT_LOST_WEBGL:
      throw new Error(
        'gl.CONTEXT_LOST_WEBGL\n If the WebGL context is lost, this error is returned on the first call to getError. Afterwards and until the context has been restored, it returns gl.NO_ERROR.'
      );
    // case gl.STACK_UNDERFLOW:
    //   throw new Error("An attempt has been made to perform an operation that would cause an internal stack to underflow.")
    // case gl.STACK_OVERFLOW:
    //   throw new Error("An attempt has been made to perform an operation that would cause an internal stack to overflow.")
  }
};

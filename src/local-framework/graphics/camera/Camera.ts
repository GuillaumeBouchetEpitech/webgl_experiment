import * as glm from 'gl-matrix';

import { degreeToRad } from '../../system/math/angles';

enum ProjectionType {
  perspective = 0,
  orthogonal = 1
}

interface IPerspectiveDataOpts {
  fovy: number;
  aspectRatio?: number;
  near: number;
  far: number;
}

type IPerspectiveData = Required<IPerspectiveDataOpts>;

interface IOrthogonalData {
  left: number;
  right: number;
  top: number;
  bottom: number;
  near: number;
  far: number;
}

export interface ICamera {
  getEye(): glm.ReadonlyVec3;
  getTarget(): glm.ReadonlyVec3;
  getUpAxis(): glm.ReadonlyVec3;

  getProjectionMatrix(): glm.ReadonlyMat4;
  getViewMatrix(): glm.ReadonlyMat4;
  getComposedMatrix(): glm.ReadonlyMat4;

  getPerspectiveData(): Readonly<IPerspectiveData | undefined>;
  getOrthogonalData(): Readonly<IOrthogonalData | undefined>;
}

export class Camera implements ICamera {
  private _projectionType = ProjectionType.perspective;
  private _perspectiveData?: IPerspectiveData;
  private _orthogonalData?: IOrthogonalData;

  private _viewportPos = glm.vec2.fromValues(0, 0);
  private _viewportSize = glm.vec2.fromValues(0, 0);

  private _projectionMatrix = glm.mat4.create();
  private _viewMatrix = glm.mat4.create();
  private _composedMatrix = glm.mat4.create();

  private _eye = glm.vec3.fromValues(0, 0, 0);
  private _target = glm.vec3.fromValues(0, 0, 0);
  private _upAxis = glm.vec3.fromValues(0, 0, 0);

  //

  setAsPerspective(inData: IPerspectiveDataOpts) {
    this._projectionType = ProjectionType.perspective;

    let aspectRatio = inData.aspectRatio;
    if (aspectRatio === undefined) {
      aspectRatio = this._viewportSize[0] / this._viewportSize[1];
    }

    this._perspectiveData = {
      fovy: inData.fovy,
      aspectRatio,
      near: inData.near,
      far: inData.far
    };
  }

  setAsOrthogonal(inData: IOrthogonalData) {
    this._projectionType = ProjectionType.orthogonal;
    this._orthogonalData = { ...inData };
  }

  //

  setViewportPos(width: number, height: number) {
    this._viewportPos[0] = width;
    this._viewportPos[1] = height;
  }

  getViewportPos(): glm.ReadonlyVec2 {
    return this._viewportPos;
  }

  //

  setViewportSize(width: number, height: number) {
    this._viewportSize[0] = width;
    this._viewportSize[1] = height;

    if (
      this._projectionType !== ProjectionType.perspective &&
      this._perspectiveData
    ) {
      this._perspectiveData.aspectRatio =
        this._viewportSize[0] / this._viewportSize[1];
    }
  }

  getViewportSize(): glm.ReadonlyVec2 {
    return this._viewportSize;
  }

  //

  lookAt(
    inEye: glm.ReadonlyVec3,
    inTarget: glm.ReadonlyVec3,
    inUpAxis: glm.ReadonlyVec3
  ) {
    this.setEye(inEye);
    this.setTarget(inTarget);
    this.setUpAxis(inUpAxis);
  }

  //

  setEye(inEye: glm.ReadonlyVec3) {
    glm.vec3.copy(this._eye, inEye);
  }
  setTarget(inTarget: glm.ReadonlyVec3) {
    glm.vec3.copy(this._target, inTarget);
  }
  setUpAxis(inUpAxis: glm.ReadonlyVec3) {
    glm.vec3.copy(this._upAxis, inUpAxis);
  }

  getEye(): glm.ReadonlyVec3 {
    return this._eye;
  }
  getTarget(): glm.ReadonlyVec3 {
    return this._target;
  }
  getUpAxis(): glm.ReadonlyVec3 {
    return this._upAxis;
  }

  //

  computeMatrices() {
    if (this._projectionType === ProjectionType.perspective) {
      const { fovy, aspectRatio, near, far } = this._perspectiveData!;
      glm.mat4.perspective(
        this._projectionMatrix,
        degreeToRad(fovy),
        aspectRatio!,
        near,
        far
      );
    } else if (this._projectionType === ProjectionType.orthogonal) {
      const { left, right, top, bottom, near, far } = this._orthogonalData!;
      glm.mat4.ortho(
        this._projectionMatrix,
        left,
        right,
        top,
        bottom,
        near,
        far
      );
    }

    glm.mat4.lookAt(this._viewMatrix, this._eye, this._target, this._upAxis);

    this.computeComposedMatrix();
  }

  computeComposedMatrix() {
    glm.mat4.multiply(
      this._composedMatrix,
      this._projectionMatrix,
      this._viewMatrix
    );
  }

  setProjectionMatrix(inMat4: glm.ReadonlyMat4) {
    glm.mat4.copy(this._projectionMatrix, inMat4);
  }
  setViewMatrix(inMat4: glm.ReadonlyMat4) {
    glm.mat4.copy(this._viewMatrix, inMat4);
  }
  setComposedMatrix(inMat4: glm.ReadonlyMat4) {
    glm.mat4.copy(this._composedMatrix, inMat4);
  }

  getProjectionMatrix(): glm.ReadonlyMat4 {
    return this._projectionMatrix;
  }
  getViewMatrix(): glm.ReadonlyMat4 {
    return this._viewMatrix;
  }
  getComposedMatrix(): glm.ReadonlyMat4 {
    return this._composedMatrix;
  }

  //

  getPerspectiveData(): Readonly<IPerspectiveData | undefined> {
    if (this._projectionType !== ProjectionType.perspective) {
      throw new Error('not a perspective projection');
    }
    return this._perspectiveData;
  }
  getOrthogonalData(): Readonly<IOrthogonalData | undefined> {
    if (this._projectionType !== ProjectionType.orthogonal) {
      throw new Error('not an orthogonal projection');
    }
    return this._orthogonalData;
  }
}

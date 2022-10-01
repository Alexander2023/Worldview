import { Vector3 } from "three";
import { withTimeout, isWithinCameraView } from "./utils";

jest.useFakeTimers();

describe('withTimeout()', () => {
  test('calls success callback when executed in time', () => {
    const handleSuccess = jest.fn();
    const handleTimeout = jest.fn();

    const fn = withTimeout(handleSuccess, handleTimeout);
    fn();

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    expect(handleTimeout).not.toHaveBeenCalled();
  });

  test('calls timeout callback when not executed in time', () => {
    const handleSuccess = jest.fn();
    const handleTimeout = jest.fn();

    withTimeout(handleSuccess, handleTimeout);

    jest.runAllTimers()

    expect(handleSuccess).not.toHaveBeenCalled();
    expect(handleTimeout).toHaveBeenCalledTimes(1);
  });

  test('adds passed in args to success callback', () => {
    const handleSuccess = jest.fn();
    const handleTimeout = jest.fn();

    const arg1 = 10;
    const arg2 = 'hello';

    const fn = withTimeout(handleSuccess, handleTimeout);
    fn(arg1, arg2);

    expect(handleSuccess).toHaveBeenCalledWith(arg1, arg2);
  });
});

describe('isWithinCameraView()', () => {
  test('returns true when position is directly in front of camera when ' +
      'rotation=0, where rotation is towards the negative z-axis', () => {
    const cameraPosition = new Vector3(0, 0, 1);
    const cameraYRotation = 0;
    const positionToCheck = new Vector3(0, 0, -1);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(true);
  });

  test('returns true when position is directly in front of camera when ' +
      'rotation=PI/2, where rotation is towards the negative x-axis', () => {
    const cameraPosition = new Vector3(1, 0, 0);
    const cameraYRotation = Math.PI / 2;
    const positionToCheck = new Vector3(-1, 0, 0);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(true);
  });

  test('returns true when position is directly in front of camera when ' +
      'rotation=PI, where rotation is towards the positive z-axis', () => {
    const cameraPosition = new Vector3(0, 0, -1);
    const cameraYRotation = Math.PI;
    const positionToCheck = new Vector3(0, 0, 1);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(true);
  });

  test('returns true when position is directly in front of camera when' +
      'rotation=3*PI/2, where rotation is towards the positive x-axis', () => {
    const cameraPosition = new Vector3(-1, 0, 0);
    const cameraYRotation = 3 * Math.PI / 2;
    const positionToCheck = new Vector3(1, 0, 0);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(true);
  });

  test('returns false when position is directly behind camera', () => {
    const cameraPosition = new Vector3(0, 0, -1);
    const cameraYRotation = 0;
    const positionToCheck = new Vector3(0, 0, 1);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(false);
  });

  test('returns false when position is perpendicular to camera', () => {
    const cameraPosition = new Vector3(1, 0, 0);
    const cameraYRotation = 0;
    const positionToCheck = new Vector3(-1, 0, 0);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(false);
  });

  test('returns false when position is the same as the camera', () => {
    const cameraPosition = new Vector3(0, 0, 0);
    const cameraYRotation = 0;
    const positionToCheck = new Vector3(0, 0, 0);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(false);
  });

  test('returns true when position is directly in front of camera when ' +
      'rotation=-PI, where rotation is negative', () => {
    const cameraPosition = new Vector3(0, 0, -1);
    const cameraYRotation = -Math.PI;
    const positionToCheck = new Vector3(0, 0, 1);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(true);
  });

  test('returns true when position is directly in front of camera when ' +
      'rotation=3PI, where rotation is > 2PI', () => {
    const cameraPosition = new Vector3(0, 0, -1);
    const cameraYRotation = 3 * Math.PI;
    const positionToCheck = new Vector3(0, 0, 1);

    const res = isWithinCameraView(cameraPosition, cameraYRotation,
        positionToCheck);

    expect(res).toBe(true);
  });
});

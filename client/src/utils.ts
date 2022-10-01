import { Vector3 } from "three";

/**
 * Wrapper for socket callbacks to ensure client side
 * is handled even when server fails to respond
 *
 * @param onSuccess callback that executes when server successfully responds
 * @param onTimeout callback that executes when server fails to respond
 */
const withTimeout = (onSuccess: Function, onTimeout: () => void) => {
  const ACKNOWLEDGMENT_TIMEOUT = 5000;
  let called = false;

  const timer = setTimeout(() => {
    if (called) return;
    called = true;
    onTimeout();
  }, ACKNOWLEDGMENT_TIMEOUT);

  return (...args: any[]) => {
    if (called) return;
    called = true;
    clearTimeout(timer);
    onSuccess.apply(this, args);
  }
}

/**
 * Determines whether a position is within view of a camera.
 * To be within view, a position must be at some non-zero
 * positive offset from the camera and within a fisheye lens fov
 *
 * @param cameraYRotation rotation in radians
 * @returns true if within view, false otherwise
 */
const isWithinCameraView = (cameraPosition: Vector3, cameraYRotation: number,
    positionToCheck: Vector3) => {
  const xPositionDiff = cameraPosition.x - positionToCheck.x;
  const zPositionDiff = cameraPosition.z - positionToCheck.z;

  if (xPositionDiff === 0 && zPositionDiff === 0) {
    return false;
  }

  // returns angle in radians between 0 and 2PI, inclusive
  // matches three.js frame of reference for y-rotation
  const positionDifferenceAngle =
      Math.atan2(xPositionDiff, zPositionDiff) + Math.PI;
  const angleDifference =
      Math.abs(cameraYRotation - positionDifferenceAngle) % (2 * Math.PI);

  return angleDifference > Math.PI / 2 && angleDifference < 3 * Math.PI / 2;
};

export { withTimeout, isWithinCameraView };

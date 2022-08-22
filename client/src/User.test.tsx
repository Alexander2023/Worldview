import ReactThreeTestRenderer from '@react-three/test-renderer'
import * as THREE from 'three';
import { User } from './User';

let boundaryBoxes = new Map<number, THREE.Box3>();
let eventMap = new Map<string, EventListenerOrEventListenerObject>();

const dispatchKeyboardEvent = async (type: string, key: string) => {
  await ReactThreeTestRenderer.act(async () => {
    const callback = eventMap.get(type);
    if (callback && (typeof callback !== 'object')) {
      callback(new KeyboardEvent(type, {'key': key}));
    }
  });
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    emit: jest.fn()
  }))
}));

beforeEach(() => {
  document.addEventListener = jest.fn((event, callback) => {
    eventMap.set(event, callback);
  });
});

afterEach(() => {
  boundaryBoxes.clear();
  eventMap.clear();
});

test('moves forward when up arrow pressed', async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <User boundaryBoxes={boundaryBoxes} />
  );

  const oldZPos = renderer.scene.children[0].instance.position.z;

  await dispatchKeyboardEvent('keydown', 'ArrowUp');

  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(50, 0.02);
  });

  const newZPos = renderer.scene.children[0].instance.position.z;
  expect(newZPos).toBeLessThan(oldZPos);
});

test('moves backward when down arrow pressed', async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <User boundaryBoxes={boundaryBoxes} />
  );

  const oldZPos = renderer.scene.children[0].instance.position.z;

  await dispatchKeyboardEvent('keydown', 'ArrowDown');

  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(50, 0.02);
  });

  const newZPos = renderer.scene.children[0].instance.position.z;
  expect(newZPos).toBeGreaterThan(oldZPos);
});

test('moves counterclockwise when left arrow pressed', async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <User boundaryBoxes={boundaryBoxes} />
  );

  const oldYRot = renderer.scene.children[0].instance.rotation.y;

  await dispatchKeyboardEvent('keydown', 'ArrowLeft');

  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(50, 0.02);
  });

  const newYRot = renderer.scene.children[0].instance.rotation.y;
  expect(newYRot).toBeGreaterThan(oldYRot);
});

test('moves clockwise when right arrow pressed', async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <User boundaryBoxes={boundaryBoxes} />
  );

  const oldYRot = renderer.scene.children[0].instance.rotation.y;

  await dispatchKeyboardEvent('keydown', 'ArrowRight');

  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(50, 0.02);
  });

  const newYRot = renderer.scene.children[0].instance.rotation.y;
  expect(newYRot).toBeLessThan(oldYRot);
});

test('stops when colliding with an object', async () => {
  const boundaryBox = new THREE.Box3();
  // Sets the boundary an arbitrary amount in front of the user
  boundaryBox.setFromCenterAndSize(new THREE.Vector3(0, 0.5, -10),
      new THREE.Vector3(1, 1, 1));
  boundaryBoxes.set(0, boundaryBox);

  const renderer = await ReactThreeTestRenderer.create(
    <User boundaryBoxes={boundaryBoxes} />
  );

  await dispatchKeyboardEvent('keydown', 'ArrowUp');

  // Moves user forward until colliding with boundary
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(50, 0.02);
  });

  const oldZPos = renderer.scene.children[0].instance.position.z;

  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(50, 0.02);
  });

  const newZPos = renderer.scene.children[0].instance.position.z;
  expect(newZPos).toBe(oldZPos);
});

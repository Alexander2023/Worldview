import ReactThreeTestRenderer from '@react-three/test-renderer';

import { RoomState } from '../../shared/types';
import { socket, SocketContext } from './context/socket';
import { Room } from './Room';

const roomState: RoomState = {
  "frameWidth": 100,
  "frameHeight": 20,
  "frameDepth": 100,
  "panels": []
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn()
  }))
}));

jest.mock('@react-three/fiber', () => {
  const originalModule = jest.requireActual('@react-three/fiber');

  return {
    ...originalModule,
    useLoader: () => [null, null]
  }
})

test('renders non-null room when server sends room state', async () => {
  const roomProps = {handleAddBoundaryBox: jest.fn(),
    handleRemoveBoundaryBox: jest.fn(),
    isControlPanelOpen: false,
    setIsControlPanelOpen: jest.fn()};

  const renderer = await ReactThreeTestRenderer.create(
    <SocketContext.Provider value={socket} >
      <Room {...roomProps} />
    </SocketContext.Provider>
  );

  expect(renderer.scene.children.length).toBe(0);

  await ReactThreeTestRenderer.act(async () => {
    const roomCallback = (socket.on as jest.Mock).mock.calls[0][1];
    roomCallback(roomState);
  });

  expect(renderer.scene.children.length).toBe(1);
});

test('opens control panel when within clickable distance', async () => {
  const roomProps = {handleAddBoundaryBox: jest.fn(),
      handleRemoveBoundaryBox: jest.fn(),
      isControlPanelOpen: false,
      setIsControlPanelOpen: jest.fn()};

  const renderer = await ReactThreeTestRenderer.create(
    <SocketContext.Provider value={socket} >
      <Room {...roomProps} />
    </SocketContext.Provider>
  );

  await ReactThreeTestRenderer.act(async () => {
    const roomCallback = (socket.on as jest.Mock).mock.calls[0][1];
    roomCallback(roomState);
  });

  const backWall = renderer.scene.children[0].children[0].children[0];
  const wallDist = 10;
  const eventData = {
    ray: {
      origin: {
        x: 0,
        y: roomState.frameHeight / 2,
        z: wallDist - roomState.frameDepth / 2
      }
    },
    point: {
      x: 0,
      y: roomState.frameHeight / 2,
      z: -roomState.frameDepth / 2
    }
  }
  await ReactThreeTestRenderer.act(async () => {
    await renderer.fireEvent(backWall, 'onClick', eventData);
  });

  expect(roomProps.setIsControlPanelOpen).toHaveBeenCalledWith(true);
});

test('keeps control panel closed when outside clickable distance',
    async () => {
  const roomProps = {handleAddBoundaryBox: jest.fn(),
      handleRemoveBoundaryBox: jest.fn(),
      isControlPanelOpen: false,
      setIsControlPanelOpen: jest.fn()};

  const renderer = await ReactThreeTestRenderer.create(
    <SocketContext.Provider value={socket} >
      <Room {...roomProps} />
    </SocketContext.Provider>
  );

  await ReactThreeTestRenderer.act(async () => {
    const roomCallback = (socket.on as jest.Mock).mock.calls[0][1];
    roomCallback(roomState);
  });

  const backWall = renderer.scene.children[0].children[0].children[0];
  const wallDist = 30;
  const eventData = {
    ray: {
      origin: {
        x: 0,
        y: roomState.frameHeight / 2,
        z: wallDist - roomState.frameDepth / 2
      }
    },
    point: {
      x: 0,
      y: roomState.frameHeight / 2,
      z: -roomState.frameDepth / 2
    }
  }
  await ReactThreeTestRenderer.act(async () => {
    await renderer.fireEvent(backWall, 'onClick', eventData);
  });

  expect(roomProps.setIsControlPanelOpen).not.toHaveBeenCalled();
});

test('opens control panel when exceeds clickable distance with y dimension, ' +
    'but is within when ignored', async () => {
  const roomProps = {handleAddBoundaryBox: jest.fn(),
      handleRemoveBoundaryBox: jest.fn(),
      isControlPanelOpen: false,
      setIsControlPanelOpen: jest.fn()};

  const renderer = await ReactThreeTestRenderer.create(
    <SocketContext.Provider value={socket} >
      <Room {...roomProps} />
    </SocketContext.Provider>
  );

  await ReactThreeTestRenderer.act(async () => {
    const roomCallback = (socket.on as jest.Mock).mock.calls[0][1];
    roomCallback(roomState);
  });

  const backWall = renderer.scene.children[0].children[0].children[0];
  const wallDist = 20;
  const eventData = {
    ray: {
      origin: {
        x: 0,
        y: roomState.frameHeight / 2,
        z: wallDist - roomState.frameDepth / 2
      }
    },
    point: {
      x: 0,
      y: roomState.frameHeight,
      z: -roomState.frameDepth / 2
    }
  }
  await ReactThreeTestRenderer.act(async () => {
    await renderer.fireEvent(backWall, 'onClick', eventData);
  });

  expect(roomProps.setIsControlPanelOpen).toHaveBeenCalledWith(true);
});

import { ThreeEvent, useLoader } from "@react-three/fiber";
import { useContext, useEffect, useState } from "react";
import { TextureLoader, Vector2 } from "three";

import { RoomState } from '../../shared/types';
import { SocketContext } from "./context/socket";
import concreteImg from './images/concrete.jpg';
import marbleImg from './images/marble.jpg';
import { Panel } from "./Panel";
import { HandleAddBoundaryBox, HandleRemoveBoundaryBox } from "./types";
import { Wall } from "./Wall";

/*
 * Max acceptable distance between a click's origin and destination
 * when ignoring the y dimension of the points
 */
const MAX_SCREEN_PLACEMENT_CLICK_DIST = 20;

interface RoomProps {
  handleAddBoundaryBox: HandleAddBoundaryBox;
  handleRemoveBoundaryBox: HandleRemoveBoundaryBox;
  isControlPanelOpen: boolean;
  setIsControlPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Generates a rectangular room populated with panels
 *
 * @returns A room populated with panels
 */
function Room(props: RoomProps) {
  const {isControlPanelOpen, setIsControlPanelOpen,
      ...otherProps} = props;

  const socket = useContext(SocketContext);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  const handleScreenPlacementClick = (event: ThreeEvent<MouseEvent>) => {
    const xzOrigin = new Vector2(event.ray.origin.x, event.ray.origin.z);
    const xzDestination = new Vector2(event.point.x, event.point.z);

    // ignores y dimension to allow for maximal vertical space usage
    if (xzOrigin.distanceTo(xzDestination) <= MAX_SCREEN_PLACEMENT_CLICK_DIST &&
        !isControlPanelOpen) {
      setIsControlPanelOpen(true);
    }

    event.stopPropagation();
  };

  useEffect(() => {
    socket.on('receiveRoom', (serverRoomState) => {
      setRoomState(serverRoomState);
    });

    socket.emit('joinRoom');
  }, [socket]);

  if (!roomState) {
    return null;
  }

  return (
    <group>
      <Frame
        roomState={roomState}
        handleScreenPlacementClick={handleScreenPlacementClick}
        {...otherProps}
      />
      {roomState.panels.map(panelData => (
        <Panel
          key={panelData.position.join()}
          panelData={panelData}
          handleScreenPlacementClick={handleScreenPlacementClick}
          {...otherProps}
        />
      ))}
      <ambientLight intensity={0.3} />
      <directionalLight intensity={1.5} position-y={roomState.frameHeight} />
      <pointLight intensity={0.5} position-y={roomState.frameHeight} />
    </group>
  )
}

interface FrameProps {
  handleAddBoundaryBox: HandleAddBoundaryBox;
  handleRemoveBoundaryBox: HandleRemoveBoundaryBox;
  handleScreenPlacementClick: (event: ThreeEvent<MouseEvent>) => void;
  roomState: RoomState;
}

/**
 * Generates a rectangular frame of the room containing a floor, ceiling,
 * and walls on all four sides
 *
 * @returns A frame of the room
 */
function Frame({handleScreenPlacementClick, roomState, ...props}: FrameProps) {
  const [concreteTexture, marbleTexture] = useLoader(TextureLoader, [
    concreteImg,
    marbleImg
  ]);

  return (
    <group>
      <Wall
        handleScreenPlacementClick={handleScreenPlacementClick}
        texture={concreteTexture}
        position={[0, roomState.frameHeight / 2, -roomState.frameDepth / 2]}
        yRotation={0}
        scale={[roomState.frameWidth, roomState.frameHeight]}
        {...props}
      />
      <Wall
        handleScreenPlacementClick={handleScreenPlacementClick}
        texture={concreteTexture}
        position={[-roomState.frameWidth / 2, roomState.frameHeight / 2, 0]}
        yRotation={Math.PI / 2}
        scale={[roomState.frameDepth, roomState.frameHeight]}
        {...props}
      />
      <Wall
        handleScreenPlacementClick={handleScreenPlacementClick}
        texture={concreteTexture}
        position={[0, roomState.frameHeight / 2, roomState.frameDepth / 2]}
        yRotation={Math.PI}
        scale={[roomState.frameWidth, roomState.frameHeight]}
        {...props}
      />
      <Wall
        handleScreenPlacementClick={handleScreenPlacementClick}
        texture={concreteTexture}
        position={[roomState.frameWidth / 2, roomState.frameHeight / 2, 0]}
        yRotation={-Math.PI / 2}
        scale={[roomState.frameDepth, roomState.frameHeight]}
        {...props}
      />
      <mesh position={[0, roomState.frameHeight, 0]} rotation-x={Math.PI / 2} >
        <planeGeometry args={[roomState.frameWidth, roomState.frameDepth]} />
        <meshStandardMaterial map={concreteTexture} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} >
        <planeGeometry args={[roomState.frameWidth, roomState.frameDepth]} />
        <meshBasicMaterial map={marbleTexture} />
      </mesh>
    </group>
  )
}

export { Room };

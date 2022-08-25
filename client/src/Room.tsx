import { ThreeEvent, useLoader } from "@react-three/fiber";
import { useContext, useEffect, useState } from "react";
import { TextureLoader, Vector2 } from "three";

import { RoomState } from '../../shared/types';
import { BoundaryBox } from "./BoundaryBox";
import { SocketContext } from "./context/socket";
import concreteImg from './images/concrete.jpg';
import marbleImg from './images/marble.jpg';
import { HandleAddBoundaryBox, HandleRemoveBoundaryBox } from "./types";

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
      {roomState.panels.map(panel => (
        <BoundaryBox key={panel.position.join()} {...otherProps} >
          <mesh
            position={[panel.position[0], panel.position[1],
                panel.position[2]]}
            rotation-y={panel.yRotation * (Math.PI / 180)}
            onClick={handleScreenPlacementClick}
          >
            <boxBufferGeometry
              args={[panel.dimensions[0], panel.dimensions[1],
                  panel.dimensions[2]]}
            />
            <meshStandardMaterial />
          </mesh>
        </BoundaryBox>
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
      <BoundaryBox {...props} >
        <mesh
          position={[0, roomState.frameHeight / 2, -roomState.frameDepth / 2]}
          onClick={handleScreenPlacementClick}
        >
          <planeBufferGeometry
            args={[roomState.frameWidth, roomState.frameHeight]}
          />
          <meshStandardMaterial map={concreteTexture} />
        </mesh>
      </BoundaryBox>
      <BoundaryBox {...props} >
        <mesh
          position={[-roomState.frameWidth / 2, roomState.frameHeight / 2, 0]}
          rotation-y={Math.PI / 2}
          onClick={handleScreenPlacementClick}
        >
          <planeBufferGeometry
            args={[roomState.frameDepth, roomState.frameHeight]}
          />
          <meshStandardMaterial map={concreteTexture} />
        </mesh>
      </BoundaryBox>
      <BoundaryBox {...props} >
        <mesh
          position={[0, roomState.frameHeight / 2, roomState.frameDepth / 2]}
          rotation-y={Math.PI}
          onClick={handleScreenPlacementClick}
        >
          <planeBufferGeometry
            args={[roomState.frameWidth, roomState.frameHeight]}
          />
          <meshStandardMaterial map={concreteTexture} />
        </mesh>
      </BoundaryBox>
      <BoundaryBox {...props} >
        <mesh
          position={[roomState.frameWidth / 2, roomState.frameHeight / 2, 0]}
          rotation-y={-Math.PI / 2}
          onClick={handleScreenPlacementClick}
        >
          <planeBufferGeometry
            args={[roomState.frameDepth, roomState.frameHeight]}
          />
          <meshStandardMaterial map={concreteTexture} />
        </mesh>
      </BoundaryBox>
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

import { useLoader } from "@react-three/fiber";
import { Texture, TextureLoader } from "three";

import roomState from './RoomState.json';
import concreteImg from './images/concrete.jpg';
import marbleImg from './images/marble.jpg';

/**
 * Generates a rectangular room populated with panels
 *
 * @returns A room populated with panels
 */
function Room(): JSX.Element {
  return (
    <group>
      <Frame/>
      {roomState.panels.map(panel => (
        <mesh key={panel.position.join()}
              position={[panel.position[0], panel.position[1], panel.position[2]]}
              rotation-y={panel.yRotation * (Math.PI / 180)} >
          <boxBufferGeometry args={[panel.dimensions[0], panel.dimensions[1],
                                   panel.dimensions[2]]} />
          <meshStandardMaterial/>
        </mesh>
      ))}
      <ambientLight intensity={0.3} />
      <directionalLight intensity={1.5} position-y={roomState.frameHeight} />
      <pointLight intensity={0.5} position-y={roomState.frameHeight} />
    </group>
  )
}

/**
 * Generates a rectangular frame of the room containing a floor, ceiling,
 * and walls on all four sides
 *
 * @returns A frame of the room
 */
function Frame(): JSX.Element {
  const [concreteMap, marbleMap]: Texture[] = useLoader(TextureLoader, [
    concreteImg,
    marbleImg
  ]);

  return (
    <group>
      <mesh position={[0, roomState.frameHeight / 2, -roomState.frameDepth / 2]} >
        <planeBufferGeometry args={[roomState.frameWidth, roomState.frameHeight]} />
        <meshStandardMaterial map={concreteMap} />
      </mesh>
      <mesh position={[-roomState.frameWidth / 2, roomState.frameHeight / 2, 0]}
            rotation-y={Math.PI / 2} >
        <planeBufferGeometry args={[roomState.frameDepth, roomState.frameHeight]} />
        <meshStandardMaterial map={concreteMap} />
      </mesh>
      <mesh position={[0, roomState.frameHeight / 2, roomState.frameDepth / 2]}
            rotation-y={Math.PI} >
        <planeBufferGeometry args={[roomState.frameWidth, roomState.frameHeight]} />
        <meshStandardMaterial map={concreteMap} />
      </mesh>
      <mesh position={[roomState.frameWidth / 2, roomState.frameHeight / 2, 0]}
            rotation-y={-Math.PI / 2} >
        <planeBufferGeometry args={[roomState.frameDepth, roomState.frameHeight]} />
        <meshStandardMaterial map={concreteMap} />
      </mesh>
      <mesh position={[0, roomState.frameHeight, 0]} rotation-x={Math.PI / 2} >
        <planeGeometry args={[roomState.frameWidth, roomState.frameDepth]} />
        <meshStandardMaterial map={concreteMap} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} >
        <planeGeometry args={[roomState.frameWidth, roomState.frameDepth]} />
        <meshBasicMaterial map={marbleMap} />
      </mesh>
    </group>
  )
}

export default Room;

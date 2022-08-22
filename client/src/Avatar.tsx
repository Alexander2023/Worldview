const CUBE_SIZE = 2;

interface AvatarProps {
  position: number[],
  yRotation: number;
}

/**
 * Generates a representation of a user's presence in the world
 */
function Avatar({position, yRotation}: AvatarProps) {
  return (
    <mesh
      position={[position[0], CUBE_SIZE / 2, position[2]]}
      rotation-y={yRotation}
    >
      <boxBufferGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial />
    </mesh>
  )
}

export { Avatar, CUBE_SIZE };

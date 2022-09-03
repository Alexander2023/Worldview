import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { Screen as ScreenType } from "../../shared/types";

interface ScreenProps {
  screenData: ScreenType;
}

/**
 * Generates a screen to display user media
 */
function Screen(props: ScreenProps) {
  const {screenData: {dataUrl, position, yRotation, dimensions}} = props;

  const imageTexture = useLoader(TextureLoader, dataUrl);

  return (
    <mesh
      position={[position[0], position[1], position[2]]}
      rotation-y={yRotation}
    >
      <planeBufferGeometry args={[dimensions[0], dimensions[1]]} />
      <meshStandardMaterial map={imageTexture} />
    </mesh>
  )
}

export { Screen };

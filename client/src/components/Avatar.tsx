import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { BackSide, BufferGeometry, Material, Mesh, sRGBEncoding, Vector3 } from "three";

import { UserMedia } from "../types";
import { isWithinCameraView } from "../utils/utils";

const CUBE_SIZE = 2;
const DIRECTIONAL_MARKER_VERTICES =
    new Float32Array([-0.5, 0, 1, 0.5, 0, 1, 0, 0, -1]);
const MAX_MEDIA_VISIBLE_DISTANCE = 20;

interface AvatarProps {
  position: number[],
  yRotation: number;
  userMedia: UserMedia | undefined;
  pauseMedia: (isProducer: boolean, serverCarrierId: string) => void;
  resumeMedia: (isProducer: boolean, serverCarrierId: string) => void;
}

/**
 * Generates a representation of a user's presence in the world
 */
function Avatar(props: AvatarProps) {
  const {position, yRotation, userMedia, pauseMedia, resumeMedia} = props;

  const videoElement = useRef(document.createElement('video'));
  const audioElement = useRef(document.createElement('audio'));
  const screenRef = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const directionalMarkerRef =
      useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const didAvatarMove = useRef(false);
  const cameraPosition = useRef<Vector3 | null>(null);
  const cameraYRotation = useRef<number | null>(null);

  const pauseUserMedia = () => {
    if (!userMedia) {
      return;
    }

    if (userMedia.video) {
      pauseMedia(false, userMedia.video.serverCarrierId);
    }

    if (userMedia.audio) {
      pauseMedia(false, userMedia.audio.serverCarrierId);
    }
  };

  const resumeUserMedia = () => {
    if (!userMedia) {
      return;
    }

    if (userMedia.video) {
      resumeMedia(false, userMedia.video.serverCarrierId);
    }

    if (userMedia.audio) {
      resumeMedia(false, userMedia.audio.serverCarrierId);
    }
  };

  useEffect(() => {
    if (!userMedia) {
      return;
    }

    if (userMedia.video) {
      videoElement.current.autoplay = true;
      videoElement.current.srcObject = userMedia.video.stream;
    }

    if (userMedia.audio) {
      audioElement.current.autoplay = true;
      audioElement.current.srcObject = userMedia.audio.stream;
    }
  }, [userMedia]);

  // used for deep comparison of position
  const positionString = JSON.stringify(position);

  useEffect(() => {
    didAvatarMove.current = true;
  }, [positionString, yRotation]);

  useFrame((state) => {
    if (!didAvatarMove.current &&
        cameraPosition.current?.equals(state.camera.position) &&
        cameraYRotation.current === state.camera.rotation.y) {
      return;
    }

    didAvatarMove.current = false;

    if (!cameraPosition.current) {
      cameraPosition.current = new Vector3();
    }

    cameraPosition.current.copy(state.camera.position);
    cameraYRotation.current = state.camera.rotation.y;

    if (!screenRef.current || !directionalMarkerRef.current) {
      return;
    }

    const distanceToCamera =
        screenRef.current.position.distanceTo(state.camera.position);

    if (distanceToCamera > MAX_MEDIA_VISIBLE_DISTANCE) {
      pauseUserMedia();
      screenRef.current.visible = false;
      directionalMarkerRef.current.visible = false;
      return;
    }

    const isAvatarWithinUserCameraView =
        isWithinCameraView(state.camera.position, state.camera.rotation.y,
            screenRef.current.position);
    const isUserWithinAvatarCameraView =
        isWithinCameraView(screenRef.current.position,
            screenRef.current.rotation.y, state.camera.position);

    if (isAvatarWithinUserCameraView && isUserWithinAvatarCameraView) {
      resumeUserMedia();
      screenRef.current.visible = true;
      directionalMarkerRef.current.visible = false;
      return;
    }

    if (userMedia?.video) {
      pauseMedia(false, userMedia.video.serverCarrierId);
    }

    if (userMedia?.audio) {
      resumeMedia(false, userMedia.audio.serverCarrierId);
    }

    screenRef.current.visible = false;
    directionalMarkerRef.current.visible = true;
  });

  return (
    <>
      <mesh
        position={[position[0], CUBE_SIZE / 2, position[2]]}
        rotation-y={yRotation}
      >
        <boxBufferGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial />
      </mesh>
      <mesh
        ref={screenRef}
        position={[position[0], 6, position[2]]}
        rotation-y={yRotation}
      >
        <planeBufferGeometry args={[8, 6]} />
        <meshBasicMaterial side={BackSide} >
          <videoTexture
            attach="map"
            args={[videoElement.current]}
            encoding={sRGBEncoding}
          />
        </meshBasicMaterial>
      </mesh>
      <mesh
        ref={directionalMarkerRef}
        position={[position[0], 10, position[2]]}
        rotation-y={yRotation}
        visible={false}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={DIRECTIONAL_MARKER_VERTICES}
            itemSize={3}
            count={3}
          />
        </bufferGeometry>
        <meshBasicMaterial color="blue" side={BackSide} />
      </mesh>
    </>
  )
}

export { Avatar, CUBE_SIZE };

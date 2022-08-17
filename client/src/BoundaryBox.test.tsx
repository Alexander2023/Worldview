import ReactThreeTestRenderer from '@react-three/test-renderer'
import { BoundaryBox } from './BoundaryBox';

test('calls handlers when mounting and unmounting', async () => {
  const props = {handleAddBoundaryBox: jest.fn(),
      handleRemoveBoundaryBox: jest.fn()};

  const renderer = await ReactThreeTestRenderer.create(
    <BoundaryBox {...props} >
      <mesh>
        <boxBufferGeometry/>
        <meshStandardMaterial/>
      </mesh>
    </BoundaryBox>
  );

  expect(props.handleAddBoundaryBox.mock.calls.length).toBe(1);
  expect(props.handleAddBoundaryBox.mock.calls[0][1]).not.toBeNull();

  await ReactThreeTestRenderer.act(async () => {
    await renderer.unmount();
  });

  expect(props.handleRemoveBoundaryBox.mock.calls.length).toBe(1);
});

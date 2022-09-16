import { withTimeout } from "./utils";

jest.useFakeTimers();

test('calls success callback when executed in time', () => {
  const handleSuccess = jest.fn();
  const handleTimeout = jest.fn();

  const fn = withTimeout(handleSuccess, handleTimeout);
  fn();

  expect(handleSuccess).toHaveBeenCalledTimes(1);
  expect(handleTimeout).not.toHaveBeenCalled();
});

test('calls timeout callback when not executed in time', () => {
  const handleSuccess = jest.fn();
  const handleTimeout = jest.fn();

  withTimeout(handleSuccess, handleTimeout);

  jest.runAllTimers()

  expect(handleSuccess).not.toHaveBeenCalled();
  expect(handleTimeout).toHaveBeenCalledTimes(1);
});

test('adds passed in args to success callback', () => {
  const handleSuccess = jest.fn();
  const handleTimeout = jest.fn();

  const arg1 = 10;
  const arg2 = 'hello';

  const fn = withTimeout(handleSuccess, handleTimeout);
  fn(arg1, arg2);

  expect(handleSuccess).toHaveBeenCalledWith(arg1, arg2);
});

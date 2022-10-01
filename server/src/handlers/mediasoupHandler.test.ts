import { Socket } from "socket.io";
import { WebRtcTransport as WebRtcTransportType, Producer as ProducerType, Consumer as ConsumerType, DtlsParameters, RtpParameters, RtpCapabilities} from "mediasoup/node/lib/types";
import { Worker } from "mediasoup/node/lib/Worker";
import { WebRtcServer } from "mediasoup/node/lib/WebRtcServer";
import { Router } from "mediasoup/node/lib/Router";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransport";
import { Consumer } from "mediasoup/node/lib/Consumer";
import { Producer } from "mediasoup/node/lib/Producer";

import { mediasoupHandler } from "./mediasoupHandler";
import { MediasoupState, MediasoupIds } from "../types";
import { ClientToServerEvents, ServerToClientEvents } from "../../../shared/types";

const WEB_RTC_TRANSPORT_ID = '0';

const mockGetterProp = <T extends {}, K extends keyof T>(object: T, property: K,
    value: T[K]) => {
  Object.defineProperty(object, property, { get: () => value });
};

const createMockedSocketInstance = (id: string) => {
  // Constructor args don't matter since Socket is mocked
  // @ts-ignore
  const socket = new Socket<ClientToServerEvents, ServerToClientEvents>();
  mockGetterProp(socket, 'id', id);
  return socket;
};

const createMockedProducerInstance = (id: string) => {
  // Constructor args don't matter since Producer is mocked
  // @ts-ignore
  const producer = new Producer();
  mockGetterProp(producer, 'id', id);
  return producer;
};

const createMockedConsumerInstance = (id: string) => {
  // Constructor args don't matter since Consumer is mocked
  // @ts-ignore
  const consumer = new Consumer();
  mockGetterProp(consumer, 'id', id);
  return consumer;
};

jest.mock('socket.io');
jest.mock('mediasoup/node/lib/Worker');
jest.mock('mediasoup/node/lib/WebRtcServer');
jest.mock('mediasoup/node/lib/Router');
jest.mock('mediasoup/node/lib/WebRtcTransport');
jest.mock('mediasoup/node/lib/Producer');
jest.mock('mediasoup/node/lib/Consumer');

const worker = jest.mocked(Worker);
const webRtcServer = jest.mocked(WebRtcServer);
const router = jest.mocked(Router);
const webRtcTransport = jest.mocked(WebRtcTransport);
mockGetterProp(webRtcTransport.prototype, 'id', WEB_RTC_TRANSPORT_ID);

const sockets = new Set<Socket<ClientToServerEvents, ServerToClientEvents>>();
const mediasoupState: MediasoupState = {
  worker: worker.prototype,
  webRtcServer: webRtcServer.prototype,
  router: router.prototype,
  producerTransports: new Map<string, WebRtcTransportType>(),
  consumerTransports: new Map<string, WebRtcTransportType>(),
  producers: new Map<string, ProducerType>(),
  consumers: new Map<string, ConsumerType>()
};
const socketIdToMediasoupIds = new Map<string, MediasoupIds>();

beforeEach(() => {
  jest.clearAllMocks();
  sockets.clear();
  mediasoupState.producerTransports.clear();
  mediasoupState.consumerTransports.clear();
  mediasoupState.producers.clear();
  mediasoupState.consumers.clear();
  socketIdToMediasoupIds.clear();
});

describe('handleGetTransportOptions()', () => {
  test('calls the callback with the appropriate transport', async () => {
    mediasoupState.producerTransports.set(WEB_RTC_TRANSPORT_ID,
        webRtcTransport.prototype);

    const mediasoupIds: MediasoupIds = {
      producerTransportId: WEB_RTC_TRANSPORT_ID,
      consumerTransportId: '',
      producerIds: [],
      consumerIds: []
    }
    const callback = jest.fn();

    const { handleGetTransportOptions } =
        mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    await handleGetTransportOptions(mediasoupIds, true, callback);

    expect(callback).toBeCalledTimes(1);

    const callbackArg = callback.mock.calls[0][0];
    expect(callbackArg.id).toBe(WEB_RTC_TRANSPORT_ID);
  });
});

describe('handleTransportConnect()', () => {
  test('calls the callback', async () => {
    mediasoupState.producerTransports.set(WEB_RTC_TRANSPORT_ID,
        webRtcTransport.prototype);

    const callback = jest.fn();

    const { handleTransportConnect } =
        mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    await handleTransportConnect(true, WEB_RTC_TRANSPORT_ID,
        {} as DtlsParameters, callback);

    expect(callback).toBeCalledTimes(1);
  });
});

describe('handleTransportProduce()', () => {
  test('calls the callback with the appropriate producer id', async () => {
    const producerId = '1';
    const socketId = '2';

    const producer = createMockedProducerInstance(producerId);
    webRtcTransport.prototype.produce.mockResolvedValueOnce(producer);
    mediasoupState.producerTransports.set(WEB_RTC_TRANSPORT_ID,
        webRtcTransport.prototype);

    const mediasoupIds: MediasoupIds = {
      producerTransportId: WEB_RTC_TRANSPORT_ID,
      consumerTransportId: '',
      producerIds: [],
      consumerIds: []
    }
    const callback = jest.fn();

    const { handleTransportProduce } =
        mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    await handleTransportProduce(socketId, mediasoupIds, WEB_RTC_TRANSPORT_ID,
        'video', {} as RtpParameters, callback);

    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith(producerId);
  });

  test('updates the mediasoup state + ids with the new producer', async () => {
    const producerId = '1';
    const socketId = '2';

    const producer = createMockedProducerInstance(producerId);
    webRtcTransport.prototype.produce.mockResolvedValueOnce(producer);
    mediasoupState.producerTransports.set(WEB_RTC_TRANSPORT_ID,
        webRtcTransport.prototype);

    const mediasoupIds: MediasoupIds = {
      producerTransportId: WEB_RTC_TRANSPORT_ID,
      consumerTransportId: '',
      producerIds: [],
      consumerIds: []
    }
    const callback = jest.fn();

    const { handleTransportProduce } =
        mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    expect(mediasoupState.producers.size).toBe(0);
    expect(mediasoupIds.producerIds.length).toBe(0);

    await handleTransportProduce(socketId, mediasoupIds, WEB_RTC_TRANSPORT_ID,
        'video', {} as RtpParameters, callback);

    expect(mediasoupState.producers.size).toBe(1);
    expect(mediasoupIds.producerIds.length).toBe(1);

    expect(mediasoupIds.producerIds.includes(producerId)).toBe(true);
    expect(mediasoupState.producers.get(producerId)).toBeTruthy();
  });

  test('notifies producers with updated producer ids', async () => {
    const socketOneId = '1';
    const socketTwoId = '2';
    const socketThreeId = '3';
    const producerOneId = '4';
    const producerTwoId = '5';
    const producerThreeId = '6';

    const socketOne = createMockedSocketInstance(socketOneId);
    const socketTwo = createMockedSocketInstance(socketTwoId);
    const socketThree = createMockedSocketInstance(socketThreeId);

    sockets.add(socketOne);
    sockets.add(socketTwo);
    sockets.add(socketThree);

    const producer = createMockedProducerInstance(producerThreeId);
    webRtcTransport.prototype.produce.mockResolvedValueOnce(producer);
    mediasoupState.producerTransports.set(WEB_RTC_TRANSPORT_ID,
        webRtcTransport.prototype);

    mediasoupState.producers.set(producerOneId,
        createMockedProducerInstance(producerOneId));
    mediasoupState.producers.set(producerTwoId,
        createMockedProducerInstance(producerTwoId));

    socketIdToMediasoupIds.set(socketOneId, {
      producerTransportId: WEB_RTC_TRANSPORT_ID,
      consumerTransportId: '',
      producerIds: [producerOneId],
      consumerIds: []
    });

    socketIdToMediasoupIds.set(socketTwoId, {
      producerTransportId: WEB_RTC_TRANSPORT_ID,
      consumerTransportId: '',
      producerIds: [producerTwoId],
      consumerIds: []
    });

    const mediasoupIds: MediasoupIds = {
      producerTransportId: WEB_RTC_TRANSPORT_ID,
      consumerTransportId: '',
      producerIds: [],
      consumerIds: []
    }

    socketIdToMediasoupIds.set(socketThreeId, mediasoupIds);

    const callback = jest.fn();

    const { handleTransportProduce } =
        mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    await handleTransportProduce(socketThreeId, mediasoupIds,
        WEB_RTC_TRANSPORT_ID, 'video', {} as RtpParameters, callback);

    expect(socketOne.emit).toBeCalledTimes(1);
    expect(socketTwo.emit).toBeCalledTimes(1);
    expect(socketThree.emit).toBeCalledTimes(1);

    const socketOneEmitArg = (socketOne.emit as jest.Mock).mock.calls[0][1];
    expect(socketOneEmitArg.includes(producerOneId)).toBe(false);
    expect(socketOneEmitArg.includes(producerTwoId)).toBe(true);
    expect(socketOneEmitArg.includes(producerThreeId)).toBe(true);

    const socketTwoEmitArg = (socketTwo.emit as jest.Mock).mock.calls[0][1];
    expect(socketTwoEmitArg.includes(producerOneId)).toBe(true);
    expect(socketTwoEmitArg.includes(producerTwoId)).toBe(false);
    expect(socketTwoEmitArg.includes(producerThreeId)).toBe(true);

    const socketThreeEmitArg = (socketThree.emit as jest.Mock).mock.calls[0][1];
    expect(socketThreeEmitArg.includes(producerOneId)).toBe(true);
    expect(socketThreeEmitArg.includes(producerTwoId)).toBe(true);
    expect(socketThreeEmitArg.includes(producerThreeId)).toBe(false);
  });
});

describe('handleTransportConsume()', () => {
  test('calls the callback with a consumer', async () => {
    const socketId = '1';
    const consumerId = '2';
    const producerId = '3';

    const consumer = createMockedConsumerInstance(consumerId);
    const producer = createMockedProducerInstance(producerId);
    mockGetterProp(producer, 'appData', {socketId: socketId});

    router.prototype.canConsume.mockImplementationOnce(() => true);

    webRtcTransport.prototype.consume.mockResolvedValueOnce(consumer);
    mediasoupState.consumerTransports.set(WEB_RTC_TRANSPORT_ID,
        webRtcTransport.prototype);
    mediasoupState.producers.set(producerId, producer);

    const mediasoupIds: MediasoupIds = {
      producerTransportId: '',
      consumerTransportId: WEB_RTC_TRANSPORT_ID,
      producerIds: [],
      consumerIds: []
    }
    const callback = jest.fn();

    const { handleTransportConsume } =
        mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    await handleTransportConsume(createMockedSocketInstance(socketId),
        mediasoupIds, producerId, {} as RtpCapabilities, callback);

    expect(callback).toBeCalledTimes(1);

    const callbackArg = callback.mock.calls[0][0];
    expect(callbackArg.id).toBe(consumerId);
  });

  test('updates the mediasoup state + ids with the new consumer', async () => {
    const socketId = '1';
    const consumerId = '2';
    const producerId = '3';

    const consumer = createMockedConsumerInstance(consumerId);
    const producer = createMockedProducerInstance(producerId);
    mockGetterProp(producer, 'appData', {socketId: socketId});

    router.prototype.canConsume.mockImplementationOnce(() => true);

    webRtcTransport.prototype.consume.mockResolvedValueOnce(consumer);
    mediasoupState.consumerTransports.set(WEB_RTC_TRANSPORT_ID,
        webRtcTransport.prototype);
    mediasoupState.producers.set(producerId, producer);

    const mediasoupIds: MediasoupIds = {
      producerTransportId: '',
      consumerTransportId: WEB_RTC_TRANSPORT_ID,
      producerIds: [],
      consumerIds: []
    }
    const callback = jest.fn();

    const { handleTransportConsume } =
        mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    expect(mediasoupState.consumers.size).toBe(0);
    expect(mediasoupIds.consumerIds.length).toBe(0);

    await handleTransportConsume(createMockedSocketInstance(socketId),
        mediasoupIds, producerId, {} as RtpCapabilities, callback);

    expect(mediasoupState.consumers.size).toBe(1);
    expect(mediasoupIds.consumerIds.length).toBe(1);

    expect(mediasoupIds.consumerIds.includes(consumerId)).toBe(true);
    expect(mediasoupState.consumers.get(consumerId)).toBeTruthy();
  });
});

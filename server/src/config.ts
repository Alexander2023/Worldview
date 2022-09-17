import { RouterOptions } from "mediasoup/node/lib/Router";
import { WebRtcServerOptions } from "mediasoup/node/lib/WebRtcServer";
import { ServerOptions } from "socket.io";

const socketServerConfig: Partial<ServerOptions> = {
  cors: {origin: '*'},
  maxHttpBufferSize: 5e6 // 5 MB
}

const webRtcServerConfig: WebRtcServerOptions = {
  listenInfos: [
    {
      protocol: 'udp',
      ip: '::',
      announcedIp: '127.0.0.1',
      port: 3002
    }
  ]
};

const routerConfig: RouterOptions = {
  mediaCodecs: [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      parameters: {
        'x-google-start-bitrate': 1000,
      },
    },
    {
      kind       : 'video',
      mimeType   : 'video/VP9',
      clockRate  : 90000,
      parameters :
      {
        'profile-id'             : 2,
        'x-google-start-bitrate' : 1000
      }
    },
    {
      kind       : 'video',
      mimeType   : 'video/h264',
      clockRate  : 90000,
      parameters :
      {
        'packetization-mode'      : 1,
        'profile-level-id'        : '4d0032',
        'level-asymmetry-allowed' : 1,
        'x-google-start-bitrate'  : 1000
      }
    },
    {
      kind       : 'video',
      mimeType   : 'video/h264',
      clockRate  : 90000,
      parameters :
      {
        'packetization-mode'      : 1,
        'profile-level-id'        : '42e01f',
        'level-asymmetry-allowed' : 1,
        'x-google-start-bitrate'  : 1000
      }
    }
  ]
};

export { socketServerConfig, webRtcServerConfig, routerConfig };
import {setupDeepgram} from "./transcriber.js";
import {EmitEnums, SubscriptionEnums} from "./constants.js";

/**
 * Events to subscribe to:
 * - connection: Triggered when a client connects to the server.
 * - configure-stream: Requires an object with a 'sampleRate' property.
 * - incoming-audio: Requires audio data as the parameter.
 * - stop-stream: Triggered when the client requests to stop the transcription stream.
 * - disconnect: Triggered when a client disconnects from the server.
 *
 *
 * Events to emit:
 * - transcriber-ready: Emitted when the transcriber is ready.
 * - final: Emits the final transcription result (string).
 * - partial: Emits the partial transcription result (string).
 * - error: Emitted when an error occurs.
 */

const initializeWebSocket = (io) => {
  io.on(SubscriptionEnums.CONNECTION, (socket) => {
    let transcriber = null;
    console.log(`connection made (${socket.id})`);

    socket.on(SubscriptionEnums.CREATE_CHANNEL, async (data) => {
      console.log('create channel called --->', data)
      socket.join(data.id);
    });

    socket.on(SubscriptionEnums.INCOMING_AUDIO, (audio) => {
      console.log("ws: client data received in socket");
      console.log("transcriber state", transcriber?.getReadyState());

      if (transcriber?.getReadyState() === 1 /* OPEN */) {
        console.log("ws: data sent to deepgram");
        // transcriber?.send(audio);
      } else if (transcriber?.getReadyState() >= 2 /* 2 = CLOSING, 3 = CLOSED */) {
        console.log("ws: data couldn't be sent to deepgram");
        console.log("ws: retrying connection to deepgram");
        /* Attempt to reopen the Deepgram connection */
        transcriber?.finish();
        transcriber?.removeAllListeners();
        transcriber = setupDeepgram(socket);
      } else {
        console.log("ws: data couldn't be sent to deepgram");
      }
    });

    // ... add needed event handlers and logic
    socket.on(SubscriptionEnums.CONFIGURE_STREAM, (data) => {
      console.log(`configure-stream--->`, data);
      transcriber = setupDeepgram(socket, data.sampleRate);
      io.to(data.id).emit(EmitEnums.TRANSCRIBER_READY, { message: "Transcriber is ready" });
    });

    socket.on(SubscriptionEnums.MESSAGE, (data) => {
      console.log(`MESSAGE--->`, data);
    });

    socket.on(SubscriptionEnums.DISCONNECT, (data) => {
      console.log("socket: client disconnected");
      transcriber?.finish();
      transcriber?.removeAllListeners();
      transcriber = null;

    });
  });

  return io;
};

export default initializeWebSocket;

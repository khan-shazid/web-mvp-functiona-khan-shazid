import Transcriber from "./transcriber.js";
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
let transcriber = new Transcriber();

const initializeWebSocket = (io) => {
  io.on(SubscriptionEnums.CONNECTION, (socket) => {
    console.log(`connection made (${socket.id})`);

    socket.on(SubscriptionEnums.INCOMING_AUDIO, (audio) => {
      console.log("ws: client data received in socket");
      transcriber.send(audio);
    });

    // ... add needed event handlers and logic
    socket.on(SubscriptionEnums.CONFIGURE_STREAM, (data) => {
      console.log(`configure-stream--->`, data);
      transcriber.startTranscriptionStream(socket, data.sampleRate);
      socket.emit(EmitEnums.TRANSCRIBER_READY, { message: "Transcriber is ready" });
    });

    socket.on(SubscriptionEnums.STOP_STREAM, () => {
      transcriber.endTranscriptionStream();
    });

    socket.on(SubscriptionEnums.TRANSCRIBER_DISCONNECT, () => {
      socket.emit();
    });

    socket.on(SubscriptionEnums.DISCONNECT, () => {
      console.log("socket: client disconnected");
      transcriber?.endTranscriptionStream();
    });
  });

  return io;
};

export default initializeWebSocket;

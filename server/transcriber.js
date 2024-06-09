import EventEmitter from "events";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import {EmitEnums} from "./constants.js";

class Transcriber extends EventEmitter {
    client = null;
    transcriber = null;
    keepAlive;

  constructor() {
      super();
      this.client = createClient(process.env.DEEPGRAM_API_KEY);
      this.transcriber = null;
  }

  // sampleRate: number
  startTranscriptionStream(socket, sampleRate) {
    // example deepgram configuration
    /*
    {
      model: "nova-2",
      punctuate: true,
      language: "en",
      interim_results: true,
      diarize: false,
      smart_format: true,
      endpointing: 0,
      encoding: "linear16",
      sample_rate: sampleRate,
    }
      */
      this.transcriber = this.client.listen.live({
          model: "nova-2",
          punctuate: true,
          language: "en",
          interim_results: true,
          diarize: false,
          smart_format: true,
          endpointing: 0,
          encoding: "linear16",
          sample_rate: sampleRate,
      });

      if (this.keepAlive) clearInterval(this.keepAlive);
      this.keepAlive = setInterval(() => {
          console.log("deepgram: keepalive");
          this.transcriber.keepAlive();
      }, 10 * 1000);

      this.transcriber.addListener(LiveTranscriptionEvents.Open, async () => {
          console.log("deepgram: connected");

          this.transcriber.addListener(LiveTranscriptionEvents.Close, async () => {
              console.log("deepgram: disconnected");
              this.endTranscriptionStream();
          });

          this.transcriber.addListener(LiveTranscriptionEvents.Error, async (error) => {
              console.log("deepgram: error recieved");
              console.error(error);
          });

          this.transcriber.addListener(LiveTranscriptionEvents.Warning, async (warning) => {
              console.log("deepgram: warning recieved");
              console.warn(warning);
          });

          this.transcriber.addListener(LiveTranscriptionEvents.Transcript, (data) => {
              console.log("deepgram: Transcript packet received");
              console.log("deepgram: transcript received", data);
              if (data?.type === "Results") {
                  const emitType = data?.is_final ? EmitEnums.FINAL : EmitEnums.PARTIAL;
                  const transcript = data?.channel?.alternatives[0].transcript ?? "";
                  socket.emit(emitType, transcript);
              }
          });
      });

  }

  endTranscriptionStream() {
      // this.transcriber?.finish();
      this.transcriber = null;
      if (this.keepAlive) clearInterval(this.keepAlive);
  }

  // NOTE: deepgram must be ready before sending audio payload or it will close the connection
  send(payload) {
      if (this.transcriber?.getReadyState() === 1) {
          this.transcriber.send(payload);
      }
  }
  // ... feel free to add more functions
}

export default Transcriber;
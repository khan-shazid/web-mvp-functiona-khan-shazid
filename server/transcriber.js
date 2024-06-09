// import EventEmitter from "events";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
//
// class Transcriber extends EventEmitter {
//   client = null;
//
//   constructor() {
//     super();
//     this.client = createClient(process.env.DEEPGRAM_API_KEY);
//   }
//
//   // sampleRate: number
//   startTranscriptionStream(sampleRate) {
//     // example deepgram configuration
//     /*
//     {
//       model: "nova-2",
//       punctuate: true,
//       language: "en",
//       interim_results: true,
//       diarize: false,
//       smart_format: true,
//       endpointing: 0,
//       encoding: "linear16",
//       sample_rate: sampleRate,
//     }
//       */
//     this.client.configureStream({
//         model: "nova-2",
//         punctuate: true,
//         language: "en",
//         interim_results: true,
//         diarize: false,
//         smart_format: true,
//         endpointing: 0,
//         encoding: "linear16",
//         sample_rate: sampleRate,
//         });
//
//   }
//
//   endTranscriptionStream() {
//     // close deepgram connection here
//   }
//
//   // NOTE: deepgram must be ready before sending audio payload or it will close the connection
//   send(payload) {}
//
//   // ... feel free to add more functions
// }
//
// export default Transcriber;
const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
let keepAlive;

export const setupDeepgram = (socket, sampleRate) => {
    const deepgram = deepgramClient.listen.live({
        language: "en",
        punctuate: true,
        smart_format: true,
        model: "nova-2",
        // model: "nova-2",
        // punctuate: true,
        // language: "en",
        // interim_results: true,
        // diarize: false,
        // smart_format: true,
        // endpointing: 0,
        encoding: "linear16",
        sample_rate: sampleRate,
    });

    if (keepAlive) clearInterval(keepAlive);
    keepAlive = setInterval(() => {
        console.log("deepgram: keepalive");
        deepgram.keepAlive();
    }, 10 * 1000);

    deepgram.addListener(LiveTranscriptionEvents.Open, async () => {
        console.log("deepgram: connected");

        deepgram.addListener(LiveTranscriptionEvents.Close, async () => {
            console.log("deepgram: disconnected");
            clearInterval(keepAlive);
            deepgram.finish();
        });

        deepgram.addListener(LiveTranscriptionEvents.Error, async (error) => {
            console.log("deepgram: error recieved");
            console.error(error);
        });

        deepgram.addListener(LiveTranscriptionEvents.Warning, async (warning) => {
            console.log("deepgram: warning recieved");
            console.warn(warning);
        });

        deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
            console.log("deepgram: packet received");
            console.log("deepgram: transcript received", data);
            // const transcript = data.channel.alternatives[0].transcript ?? "";
            console.log("socket: transcript sent to client");
            // socket.emit("transcript", data);
            console.log("socket: transcript data sent to client");
            // socket.emit("data", data);
        });

        deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
            console.log("deepgram: packet received");
            console.log("deepgram: metadata received");
            console.log("socket: metadata sent to client");
            // socket.emit("metadata", data);
        });
    });

    return deepgram;
};
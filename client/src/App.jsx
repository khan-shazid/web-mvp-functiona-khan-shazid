import { useEffect } from "react";
import useAudioRecorder from "./useAudioRecorder";
import useSocket from "./useSocket";

// IMPORTANT: To ensure proper functionality and microphone access, please follow these steps:
// 1. Access the site using 'localhost' instead of the local IP address.
// 2. When prompted, grant microphone permissions to the site to enable audio recording.
// Failure to do so may result in issues with audio capture and transcription.
// NOTE: Don't use createPortal()

function App() {
  const { startRecording, stopRecording, isRecording, sampleRate } = useAudioRecorder({
    dataCb: (data) => {
      console.log('data cb --->', data);
      sendAudio(data);
    },
  });
  const { initialize, disconnect, startTranscriberAndRecording, sendAudio } = useSocket({startRecording});

  useEffect(() => {
    // Note: must connect to server on page load but don't start transcriber
    initialize();

    return () => {
      // disconnect();
    }
  }, [initialize, disconnect]);

  const onStartRecordingPress = async () => {
    // start recorder and transcriber (send configure-stream)
    startTranscriberAndRecording(sampleRate);
    // startRecording();
  };

  const onStopRecordingPress = async () => {
    stopRecording();
  };

  const copyToClipboard = () => {

  }

  const onClear  = () => {

  }

  return (
      <div>
        <h1>Speechify Voice Notes</h1>
        <p>Record or type something in the textbox.</p>
        <textarea id="transcription-display" rows={6} cols={50}>

      </textarea>
        <div>
          {!isRecording ?
              <button id="record-button" onClick={onStartRecordingPress}>Start Recording</button>
              :
              <button onClick={onStopRecordingPress}>Stop Recording</button>
          }
          <button id="copy-button" onClick={copyToClipboard}>Copy</button>
          <button id="reset-button" onClick={onClear}>Clear</button>
        </div>
      </div>
  );
}

export default App;

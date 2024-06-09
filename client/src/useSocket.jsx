import {useCallback, useRef, useState} from "react";
import io from "socket.io-client";
import {EmitEnums, SubscriptionEnums} from "@/constants/index.js";

const serverURL = "http://localhost:8080";

// const subscriptions = ["final", "partial", "transcriber-ready", "error"];

// feel free to pass in any props
const useSocket = (props) => {
  const {startRecording, onTranscribe} = props;
  const socketRef = useRef(null);
  const [loadingTranscriber, setLoadingTranscriber] = useState(false);
  // ... free to add any state or variables
  const initialize = useCallback(() => {
    socketRef.current = io(serverURL);

    socketRef.current?.on(SubscriptionEnums.CONNECT, () => {
      console.log(`Connected to server (${socketRef.current?.id})`);
    });

    socketRef.current?.on(SubscriptionEnums.TRANSCRIBER_READY, () => {
      setLoadingTranscriber(false);
      startRecording();
    });

    socketRef.current?.on(SubscriptionEnums.PARTIAL, (data) => {
      onTranscribe(data, false);
    });

    socketRef.current?.on(SubscriptionEnums.FINAL, (data) => {
      onTranscribe(data, true);
    });

    socketRef.current?.on(SubscriptionEnums.ERROR, (data) => {
      console.log(`error`, data);
    });

    socketRef.current?.on(SubscriptionEnums.DISCONNECT, () => {
      // alert("Disconnected from server. Please reload again to reconnect.");
    });
  }, [socketRef, setLoadingTranscriber, startRecording, onTranscribe]);

  const disconnect = () => {
    socketRef.current?.disconnect();
  };

  const startTranscriberAndRecording = (sampleRate) => {
    setLoadingTranscriber(true);
    socketRef.current?.emit(EmitEnums.CONFIGURE_STREAM, { sampleRate });
    console.log(`configure-stream emitted called (${socketRef.current?.id})`);
  };

  const stopTranscriber = useCallback(() => {
    socketRef.current?.emit(EmitEnums.STOP_STREAM);
  }, [socketRef]);

  const sendAudio = (audioData) => {
    socketRef.current?.emit(EmitEnums.INCOMING_AUDIO, audioData);
  }

  // ... free to add more functions
  return { initialize, disconnect, loadingTranscriber, startTranscriberAndRecording, stopTranscriber, sendAudio };
};

export default useSocket;

import { useState, useCallback } from 'react';

export function useGGWave() {
  const [instance, setInstance] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyzer, setAnalyzer] = useState(null);
  const [isGGWaveInitialized, setGGWaveIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  const convertTypedArray = (src, type) => {
      var buffer = new ArrayBuffer(src.byteLength);
      var baseView = new src.constructor(buffer).set(src);
      return new type(buffer);
  }
  
  const initialize = useCallback(async () => {
    try {
      // Import ggwave dynamically
      const factory = await import('ggwave');
      
      // Initialize audio context
      const context = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 48000});
      await context.resume();
      
      // Create instance using factory pattern
      const ggwave = await factory.default();
      const parameters = ggwave.getDefaultParameters();
      parameters.sampleRateInp = context.sampleRate;
      parameters.sampleRateOut = context.sampleRate;
      
      const ggwaveInstance = ggwave.init(parameters);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      const analyzerNode = context.createAnalyser();
      source.connect(analyzerNode);

      setInstance({ ggwave, instance: ggwaveInstance });
      setAudioContext(context);
      setAnalyzer(analyzerNode);
      setGGWaveIsInitialized(true);
      setError(null);

      console.log('GGWave initialized successfully', ggwave, ggwaveInstance);
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err.message);
    }
  }, []);

  const startListening = useCallback((onMessage) => {
      if (!analyzer || !instance || !audioContext) {
          console.error('Cannot start listening - not initialized');
          return;
      }
  
      let mediaStream = null;
      let recorder = null;
  
      const constraints = {
          audio: {
              echoCancellation: false,
              autoGainControl: false,
              noiseSuppression: false
          }
      };
  
      navigator.mediaDevices.getUserMedia(constraints).then(function(e) {
          mediaStream = audioContext.createMediaStreamSource(e);
  
          const bufferSize = 1024;
          const numberOfInputChannels = 1;
          const numberOfOutputChannels = 1;
  
          if (audioContext.createScriptProcessor) {
              recorder = audioContext.createScriptProcessor(
                  bufferSize,
                  numberOfInputChannels,
                  numberOfOutputChannels
              );
          } else {
              recorder = audioContext.createJavaScriptNode(
                  bufferSize,
                  numberOfInputChannels,
                  numberOfOutputChannels
              );
          }
  
          recorder.onaudioprocess = function(e) {
              const source = e.inputBuffer;
              const res = instance.ggwave.decode(
                  instance.instance, 
                  convertTypedArray(new Float32Array(source.getChannelData(0)), Int8Array)
              );
  
              if (res && res.length > 0) {
                  // Decode the UTF-8 text
                  const decoded = new TextDecoder("utf-8").decode(res);
                  onMessage(decoded);
              }
          }
  
          mediaStream.connect(recorder);
          recorder.connect(audioContext.destination);
      }).catch(function(err) {
          console.error('Media access error:', err);
          setError(err.message);
      });
  
      // Return cleanup function
      return () => {
          if (recorder) {
              recorder.disconnect(audioContext.destination);
              mediaStream.disconnect(recorder);
          }
      };
  }, [analyzer, instance, audioContext]);

  const sendMessage = useCallback(async (message) => {
    if (!instance || !audioContext) {
      console.error('GGWave not initialized');
      return;
    }
 
    try {
      const waveform = instance.ggwave.encode(instance.instance, message, instance.ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FASTEST, 10);
      
      if (!waveform) {
        throw new Error('Failed to encode message');
      }
      
      // play audio
      const buffer = convertTypedArray(waveform, Float32Array);
      const audioBuffer = audioContext.createBuffer(1, buffer.length, audioContext.sampleRate);
      audioBuffer.getChannelData(0).set(buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.message);
    }
  }, [instance, audioContext]);
  
  const cleanup = useCallback(() => {
    if (audioContext) {
      audioContext.close();
    }
    if (instance) {
      instance.ggwave.free(instance.instance);
    }
    setInstance(null);
    setAudioContext(null);
    setAnalyzer(null);
    setGGWaveIsInitialized(false);
  }, [audioContext, instance]);

  return {
    sendMessage,
    startListening,
    initialize,
    cleanup,
    isGGWaveInitialized,
    error
  };
}

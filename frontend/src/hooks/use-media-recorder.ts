"use client";

import { useState, useRef, useCallback } from 'react';

type Status = 'idle' | 'recording' | 'stopped' | 'error';

export function useMediaRecorder() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback((stream: MediaStream) => {
    if (status === 'recording') {
        console.warn('Already recording.');
        return;
    }
    
    streamRef.current = stream;
    recordedChunksRef.current = [];
    setError(null);
    
    try {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstart = () => {
        setStatus('recording');
      };
      mediaRecorderRef.current.onstop = () => {
        // This is handled in stopRecording promise
      };
      mediaRecorderRef.current.onerror = (event) => {
        const err = new Error(`MediaRecorder error: ${(event as any).error.name}`);
        setError(err);
        setStatus('error');
      };
      mediaRecorderRef.current.start();
    } catch (err) {
      const e = err as Error;
      setError(new Error(`MediaRecorder setup failed: ${e.message}`));
      setStatus('error');
    }
  }, [status]);

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      if (mediaRecorderRef.current && (status === 'recording' || mediaRecorderRef.current.state === 'recording')) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result as string);
            recordedChunksRef.current = [];
          };
          reader.onerror = (error) => {
            console.error("FileReader error:", error);
            setError(new Error('Failed to read video data.'));
            reject(error);
          };
          setStatus('stopped');
        };

        mediaRecorderRef.current.stop();
      } else {
        resolve(null); // Resolve with null if not recording
      }
    });
  }, [status]);
  
  return { status, error, startRecording, stopRecording };
}

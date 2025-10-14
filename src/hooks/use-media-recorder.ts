"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

type Status = 'idle' | 'permission-requested' | 'recording' | 'stopped' | 'error';

export function useMediaRecorder(videoRef: React.RefObject<HTMLVideoElement>) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef]);

  const requestPermissionAndStart = useCallback(async () => {
    setStatus('permission-requested');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }

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
        setStatus('stopped');
      };
      mediaRecorderRef.current.onerror = (event) => {
        const err = new Error(`MediaRecorder error: ${(event as any).error.name}`);
        setError(err);
        setStatus('error');
      };
      mediaRecorderRef.current.start();
    } catch (err) {
      const e = err as Error;
      setError(new Error(`Camera access denied: ${e.message}`));
      setStatus('error');
    }
  }, [videoRef]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (mediaRecorderRef.current && status === 'recording') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result as string);
            recordedChunksRef.current = [];
            setStatus('stopped');
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
          };
          reader.onerror = (error) => {
            reject(error);
          };
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(''); // Resolve with empty string if not recording
      }
    });
  }, [status]);
  
  return { status, error, requestPermissionAndStart, stopRecording };
}

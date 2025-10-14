"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { examQuestions } from '@/lib/questions';
import type { Question, ExamReport } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProctoringAnalysis } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, AlertTriangle, ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { cn } from '@/lib/utils';

type ExamState = 'idle' | 'permission' | 'active' | 'submitting' | 'error';

// Type definition for FaceDetector, which might not be in default TS libs
declare global {
  interface Window {
    FaceDetector: any;
  }
  class FaceDetector {
    constructor(options?: any);
    detect(image:
      | HTMLImageElement
      | HTMLVideoElement
      | HTMLCanvasElement
      | Blob
      | ImageData
      | VideoFrame
    ): Promise<any[]>;
  }
}

export default function ExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [examState, setExamState] = useState<ExamState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(examQuestions.length).fill(null));
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isFaceDetectorSupported, setIsFaceDetectorSupported] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const animationFrameId = useRef<number>();

  const { status, startRecording, stopRecording, error: recorderError } = useMediaRecorder();
  
  const drawBoundingBox = (faces: any[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas dimensions to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'hsl(var(--accent))';
    ctx.lineWidth = 4;
    ctx.font = '16px Inter';
    ctx.fillStyle = 'hsl(var(--accent))';

    faces.forEach(face => {
      const { x, y, width, height } = face.boundingBox;
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.stroke();
      ctx.fillText('Candidate', x, y > 20 ? y - 5 : y + height + 15);
    });
  };

  const detectFaces = async () => {
    if (faceDetectorRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      try {
        const faces = await faceDetectorRef.current.detect(videoRef.current);
        drawBoundingBox(faces);
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }
    animationFrameId.current = requestAnimationFrame(detectFaces);
  };


  useEffect(() => {
    if (status === 'recording' && isFaceDetectorSupported) {
      animationFrameId.current = requestAnimationFrame(detectFaces);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isFaceDetectorSupported]);
  

  useEffect(() => {
    return () => {
      // Cleanup stream on component unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recorderError) {
      setExamState('error');
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: recorderError.message,
      });
    }
  }, [recorderError, toast]);
  

  const handleStartExam = async () => {
    setExamState('permission');
    try {
      if (!('FaceDetector' in window)) {
        setIsFaceDetectorSupported(false);
        console.warn('FaceDetector API is not supported in this browser.');
      } else {
        faceDetectorRef.current = new window.FaceDetector({ fastMode: true });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      startRecording(stream);
      setExamState('active');

    } catch (err) {
      console.error("Camera access error:", err);
      setExamState('error');
      setHasCameraPermission(false);
      toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to start the exam.',
      });
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1); // Corrected from +1
    }
  };

  const handleSubmit = async () => {
    setExamState('submitting');
    
    const videoDataUri = await stopRecording();
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }

    if (!videoDataUri && hasCameraPermission) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not retrieve the exam recording. Submission failed.",
      });
      setExamState('active');
      return;
    }

    const proctoringResult = await getProctoringAnalysis(videoDataUri || '');
    
    let score = 0;
    const answeredQuestions = examQuestions.map((q, index) => {
      const isCorrect = answers[index] === q.correctAnswer;
      if (isCorrect) score++;
      return {
        question: q,
        selectedAnswer: answers[index],
        isCorrect,
      };
    });

    const report: ExamReport = {
      score,
      totalQuestions: examQuestions.length,
      proctoringResult,
      answeredQuestions,
    };
    
    localStorage.setItem('examReport', JSON.stringify(report));
    router.push('/report');
  };
  
  const currentQuestion = examQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="fixed bottom-4 right-4 z-10">
          <Card className="w-64 shadow-lg">
            <CardHeader className="p-2 flex-row items-center gap-2">
              <Video className={cn("h-4 w-4", status === 'recording' ? 'text-destructive animate-pulse' : 'text-muted-foreground')} />
              <CardTitle className="text-sm">
                {status === 'recording' ? 'Recording in Progress' : 'Camera Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative">
               <video ref={videoRef} className="w-full h-auto rounded-b-lg" autoPlay playsInline muted />
               <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
            </CardContent>
          </Card>
           {!isFaceDetectorSupported && (
            <Alert variant="destructive" className="mt-2 text-xs">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Face Detection Not Supported</AlertTitle>
              <AlertDescription>
                Your browser doesn't support the Face Detector API. The bounding box will not be shown.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          {examState === 'idle' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Exam Instructions</CardTitle>
                <CardDescription>Please read the instructions carefully before starting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>This is a proctored exam. Your session will be recorded via your webcam and audio.</p>
                <p>A bounding box will appear around your face to ensure you are in the frame.</p>
                <p>Ensure you are in a quiet, well-lit room with no one else present.</p>
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertTitle>Camera & Mic Access Required</AlertTitle>
                  <AlertDescription>
                    We will need to access your camera and microphone to proctor the exam. Please grant permission when prompted.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button size="lg" onClick={handleStartExam}>Start Exam</Button>
              </CardFooter>
            </Card>
          )}

          {(examState === 'permission' || examState === 'submitting') && (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg">
                  {examState === 'permission' ? 'Requesting camera access...' : 'Submitting and analyzing...'}
                </p>
            </div>
          )}

          {examState === 'error' && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Camera access was denied or another error occurred. Please refresh the page, grant permissions, and try again.
                </AlertDescription>
            </Alert>
          )}

          {examState === 'active' && (
            <div>
              <Progress value={progress} className="mb-4" />
              <Card className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Question {currentQuestionIndex + 1} of {examQuestions.length}</CardTitle>
                  <CardDescription className="text-lg pt-2">{currentQuestion.question}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={answers[currentQuestionIndex]?.toString()} onValueChange={(val) => handleAnswerSelect(parseInt(val))}>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-md hover:bg-secondary transition-colors">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="text-base flex-1 cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                    <ArrowLeft className="mr-2" /> Previous
                  </Button>
                  {currentQuestionIndex < examQuestions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next <ArrowRight className="ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} variant="destructive">Submit Exam</Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

    
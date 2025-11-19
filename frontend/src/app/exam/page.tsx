"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProctoringAnalysis } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Video,
  ArrowLeft,
  ArrowRight,
  Camera,
  TimerIcon,
  LogOut,
} from "lucide-react";

import Draggable from "react-draggable";

import { authApi, examApi } from "@/lib/api"; // Import authApi and examApi

// Define types for API response
interface Question {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface ReportQuestion {
  id: number;
  question: string;
  options: string;
  correctAnswer: number;
}

interface AnsweredQuestion {
  question: ReportQuestion;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

interface ExamReport {
  score: number;
  totalQuestions: number;
  proctoringResult: any;
  answeredQuestions: AnsweredQuestion[];
}

interface QuizSubmitResponse {
  message: string;
  marks: number;
  total_questions_submitted: number;
  invalid_question_ids: number[];
  per_question: Array<{
    q_id: number;
    ans: string;
    valid: boolean;
    is_correct?: boolean;
    reason?: string;
  }>;
}

interface QuizQuestionsResponse {
  questions: Question[];
}

type ExamState = "idle" | "permission" | "active" | "submitting" | "error";

const EXAM_TIME_LIMIT = 25 * 60; // 25 minutes in seconds

export default function ExamPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [examState, setExamState] = useState<ExamState>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]); // State to store fetched questions
  const [loadingQuestions, setLoadingQuestions] = useState(true); // Loading state for questions
  const [examAlreadyAttempted, setExamAlreadyAttempted] = useState(false); // Track if exam was already attempted

  useEffect(() => {
    const checkLoginStatus = () => {
      const accessToken = localStorage.getItem("access_token");
      setIsLoggedIn(!!accessToken);

      if (!accessToken) {
        // If not logged in, redirect to login
        router.push("/login");
      }
    };

    checkLoginStatus();

    window.addEventListener("storage", checkLoginStatus);
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, [router]);

  const handleSessionExpiration = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
    });
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    router.push("/login");
  }, [toast, router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const response = await authApi.logout({ refresh_token: refreshToken });
      if (response.success) {
        toast({
          title: "Logout Successful",
          description: response.message,
        });
      } else {
        if (response.error === "Authentication required.") {
          handleSessionExpiration();
          return;
        }
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: response.error,
        });
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    router.push("/login"); // Redirect to login page after logout
  };
  const [answers, setAnswers] = useState<(number | null)[]>([]); // Changed initial state to empty array
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [remainingTime, setRemainingTime] = useState(EXAM_TIME_LIMIT);

  const videoRef = useRef<HTMLVideoElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async () => {
    setExamState("submitting");

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    const proctoringResult = await getProctoringAnalysis("");

    // Prepare answers for API submission
    // Map option index (0,1,2,3) to letter (A,B,C,D)
    const indexToLetter = ["A", "B", "C", "D"];
    const answersToSubmit = questions
      .map((q, index) => {
        const selectedIndex = answers[index];
        return {
          q_id: q.id,
          ans: selectedIndex !== null ? indexToLetter[selectedIndex] : null,
        };
      })
      .filter((answer) => answer.ans !== null); // Filter out unanswered questions

    try {
      const submissionResponse = await examApi.submitExamAnswers({
        answers: answersToSubmit,
      });

      if (submissionResponse.success) {
        // Map the new API response format to the expected report format
        const submitData = submissionResponse.data as QuizSubmitResponse;
        const report: ExamReport = {
          score: submitData.marks || 0,
          totalQuestions:
            submitData.total_questions_submitted || questions.length,
          proctoringResult,
          answeredQuestions:
            submitData.per_question?.map((item) => ({
              question: {
                id: item.q_id,
                question: questions.find((q) => q.id === item.q_id)?.text || "",
                options: JSON.stringify([
                  questions.find((q) => q.id === item.q_id)?.option_a || "",
                  questions.find((q) => q.id === item.q_id)?.option_b || "",
                  questions.find((q) => q.id === item.q_id)?.option_c || "",
                  questions.find((q) => q.id === item.q_id)?.option_d || "",
                ]),
                correctAnswer: -1, // Not provided in new API
              },
              selectedAnswer: item.ans
                ? ["A", "B", "C", "D"].indexOf(item.ans)
                : null,
              isCorrect: item.is_correct || false,
            })) || [],
        };
        localStorage.setItem("examReport", JSON.stringify(report));
        toast({
          variant: "success",
          title: "Exam Submitted",
          description: "Your exam has been submitted successfully.",
        });
        router.push("/report");
      } else {
        if (submissionResponse.error === "Authentication required.") {
          handleSessionExpiration();
          return;
        }
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description:
            submissionResponse.error ||
            "An unknown error occurred during submission.",
        });
        setExamState("active");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: error.message || "Network error during submission.",
      });
      setExamState("active");
    }
  }, [
    answers,
    hasCameraPermission,
    questions,
    router,
    toast,
    handleSessionExpiration,
  ]);

  useEffect(() => {
    if (examState === "active") {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examState, handleSubmit]);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartExam = async () => {
    setExamState("permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Fetch questions after camera access is granted
      setLoadingQuestions(true);
      try {
        const response = await examApi.getExamQuestions();

        // Check if user already attempted (403 response)
        if (
          !response.success &&
          response.error === "You already attempted the exam."
        ) {
          setExamAlreadyAttempted(true);
          setExamState("error");
          setLoadingQuestions(false);
          return;
        }

        if (response.success && response.data) {
          const questionsData = response.data as QuizQuestionsResponse;
          if (
            questionsData.questions &&
            Array.isArray(questionsData.questions)
          ) {
            setQuestions(questionsData.questions);
            setAnswers(Array(questionsData.questions.length).fill(null));
            setExamState("active");
          } else {
            toast({
              variant: "destructive",
              title: "Failed to load questions",
              description: "Invalid response format from server.",
            });
            setExamState("error");
          }
        } else {
          if (response.error === "Authentication required.") {
            handleSessionExpiration();
          } else {
            toast({
              variant: "destructive",
              title: "Failed to load questions",
              description: response.error || "An unknown error occurred.",
            });
            setExamState("error");
          }
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to load questions",
          description: error.message || "An unknown error occurred.",
        });
        setExamState("error");
      } finally {
        setLoadingQuestions(false);
      }
    } catch (err: any) {
      setExamState("error");
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description:
          "You must grant camera access to start the exam. Please enable permissions and try again.",
      });
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Map question options to array format
  const optionsArray = currentQuestion
    ? [
        currentQuestion.option_a,
        currentQuestion.option_b,
        currentQuestion.option_c,
        currentQuestion.option_d,
      ]
    : [];

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {isLoggedIn && (
          <div className="flex justify-end mb-4">
            {/* The logout button here is redundant as Header already has it */}
            {/* <Button onClick={handleLogout} className="text-white bg-[#30475f] hover:bg-[#2a3f55] shadow-sm hover:shadow-md transition-all duration-300">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button> */}
          </div>
        )}
        <Draggable nodeRef={draggableRef}>
          <div
            ref={draggableRef}
            className="fixed top-20 right-4 z-10 cursor-move"
          >
            <Card className="w-32 shadow-lg">
              <CardHeader className="p-2 flex-row items-center gap-2">
                <Video className={"h-4 w-4 text-muted-foreground"} />
                <CardTitle className="text-sm">{"Camera"}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                <video
                  ref={videoRef}
                  className="w-full h-auto rounded-b-lg"
                  autoPlay
                  playsInline
                  muted
                />
                {examState === "permission" && !hasCameraPermission && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                {examState !== "active" && examState !== "permission" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Draggable>

        <div className="max-w-4xl mx-auto">
          {examAlreadyAttempted ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-destructive">
                  Exam Already Attempted
                </CardTitle>
                <CardDescription>
                  You have already attempted the exam.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTitle>No More Attempts</AlertTitle>
                  <AlertDescription>
                    You have already completed the exam and cannot attempt it
                    again.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : examState === "idle" || examState === "error" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline">
                  Exam Instructions
                </CardTitle>
                <CardDescription>
                  Please read the instructions carefully before starting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This is a closed-book, multiple-choice assessment designed to
                  test your aptitude.
                </p>
                <p>
                  To protect the integrity of your results and ensure a level
                  playing field for everyone, this assessment uses secure,
                  AI-powered proctoring.
                </p>

                <h3 className="font-semibold">
                  How Proctoring Ensures Fairness:
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>
                    <strong>Camera Access (Visual Security):</strong> Your
                    webcam will take still pictures at randomized intervals.
                    These images are used solely to verify your identity and
                    ensure no unauthorized resources or individuals are present.
                  </li>
                  <li>
                    <strong>Microphone Access (Audio Security):</strong> Your
                    microphone will record short audio snippets throughout the
                    exam. This is used to detect unusual noises or conversations
                    that may indicate unauthorized assistance.
                  </li>
                </ul>

                <h3 className="font-semibold">Data Policy:</h3>
                <p className="text-sm text-muted-foreground">
                  All collected data is stored securely and reviewed{" "}
                  <strong>only if the AI flags suspicious activity</strong>. If
                  no flags are raised, the data is automatically discarded after
                  the review period. By proceeding, you agree to this
                  monitoring.
                </p>

                <Alert
                  variant={examState === "error" ? "destructive" : "default"}
                >
                  <Camera className="h-4 w-4" />
                  <AlertTitle>Camera & Mic Access Required</AlertTitle>
                  <AlertDescription>
                    Access is required for your device's camera and microphone
                    before the exam can begin.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  onClick={handleStartExam}
                  style={{
                    padding: "12px 24px",
                    fontSize: "1.1em",
                    fontWeight: "bold",
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginTop: "20px",
                  }}
                >
                  {examState === "error"
                    ? "Retry Camera Access"
                    : "START SECURE EXAM"}
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          {examState === "permission" && (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg">
                Requesting camera access... Please allow access in the browser
                prompt.
              </p>
            </div>
          )}

          {examState === "submitting" && (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg">Submitting and analyzing...</p>
            </div>
          )}

          {examState === "active" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Progress value={progress} className="w-full mr-4" />
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <TimerIcon className="h-6 w-6" />
                  <span>{formatTime(remainingTime)}</span>
                </div>
              </div>
              <Card className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-headline">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </CardTitle>
                  <CardDescription className="text-lg pt-2">
                    {currentQuestion?.text}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={
                      answers[currentQuestionIndex] !== null
                        ? answers[currentQuestionIndex].toString()
                        : ""
                    }
                    onValueChange={(val) => handleAnswerSelect(parseInt(val))}
                  >
                    {optionsArray?.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-3 rounded-md hover:bg-secondary transition-colors"
                      >
                        <RadioGroupItem
                          value={index.toString()}
                          id={`option-${index}`}
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className="text-base flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="mr-2" /> Previous
                  </Button>
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next <ArrowRight className="ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubmit()}
                      variant="destructive"
                    >
                      Submit Exam
                    </Button>
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

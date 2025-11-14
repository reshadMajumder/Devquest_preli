"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { Loader2, LogOut, CheckCircle, XCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define interfaces for user data and exam report
interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  whatsapp_number: string;
  student_id: string;
  exam_attempted: boolean;
  exam_answers: string; // JSON string
  exam_marks: number;
}

interface ReportQuestion {
  id: number;
  question: string;
  options: string; // JSON string
  correctAnswer: number;
}

interface AnsweredQuestion {
  question: ReportQuestion;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpiration = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
    });
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  }, [toast, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      const response = await authApi.getUserDetails();

      if (response.success && response.data) {
        setUserProfile(response.data as UserProfile);
      } else {
        if (response.error === "Authentication required.") {
          handleSessionExpiration();
        } else {
          setError(response.error || "Failed to fetch user profile.");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error || "Failed to fetch user profile.",
          });
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [handleSessionExpiration, toast]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const response = await authApi.logout({ refresh_token: refreshToken });
      if (response.success) {
        toast({
          variant: "success",
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
    router.push("/login"); // Redirect to login page after logout
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg">Loading profile...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center text-destructive">
            <p className="text-lg">{error}</p>
            <Button onClick={() => router.push("/login")} className="mt-4">
              Go to Login
            </Button>
          </div>
        </main>
      </>
    );
  }

  if (!userProfile) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg">No user profile found. Please log in.</p>
            <Button onClick={() => router.push("/login")} className="mt-4">
              Go to Login
            </Button>
          </div>
        </main>
      </>
    );
  }

  let parsedExamAnswers: AnsweredQuestion[] = [];
  if (userProfile.exam_attempted && userProfile.exam_answers) {
    try {
      parsedExamAnswers = JSON.parse(userProfile.exam_answers);
    } catch (e) {
      console.error("Failed to parse exam answers:", e);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline text-primary">
              User Profile
            </h1>
            <Button
              onClick={handleLogout}
              className="text-white bg-[#30475f] hover:bg-[#2a3f55] shadow-sm hover:shadow-md transition-all duration-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Full Name:</strong> {userProfile.full_name}
              </p>
              <p>
                <strong>Email:</strong> {userProfile.email}
              </p>
              <p>
                <strong>Student ID:</strong> {userProfile.student_id}
              </p>
              <p>
                <strong>WhatsApp Number:</strong> {userProfile.whatsapp_number}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exam Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Exam Attempted:</strong>{" "}
                {userProfile.exam_attempted ? "Yes" : "No"}
              </p>
              {userProfile.exam_attempted && (
                <p>
                  <strong>Marks:</strong> {userProfile.exam_marks}
                </p>
              )}
            </CardContent>
          </Card>

          {userProfile.exam_attempted && parsedExamAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Exam Report</CardTitle>
                <CardDescription>
                  Detailed review of your attempted exam.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {parsedExamAnswers.map((answeredQuestion, index) => {
                    const optionsArray =
                      typeof answeredQuestion.question.options === "string"
                        ? JSON.parse(answeredQuestion.question.options)
                        : answeredQuestion.question.options;
                    return (
                      <AccordionItem
                        value={`item-${index}`}
                        key={answeredQuestion.question.id}
                      >
                        <AccordionTrigger
                          className={cn(
                            "text-left",
                            answeredQuestion.isCorrect
                              ? "text-foreground"
                              : "text-destructive"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {answeredQuestion.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                            <span>
                              Question {index + 1}:{" "}
                              {answeredQuestion.isCorrect
                                ? "Correct"
                                : "Incorrect"}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="font-semibold">
                            {answeredQuestion.question.question}
                          </p>
                          <ul className="space-y-2 text-sm">
                            {optionsArray?.map(
                              (option: string, optIndex: number) => (
                                <li
                                  key={optIndex}
                                  className={cn(
                                    "flex items-center gap-2 border p-2 rounded-md",
                                    optIndex ===
                                      answeredQuestion.question.correctAnswer
                                      ? "border-green-500 bg-green-500/10"
                                      : "",
                                    optIndex ===
                                      answeredQuestion.selectedAnswer &&
                                      !answeredQuestion.isCorrect
                                      ? "border-destructive bg-red-500/10"
                                      : ""
                                  )}
                                >
                                  {optIndex ===
                                    answeredQuestion.question.correctAnswer && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                  {optIndex ===
                                    answeredQuestion.selectedAnswer &&
                                    optIndex !==
                                      answeredQuestion.question
                                        .correctAnswer && (
                                      <XCircle className="h-4 w-4 text-destructive" />
                                    )}
                                  <span>{option}</span>
                                  {optIndex ===
                                    answeredQuestion.selectedAnswer && (
                                    <Badge variant="outline">Your Answer</Badge>
                                  )}
                                  {optIndex ===
                                    answeredQuestion.question.correctAnswer && (
                                    <Badge
                                      variant="outline"
                                      className="border-green-500 text-green-600"
                                    >
                                      Correct Answer
                                    </Badge>
                                  )}
                                </li>
                              )
                            )}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

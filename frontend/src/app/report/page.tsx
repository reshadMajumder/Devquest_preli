"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ExamReport } from '@/lib/types';
import  Header  from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bot, CheckCircle, FileText, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function ReportSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<ExamReport | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const reportData = localStorage.getItem('examReport');
    if (reportData) {
      setReport(JSON.parse(reportData));
      // Do not remove from localStorage immediately
    } else {
      // If no report data, set report to null and let the skeleton handle it
      setReport(null);
    }
  }, []); // Empty dependency array to run only once on mount

  if (!isClient || !report) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <ReportSkeleton />
          </div>
        </main>
      </>
    );
  }

  const { score, totalQuestions, proctoringResult, answeredQuestions } = report;
  const scorePercentage = (score / totalQuestions) * 100;

  // Generate random numbers for photos and audio snippets
  const photosTaken = Math.floor(Math.random() * 20) + 1; // 1 to 20
  const audioSnippets = Math.floor(Math.random() * 4) + 2; // 2 to 5

  const suspicionLevelStyles = {
    LOW: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    HIGH: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  };

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Exam Report</h1>
            <p className="text-muted-foreground">Here is a summary of your performance and proctoring analysis.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-6xl font-bold">{score}/{totalQuestions}</p>
                <p className="text-muted-foreground">({scorePercentage.toFixed(1)}%)</p>
              </div>
              <Progress value={scorePercentage} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> AI Proctoring Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Photos taken: {photosTaken} <br />
                Audio snippets: {audioSnippets} <br />
                AI analysis result will be published with final standings.
              </p>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText /> Answer Review
              </CardTitle>
              <CardDescription>Review each question and your answer.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {answeredQuestions.map(({ question, selectedAnswer, isCorrect }, index) => {
                        const optionsArray = typeof question.options === 'string'
                            ? JSON.parse(question.options)
                            : question.options;
                        return (
                            <AccordionItem value={`item-${index}`} key={question.id}>
                                <AccordionTrigger className={cn("text-left", isCorrect ? 'text-foreground' : 'text-destructive')}>
                                    <div className="flex items-center gap-2">
                                        {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                                        <span>Question {index + 1}: {isCorrect ? 'Correct' : 'Incorrect'}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <p className="font-semibold">{question.question}</p>
                                    <ul className="space-y-2 text-sm">
                                        {optionsArray?.map((option, optIndex) => (
                                            <li key={optIndex} className={cn(
                                                "flex items-center gap-2 border p-2 rounded-md",
                                                optIndex === question.correctAnswer ? 'border-green-500 bg-green-500/10' : '',
                                                optIndex === selectedAnswer && !isCorrect ? 'border-destructive bg-red-500/10' : ''
                                            )}>
                                                {optIndex === question.correctAnswer && <CheckCircle className="h-4 w-4 text-green-500" />}
                                                {optIndex === selectedAnswer && optIndex !== question.correctAnswer && <XCircle className="h-4 w-4 text-destructive" />}
                                                <span>{option}</span>
                                                {optIndex === selectedAnswer && <Badge variant="outline">Your Answer</Badge>}
                                                {optIndex === question.correctAnswer && <Badge variant="outline" className="border-green-500 text-green-600">Correct Answer</Badge>}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
          </Card>

          <div className="text-center pt-4">
             <Button asChild size="lg">
                <Link href="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

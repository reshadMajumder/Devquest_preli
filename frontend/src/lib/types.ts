import type { AnalyzeExamRecordingOutput } from '@/ai/flows/analyze-exam-recording';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface ExamReport {
  score: number;
  totalQuestions: number;
  proctoringResult: AnalyzeExamRecordingOutput;
  answeredQuestions: {
    question: Question;
    selectedAnswer: number | null;
    isCorrect: boolean;
  }[];
}

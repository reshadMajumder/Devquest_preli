'use server';

import { analyzeExamRecording, type AnalyzeExamRecordingInput } from '@/ai/flows/analyze-exam-recording';

export async function getProctoringAnalysis(videoDataUri: string) {
  try {
    const input: AnalyzeExamRecordingInput = {
      videoDataUri,
      examDetails: 'Standard MCQ test on general knowledge.',
      candidateDetails: 'Anonymous candidate.',
    };
    const result = await analyzeExamRecording(input);
    return result;
  } catch (error) {
    console.error("Error in proctoring analysis:", error);
    return {
      summary: 'Analysis failed due to a server error. The AI proctor was unable to review the recording.',
      flags: ['Analysis Failed'],
      overallSuspicionLevel: 'HIGH' as const,
    };
  }
}

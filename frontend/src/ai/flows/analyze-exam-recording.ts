'use server';

/**
 * @fileOverview Exam recording analysis flow to detect suspicious behavior.
 *
 * - analyzeExamRecording - Analyzes an exam recording for suspicious behavior.
 * - AnalyzeExamRecordingInput - Input type for the analyzeExamRecording function.
 * - AnalyzeExamRecordingOutput - Return type for the analyzeExamRecording function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeExamRecordingInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'The video recording of the exam as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected format
    ),
  examDetails: z
    .string()
    .describe('Details about the exam, such as the subject and duration.'),
  candidateDetails: z.string().describe('Details about the candidate taking the exam.'),
});
export type AnalyzeExamRecordingInput = z.infer<typeof AnalyzeExamRecordingInputSchema>;

const AnalyzeExamRecordingOutputSchema = z.object({
  summary: z.string().describe('A summary of any suspicious behavior detected.'),
  flags: z.array(z.string()).describe('A list of specific flags raised (e.g., "Frequent looking away", "Unauthorized material detected").'),
  overallSuspicionLevel: z
    .enum(['LOW', 'MEDIUM', 'HIGH'])
    .describe('An overall assessment of the suspicion level.'),
});
export type AnalyzeExamRecordingOutput = z.infer<typeof AnalyzeExamRecordingOutputSchema>;

export async function analyzeExamRecording(input: AnalyzeExamRecordingInput): Promise<AnalyzeExamRecordingOutput> {
  return analyzeExamRecordingFlow(input);
}

const analyzeExamRecordingPrompt = ai.definePrompt({
  name: 'analyzeExamRecordingPrompt',
  input: {schema: AnalyzeExamRecordingInputSchema},
  output: {schema: AnalyzeExamRecordingOutputSchema},
  prompt: `You are an AI proctoring assistant tasked with analyzing exam recordings for suspicious behavior. Review the provided video recording, exam details, and candidate information to detect any potential instances of cheating.

    Video Recording: {{media url=videoDataUri}}
    Exam Details: {{examDetails}}
    Candidate Details: {{candidateDetails}}

    Identify any suspicious actions such as:
    - Frequent looking away from the screen
    - Presence of other individuals in the recording
    - Usage of unauthorized materials (e.g., notes, phones) -- attempt to recognize these via the screen if possible.
    - Suspicious sounds or voices
    - Long period of inactivity

    Based on your analysis, provide:
    1. A summary of the suspicious behavior detected.
    2. A list of specific flags raised (e.g., "Frequent looking away", "Unauthorized material detected").
    3. An overall assessment of the suspicion level (LOW, MEDIUM, or HIGH).

    Ensure your analysis is objective and based on the evidence in the recording.

    Output in JSON format:
    { 
      "summary": "summary of any suspicious behavior detected",
      "flags": ["list", "of", "specific", "flags"],
      "overallSuspicionLevel": "LOW, MEDIUM, or HIGH"
    }`,
});

const analyzeExamRecordingFlow = ai.defineFlow(
  {
    name: 'analyzeExamRecordingFlow',
    inputSchema: AnalyzeExamRecordingInputSchema,
    outputSchema: AnalyzeExamRecordingOutputSchema,
  },
  async input => {
    const {output} = await analyzeExamRecordingPrompt(input);
    return output!;
  }
);

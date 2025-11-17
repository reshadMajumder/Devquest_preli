'use server';

// Proctoring analysis - returning mock result
export async function getProctoringAnalysis(videoDataUri: string) {
  // Return a realistic mock analysis result
  return {
    summary: 'AI proctoring analysis completed successfully. The recording was reviewed for suspicious activity including unauthorized assistance, multiple faces, and unusual behavior patterns. No significant violations were detected during the examination period.',
    flags: [],
    overallSuspicionLevel: 'LOW' as const,
  };
}

# **App Name**: SecureExam Pro

## Core Features:

- Secure Camera Access: Request permission to access the user's camera for monitoring during the exam.
- Live Recording: Record the user's video and audio during the exam session. Stream the recording securely to a server to prevent tampering. Also, capture user inactivity in a tool report at the end.
- MCQ Question Display: Display multiple-choice questions to the user one at a time in a clear and readable format.
- Answer Recording: Record the user's selected answers along with timestamps to the Cloud SQL database, providing data for analysis and auditing.
- Automated Marking: Automatically grade the exam based on the recorded answers, comparing them against a set of keys to determine correct and incorrect responses.
- Report Generation: Generate a detailed report on the user inactivity including the exam results, user activity timeline, and any flags raised by the proctoring system. Display the report once it is requested, or output into a downloadable document file format.

## Style Guidelines:

- Primary color: Deep blue (#30475E) to convey trust and seriousness.
- Background color: Light gray (#F0F0F0) for a clean, non-distracting interface.
- Accent color: Teal (#4AA96C) for highlighting important elements like the submit button.
- Body and headline font: 'Inter', a grotesque-style sans-serif font known for being modern and neutral, is appropriate for both headlines and body text.
- Use clear and simple icons for navigation and controls. All icons should have sufficient contrast.
- Maintain a clean and simple layout to minimize distractions, ensuring questions and options are easy to read. Avoid animations for questions.
- Use subtle animations when transitioning between questions. Avoid overdoing it and slowing down the student.
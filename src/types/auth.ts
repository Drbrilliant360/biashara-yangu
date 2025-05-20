
// Auth Types
export interface SecurityQuestion {
  question: string;
  id: string;
}

export const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: '1', question: 'What was your childhood nickname?' },
  { id: '2', question: 'What is the name of your first pet?' },
  { id: '3', question: 'What was your first car?' },
  { id: '4', question: 'What elementary school did you attend?' },
  { id: '5', question: 'What is the name of the town where you were born?' },
  { id: '6', question: 'What is your mother\'s maiden name?' },
];

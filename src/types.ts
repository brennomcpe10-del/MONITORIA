export type Role = 'student' | 'monitor';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  lastMissedQuestionIds?: string[];
}

export interface Question {
  id: string;
  text: string;
  topic: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  createdAt: any;
  createdBy: string;
}

export interface QuizResult {
  id?: string;
  userId: string;
  date: any;
  total: number;
  score: number;
  topicStats: {
    [topic: string]: {
      total: number;
      errors: number;
    };
  };
  missedQuestionIds: string[];
}

export interface ClassStats {
  mostMissedQuestions: Array<{
    questionId: string;
    text: string;
    missCount: number;
  }>;
  topicErrorRates: Array<{
    topic: string;
    errorRate: number;
  }>;
  totalStudents: number;
  totalQuizzes: number;
}

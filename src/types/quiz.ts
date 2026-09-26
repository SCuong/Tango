import { StudyItem } from './study';

export type QuestionType =
  | 'kana_to_japanese'   // Prompt: りょこう → Choose 旅行
  | 'japanese_to_vi'     // Prompt: 旅行 → Choose du lịch
  | 'vi_to_japanese'     // Prompt: du lịch → Choose 旅行
  | 'vi_to_text';        // Prompt: du lịch → Type 旅行 or りょこう

export type QuizMode = 'practice' | 'test';

export interface QuizConfig {
  lessonIds: string[];            // Array of selected lesson IDs (supports 1 to N lessons)
  mode: QuizMode;                 // 'practice' or 'test'
  questionCount: number | 'all';  // Candidate fixed counts (10, 20, 40) or 'all'
  allowedTypes: QuestionType[];   // Enabled question formats
}

export interface QuizQuestion {
  id: string;                     // Question identifier in session, e.g. "q-1"
  type: QuestionType;
  prompt: string;                 // The prompt string displayed
  subPrompt?: string;             // Optional reading aid or instruction
  correctAnswer: string;          // Correct choice text or expected input
  options?: string[];             // 4 choices for multiple choice questions
  targetItem: StudyItem;          // Full reference to the underlying StudyItem
  userAnswer?: string;            // Answer submitted by learner
  isCorrect?: boolean;            // Evaluation flag
}

export interface QuizSessionResult {
  sessionId: string;
  lessonIds: string[];            // IDs of lessons included in this session
  mode: QuizMode;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;               // 0 to 100 percentage
  bestStreak: number;
  timeSpentSeconds: number;
  missedItemIds: string[];        // StudyItem IDs failed during this quiz
  completedAt: string;            // ISO 8601 timestamp
}

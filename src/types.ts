export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

export interface ReflectionSummary {
  title?: string;
  summary: string;
  keyThemes: string[];
  actionableTakeaways: string[];
  sentiment?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  summary?: string;
  keyThemes?: string[];
  actionableTakeaways?: string[];
  sentiment?: string;
  category?: string;
}

export interface JournalPrompt {
  id: string;
  category: string;
  prompt: string;
  starterThought: string;
}

export type DocumentItem = {
  id: string;
  title: string;
  subject: string;
  type: 'PDF' | 'Slides' | 'Notes' | 'Textbook';
  size: string;
  uploadedAt: string;
  progress: number;
};

export type StudySession = {
  id: string;
  title: string;
  subject: string;
  date: string;
  startTime: string;
  duration: number;
  type: 'Review' | 'Quiz' | 'Reading' | 'Tutor';
};

export type ActivityPoint = {
  day: string;
  hours: number;
  sessions: number;
};

export type Stat = {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  accent: string;
};

export const user = {
  name: 'Avery Chen',
  email: 'avery.chen@studymate.ai',
  initials: 'AC',
  plan: 'Pro Learner',
  streak: 12,
};

export const stats: Stat[] = [
  {
    label: 'Documents Uploaded',
    value: '24',
    delta: '+3 this week',
    trend: 'up',
    icon: 'FileText',
    accent: 'primary',
  },
  {
    label: 'Questions Answered',
    value: '1,284',
    delta: '+212 today',
    trend: 'up',
    icon: 'MessagesSquare',
    accent: 'success',
  },
  {
    label: 'Study Streak',
    value: '12 days',
    delta: 'Personal best',
    trend: 'up',
    icon: 'Flame',
    accent: 'warning',
  },
  {
    label: 'Learning Progress',
    value: '68%',
    delta: '+8% this month',
    trend: 'up',
    icon: 'TrendingUp',
    accent: 'primary',
  },
];

export const recentDocuments: DocumentItem[] = [
  {
    id: 'd1',
    title: 'Organic Chemistry — Reaction Mechanisms',
    subject: 'Chemistry',
    type: 'PDF',
    size: '4.2 MB',
    uploadedAt: '2 hours ago',
    progress: 82,
  },
  {
    id: 'd2',
    title: 'Macroeconomics: Monetary Policy',
    subject: 'Economics',
    type: 'Slides',
    size: '1.8 MB',
    uploadedAt: 'Yesterday',
    progress: 45,
  },
  {
    id: 'd3',
    title: 'Cell Biology — Mitochondria Notes',
    subject: 'Biology',
    type: 'Notes',
    size: '640 KB',
    uploadedAt: '2 days ago',
    progress: 100,
  },
  {
    id: 'd4',
    title: 'Linear Algebra — Eigenvectors',
    subject: 'Mathematics',
    type: 'Textbook',
    size: '12.5 MB',
    uploadedAt: '4 days ago',
    progress: 27,
  },
  {
    id: 'd5',
    title: 'Constitutional Law — Case Briefs',
    subject: 'Law',
    type: 'PDF',
    size: '3.1 MB',
    uploadedAt: '1 week ago',
    progress: 64,
  },
];

export const weeklyActivity: ActivityPoint[] = [
  { day: 'Mon', hours: 2.5, sessions: 3 },
  { day: 'Tue', hours: 3.8, sessions: 4 },
  { day: 'Wed', hours: 1.9, sessions: 2 },
  { day: 'Thu', hours: 4.2, sessions: 5 },
  { day: 'Fri', hours: 3.1, sessions: 3 },
  { day: 'Sat', hours: 5.4, sessions: 6 },
  { day: 'Sun', hours: 2.7, sessions: 3 },
];

export const upcomingSessions: StudySession[] = [
  {
    id: 's1',
    title: 'Chemistry — Mechanism Review',
    subject: 'Chemistry',
    date: 'Today',
    startTime: '4:00 PM',
    duration: 45,
    type: 'Review',
  },
  {
    id: 's2',
    title: 'AI Tutor: Calculus Practice',
    subject: 'Mathematics',
    date: 'Today',
    startTime: '7:30 PM',
    duration: 60,
    type: 'Tutor',
  },
  {
    id: 's3',
    title: 'Biology Flashcard Sprint',
    subject: 'Biology',
    date: 'Tomorrow',
    startTime: '10:00 AM',
    duration: 30,
    type: 'Review',
  },
  {
    id: 's4',
    title: 'Economics Quiz — Ch. 4',
    subject: 'Economics',
    date: 'Tomorrow',
    startTime: '2:00 PM',
    duration: 40,
    type: 'Quiz',
  },
];

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  accent: string;
};

export const quickActions: QuickAction[] = [
  {
    id: 'upload',
    title: 'Upload Notes',
    description: 'Add study materials for the AI to learn',
    icon: 'Upload',
    href: '/documents',
    accent: 'primary',
  },
  {
    id: 'tutor',
    title: 'Chat with AI Tutor',
    description: 'Ask questions and get instant explanations',
    icon: 'Sparkles',
    href: '/tutor',
    accent: 'success',
  },
  {
    id: 'flashcards',
    title: 'Create Flashcards',
    description: 'Generate a deck from your documents',
    icon: 'Layers',
    href: '/flashcards',
    accent: 'warning',
  },
  {
    id: 'quiz',
    title: 'Generate Quiz',
    description: 'Test yourself with auto-generated questions',
    icon: 'ListChecks',
    href: '/quizzes',
    accent: 'primary',
  },
];

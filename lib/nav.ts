export type NavLink = {
  label: string;
  href: string;
  icon: string;
  description: string;
};

export const navLinks: NavLink[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
    description: 'Overview of your study activity',
  },
  {
    label: 'AI Tutor',
    href: '/tutor',
    icon: 'Sparkles',
    description: 'Chat with your AI study assistant',
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: 'FileText',
    description: 'Notes, slides, and readings',
  },
  {
    label: 'Flashcards',
    href: '/flashcards',
    icon: 'Layers',
    description: 'Review and create decks',
  },
  {
    label: 'Quizzes',
    href: '/quizzes',
    icon: 'ListChecks',
    description: 'Test your knowledge',
  },
  {
    label: 'Study Planner',
    href: '/planner',
    icon: 'CalendarDays',
    description: 'Schedule your sessions',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: 'BarChart3',
    description: 'Track your progress',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
    description: 'Manage your account',
  },
];

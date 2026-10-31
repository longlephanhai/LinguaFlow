export type WritingLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

export interface WritingTopic {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  description: string;
  guidingQuestions: string[];
  sentenceStarter: string;
}

export const WRITING_TOPICS: WritingTopic[] = [
  // Beginner (A1 - A2)
  {
    id: 'beg-morning-routine',
    title: 'My Morning Routine',
    level: 'beginner',
    category: 'Daily Life',
    description: 'Describe what you typically do in the morning from waking up until starting your day.',
    guidingQuestions: [
      'What time do you usually wake up?',
      'What do you eat or drink for breakfast?',
      'How do you prepare for the day ahead?',
    ],
    sentenceStarter: 'Every morning, I usually wake up at 7:00 AM, drink a glass of warm water, and...',
  },
  {
    id: 'beg-favorite-food',
    title: 'My Favorite Food & Drink',
    level: 'beginner',
    category: 'Food & Health',
    description: 'Talk about a favorite meal, snack, or drink and explain why you enjoy it.',
    guidingQuestions: [
      'What is your favorite dish or beverage?',
      'What flavors and ingredients make it special?',
      'When or with whom do you enjoy having it?',
    ],
    sentenceStarter: 'One dish that I never get tired of eating is...',
  },
  {
    id: 'beg-hometown',
    title: 'Where I Live',
    level: 'beginner',
    category: 'Travel & Places',
    description: 'Introduce your hometown or neighborhood to a foreign friend who has never visited.',
    guidingQuestions: [
      'Where is your hometown or neighborhood located?',
      'What is the atmosphere and weather like?',
      'What is one place you recommend visiting there?',
    ],
    sentenceStarter: 'I currently live in a pleasant city where people are friendly and...',
  },
  {
    id: 'beg-admired-person',
    title: 'A Person I Truly Admire',
    level: 'beginner',
    category: 'People',
    description: 'Introduce a family member, friend, or mentor who inspires you.',
    guidingQuestions: [
      'Who is this person and how do you know them?',
      'What kind of qualities or personality do they have?',
      'Why do you look up to them?',
    ],
    sentenceStarter: 'Someone who inspires me in my daily life is...',
  },

  // Intermediate (B1 - B2)
  {
    id: 'int-project-update',
    title: 'Workplace Email: Project Status',
    level: 'intermediate',
    category: 'Work & Study',
    description: 'Write a professional email updating a colleague or team on your recent progress.',
    guidingQuestions: [
      'What milestone or task did you recently complete?',
      'What key priorities are you tackling next?',
      'Is there anything you need feedback or collaboration on?',
    ],
    sentenceStarter: 'Dear team, I am writing to provide a concise update on our recent milestones...',
  },
  {
    id: 'int-memorable-trip',
    title: 'A Memorable Travel Experience',
    level: 'intermediate',
    category: 'Travel & Places',
    description: 'Recount an unforgettable vacation or an unexpected adventure you had while traveling.',
    guidingQuestions: [
      'Where did you go and when did this trip take place?',
      'What was the most exciting or surprising moment?',
      'What lasting impression did you bring home?',
    ],
    sentenceStarter: 'One of the most memorable journeys I have ever embarked on was...',
  },
  {
    id: 'int-unwind-hobby',
    title: 'How I Unwind & Recharge',
    level: 'intermediate',
    category: 'Lifestyle',
    description: 'Explain a personal hobby or ritual that helps you clear your mind after a busy week.',
    guidingQuestions: [
      'What activity helps you release stress?',
      'How does it make you feel mentally and physically?',
      'Why would you recommend this hobby to others?',
    ],
    sentenceStarter: 'Whenever I feel overwhelmed with daily responsibilities, my favorite way to recharge is...',
  },
  {
    id: 'int-learning-journey',
    title: 'My English Learning Journey',
    level: 'intermediate',
    category: 'Work & Study',
    description: 'Reflect on how your language skills are progressing and what goals you want to hit.',
    guidingQuestions: [
      'What was the biggest challenge when you started learning?',
      'What study methods or habits have helped you the most?',
      'What do you hope to accomplish once you become fluent?',
    ],
    sentenceStarter: 'Throughout my journey of mastering English, I have learned that consistency is...',
  },

  // Advanced (C1)
  {
    id: 'adv-ai-creativity',
    title: 'AI & Human Creativity',
    level: 'advanced',
    category: 'Technology & Society',
    description: 'Argue whether artificial intelligence enhances human creativity or diminishes original thinking.',
    guidingQuestions: [
      'In what ways can generative AI empower writers and creators?',
      'What potential risks does over-reliance on AI pose to authentic expression?',
      'How should creators strike an ethical and productive balance?',
    ],
    sentenceStarter: 'The rapid emergence of artificial intelligence has sparked a profound debate regarding...',
  },
  {
    id: 'adv-work-life-balance',
    title: 'Work-Life Balance in a Digital Era',
    level: 'advanced',
    category: 'Career & Well-being',
    description: 'Discuss how modern professionals can prevent burnout in an always-connected digital workplace.',
    guidingQuestions: [
      'Why is maintaining boundaries between work and personal life increasingly difficult?',
      'What personal routines or systemic boundaries foster genuine sustainable productivity?',
      'What responsibility do employers bear in cultivating a healthy culture?',
    ],
    sentenceStarter: 'In an increasingly hyper-connected society, the traditional concept of work-life balance has evolved into...',
  },
];

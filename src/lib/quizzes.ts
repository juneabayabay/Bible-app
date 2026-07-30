export type QuizQuestion = {
  prompt: string;
  answer: string;
};

export type ChapterQuiz = {
  slug: string;
  chapter: number;
  title: string;
  questions: QuizQuestion[];
};

/** Soft comprehension checks — reveal answers, no harsh scoring. */
export const CHAPTER_QUIZZES: ChapterQuiz[] = [
  {
    slug: "john",
    chapter: 3,
    title: "John 3",
    questions: [
      {
        prompt: "Who visited Jesus at night?",
        answer: "Nicodemus, a Pharisee and ruler of the Jews.",
      },
      {
        prompt: "What did Jesus say a person must be to see the kingdom of God?",
        answer: "Born again (born from above).",
      },
      {
        prompt: "Why did God give His only Son, according to John 3:16?",
        answer: "So that whoever believes in Him should not perish, but have eternal life.",
      },
    ],
  },
  {
    slug: "psalms",
    chapter: 23,
    title: "Psalm 23",
    questions: [
      {
        prompt: "How does David describe the Lord in this psalm?",
        answer: "As his shepherd—so he lacks nothing.",
      },
      {
        prompt: "Where does the shepherd lead the sheep?",
        answer: "Beside still waters and in paths of righteousness.",
      },
      {
        prompt: "What does David say will follow him all his days?",
        answer: "Goodness and loving kindness.",
      },
    ],
  },
  {
    slug: "matthew",
    chapter: 5,
    title: "Matthew 5",
    questions: [
      {
        prompt: "Where does Jesus teach in this chapter?",
        answer: "On a mountain (the Sermon on the Mount).",
      },
      {
        prompt: "Name one group Jesus calls “blessed.”",
        answer: "Examples: the poor in spirit, the meek, the merciful, peacemakers.",
      },
      {
        prompt: "What does Jesus say about anger toward a brother?",
        answer: "It is subject to judgment—reconcile quickly.",
      },
    ],
  },
  {
    slug: "genesis",
    chapter: 1,
    title: "Genesis 1",
    questions: [
      {
        prompt: "How does the Bible begin creation?",
        answer: "“In the beginning, God created the heavens and the earth.”",
      },
      {
        prompt: "What did God create on the first day?",
        answer: "Light, and He separated light from darkness.",
      },
      {
        prompt: "In whose image were humans created?",
        answer: "In the image of God.",
      },
    ],
  },
];

export function getQuiz(slug: string, chapter: number) {
  return CHAPTER_QUIZZES.find((q) => q.slug === slug && q.chapter === chapter);
}

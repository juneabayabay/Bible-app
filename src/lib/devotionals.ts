export type DevotionVerse = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
};

export type DevotionEntry = {
  id: string;
  title: string;
  reflection: string;
  prayer: string;
  verse: DevotionVerse;
};

export type DevotionTheme = {
  slug: string;
  title: string;
  summary: string;
  focus: string;
  entries: DevotionEntry[];
};

/**
 * Themed devotionals — short, calm, Scripture-centered.
 * Texts are public-domain paraphrase style (WEB-aligned meaning).
 */
export const DEVOTION_THEMES: DevotionTheme[] = [
  {
    slug: "love",
    title: "Love",
    summary: "Learn the love that gives, stays, and never fails.",
    focus: "God’s love for us, and love for one another.",
    entries: [
      {
        id: "day-1",
        title: "Love that remains",
        reflection:
          "Love is not only a feeling—it is a choice to seek another’s good. God’s love holds us when ours runs thin. Receive His love first, then let it overflow.",
        prayer: "Lord, fill me with Your love so I can love others with patience and truth.",
        verse: {
          book: "1 Corinthians",
          slug: "1-corinthians",
          chapter: 13,
          verse: 4,
          text: "Love is patient and is kind. Love doesn’t envy. Love doesn’t brag, is not proud.",
        },
      },
      {
        id: "day-2",
        title: "Love that sacrifices",
        reflection:
          "True love costs something. Jesus showed love by laying down His life. Ask where love invites you to give today—time, attention, or forgiveness.",
        prayer: "Jesus, teach me to love as You love—freely and without fear.",
        verse: {
          book: "John",
          slug: "john",
          chapter: 15,
          verse: 13,
          text: "Greater love has no one than this, that someone lay down his life for his friends.",
        },
      },
      {
        id: "day-3",
        title: "Love from God",
        reflection:
          "We love because He first loved us. When you feel empty, return to the Source. Rest in being loved, then take one small step of love toward someone near you.",
        prayer: "Father, remind me that I am loved, and help me show that love today.",
        verse: {
          book: "1 John",
          slug: "1-john",
          chapter: 4,
          verse: 19,
          text: "We love him, because he first loved us.",
        },
      },
    ],
  },
  {
    slug: "kindness",
    title: "Kindness",
    summary: "Practice gentle strength that softens hard places.",
    focus: "Everyday mercy in words and actions.",
    entries: [
      {
        id: "day-1",
        title: "Kindness that heals",
        reflection:
          "Kindness is courage with a soft voice. It notices need and responds without keeping score. Look for one person who needs a kind word today.",
        prayer: "God, make my words gentle and my actions helpful.",
        verse: {
          book: "Ephesians",
          slug: "ephesians",
          chapter: 4,
          verse: 32,
          text: "And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you.",
        },
      },
      {
        id: "day-2",
        title: "A soft answer",
        reflection:
          "Harsh words escalate; kindness lowers the temperature. Before you reply, pause. Ask what would bring peace rather than winning.",
        prayer: "Lord, guard my tongue and fill my replies with grace.",
        verse: {
          book: "Proverbs",
          slug: "proverbs",
          chapter: 15,
          verse: 1,
          text: "A gentle answer turns away wrath, but a harsh word stirs up anger.",
        },
      },
    ],
  },
  {
    slug: "humility",
    title: "Humility",
    summary: "Walk low before God so others can stand tall.",
    focus: "Serving without needing the spotlight.",
    entries: [
      {
        id: "day-1",
        title: "The mind of Christ",
        reflection:
          "Humility is not thinking less of yourself—it is thinking of yourself less. Jesus emptied Himself for others. Where can you choose the lower place today?",
        prayer: "Jesus, give me Your humility and a servant’s heart.",
        verse: {
          book: "Philippians",
          slug: "philippians",
          chapter: 2,
          verse: 3,
          text: "Doing nothing through rivalry or through conceit, but in humility, each counting others better than himself.",
        },
      },
      {
        id: "day-2",
        title: "God lifts the humble",
        reflection:
          "Pride isolates; humility invites grace. Admit need. Ask for help. Celebrate others. God draws near to the lowly heart.",
        prayer: "Father, free me from pride and teach me to honor others.",
        verse: {
          book: "James",
          slug: "james",
          chapter: 4,
          verse: 6,
          text: "But he gives more grace. Therefore it says, “God resists the proud, but gives grace to the humble.”",
        },
      },
    ],
  },
  {
    slug: "grace",
    title: "Grace",
    summary: "Receive what you cannot earn, then pass it on.",
    focus: "Undeserved favor that changes how we live.",
    entries: [
      {
        id: "day-1",
        title: "Saved by grace",
        reflection:
          "Grace means God moves toward you first. You are not loved because you perform—you are empowered because you are loved. Rest in that gift.",
        prayer: "Lord, help me receive Your grace without striving.",
        verse: {
          book: "Ephesians",
          slug: "ephesians",
          chapter: 2,
          verse: 8,
          text: "For by grace you have been saved through faith, and that not of yourselves; it is the gift of God.",
        },
      },
      {
        id: "day-2",
        title: "Grace for today",
        reflection:
          "Grace is not only for salvation—it is strength for this day’s weakness. Bring your limits to God. Ask for enough grace for the next faithful step.",
        prayer: "God, give me grace for what I face today.",
        verse: {
          book: "2 Corinthians",
          slug: "2-corinthians",
          chapter: 12,
          verse: 9,
          text: "He has said to me, “My grace is sufficient for you, for my power is made perfect in weakness.”",
        },
      },
    ],
  },
  {
    slug: "sacrifice",
    title: "Sacrifice",
    summary: "Offer your life as worship—little yeses that matter.",
    focus: "Giving up lesser things for greater love.",
    entries: [
      {
        id: "day-1",
        title: "A living sacrifice",
        reflection:
          "Sacrifice in Christ is not empty loss—it is love poured out. Present your day to God: your plans, your phone, your preferences. Let worship reshape ordinary hours.",
        prayer: "Lord, I offer this day to You. Use my life for Your glory.",
        verse: {
          book: "Romans",
          slug: "romans",
          chapter: 12,
          verse: 1,
          text: "Therefore I urge you, brothers, by the mercies of God, to present your bodies a living sacrifice, holy, acceptable to God, which is your spiritual service.",
        },
      },
      {
        id: "day-2",
        title: "Take up the cross",
        reflection:
          "Following Jesus means releasing self-first living. Name one comfort you can set down so someone else can rise. Small crosses form a faithful life.",
        prayer: "Jesus, help me follow You even when it costs me.",
        verse: {
          book: "Luke",
          slug: "luke",
          chapter: 9,
          verse: 23,
          text: "He said to all, “If anyone desires to come after me, let him deny himself, take up his cross, and follow me.”",
        },
      },
    ],
  },
  {
    slug: "faith",
    title: "Faith",
    summary: "Trust God when sight is limited.",
    focus: "Believing His promises in real life.",
    entries: [
      {
        id: "day-1",
        title: "Faith is assurance",
        reflection:
          "Faith is confidence in what God has said, even before you see results. Anchor today in a promise you know is true, and walk one step in that direction.",
        prayer: "God, increase my faith and quiet my fear.",
        verse: {
          book: "Hebrews",
          slug: "hebrews",
          chapter: 11,
          verse: 1,
          text: "Now faith is assurance of things hoped for, proof of things not seen.",
        },
      },
      {
        id: "day-2",
        title: "Walk by faith",
        reflection:
          "You may not control outcomes, but you can trust the One who does. Choose obedience over anxiety. Faith grows when it is practiced.",
        prayer: "Lord, I will walk by faith, not by sight.",
        verse: {
          book: "2 Corinthians",
          slug: "2-corinthians",
          chapter: 5,
          verse: 7,
          text: "For we walk by faith, not by sight.",
        },
      },
    ],
  },
  {
    slug: "hope",
    title: "Hope",
    summary: "Look forward with courage because God is faithful.",
    focus: "Living expectantly in Christ.",
    entries: [
      {
        id: "day-1",
        title: "Living hope",
        reflection:
          "Hope in Scripture is not wishful thinking—it is confident expectation. Because Jesus lives, your story is not finished in despair.",
        prayer: "Father, renew my hope and lift my eyes to You.",
        verse: {
          book: "1 Peter",
          slug: "1-peter",
          chapter: 1,
          verse: 3,
          text: "Blessed be the God and Father of our Lord Jesus Christ, who according to his great mercy caused us to be born again to a living hope through the resurrection of Jesus Christ from the dead.",
        },
      },
      {
        id: "day-2",
        title: "Hope that does not put to shame",
        reflection:
          "God’s hope does not disappoint. When waiting feels long, remember His character. Hope waits with open hands, not clenched fists.",
        prayer: "Spirit, teach me to wait with hope and peace.",
        verse: {
          book: "Romans",
          slug: "romans",
          chapter: 5,
          verse: 5,
          text: "And hope doesn’t disappoint us, because God’s love has been poured into our hearts through the Holy Spirit who was given to us.",
        },
      },
    ],
  },
  {
    slug: "peace",
    title: "Peace",
    summary: "Receive the calm that Christ gives, not as the world gives.",
    focus: "Resting your mind in God.",
    entries: [
      {
        id: "day-1",
        title: "Peace I leave with you",
        reflection:
          "Jesus offers peace that survives trouble. Invite Him into your worries by name. Trade frantic control for quiet trust.",
        prayer: "Jesus, speak peace over my heart and mind.",
        verse: {
          book: "John",
          slug: "john",
          chapter: 14,
          verse: 27,
          text: "Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don’t let your heart be troubled, neither let it be fearful.",
        },
      },
      {
        id: "day-2",
        title: "Pray instead of panic",
        reflection:
          "Peace grows where prayer replaces rumination. Tell God what you need. Thank Him for what remains. Guard your heart with gratitude.",
        prayer: "God, I bring my worries to You and choose thanksgiving.",
        verse: {
          book: "Philippians",
          slug: "philippians",
          chapter: 4,
          verse: 6,
          text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.",
        },
      },
    ],
  },
  {
    slug: "forgiveness",
    title: "Forgiveness",
    summary: "Release burdens and receive freedom.",
    focus: "Being forgiven and forgiving others.",
    entries: [
      {
        id: "day-1",
        title: "As the Lord forgave",
        reflection:
          "Forgiveness is not saying the wound was small—it is refusing to let bitterness rule. Start by remembering how much you have been forgiven.",
        prayer: "Lord, help me forgive as You have forgiven me.",
        verse: {
          book: "Colossians",
          slug: "colossians",
          chapter: 3,
          verse: 13,
          text: "Bearing with one another, and forgiving each other, if any man has a complaint against any; even as Christ forgave you, so you also do.",
        },
      },
      {
        id: "day-2",
        title: "Confess and be cleansed",
        reflection:
          "Bring your failures into the light. God is faithful to forgive. Do not hide—come home. Fresh mercy is waiting.",
        prayer: "Father, I confess my sins. Cleanse me and restore me.",
        verse: {
          book: "1 John",
          slug: "1-john",
          chapter: 1,
          verse: 9,
          text: "If we confess our sins, he is faithful and righteous to forgive us the sins and to cleanse us from all unrighteousness.",
        },
      },
    ],
  },
  {
    slug: "gratitude",
    title: "Gratitude",
    summary: "Train your eyes to see God’s gifts.",
    focus: "Thankfulness that reshapes the day.",
    entries: [
      {
        id: "day-1",
        title: "Give thanks in everything",
        reflection:
          "Gratitude does not deny pain—it discovers God in the middle of it. Name three gifts from today, even small ones, and thank Him out loud.",
        prayer: "Lord, open my eyes to Your gifts and fill my mouth with thanks.",
        verse: {
          book: "1 Thessalonians",
          slug: "1-thessalonians",
          chapter: 5,
          verse: 18,
          text: "In everything give thanks, for this is the will of God in Christ Jesus toward you.",
        },
      },
      {
        id: "day-2",
        title: "Every good gift",
        reflection:
          "Good things are not accidents—they are gifts from a generous Father. Receive them with humility, and share them freely.",
        prayer: "Father of lights, thank You for every good and perfect gift.",
        verse: {
          book: "James",
          slug: "james",
          chapter: 1,
          verse: 17,
          text: "Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom can be no variation nor turning shadow.",
        },
      },
    ],
  },
];

export function getDevotionThemes() {
  return DEVOTION_THEMES;
}

export function getDevotionTheme(slug: string) {
  return DEVOTION_THEMES.find((t) => t.slug === slug);
}

export function totalDevotionEntries() {
  return DEVOTION_THEMES.reduce((n, t) => n + t.entries.length, 0);
}

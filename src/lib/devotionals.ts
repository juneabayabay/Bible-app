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
  /** Related Scriptures visitors can choose to read */
  relatedVerses: DevotionVerse[];
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
    relatedVerses: [
      { book: "1 Corinthians", slug: "1-corinthians", chapter: 13, verse: 4, text: "Love is patient and is kind. Love doesn’t envy. Love doesn’t brag, is not proud." },
      { book: "1 Corinthians", slug: "1-corinthians", chapter: 13, verse: 13, text: "But now faith, hope, and love remain—these three. The greatest of these is love." },
      { book: "John", slug: "john", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life." },
      { book: "John", slug: "john", chapter: 15, verse: 12, text: "This is my commandment, that you love one another, even as I have loved you." },
      { book: "John", slug: "john", chapter: 15, verse: 13, text: "Greater love has no one than this, that someone lay down his life for his friends." },
      { book: "1 John", slug: "1-john", chapter: 4, verse: 7, text: "Beloved, let’s love one another, for love is of God; and everyone who loves has been born of God and knows God." },
      { book: "1 John", slug: "1-john", chapter: 4, verse: 8, text: "He who doesn’t love doesn’t know God, for God is love." },
      { book: "1 John", slug: "1-john", chapter: 4, verse: 19, text: "We love him, because he first loved us." },
      { book: "Romans", slug: "romans", chapter: 5, verse: 8, text: "But God commends his own love toward us, in that while we were yet sinners, Christ died for us." },
      { book: "Romans", slug: "romans", chapter: 8, verse: 39, text: "Nor height, nor depth, nor any other created thing will be able to separate us from the love of God which is in Christ Jesus our Lord." },
      { book: "Ephesians", slug: "ephesians", chapter: 5, verse: 2, text: "Walk in love, even as Christ also loved us and gave himself up for us." },
      { book: "Song of Solomon", slug: "song-of-solomon", chapter: 8, verse: 7, text: "Many waters can’t quench love, neither can floods drown it." },
    ],
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
    relatedVerses: [
      { book: "Ephesians", slug: "ephesians", chapter: 4, verse: 32, text: "And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you." },
      { book: "Proverbs", slug: "proverbs", chapter: 15, verse: 1, text: "A gentle answer turns away wrath, but a harsh word stirs up anger." },
      { book: "Colossians", slug: "colossians", chapter: 3, verse: 12, text: "Put on therefore, as God’s chosen ones, holy and beloved, a heart of compassion, kindness, lowliness, humility, and perseverance." },
      { book: "Galatians", slug: "galatians", chapter: 5, verse: 22, text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith." },
      { book: "Micah", slug: "micah", chapter: 6, verse: 8, text: "He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?" },
      { book: "Luke", slug: "luke", chapter: 6, verse: 35, text: "But love your enemies, and do good, and lend, expecting nothing back." },
      { book: "Romans", slug: "romans", chapter: 12, verse: 10, text: "In love of the brothers be tenderly affectionate to one another; in honor prefer one another." },
      { book: "Proverbs", slug: "proverbs", chapter: 11, verse: 17, text: "The merciful man does good to his own soul, but he who is cruel troubles his own flesh." },
      { book: "Titus", slug: "titus", chapter: 3, verse: 4, text: "But when the kindness of God our Savior and his love toward mankind appeared." },
      { book: "Ruth", slug: "ruth", chapter: 2, verse: 20, text: "Naomi said to her daughter-in-law, “Blessed be he of Yahweh, who has not left off his kindness to the living and to the dead.”" },
    ],
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
    relatedVerses: [
      { book: "Philippians", slug: "philippians", chapter: 2, verse: 3, text: "Doing nothing through rivalry or through conceit, but in humility, each counting others better than himself." },
      { book: "Philippians", slug: "philippians", chapter: 2, verse: 5, text: "Have this in your mind, which was also in Christ Jesus." },
      { book: "James", slug: "james", chapter: 4, verse: 6, text: "But he gives more grace. Therefore it says, “God resists the proud, but gives grace to the humble.”" },
      { book: "James", slug: "james", chapter: 4, verse: 10, text: "Humble yourselves in the sight of the Lord, and he will exalt you." },
      { book: "1 Peter", slug: "1-peter", chapter: 5, verse: 5, text: "Likewise, you younger ones, be subject to the elder. Yes, all of you clothe yourselves with humility." },
      { book: "1 Peter", slug: "1-peter", chapter: 5, verse: 6, text: "Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time." },
      { book: "Micah", slug: "micah", chapter: 6, verse: 8, text: "He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?" },
      { book: "Matthew", slug: "matthew", chapter: 23, verse: 12, text: "Whoever exalts himself will be humbled, and whoever humbles himself will be exalted." },
      { book: "Proverbs", slug: "proverbs", chapter: 22, verse: 4, text: "The result of humility and the fear of Yahweh is wealth, honor, and life." },
      { book: "Luke", slug: "luke", chapter: 14, verse: 11, text: "For everyone who exalts himself will be humbled, and whoever humbles himself will be exalted." },
    ],
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
    relatedVerses: [
      { book: "Ephesians", slug: "ephesians", chapter: 2, verse: 8, text: "For by grace you have been saved through faith, and that not of yourselves; it is the gift of God." },
      { book: "Ephesians", slug: "ephesians", chapter: 2, verse: 9, text: "Not of works, that no one would boast." },
      { book: "2 Corinthians", slug: "2-corinthians", chapter: 12, verse: 9, text: "He has said to me, “My grace is sufficient for you, for my power is made perfect in weakness.”" },
      { book: "Romans", slug: "romans", chapter: 3, verse: 24, text: "Being justified freely by his grace through the redemption that is in Christ Jesus." },
      { book: "Romans", slug: "romans", chapter: 5, verse: 20, text: "Where sin abounded, grace abounded more exceedingly." },
      { book: "Titus", slug: "titus", chapter: 2, verse: 11, text: "For the grace of God has appeared, bringing salvation to all men." },
      { book: "Hebrews", slug: "hebrews", chapter: 4, verse: 16, text: "Let’s therefore draw near with boldness to the throne of grace, that we may receive mercy and may find grace for help in time of need." },
      { book: "John", slug: "john", chapter: 1, verse: 16, text: "From his fullness we all received grace upon grace." },
      { book: "2 Timothy", slug: "2-timothy", chapter: 1, verse: 9, text: "Who saved us and called us with a holy calling, not according to our works, but according to his own purpose and grace." },
      { book: "Acts", slug: "acts", chapter: 20, verse: 32, text: "Now, brothers, I entrust you to God and to the word of his grace, which is able to build up." },
      { book: "1 Peter", slug: "1-peter", chapter: 5, verse: 10, text: "But may the God of all grace, who called you to his eternal glory by Christ Jesus, after you have suffered a little while, perfect, establish, strengthen, and settle you." },
    ],
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
    relatedVerses: [
      { book: "Romans", slug: "romans", chapter: 12, verse: 1, text: "Therefore I urge you, brothers, by the mercies of God, to present your bodies a living sacrifice, holy, acceptable to God, which is your spiritual service." },
      { book: "Luke", slug: "luke", chapter: 9, verse: 23, text: "He said to all, “If anyone desires to come after me, let him deny himself, take up his cross, and follow me.”" },
      { book: "John", slug: "john", chapter: 15, verse: 13, text: "Greater love has no one than this, that someone lay down his life for his friends." },
      { book: "Hebrews", slug: "hebrews", chapter: 13, verse: 16, text: "But don’t forget to be doing good and sharing, for with such sacrifices God is well pleased." },
      { book: "Ephesians", slug: "ephesians", chapter: 5, verse: 2, text: "Walk in love, even as Christ also loved us and gave himself up for us, an offering and a sacrifice to God." },
      { book: "Mark", slug: "mark", chapter: 8, verse: 34, text: "He called the multitude to himself with his disciples and said to them, “Whoever wants to come after me, let him deny himself, and take up his cross, and follow me.”" },
      { book: "Philippians", slug: "philippians", chapter: 2, verse: 8, text: "And being found in human form, he humbled himself, becoming obedient to the point of death, yes, the death of the cross." },
      { book: "1 John", slug: "1-john", chapter: 3, verse: 16, text: "By this we know love, because he laid down his life for us. And we ought to lay down our lives for the brothers." },
      { book: "Psalms", slug: "psalms", chapter: 51, verse: 17, text: "The sacrifices of God are a broken spirit. O God, you will not despise a broken and contrite heart." },
      { book: "Hebrews", slug: "hebrews", chapter: 9, verse: 26, text: "But now once at the end of the ages, he has been revealed to put away sin by the sacrifice of himself." },
    ],
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
    relatedVerses: [
      { book: "Hebrews", slug: "hebrews", chapter: 11, verse: 1, text: "Now faith is assurance of things hoped for, proof of things not seen." },
      { book: "Hebrews", slug: "hebrews", chapter: 11, verse: 6, text: "Without faith it is impossible to be well pleasing to him, for he who comes to God must believe that he exists, and that he is a rewarder of those who seek him." },
      { book: "2 Corinthians", slug: "2-corinthians", chapter: 5, verse: 7, text: "For we walk by faith, not by sight." },
      { book: "Romans", slug: "romans", chapter: 10, verse: 17, text: "So faith comes by hearing, and hearing by the word of God." },
      { book: "Romans", slug: "romans", chapter: 1, verse: 17, text: "For in it is revealed God’s righteousness from faith to faith. As it is written, “But the righteous shall live by faith.”" },
      { book: "Mark", slug: "mark", chapter: 11, verse: 22, text: "Jesus answered them, “Have faith in God.”" },
      { book: "Matthew", slug: "matthew", chapter: 17, verse: 20, text: "For most certainly I tell you, if you have faith as a grain of mustard seed, you will tell this mountain, ‘Move from here to there,’ and it will move." },
      { book: "James", slug: "james", chapter: 1, verse: 6, text: "But let him ask in faith, without any doubting, for he who doubts is like a wave of the sea, driven by the wind and tossed." },
      { book: "Ephesians", slug: "ephesians", chapter: 2, verse: 8, text: "For by grace you have been saved through faith, and that not of yourselves; it is the gift of God." },
      { book: "Galatians", slug: "galatians", chapter: 2, verse: 20, text: "I have been crucified with Christ, and it is no longer I who live, but Christ lives in me. That life which I now live in the flesh, I live by faith in the Son of God." },
      { book: "Proverbs", slug: "proverbs", chapter: 3, verse: 5, text: "Trust in Yahweh with all your heart, and don’t lean on your own understanding." },
    ],
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
    relatedVerses: [
      { book: "1 Peter", slug: "1-peter", chapter: 1, verse: 3, text: "Blessed be the God and Father of our Lord Jesus Christ, who according to his great mercy caused us to be born again to a living hope through the resurrection of Jesus Christ from the dead." },
      { book: "Romans", slug: "romans", chapter: 5, verse: 5, text: "And hope doesn’t disappoint us, because God’s love has been poured into our hearts through the Holy Spirit who was given to us." },
      { book: "Romans", slug: "romans", chapter: 15, verse: 13, text: "Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope in the power of the Holy Spirit." },
      { book: "Jeremiah", slug: "jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you,” says Yahweh, “thoughts of peace, and not of evil, to give you hope and a future." },
      { book: "Hebrews", slug: "hebrews", chapter: 6, verse: 19, text: "This hope we have as an anchor of the soul, a hope both sure and steadfast." },
      { book: "Psalms", slug: "psalms", chapter: 42, verse: 11, text: "Why are you in despair, my soul? Why are you disturbed within me? Hope in God! For I shall still praise him." },
      { book: "Psalms", slug: "psalms", chapter: 39, verse: 7, text: "Now, Lord, what do I wait for? My hope is in you." },
      { book: "Lamentations", slug: "lamentations", chapter: 3, verse: 24, text: "“Yahweh is my portion,” says my soul. “Therefore I will hope in him.”" },
      { book: "Titus", slug: "titus", chapter: 2, verse: 13, text: "Looking for the blessed hope and appearing of the glory of our great God and Savior, Jesus Christ." },
      { book: "Colossians", slug: "colossians", chapter: 1, verse: 27, text: "To whom God was pleased to make known what are the riches of the glory of this mystery among the Gentiles, which is Christ in you, the hope of glory." },
    ],
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
    relatedVerses: [
      { book: "John", slug: "john", chapter: 14, verse: 27, text: "Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don’t let your heart be troubled, neither let it be fearful." },
      { book: "Philippians", slug: "philippians", chapter: 4, verse: 6, text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God." },
      { book: "Philippians", slug: "philippians", chapter: 4, verse: 7, text: "And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus." },
      { book: "Isaiah", slug: "isaiah", chapter: 26, verse: 3, text: "You will keep whoever’s mind is steadfast in perfect peace, because he trusts in you." },
      { book: "John", slug: "john", chapter: 16, verse: 33, text: "I have told you these things, that in me you may have peace. In the world you have trouble; but cheer up! I have overcome the world." },
      { book: "Colossians", slug: "colossians", chapter: 3, verse: 15, text: "And let the peace of God rule in your hearts, to which also you were called in one body, and be thankful." },
      { book: "Romans", slug: "romans", chapter: 5, verse: 1, text: "Being therefore justified by faith, we have peace with God through our Lord Jesus Christ." },
      { book: "Psalms", slug: "psalms", chapter: 29, verse: 11, text: "Yahweh will give strength to his people. Yahweh will bless his people with peace." },
      { book: "Psalms", slug: "psalms", chapter: 4, verse: 8, text: "In peace I will both lay myself down and sleep, for you alone, Yahweh, make me live in safety." },
      { book: "2 Thessalonians", slug: "2-thessalonians", chapter: 3, verse: 16, text: "Now may the Lord of peace himself give you peace at all times in all ways. The Lord be with you all." },
      { book: "Matthew", slug: "matthew", chapter: 5, verse: 9, text: "Blessed are the peacemakers, for they shall be called children of God." },
    ],
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
    relatedVerses: [
      { book: "Colossians", slug: "colossians", chapter: 3, verse: 13, text: "Bearing with one another, and forgiving each other, if any man has a complaint against any; even as Christ forgave you, so you also do." },
      { book: "1 John", slug: "1-john", chapter: 1, verse: 9, text: "If we confess our sins, he is faithful and righteous to forgive us the sins and to cleanse us from all unrighteousness." },
      { book: "Ephesians", slug: "ephesians", chapter: 4, verse: 32, text: "And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you." },
      { book: "Matthew", slug: "matthew", chapter: 6, verse: 14, text: "For if you forgive men their trespasses, your heavenly Father will also forgive you." },
      { book: "Matthew", slug: "matthew", chapter: 18, verse: 21, text: "Then Peter came and said to him, “Lord, how often shall my brother sin against me, and I forgive him? Until seven times?”" },
      { book: "Matthew", slug: "matthew", chapter: 18, verse: 22, text: "Jesus said to him, “I don’t tell you until seven times, but, until seventy times seven.”" },
      { book: "Psalms", slug: "psalms", chapter: 103, verse: 12, text: "As far as the east is from the west, so far has he removed our transgressions from us." },
      { book: "Isaiah", slug: "isaiah", chapter: 1, verse: 18, text: "“Come now, and let’s reason together,” says Yahweh: “Though your sins are as scarlet, they shall be as white as snow.”" },
      { book: "Luke", slug: "luke", chapter: 6, verse: 37, text: "Don’t judge, and you won’t be judged. Don’t condemn, and you won’t be condemned. Set free, and you will be set free." },
      { book: "Acts", slug: "acts", chapter: 3, verse: 19, text: "Repent therefore, and turn again, that your sins may be blotted out, so that there may come times of refreshing from the presence of the Lord." },
    ],
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
    relatedVerses: [
      { book: "1 Thessalonians", slug: "1-thessalonians", chapter: 5, verse: 18, text: "In everything give thanks, for this is the will of God in Christ Jesus toward you." },
      { book: "James", slug: "james", chapter: 1, verse: 17, text: "Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom can be no variation nor turning shadow." },
      { book: "Psalms", slug: "psalms", chapter: 100, verse: 4, text: "Enter into his gates with thanksgiving, and into his courts with praise. Give thanks to him, and bless his name." },
      { book: "Psalms", slug: "psalms", chapter: 107, verse: 1, text: "Give thanks to Yahweh, for he is good, for his loving kindness endures forever." },
      { book: "Colossians", slug: "colossians", chapter: 3, verse: 15, text: "And let the peace of God rule in your hearts, to which also you were called in one body, and be thankful." },
      { book: "Colossians", slug: "colossians", chapter: 3, verse: 17, text: "Whatever you do, in word or in deed, do all in the name of the Lord Jesus, giving thanks to God the Father through him." },
      { book: "Ephesians", slug: "ephesians", chapter: 5, verse: 20, text: "Giving thanks always concerning all things in the name of our Lord Jesus Christ to God, even the Father." },
      { book: "Philippians", slug: "philippians", chapter: 4, verse: 6, text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God." },
      { book: "Psalms", slug: "psalms", chapter: 118, verse: 24, text: "This is the day that Yahweh has made. We will rejoice and be glad in it!" },
      { book: "Luke", slug: "luke", chapter: 17, verse: 15, text: "One of them, when he saw that he was healed, turned back, glorifying God with a loud voice." },
    ],
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

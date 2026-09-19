/**
 * CECUREUS — Mental Health Articles & Community Blogs Microservice
 *
 * Why this file was created:
 * This router powers the psychoeducational content and community storytelling platform:
 * - Paginated blog feed (`GET /api/v1/blogs?page=1&limit=10`) with category and keyword search filtering.
 * - Virtualized infinite scroll support on client devices.
 * - Single article deep-dive (`GET /api/v1/blogs/:id`).
 * - Community blog publishing (`POST /api/v1/blogs`).
 */

const express = require('express');
const router = express.Router();
const { optionalAuthenticate } = require('../middleware/authenticate');

// In-memory curated blog database with rich clinical psychoeducation
let BLOG_POSTS = [
  {
    id: 'art_1',
    title: 'Overcoming Workplace Imposter Syndrome & Burnout',
    readTime: '4 min read',
    author: 'Dr. Neha Sharma',
    authorRole: 'Clinical Psychologist',
    category: 'workplace',
    categoryLabel: 'Workplace',
    date: 'Sep 18, 2026',
    summary: 'Practical psychological techniques to quiet your inner critic and set healthy professional boundaries.',
    content: [
      'Imposter syndrome is an internal feeling of being a fraud despite objective evidence of competence. In high-pressure modern environments, this cognitive distortion frequently becomes the prelude to clinical burnout.',
      'When left unchecked, the fear of exposure leads to hyper-vigilance, over-preparation, inability to delegate, and severe emotional exhaustion. Recognizing that self-doubt is a conditioned cognitive response rather than a factual reflection of ability is the first critical step toward recovery.',
      'Clinical studies show that over 70% of professionals experience imposter phenomena at least once in their career. The goal is not to silence doubt completely, but to de-fuse from it using acceptance and commitment techniques.',
    ],
    takeaways: [
      'Document objective achievements in a "Gratitude & Win Journal" to counter negative cognitive bias.',
      'Separate emotion from fact: feeling inadequate does not equate to being inadequate.',
      'Establish non-negotiable boundaries between professional deadlines and personal recovery time.',
    ],
    likes: 42,
    isUserSubmitted: false,
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'art_2',
    title: 'The Neuroscience of 4-7-8 Breathing for Acute Panic',
    readTime: '3 min read',
    author: 'Dr. Ayesha Khan',
    authorRole: 'Psychiatrist',
    category: 'stress',
    categoryLabel: 'Stress',
    date: 'Sep 15, 2026',
    summary: 'How intentional respiratory modulation triggers the parasympathetic nervous system within 90 seconds.',
    content: [
      'When psychological stress triggers the sympathetic nervous system ("fight or flight"), heart rate accelerates, cortisol surges, and prefrontal cognitive processing becomes restricted.',
      'The 4-7-8 breathing pattern directly stimulates the vagus nerve. By doubling the duration of exhalation relative to inhalation, arterial blood pressure drops and the body signals safety to the brain.',
      'Practicing this exercise twice daily builds autonomic resilience, allowing you to intercept anxiety spikes before they escalate into acute panic attacks.',
    ],
    takeaways: [
      'Inhale quietly through your nose for 4 seconds.',
      'Gently hold your breath for 7 seconds without tension.',
      'Exhale completely through your mouth with a soft whoosh for 8 seconds. Repeat 4 cycles.',
    ],
    likes: 89,
    isUserSubmitted: false,
    created_at: '2026-09-15T08:30:00Z',
  },
  {
    id: 'art_3',
    title: 'Sleep Hygiene & Restorative Circadian Rhythms',
    readTime: '5 min read',
    author: 'Dr. Arjun Patel',
    authorRole: 'Clinical Psychologist',
    category: 'sleep',
    categoryLabel: 'Sleep',
    date: 'Sep 12, 2026',
    summary: 'Clinical recommendations for restoring deep REM sleep architecture amidst digital screen fatigue.',
    content: [
      'Chronic insomnia and fragmented sleep patterns are both a primary symptom and an amplifier of depression and generalized anxiety disorders.',
      'Artificial blue spectrum light from mobile devices suppresses melatonin secretion by up to 85%, artificially delaying your circadian sleep window.',
      'By anchoring your morning wake time and creating a low-stimulation wind-down sanctuary, your brain relearns the physiological cues for restorative rest.',
    ],
    takeaways: [
      'Keep your wake time consistent within 30 minutes, even on weekends.',
      'Dim ambient lighting and eliminate screen exposure at least 45 minutes prior to sleep.',
      'Keep the bedroom temperature cool (between 18°C–20°C) to support core body cooling.',
    ],
    likes: 56,
    isUserSubmitted: false,
    created_at: '2026-09-12T14:15:00Z',
  },
  {
    id: 'art_4',
    title: 'Cognitive Reframing: Breaking Free from All-or-Nothing Thinking',
    readTime: '4 min read',
    author: 'Dr. Ayesha Khan',
    authorRole: 'Psychiatrist',
    category: 'anxiety',
    categoryLabel: 'Anxiety',
    date: 'Sep 10, 2026',
    summary: 'Identify cognitive distortions and replace catastrophic black-and-white perspectives with nuanced realities.',
    content: [
      'All-or-nothing thinking (or black-and-white cognitive bias) convinces us that if a situation is not completely perfect, it is an irredeemable failure.',
      'This cognitive trap intensifies social anxiety, performance pressure, and depression. A missed workout or an awkward sentence in a meeting is magnified into proof of total inadequacy.',
      'Cognitive behavioral reframing teaches you to identify automatic thoughts, examine real supporting and contradicting evidence, and adopt a balanced middle-ground narrative.',
    ],
    takeaways: [
      'Notice cognitive extreme words: "always", "never", "ruined", "worthless".',
      'Ask yourself: "What is the middle path? What advice would I give a close friend in this position?"',
      'Embrace 80% completion over paralyzing 100% perfectionism.',
    ],
    likes: 64,
    isUserSubmitted: false,
    created_at: '2026-09-10T11:00:00Z',
  },
  {
    id: 'art_5',
    title: 'Navigating Boundaries Without Chronic Guilt',
    readTime: '5 min read',
    author: 'Dr. Neha Sharma',
    authorRole: 'Clinical Psychologist',
    category: 'growth',
    categoryLabel: 'Growth',
    date: 'Sep 06, 2026',
    summary: 'Why saying no is an essential act of mental preservation rather than personal selfishness.',
    content: [
      'Many people confuse healthy personal boundaries with cold rejection. When raised in environments that prioritized people-pleasing, asserting boundaries often triggers intense somatic guilt.',
      'However, chronic boundary violations inevitably breed resentment, physical exhaustion, and passive-aggressive withdrawal.',
      'A boundary is not a demand placed on someone else; it is a clear statement of what you will do to protect your peace and well-being.',
    ],
    takeaways: [
      '"No" is a complete sentence that does not require defensive over-justification.',
      'Tolerate short-term discomfort in exchange for long-term emotional integrity.',
      'Communicate boundaries calmly, respectfully, and early before resentment builds.',
    ],
    likes: 73,
    isUserSubmitted: false,
    created_at: '2026-09-06T09:45:00Z',
  },
  {
    id: 'art_6',
    title: 'Exam Pressure & Academic Decompression Strategies',
    readTime: '4 min read',
    author: 'Dr. Arjun Patel',
    authorRole: 'Clinical Psychologist',
    category: 'stress',
    categoryLabel: 'Stress',
    date: 'Sep 02, 2026',
    summary: 'How students and test-takers can sustain mental clarity and prevent cognitive paralysis during finals.',
    content: [
      'Academic testing environments often trigger intense somatic anxiety: racing pulse, memory blanks, and catastrophizing thoughts.',
      'Understanding the Yerkes-Dodson law helps us realize that moderate arousal enhances performance, but excessive panic leads to cognitive bottlenecking.',
      'Structured study intervals combined with deliberate physical movement discharge excess adrenaline, preserving working memory bandwidth.',
    ],
    takeaways: [
      'Utilize 25-minute Pomodoro study cycles with mandatory 5-minute movement breaks.',
      'If your mind goes blank on a question, take two deep diaphragmatic breaths and skip ahead.',
      'Your worth as an individual is not defined by numerical examination scores.',
    ],
    likes: 38,
    isUserSubmitted: false,
    created_at: '2026-09-02T16:20:00Z',
  },
  {
    id: 'art_7',
    title: 'Grounding Techniques: The 5-4-3-2-1 Sensory Reset',
    readTime: '3 min read',
    author: 'Dr. Ayesha Khan',
    authorRole: 'Psychiatrist',
    category: 'anxiety',
    categoryLabel: 'Anxiety',
    date: 'Aug 28, 2026',
    summary: 'Anchor your nervous system back into the physical present during sudden trauma or anxiety triggers.',
    content: [
      'During severe anxiety or sensory overload, the mind becomes unmoored from physical reality, hyper-fixating on internal alarms.',
      'The 5-4-3-2-1 grounding technique forces the brain to redirect neurological attention outward through the five sensory pathways.',
      'By consciously observing external textures, sounds, and scents, the amygdala receives concrete evidence that the immediate environment is safe.',
    ],
    takeaways: [
      '5 things you can see around you.',
      '4 things you can physically touch.',
      '3 distinct sounds you can hear.',
      '2 scents you can smell.',
      '1 flavor you can taste.',
    ],
    likes: 95,
    isUserSubmitted: false,
    created_at: '2026-08-28T12:00:00Z',
  },
  {
    id: 'art_8',
    title: 'Self-Compassion in the Wake of Relapse or Setback',
    readTime: '6 min read',
    author: 'Dr. Neha Sharma',
    authorRole: 'Clinical Psychologist',
    category: 'growth',
    categoryLabel: 'Growth',
    date: 'Aug 22, 2026',
    summary: 'Why beating yourself up stalls healing, and how fierce self-kindness accelerates sustainable resilience.',
    content: [
      'Healing is non-linear. Whether dealing with depressive episodes, anxiety triggers, or habit relapse, setbacks are a normal part of the human condition.',
      'Dr. Kristin Neff’s clinical research confirms that harsh self-criticism triggers stress responses, whereas self-compassion releases oxytocin and promotes restorative neuroplasticity.',
      'Treating yourself with the gentle understanding you would offer a struggling child creates the emotional safety needed to stand back up.',
    ],
    takeaways: [
      'A setback is a data point, not a verdict on your character.',
      'Replace internal scolding with mindful validation: "This is a moment of suffering, and suffering is part of living."',
      'Focus on the very next microscopic healthy choice.',
    ],
    likes: 81,
    isUserSubmitted: false,
    created_at: '2026-08-22T14:30:00Z',
  },
];

/**
 * GET /api/v1/blogs
 * Paginated blog archive with filtering
 */
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const category = (req.query.category || '').toLowerCase().trim();
    const search = (req.query.search || '').toLowerCase().trim();

    let filtered = [...BLOG_POSTS];

    if (category && category !== 'all') {
      filtered = filtered.filter(
        (b) => b.category.toLowerCase() === category || (b.categoryLabel && b.categoryLabel.toLowerCase() === category)
      );
    }

    if (search) {
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.summary.toLowerCase().includes(search) ||
          b.author.toLowerCase().includes(search) ||
          b.content.some((c) => c.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBlogs = filtered.slice(startIndex, endIndex);

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      blogs: paginatedBlogs,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch blogs', details: err.message });
  }
});

/**
 * GET /api/v1/blogs/:id
 * Single article retrieval
 */
router.get('/:id', (req, res) => {
  const blog = BLOG_POSTS.find((b) => b.id === req.params.id);
  if (!blog) {
    return res.status(404).json({ error: 'Article not found' });
  }
  return res.json({ success: true, blog });
});

/**
 * POST /api/v1/blogs
 * Community story publishing
 */
router.post('/', (req, res) => {
  const { title, summary, category, content, author } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newPost = {
    id: `comm_${Date.now()}`,
    title: title.trim(),
    readTime: '3 min read',
    author: author ? author.trim() : 'Community Member',
    authorRole: 'Community Voice',
    category: (category || 'growth').toLowerCase().trim(),
    categoryLabel: category || 'Community Story',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    summary: summary ? summary.trim() : title.trim(),
    content: Array.isArray(content) ? content : [String(content)],
    takeaways: ['Shared courage inspires community resilience.'],
    likes: 1,
    isUserSubmitted: true,
    created_at: new Date().toISOString(),
  };

  BLOG_POSTS.unshift(newPost);

  return res.status(201).json({
    success: true,
    message: 'Blog published successfully to the community feed',
    blog: newPost,
  });
});

module.exports = router;

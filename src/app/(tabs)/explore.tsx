/**
 * CECUREUS — Explore, Mental Health Resources & Community Blog Platform
 *
 * Why this file was created:
 * This screen provides a psychoeducational resource hub and interactive community wellness blogging platform.
 * It was created to facilitate self-directed healing, reflection, and peer support:
 * - Interactive clinical self-assessments (Stress, Burnout, Anxiety, Work-Life Balance, Sleep Quality, Depression).
 * - High-value psychoeducational article reader (opens full articles with clinical takeaways and like counter).
 * - "Write a Blog / Share Your Story": Enables users to write and publish their own wellness reflections and read community posts.
 * - Dynamic category filtering (All, Stress, Anxiety, Sleep, Workplace, Growth) and instant keyword search.
 * - Functional "View All >" links for comprehensive assessment exploration and full blog archive browsing.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface ArticleItem {
  id: string;
  title: string;
  readTime: string;
  author: string;
  authorRole: string;
  category: string;
  summary: string;
  content: string[];
  takeaways: string[];
  likes: number;
  date: string;
  isUserSubmitted?: boolean;
}

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'stress', label: 'Stress', emoji: '😐' },
  { key: 'anxiety', label: 'Anxiety', emoji: '😟' },
  { key: 'sleep', label: 'Sleep', emoji: '🌙' },
  { key: 'workplace', label: 'Workplace', emoji: '💼' },
  { key: 'growth', label: 'Growth', emoji: '🌱' },
];

const INITIAL_ASSESSMENTS = [
  {
    id: 'stress_check',
    title: 'Stress Level\nCheck',
    description: 'Find out your current chronic and acute stress levels',
    duration: '5 mins',
    dotColor: '#00A99D',
    category: 'stress',
  },
  {
    id: 'burnout_eval',
    title: 'Burnout\nAssessment',
    description: "Evaluate workplace exhaustion and emotional depletion",
    duration: '7 mins',
    dotColor: '#F59E0B',
    category: 'workplace',
  },
  {
    id: 'anxiety_screen',
    title: 'Anxiety\nScreening',
    description: 'Clinically validated screening for generalized anxiety',
    duration: '5 mins',
    dotColor: '#8B5CF6',
    category: 'anxiety',
  },
  {
    id: 'work_life_score',
    title: 'Work-Life\nBalance Score',
    description: 'Evaluate boundaries between career and personal life',
    duration: '6 mins',
    dotColor: '#10B981',
    category: 'workplace',
  },
  {
    id: 'sleep_quality',
    title: 'Sleep Quality\nIndex',
    description: 'Assess restorative sleep patterns and insomnia cues',
    duration: '4 mins',
    dotColor: '#3B82F6',
    category: 'sleep',
  },
  {
    id: 'depression_screen',
    title: 'Depression\nSeverity Screen',
    description: 'Screen mood vitality, interest levels, and energy',
    duration: '6 mins',
    dotColor: '#EC4899',
    category: 'growth',
  },
];

const INITIAL_ARTICLES: ArticleItem[] = [
  {
    id: 'art_1',
    title: 'Overcoming Workplace Imposter Syndrome & Burnout',
    readTime: '4 min read',
    author: 'Dr. Neha Sharma',
    authorRole: 'Clinical Psychologist',
    category: 'Workplace',
    date: 'Sep 18, 2026',
    summary: 'Practical psychological techniques to quiet your inner critic and set healthy professional boundaries.',
    content: [
      'Imposter syndrome is the pervasive feeling that you are a fraud and that your accomplishments are merely the result of luck rather than competence. In modern fast-paced work cultures, this is frequently amplified by constant comparisons and perfectionism.',
      'To break the cycle, begin by separating feelings from facts. Just because you feel inadequate during a challenging project does not mean you lack the ability to succeed. Document your objective wins in a dedicated "brag sheet" and review it whenever self-doubt surfaces.',
      'Establish non-negotiable end-of-day boundaries. When you step away from your desk, mentally clock out. Taking restorative evening walks, avoiding late-night Slack checks, and practicing mindful pacing protects your cognitive bandwidth and prevents chronic burnout.',
    ],
    takeaways: [
      'Separate subjective feelings from objective track records of success.',
      'Keep a factual log of daily accomplishments and client appreciation.',
      'Protect evening shutdown rituals to replenish neurotransmitters for the next day.',
    ],
    likes: 84,
  },
  {
    id: 'art_2',
    title: 'Understanding the Gut-Brain Axis: How Anxiety Affects Digestion',
    readTime: '6 min read',
    author: 'Dr. Ayesha Khan',
    authorRole: 'Board-Certified Psychiatrist',
    category: 'Anxiety',
    date: 'Sep 15, 2026',
    summary: 'The vagus nerve links your enteric nervous system with emotional centers in the brain.',
    content: [
      'Ever wondered why you get butterflies in your stomach before a big presentation or experience stomach cramps when stressed? The enteric nervous system contains over 500 million neurons and communicates bidirectionally with your brain along the vagus nerve.',
      'When your sympathetic nervous system triggers the "fight-or-flight" response, blood is diverted away from digestion toward peripheral muscles. This creates gastrointestinal discomfort, bloating, or nausea.',
      'Activating the parasympathetic nervous system through 4-7-8 diaphragmatic breathing signals safety to both your digestive system and your amygdala, quickly restoring physical equilibrium.',
    ],
    takeaways: [
      'The brain and gut share a continuous neural dialogue via the vagus nerve.',
      'Acute stress inhibits digestive enzyme secretion and gastrointestinal blood flow.',
      'Box breathing and diaphragmatic pacing restore digestive balance within minutes.',
    ],
    likes: 126,
  },
  {
    id: 'art_3',
    title: '5 Micro-Habits for Restorative Deep REM Sleep',
    readTime: '3 min read',
    author: 'Mr. Rohan Verma',
    authorRole: 'Counselling Psychologist',
    category: 'Sleep',
    date: 'Sep 12, 2026',
    summary: 'How small shifts in circadian alignment and evening temperature regulation double sleep quality.',
    content: [
      'Sleep is not simply the absence of wakefulness; it is an active neurobiological repair process where your brain consolidates memory and clears metabolic waste.',
      'First, prioritize morning sunlight exposure within 30 minutes of waking. This sets your master circadian clock (the suprachiasmatic nucleus) and anchors melatonin release 14 to 16 hours later.',
      'Second, keep your bedroom cool (around 19°C to 20°C). Your body needs to drop its core temperature by 1°C to initiate deep sleep. A warm shower 90 minutes before bed accelerates this drop.',
    ],
    takeaways: [
      'Morning sunlight anchors your evening melatonin release curve.',
      'A cooler bedroom temperature triggers the physiological onset of sleep.',
      'Avoid high-intensity blue light screens for 45 minutes prior to sleep.',
    ],
    likes: 95,
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState<ArticleItem[]>(INITIAL_ARTICLES);
  const [showAllAssessments, setShowAllAssessments] = useState(false);

  // Reader Modal State
  const [readingArticle, setReadingArticle] = useState<ArticleItem | null>(null);
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});

  // Write Blog Modal State
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('Stress');
  const [newBlogAuthor, setNewBlogAuthor] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Filter Assessments
  const filteredAssessments = INITIAL_ASSESSMENTS.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const displayedAssessments = showAllAssessments
    ? filteredAssessments
    : filteredAssessments.slice(0, 4);

  // Filter Articles
  const filteredArticles = articles.filter((art) => {
    if (selectedCategory !== 'all' && art.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.author.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Article Like
  const handleToggleLike = (id: string) => {
    const isLiked = likedArticles[id];
    setLikedArticles((prev) => ({ ...prev, [id]: !isLiked }));
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, likes: isLiked ? a.likes - 1 : a.likes + 1 } : a))
    );
    if (readingArticle && readingArticle.id === id) {
      setReadingArticle((prev) =>
        prev ? { ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1 } : null
      );
    }
  };

  // Handle Share Article
  const handleShareArticle = async (article: ArticleItem) => {
    try {
      await Share.share({
        title: article.title,
        message: `Check out this wellness read on CecureUs: "${article.title}" by ${article.author}.`,
      });
    } catch {
      // Ignored
    }
  };

  // Handle Publish User Blog
  const handlePublishBlog = () => {
    if (!newBlogTitle.trim() || !newBlogContent.trim()) {
      Alert.alert('Required Fields', 'Please enter a title and content for your wellness reflection.');
      return;
    }

    const newArticle: ArticleItem = {
      id: `user_blog_${Date.now()}`,
      title: newBlogTitle.trim(),
      readTime: '3 min read',
      author: isAnonymous ? 'Community Peer' : newBlogAuthor.trim() || 'Community Member',
      authorRole: isAnonymous ? 'Anonymous Reflection' : 'Community Story',
      category: newBlogCategory,
      date: 'Just now',
      summary: newBlogContent.slice(0, 110) + '...',
      content: newBlogContent.split('\n\n').filter((p) => p.trim().length > 0),
      takeaways: [
        'Sharing personal experiences helps reduce isolation and stigma.',
        'Every journey with mental well-being is unique and valid.',
      ],
      likes: 1,
      isUserSubmitted: true,
    };

    setArticles([newArticle, ...articles]);
    setNewBlogTitle('');
    setNewBlogAuthor('');
    setNewBlogContent('');
    setWriteModalVisible(false);

    Alert.alert('Blog Published!', 'Your story is now live in the CecureUs community library.');
  };

  return (
    <ScreenContainer>
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore &amp; Learn</Text>
        <Text style={styles.subtitle}>Discover clinically backed resources to understand, heal, and grow.</Text>
      </View>

      {/* ── SEARCH BAR ──────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Input
            placeholder="Search blogs, self-assessments, topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search-outline" size={20} color={colors.textMuted} />}
            rightIcon={
              searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="filter-outline" size={18} color={colors.textMuted} />
              )
            }
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* ── CATEGORY PILLS BAR ──────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => {
                setSelectedCategory(cat.key);
                setShowAllAssessments(false);
              }}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              activeOpacity={0.8}
            >
              {cat.icon ? (
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={isSelected ? '#00A99D' : colors.textSecondary}
                  style={styles.chipIcon}
                />
              ) : (
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              )}
              <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── SELF ASSESSMENTS SECTION ───────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <View style={styles.sectionTitleWithIcon}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#00A99D" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Self Assessments</Text>
          </View>
          <Text style={styles.sectionSub}>Screen your current emotional and cognitive state.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setShowAllAssessments(!showAllAssessments);
            setSelectedCategory('all');
          }}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>
            {showAllAssessments ? 'Show Less' : 'View All >'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2x2 Assessments Grid */}
      <View style={styles.assessmentGrid}>
        {displayedAssessments.map((item) => (
          <Card
            key={item.id}
            style={styles.assessmentCard}
            onPress={() => router.push(`/assessment/${item.id}`)}
          >
            <Text style={styles.assessmentTitle}>{item.title}</Text>
            <View style={[styles.assessmentDot, { backgroundColor: item.dotColor }]} />
            <Text style={styles.assessmentDesc}>{item.description}</Text>
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.durationText}>{item.duration}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </View>
          </Card>
        ))}
      </View>

      {/* ── BLOGS & ARTICLES SECTION ────────────────────────────── */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.sectionTitleWithIcon}>
            <Ionicons name="book-outline" size={20} color="#00A99D" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Blogs &amp; Articles</Text>
          </View>
          <Text style={styles.sectionSub}>Expert guidance and community reflections.</Text>
        </View>

        {/* Action Buttons: Write Blog & View All */}
        <View style={styles.blogHeaderActions}>
          <TouchableOpacity
            style={styles.writeBlogPill}
            onPress={() => setWriteModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.writeBlogPillText}>Write Blog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedCategory('all')}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Articles List */}
      <View style={styles.articleList}>
        {filteredArticles.map((art) => (
          <Card
            key={art.id}
            style={styles.articleCard}
            onPress={() => setReadingArticle(art)}
          >
            <View style={styles.articleContent}>
              <View style={styles.articleMeta}>
                <View style={[styles.categoryBadge, art.isUserSubmitted && styles.communityBadge]}>
                  <Text style={[styles.articleCategory, art.isUserSubmitted && styles.communityCategoryText]}>
                    {art.isUserSubmitted ? 'Community Story' : art.category}
                  </Text>
                </View>
                <Text style={styles.articleDot}>·</Text>
                <Text style={styles.articleReadTime}>{art.readTime}</Text>
                <Text style={styles.articleDot}>·</Text>
                <Text style={styles.articleDate}>{art.date}</Text>
              </View>

              <Text style={styles.articleTitle}>{art.title}</Text>
              <Text style={styles.articleSummary} numberOfLines={2}>
                {art.summary}
              </Text>

              <View style={styles.articleFooter}>
                <Text style={styles.articleAuthor}>By {art.author}</Text>
                <View style={styles.likesRow}>
                  <Ionicons name="heart" size={14} color={likedArticles[art.id] ? '#EF4444' : colors.textMuted} />
                  <Text style={styles.likesCount}>{art.likes}</Text>
                </View>
              </View>
            </View>

            <View style={styles.articleArrow}>
              <Ionicons name="chevron-forward" size={20} color="#00A99D" />
            </View>
          </Card>
        ))}
      </View>

      {/* ── ARTICLE READER MODAL ────────────────────────────────── */}
      <Modal visible={!!readingArticle} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.readerModalSheet}>
            {readingArticle && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.readerScroll}>
                {/* Close & Share Bar */}
                <View style={styles.readerTopBar}>
                  <TouchableOpacity
                    onPress={() => setReadingArticle(null)}
                    style={styles.readerCloseBtn}
                  >
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <View style={styles.readerTopActions}>
                    <TouchableOpacity
                      onPress={() => handleToggleLike(readingArticle.id)}
                      style={styles.readerActionBtn}
                    >
                      <Ionicons
                        name={likedArticles[readingArticle.id] ? 'heart' : 'heart-outline'}
                        size={22}
                        color={likedArticles[readingArticle.id] ? '#EF4444' : colors.textSecondary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleShareArticle(readingArticle)}
                      style={styles.readerActionBtn}
                    >
                      <Ionicons name="share-social-outline" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Article Header */}
                <View style={styles.readerHeader}>
                  <View style={styles.readerCategoryBadge}>
                    <Text style={styles.readerCategoryText}>{readingArticle.category}</Text>
                  </View>
                  <Text style={styles.readerTitle}>{readingArticle.title}</Text>
                  <View style={styles.readerAuthorRow}>
                    <View style={styles.authorAvatarCircle}>
                      <Text style={styles.authorInitial}>
                        {readingArticle.author.replace('Dr. ', '').charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.readerAuthorName}>{readingArticle.author}</Text>
                      <Text style={styles.readerAuthorRole}>
                        {readingArticle.authorRole} · {readingArticle.readTime}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Key Takeaways Card */}
                <Card style={styles.takeawaysCard}>
                  <View style={styles.takeawaysHeader}>
                    <Ionicons name="bulb-outline" size={18} color="#00A99D" style={{ marginRight: 6 }} />
                    <Text style={styles.takeawaysHeading}>Key Clinical Takeaways</Text>
                  </View>
                  {readingArticle.takeaways.map((takeaway, idx) => (
                    <View key={idx} style={styles.takeawayItem}>
                      <Text style={styles.takeawayBullet}>•</Text>
                      <Text style={styles.takeawayText}>{takeaway}</Text>
                    </View>
                  ))}
                </Card>

                {/* Full Article Body */}
                <View style={styles.articleBody}>
                  {readingArticle.content.map((paragraph, idx) => (
                    <Text key={idx} style={styles.paragraphText}>
                      {paragraph}
                    </Text>
                  ))}
                </View>

                {/* Reader Footer */}
                <View style={styles.readerFooter}>
                  <TouchableOpacity
                    style={[
                      styles.helpfulBtn,
                      likedArticles[readingArticle.id] && styles.helpfulBtnActive,
                    ]}
                    onPress={() => handleToggleLike(readingArticle.id)}
                  >
                    <Ionicons
                      name={likedArticles[readingArticle.id] ? 'heart' : 'heart-outline'}
                      size={18}
                      color={likedArticles[readingArticle.id] ? '#EF4444' : '#00A99D'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.helpfulBtnText,
                        likedArticles[readingArticle.id] && styles.helpfulBtnTextActive,
                      ]}
                    >
                      {likedArticles[readingArticle.id] ? 'Liked' : 'Helpful'} ({readingArticle.likes})
                    </Text>
                  </TouchableOpacity>

                  <Button
                    title="Close Reader"
                    variant="secondary"
                    size="md"
                    onPress={() => setReadingArticle(null)}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── WRITE A BLOG MODAL ──────────────────────────────────── */}
      <Modal visible={writeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Share Your Story</Text>
                  <Text style={styles.sheetSub}>Write a wellness reflection or coping advice</Text>
                </View>
                <TouchableOpacity onPress={() => setWriteModalVisible(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>Story Title</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="e.g. How I Navigated Exam Anxiety Without Panicking"
                placeholderTextColor={colors.textMuted}
                value={newBlogTitle}
                onChangeText={setNewBlogTitle}
              />

              {/* Category Picker */}
              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                {['Stress', 'Anxiety', 'Sleep', 'Workplace', 'Personal Growth'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewBlogCategory(cat)}
                    style={[styles.miniCategoryPill, newBlogCategory === cat && styles.miniCategoryPillActive]}
                  >
                    <Text style={[styles.miniCategoryText, newBlogCategory === cat && styles.miniCategoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Author / Anonymous Option */}
              <Text style={[styles.inputLabel, { marginTop: spacing.xs }]}>Author Name</Text>
              {!isAnonymous ? (
                <TextInput
                  style={styles.textInputBox}
                  placeholder="Your Name (or leave blank for Community Member)"
                  placeholderTextColor={colors.textMuted}
                  value={newBlogAuthor}
                  onChangeText={setNewBlogAuthor}
                />
              ) : (
                <View style={styles.anonymousActiveBanner}>
                  <Ionicons name="shield" size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
                  <Text style={styles.anonymousBannerText}>Posting anonymously as "Community Peer"</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.anonToggleRow}
                onPress={() => setIsAnonymous(!isAnonymous)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isAnonymous ? 'checkbox' : 'square-outline'}
                  size={20}
                  color="#00A99D"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.anonToggleText}>Post anonymously to protect my identity</Text>
              </TouchableOpacity>

              {/* Content Input */}
              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Your Story &amp; Reflection</Text>
              <TextInput
                style={[styles.textInputBox, styles.textAreaBox]}
                placeholder="Share what worked for you, what you felt, or strategies that brought peace..."
                placeholderTextColor={colors.textMuted}
                value={newBlogContent}
                onChangeText={setNewBlogContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              {/* Publish Action */}
              <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
                <Button
                  title="Publish to Community Library"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handlePublishBlog}
                  leftIcon={<Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  searchRow: {
    marginBottom: spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
  },
  categoryList: {
    paddingVertical: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    minWidth: 72,
  },
  categoryChipSelected: {
    borderColor: '#00A99D',
    backgroundColor: '#F0FAF9',
    borderWidth: 1.5,
  },
  chipIcon: {
    marginBottom: 4,
  },
  chipEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryChipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#00A99D',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    ...typography.captionBold,
    color: '#00A99D',
  },
  assessmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  assessmentCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
  },
  assessmentTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  assessmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  assessmentDesc: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.sm,
    minHeight: 32,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  durationText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 4,
    fontSize: 11,
  },
  blogHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  writeBlogPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A99D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  writeBlogPillText: {
    ...typography.captionBold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  articleList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
  },
  articleContent: {
    flex: 1,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#F0FAF9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  communityBadge: {
    backgroundColor: '#F3E8FF',
  },
  articleCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A99D',
  },
  communityCategoryText: {
    color: '#7C3AED',
  },
  articleDot: {
    marginHorizontal: 6,
    color: colors.textMuted,
  },
  articleReadTime: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  articleDate: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  articleTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  articleSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  articleAuthor: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCount: {
    ...typography.captionBold,
    color: colors.textSecondary,
    fontSize: 11,
  },
  articleArrow: {
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  readerModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    height: '92%',
    paddingTop: spacing.md,
  },
  readerScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  readerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  readerCloseBtn: {
    padding: 6,
  },
  readerTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readerActionBtn: {
    padding: 6,
  },
  readerHeader: {
    marginBottom: spacing.lg,
  },
  readerCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F7F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    marginBottom: 8,
  },
  readerCategoryText: {
    ...typography.captionBold,
    color: '#008B80',
  },
  readerTitle: {
    ...typography.h1,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  readerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A99D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  readerAuthorName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  readerAuthorRole: {
    ...typography.caption,
    color: colors.textMuted,
  },
  takeawaysCard: {
    backgroundColor: '#F0FAF9',
    borderColor: '#CCFBF1',
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  takeawaysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  takeawaysHeading: {
    ...typography.smallBold,
    color: '#008B80',
  },
  takeawayItem: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  takeawayBullet: {
    color: '#00A99D',
    fontWeight: '700',
    marginRight: 6,
  },
  takeawayText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  articleBody: {
    marginBottom: spacing.xl,
  },
  paragraphText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  readerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00A99D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  helpfulBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  helpfulBtnText: {
    ...typography.smallBold,
    color: '#00A99D',
  },
  helpfulBtnTextActive: {
    color: '#EF4444',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '90%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text,
  },
  sheetSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    ...typography.smallBold,
    color: colors.text,
    marginBottom: 6,
  },
  textInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  textAreaBox: {
    height: 120,
    paddingTop: 10,
  },
  miniCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xs,
  },
  miniCategoryPillActive: {
    backgroundColor: '#00A99D',
    borderColor: '#00A99D',
  },
  miniCategoryText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  miniCategoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  anonymousActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  anonymousBannerText: {
    ...typography.smallBold,
    color: '#7C3AED',
  },
  anonToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  anonToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

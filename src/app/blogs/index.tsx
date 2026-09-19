/**
 * CECUREUS — All Blogs & Psychoeducational Archive Screen
 *
 * Why this file was created:
 * This screen resolves the high-memory degradation of unpaginated feeds by implementing
 * a virtualized `FlatList` with server-side pagination (`GET /api/v1/blogs?page=1&limit=10`).
 * It was created to provide a complete, high-performance reading archive:
 * - Server-driven cursor/page-based infinite scroll via `onEndReached` (threshold 0.5).
 * - Smooth bottom loading spinner (`ListFooterComponent`) and pull-to-refresh (`RefreshControl`).
 * - Category filter chips (All, Stress, Anxiety, Sleep, Workplace, Growth) and instant keyword search.
 * - Tap-to-read full modal reader with clinical takeaways and like counter.
 * - Community authoring modal to publish reflections directly to the feed.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { blogsApi } from '../../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface BlogArticle {
  id: string;
  title: string;
  readTime: string;
  author: string;
  authorRole: string;
  category: string;
  categoryLabel?: string;
  date: string;
  summary: string;
  content: string[];
  takeaways: string[];
  likes: number;
  isUserSubmitted?: boolean;
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'stress', label: 'Stress' },
  { key: 'anxiety', label: 'Anxiety' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'workplace', label: 'Workplace' },
  { key: 'growth', label: 'Growth' },
];

export default function AllBlogsScreen() {
  const router = useRouter();

  // State
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reader & Authoring Modals
  const [readingArticle, setReadingArticle] = useState<BlogArticle | null>(null);
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('growth');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search
  const searchTimeout = useRef<any>(null);

  const fetchBlogs = useCallback(
    async (pageToFetch: number, isRefresh: boolean = false) => {
      try {
        if (pageToFetch === 1) {
          if (!isRefresh) setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const res = await blogsApi.getBlogs({
          page: pageToFetch,
          limit: 6,
          category: selectedCategory,
          search: searchQuery.trim(),
        });

        if (res?.success) {
          setBlogs((prev) => (pageToFetch === 1 ? res.blogs : [...prev, ...res.blogs]));
          setHasMore(res.hasMore);
          setPage(res.page);
        }
      } catch (error) {
        // Interceptor handles network alerts
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [selectedCategory, searchQuery]
  );

  useEffect(() => {
    fetchBlogs(1);
  }, [fetchBlogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBlogs(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchBlogs(page + 1);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  const handleLike = (id: string) => {
    setLikedArticles((prev) => {
      const currentlyLiked = !!prev[id];
      const nextLiked = !currentlyLiked;

      setBlogs((all) =>
        all.map((item) =>
          item.id === id ? { ...item, likes: item.likes + (nextLiked ? 1 : -1) } : item
        )
      );

      if (readingArticle && readingArticle.id === id) {
        setReadingArticle((curr) =>
          curr ? { ...curr, likes: curr.likes + (nextLiked ? 1 : -1) } : null
        );
      }

      return { ...prev, [id]: nextLiked };
    });
  };

  const handleShare = async (article: BlogArticle) => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.summary}\n\nRead more on CecureUs Mental Wellness App.`,
      });
    } catch {}
  };

  const handlePublishStory = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Missing Details', 'Please enter a title and reflection content.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await blogsApi.createBlog({
        title: newTitle.trim(),
        summary: newSummary.trim() || newTitle.trim(),
        category: newCategory,
        content: newContent.split('\n\n').filter(Boolean),
      });

      if (res?.success) {
        Alert.alert('Success', 'Your story has been shared with the community!');
        setNewTitle('');
        setNewSummary('');
        setNewContent('');
        setWriteModalVisible(false);
        fetchBlogs(1, true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not publish story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBlogItem = ({ item }: { item: BlogArticle }) => {
    const isLiked = !!likedArticles[item.id];

    return (
      <Card style={styles.blogCard} onPress={() => setReadingArticle(item)}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, item.isUserSubmitted && styles.communityBadge]}>
            <Text style={[styles.categoryBadgeText, item.isUserSubmitted && styles.communityBadgeText]}>
              {item.isUserSubmitted ? 'Community Story' : item.categoryLabel || item.category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.readTimeText}>{item.readTime}</Text>
        </View>

        <Text style={styles.blogTitle}>{item.title}</Text>
        <Text style={styles.blogSummary} numberOfLines={2}>
          {item.summary}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.authorCol}>
            <Text style={styles.authorName}>{item.author}</Text>
            <Text style={styles.authorRole}>{item.authorRole} · {item.date}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleLike(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? '#EF4444' : colors.textMuted}
              />
              <Text style={[styles.actionCount, isLiked && { color: '#EF4444' }]}>
                {item.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { marginLeft: 12 }]}
              onPress={() => handleShare(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-social-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerLoaderText}>Loading more insights...</Text>
        </View>
      );
    }
    if (!hasMore && blogs.length > 0) {
      return (
        <View style={styles.caughtUpRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.caughtUpText}>You're all caught up with latest articles!</Text>
        </View>
      );
    }
    return <View style={{ height: 20 }} />;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Loading wellness insights...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No Articles Found</Text>
        <Text style={styles.emptySubtitle}>
          Try searching for a different keyword or select another category.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Blogs &amp; Articles</Text>
          <Text style={styles.headerSubtitle}>Psychoeducation &amp; community reflections</Text>
        </View>

        <TouchableOpacity
          style={styles.writeStoryBtn}
          onPress={() => setWriteModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.writeStoryBtnText}>Write</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles, topics, or authors..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {!!searchQuery && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Virtualized Infinite Scroll FlatList */}
      <FlatList
        data={blogs}
        renderItem={renderBlogItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Article Reader Modal */}
      {readingArticle && (
        <Modal visible={true} animationType="slide" onRequestClose={() => setReadingArticle(null)}>
          <SafeAreaView style={styles.readerContainer}>
            <View style={styles.readerHeader}>
              <TouchableOpacity style={styles.readerCloseBtn} onPress={() => setReadingArticle(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.readerHeaderCat}>
                {readingArticle.isUserSubmitted ? 'Community Story' : readingArticle.category.toUpperCase()}
              </Text>
              <TouchableOpacity
                style={styles.readerShareBtn}
                onPress={() => handleShare(readingArticle)}
              >
                <Ionicons name="share-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.readerScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.readerTitle}>{readingArticle.title}</Text>

              <View style={styles.readerMetaRow}>
                <View style={styles.readerAvatarCircle}>
                  <Text style={styles.readerAvatarInitials}>
                    {readingArticle.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.readerAuthorCol}>
                  <Text style={styles.readerAuthorName}>{readingArticle.author}</Text>
                  <Text style={styles.readerAuthorRole}>
                    {readingArticle.authorRole} · {readingArticle.readTime}
                  </Text>
                </View>
              </View>

              {/* Summary Card */}
              <View style={styles.readerSummaryBox}>
                <Text style={styles.readerSummaryText}>{readingArticle.summary}</Text>
              </View>

              {/* Body Paragraphs */}
              {readingArticle.content.map((para, idx) => (
                <Text key={idx} style={styles.readerParagraph}>
                  {para}
                </Text>
              ))}

              {/* Clinical Takeaways */}
              {readingArticle.takeaways && readingArticle.takeaways.length > 0 && (
                <View style={styles.takeawaysCard}>
                  <View style={styles.takeawaysHeader}>
                    <Ionicons name="bulb-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
                  </View>
                  {readingArticle.takeaways.map((point, idx) => (
                    <View key={idx} style={styles.takeawayBulletRow}>
                      <Text style={styles.takeawayBulletPoint}>•</Text>
                      <Text style={styles.takeawayBulletText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Like Action */}
              <View style={styles.readerBottomBar}>
                <TouchableOpacity
                  style={[
                    styles.readerLikeBtn,
                    likedArticles[readingArticle.id] && styles.readerLikeBtnActive,
                  ]}
                  onPress={() => handleLike(readingArticle.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={likedArticles[readingArticle.id] ? 'heart' : 'heart-outline'}
                    size={20}
                    color={likedArticles[readingArticle.id] ? '#FFFFFF' : colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.readerLikeBtnText,
                      likedArticles[readingArticle.id] && { color: '#FFFFFF' },
                    ]}
                  >
                    {likedArticles[readingArticle.id] ? 'Liked' : 'Helpful'} ({readingArticle.likes})
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Community Story Authoring Modal */}
      <Modal visible={writeModalVisible} animationType="slide" onRequestClose={() => setWriteModalVisible(false)}>
        <SafeAreaView style={styles.readerContainer}>
          <View style={styles.readerHeader}>
            <TouchableOpacity style={styles.readerCloseBtn} onPress={() => setWriteModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.readerHeaderCat}>SHARE YOUR STORY</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.writeScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.writeTitle}>Share Your Reflection</Text>
            <Text style={styles.writeSub}>
              Inspire peers by sharing personal strategies, milestones, or mindful coping practices.
            </Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInputField}
              placeholder="e.g., Finding calm in small morning routines"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Short Summary</Text>
            <TextInput
              style={styles.textInputField}
              placeholder="A brief overview of your insight..."
              placeholderTextColor={colors.textMuted}
              value={newSummary}
              onChangeText={setNewSummary}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryPillRow}>
              {['stress', 'anxiety', 'sleep', 'growth', 'workplace'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.smallCatPill, newCategory === cat && styles.smallCatPillActive]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.smallCatPillText, newCategory === cat && styles.smallCatPillTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Your Story / Content</Text>
            <TextInput
              style={[styles.textInputField, { height: 160, textAlignVertical: 'top' }]}
              placeholder="Write your thoughts, coping rituals, or experiences here..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={newContent}
              onChangeText={setNewContent}
            />

            <Button
              title="Publish Story"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handlePublishStory}
              style={{ marginTop: spacing.lg }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginRight: spacing.sm,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  writeStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  writeStoryBtnText: {
    ...typography.captionBold,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  categoryContainer: {
    marginVertical: spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  blogCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F0FDFA',
  },
  categoryBadgeText: {
    ...typography.smallBold,
    color: colors.primary,
  },
  communityBadge: {
    backgroundColor: '#FEF3C7',
  },
  communityBadgeText: {
    color: '#D97706',
  },
  readTimeText: {
    ...typography.small,
    color: colors.textMuted,
  },
  blogTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  blogSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.xs,
  },
  authorCol: {
    flex: 1,
  },
  authorName: {
    ...typography.captionBold,
    color: colors.text,
  },
  authorRole: {
    ...typography.small,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    ...typography.small,
    color: colors.textMuted,
    marginLeft: 4,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerLoaderText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 6,
  },
  caughtUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  caughtUpText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  readerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  readerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  readerShareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerHeaderCat: {
    ...typography.captionBold,
    color: colors.primary,
    letterSpacing: 1,
  },
  readerScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  readerTitle: {
    ...typography.h2,
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  readerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  readerAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00A99D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  readerAvatarInitials: {
    ...typography.captionBold,
    color: '#FFFFFF',
  },
  readerAuthorCol: {
    flex: 1,
  },
  readerAuthorName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  readerAuthorRole: {
    ...typography.caption,
    color: colors.textMuted,
  },
  readerSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.lg,
  },
  readerSummaryText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  readerParagraph: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  takeawaysCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  takeawaysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  takeawaysTitle: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  takeawayBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  takeawayBulletPoint: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 20,
    marginRight: 8,
  },
  takeawayBulletText: {
    flex: 1,
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  readerBottomBar: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  readerLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  readerLikeBtnActive: {
    backgroundColor: colors.primary,
  },
  readerLikeBtnText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  writeScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  writeTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  writeSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: 6,
  },
  textInputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  smallCatPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    marginBottom: 8,
  },
  smallCatPillActive: {
    backgroundColor: colors.primary,
  },
  smallCatPillText: {
    ...typography.smallBold,
    color: colors.textSecondary,
  },
  smallCatPillTextActive: {
    color: '#FFFFFF',
  },
});

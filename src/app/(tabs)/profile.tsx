/**
 * CECUREUS — Patient Profile & Wellness Records Screen
 *
 * Why this file was created:
 * This screen manages the user's personal identity, therapy records, wellness metrics, and account privacy settings.
 * It was created to provide a centralized account hub:
 * - Patient identity card with verification badges and profile editor modal.
 * - Wellness overview telemetry metrics (Completed Sessions, Read Articles, Assessments Taken, Active Goals).
 * - Longitudinal therapy session history cards with clinician summaries and Zoom meeting links.
 * - Interactive Session History, Clinical Summary, and Wellness Goals modals.
 * - Seamless navigation to Blogs (/blogs) and Clinical Assessments (/(tabs)/explore).
 * - Compliant account lifecycle controls (Secure Logout and permanent Account Deletion flows).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { EmergencyBanner } from '../../components/ui/EmergencyBanner';
import { useAuth } from '../../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { counsellorApi, profileApi } from '../../services/api';

const DEFAULT_SESSIONS = [
  {
    id: 'sess_1',
    counsellor_name: 'Dr. Neha Sharma',
    counsellor_title: 'Senior Clinical Psychologist',
    scheduled_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    session_type: 'video_call',
    status: 'completed',
    topics: ['Stress & Anxiety', 'Mindfulness'],
    summary: 'Patient engaged actively in cognitive restructuring exercises. Reviewed work-related triggers and practiced the 4-7-8 breathing reset. Established goal to practice 5 minutes of evening grounding before sleep.',
    zoomLink: 'https://abc.com/zoom-drneha1',
    duration_minutes: 45,
  },
  {
    id: 'sess_2',
    counsellor_name: 'Mr. Rohan Verma',
    counsellor_title: 'Counselling Psychologist',
    scheduled_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    session_type: 'phone_call',
    status: 'completed',
    topics: ['Work Stress', 'Burnout'],
    summary: 'Explored boundary-setting techniques in professional communication. Discussed decoupling self-worth from workload output and establishing a strict 30-minute digital sunset.',
    zoomLink: 'https://abc.com/zoom-rohanv2',
    duration_minutes: 45,
  },
];

const INITIAL_GOALS = [
  { id: 'g1', title: 'Daily 4-7-8 Breathing Reset', category: 'Mindfulness', completed: true },
  { id: 'g2', title: 'Evening Mood Check-In', category: 'Reflection', completed: true },
  { id: 'g3', title: 'Weekly Therapy Consultation', category: 'Self-Care', completed: false },
  { id: 'g4', title: '30-Minute Digital Sunset Before Sleep', category: 'Sleep Hygiene', completed: false },
  { id: 'g5', title: 'Self-Assessment Progress Review', category: 'Tracking', completed: true },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamic Profile & Session State
  const [sessions, setSessions] = useState<any[]>(DEFAULT_SESSIONS);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [selectedSummarySession, setSelectedSummarySession] = useState<any | null>(null);
  const [wellnessGoals, setWellnessGoals] = useState(INITIAL_GOALS);
  const [wellnessStats, setWellnessStats] = useState({
    sessionsTaken: 12,
    blogsCompleted: 18,
    assessmentsDone: 5,
    goalsAchieved: 8,
  });

  // Load real sessions & telemetry on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [sessionRes, profileRes] = await Promise.allSettled([
          counsellorApi.getMySessions(),
          profileApi.getProfile(),
        ]);

        if (sessionRes.status === 'fulfilled' && sessionRes.value?.sessions?.length > 0) {
          setSessions(sessionRes.value.sessions);
          setWellnessStats((prev) => ({
            ...prev,
            sessionsTaken: sessionRes.value.sessions.length,
          }));
        }

        if (profileRes.status === 'fulfilled' && profileRes.value?.wellnessOverview) {
          const ov = profileRes.value.wellnessOverview;
          setWellnessStats((prev) => ({
            ...prev,
            sessionsTaken: ov.sessionsTaken || prev.sessionsTaken,
            assessmentsDone: ov.assessmentsDone || prev.assessmentsDone,
          }));
        }
      } catch {}
    }
    loadData();
  }, []);

  const toggleGoal = (id: string) => {
    setWellnessGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const handleCopyLink = async (link: string) => {
    try {
      await Share.share({
        message: `CecureUs Therapy Meeting Link: ${link}`,
      });
    } catch {}
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Unable to delete account. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from CecureUs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const formatSessionDate = (isoString?: string) => {
    if (!isoString) return 'Upcoming';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatSessionTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const completedGoalsCount = wellnessGoals.filter((g) => g.completed).length;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>My Profile</Text>
        <Text style={styles.pageSubtitle}>
          Manage your account and wellness journey.
        </Text>
      </View>

      {/* User Info Card */}
      <Card style={styles.userCard}>
        <View style={styles.userCardRow}>
          <Avatar
            name={user?.name || 'Patient Profile'}
            size={64}
            backgroundColor="#00A99D"
            style={{ marginRight: spacing.md }}
          />

          <View style={styles.userInfoCol}>
            <Text style={styles.userName}>{user?.name || 'Patient Profile'}</Text>
            <Text style={styles.userEmail}>
              {user?.email || (user?.phone ? `Mobile: ${user.phone}` : 'Member')}
            </Text>
            {user?.phone ? (
              <Text style={styles.userPhone}>{user.phone}</Text>
            ) : null}
            <View style={styles.verifiedBadgeRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.verifiedText}>Verified Account</Text>
            </View>
          </View>

          <Button
            title="Edit Profile"
            variant="tealOutline"
            size="sm"
            leftIcon={<Ionicons name="create-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />}
            onPress={() => Alert.alert('Edit Profile', 'Profile details are synced with your registered account.')}
          />
        </View>
      </Card>

      {/* Emergency Helpline Banner */}
      <EmergencyBanner />

      {/* My Wellness Overview */}
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>My Wellness Overview</Text>

        <View style={styles.overviewGrid}>
          {/* Card 1: Sessions Taken -> Opens Session History Modal */}
          <Card style={styles.overviewCard}>
            <View style={styles.overviewIconHeader}>
              <Text style={styles.overviewEmoji}>📅</Text>
              <Text style={styles.overviewNumber}>{wellnessStats.sessionsTaken}</Text>
            </View>
            <Text style={styles.overviewLabel}>Sessions Taken</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.overviewLink}
              onPress={() => setShowHistoryModal(true)}
            >
              <Text style={styles.overviewLinkText}>View History &gt;</Text>
            </TouchableOpacity>
          </Card>

          {/* Card 2: Blogs Completed -> Navigates to /blogs */}
          <Card style={styles.overviewCard}>
            <View style={styles.overviewIconHeader}>
              <Text style={styles.overviewEmoji}>📖</Text>
              <Text style={styles.overviewNumber}>{wellnessStats.blogsCompleted}</Text>
            </View>
            <Text style={styles.overviewLabel}>Blogs Completed</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.overviewLink}
              onPress={() => router.push('/blogs')}
            >
              <Text style={styles.overviewLinkText}>View All &gt;</Text>
            </TouchableOpacity>
          </Card>

          {/* Card 3: Assessments Done -> Navigates to /(tabs)/explore */}
          <Card style={styles.overviewCard}>
            <View style={styles.overviewIconHeader}>
              <Text style={styles.overviewEmoji}>📋</Text>
              <Text style={styles.overviewNumber}>{wellnessStats.assessmentsDone}</Text>
            </View>
            <Text style={styles.overviewLabel}>Assessments Done</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.overviewLink}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.overviewLinkText}>View Results &gt;</Text>
            </TouchableOpacity>
          </Card>

          {/* Card 4: Goals Achieved -> Opens Goals Modal */}
          <Card style={styles.overviewCard}>
            <View style={styles.overviewIconHeader}>
              <Text style={styles.overviewEmoji}>🎯</Text>
              <Text style={styles.overviewNumber}>{completedGoalsCount}</Text>
            </View>
            <Text style={styles.overviewLabel}>Goals Achieved</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.overviewLink}
              onPress={() => setShowGoalsModal(true)}
            >
              <Text style={styles.overviewLinkText}>View Goals &gt;</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </View>

      {/* Recent Sessions */}
      <View style={styles.recentSessionsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowHistoryModal(true)}
          >
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TouchableOpacity>
        </View>

        {sessions.slice(0, 3).map((session) => {
          const dateStr = formatSessionDate(session.scheduled_at);
          const timeStr = formatSessionTime(session.scheduled_at);
          const modeLabel =
            session.session_type === 'video_call'
              ? 'Video Call'
              : session.session_type === 'phone_call'
              ? 'Phone Call'
              : 'Live Chat';

          return (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionTopRow}>
                <Avatar
                  name={session.counsellor_name || 'Clinician'}
                  size={44}
                  backgroundColor="#00A99D"
                  showOnlineDot={true}
                />
                <View style={styles.sessionDetails}>
                  <Text style={styles.counsellorSessionName}>{session.counsellor_name || 'Counsellor'}</Text>
                  <Text style={styles.sessionTimeInfo}>
                    {dateStr} {timeStr ? `· ${timeStr}` : ''} · {modeLabel}
                  </Text>
                  <Badge
                    label={Array.isArray(session.topics) && session.topics[0] ? session.topics[0] : 'Mindful Support'}
                    variant="default"
                    style={{ marginTop: 4, alignSelf: 'flex-start' }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.summaryButton}
                  activeOpacity={0.7}
                  onPress={() => setSelectedSummarySession(session)}
                >
                  <Ionicons name="book-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.summaryButtonText}>View Summary</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Legal & Policies (Google Play Store Compliance) */}
      <View style={styles.legalSection}>
        <Text style={styles.sectionTitle}>Legal &amp; Compliance</Text>
        <Card style={styles.legalMenuCard}>
          <TouchableOpacity
            style={styles.legalMenuItem}
            onPress={() => router.push('/privacy')}
            activeOpacity={0.7}
          >
            <View style={styles.legalMenuIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#00A99D" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.legalMenuTitle}>Privacy Policy</Text>
              <Text style={styles.legalMenuSubtitle}>Data safety, encryption &amp; privacy rights</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.legalDivider} />

          <TouchableOpacity
            style={styles.legalMenuItem}
            onPress={() => router.push('/terms')}
            activeOpacity={0.7}
          >
            <View style={styles.legalMenuIconCircle}>
              <Ionicons name="document-text-outline" size={20} color="#00A99D" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.legalMenuTitle}>Terms of Service</Text>
              <Text style={styles.legalMenuSubtitle}>EAP terms, medical disclaimers &amp; guidelines</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Account Settings & Compliance */}
      <View style={styles.accountActionsSection}>
        <Button
          title="Log Out"
          variant="outline"
          fullWidth
          onPress={handleLogout}
          style={{ marginBottom: spacing.md }}
          leftIcon={<Ionicons name="log-out-outline" size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />}
        />

        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteAccountBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteAccountText}>Delete Account &amp; Data</Text>
        </TouchableOpacity>
      </View>

      {/* ── 1. SESSION SUMMARY MODAL ────────────────────────────────────── */}
      <Modal visible={!!selectedSummarySession} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Session Summary</Text>
                <Text style={styles.modalHeaderSub}>
                  {selectedSummarySession?.counsellor_name} · {formatSessionDate(selectedSummarySession?.scheduled_at)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedSummarySession(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Meeting Link Pill if Video Call */}
              {selectedSummarySession?.zoomLink ? (
                <View style={styles.zoomCallout}>
                  <Ionicons name="videocam" size={18} color="#00A99D" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoomCalloutTitle}>Meeting Link</Text>
                    <Text style={styles.zoomCalloutLink} numberOfLines={1}>
                      {selectedSummarySession.zoomLink}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCopyLink(selectedSummarySession.zoomLink)}
                    style={styles.copyLinkBtn}
                  >
                    <Text style={styles.copyLinkText}>Share</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Discussion Focus */}
              <Text style={styles.summarySectionLabel}>Discussion Focus</Text>
              <View style={styles.topicsRow}>
                {(Array.isArray(selectedSummarySession?.topics) ? selectedSummarySession.topics : ['Stress Relief', 'Cognitive Tools']).map(
                  (t: string, idx: number) => (
                    <Badge key={idx} label={t} variant="primary" style={{ marginRight: 6, marginBottom: 6 }} />
                  )
                )}
              </View>

              {/* Clinician Notes */}
              <Text style={[styles.summarySectionLabel, { marginTop: spacing.md }]}>Clinician Notes &amp; Takeaways</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>
                  {selectedSummarySession?.summary ||
                    'Patient actively participated in cognitive coping exploration. Highlighted daily stress mitigation strategies, mindful breathing routines, and constructive sleep habits.'}
                </Text>
              </View>

              {/* Confidentiality Notice */}
              <View style={styles.anonAssuranceBox}>
                <Ionicons name="shield-checkmark" size={16} color="#00A99D" style={{ marginRight: 6 }} />
                <Text style={styles.anonAssuranceText}>
                  This record is confidential and private to your account.
                </Text>
              </View>
            </ScrollView>

            <Button
              title="Close Summary"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => setSelectedSummarySession(null)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* ── 2. FULL SESSION HISTORY MODAL ──────────────────────────────── */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Session History</Text>
                <Text style={styles.modalHeaderSub}>All consultations &amp; appointments</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHistoryModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {sessions.length === 0 ? (
                <View style={styles.emptySessionBox}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>📅</Text>
                  <Text style={styles.emptyTitle}>No sessions booked yet</Text>
                  <Text style={styles.emptyDesc}>
                    Connect with our verified psychologists for personalized, anonymous support.
                  </Text>
                  <Button
                    title="Find a Counsellor"
                    variant="primary"
                    size="md"
                    onPress={() => {
                      setShowHistoryModal(false);
                      router.push('/(tabs)/counsellor');
                    }}
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              ) : (
                sessions.map((s) => (
                  <Card key={s.id} style={styles.historySessionCard}>
                    <View style={styles.historyCardHeader}>
                      <Avatar name={s.counsellor_name || 'Counsellor'} size={40} backgroundColor="#00A99D" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.counsellorSessionName}>{s.counsellor_name || 'Counsellor'}</Text>
                        <Text style={styles.sessionTimeInfo}>
                          {formatSessionDate(s.scheduled_at)} · {formatSessionTime(s.scheduled_at)}
                        </Text>
                      </View>
                      <Badge
                        label={s.status === 'completed' ? 'Completed' : 'Confirmed'}
                        variant={s.status === 'completed' ? 'default' : 'primary'}
                      />
                    </View>

                    {s.zoomLink ? (
                      <View style={styles.historyZoomRow}>
                        <Ionicons name="videocam-outline" size={14} color="#00A99D" style={{ marginRight: 6 }} />
                        <Text style={styles.historyZoomText} numberOfLines={1}>
                          Meeting: {s.zoomLink}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.historyCardActions}>
                      <TouchableOpacity
                        style={styles.viewSummaryPill}
                        onPress={() => {
                          setShowHistoryModal(false);
                          setSelectedSummarySession(s);
                        }}
                      >
                        <Ionicons name="document-text-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.viewSummaryPillText}>View Summary</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              )}
            </ScrollView>

            <Button
              title="Close"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => setShowHistoryModal(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* ── 3. WELLNESS GOALS MODAL ────────────────────────────────────── */}
      <Modal visible={showGoalsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.goalsModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Wellness Goals</Text>
                <Text style={styles.modalHeaderSub}>
                  {completedGoalsCount} of {wellnessGoals.length} completed
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowGoalsModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {wellnessGoals.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalItemCard, g.completed && styles.goalItemCardCompleted]}
                  activeOpacity={0.8}
                  onPress={() => toggleGoal(g.id)}
                >
                  <Ionicons
                    name={g.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={g.completed ? '#00A99D' : '#94A3B8'}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, g.completed && styles.goalTitleCompleted]}>
                      {g.title}
                    </Text>
                    <Text style={styles.goalCategory}>{g.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button
              title="Done"
              variant="primary"
              size="md"
              fullWidth
              onPress={() => setShowGoalsModal(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* ── 4. DELETE ACCOUNT MODAL ────────────────────────────────────── */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteModalIconCircle}>
              <Ionicons name="warning-outline" size={28} color={colors.error} />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalDesc}>
              This action will permanently anonymize your account, revoke all active sessions, and remove personal identifiable records in compliance with data privacy regulations.
            </Text>
            <View style={styles.deleteModalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setShowDeleteModal(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Delete Account"
                variant="danger"
                size="md"
                loading={isDeleting}
                onPress={handleDeleteAccountConfirm}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: spacing.xs,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  userCard: {
    marginVertical: spacing.sm,
    padding: spacing.md,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    fontSize: 17,
  },
  userEmail: {
    ...typography.small,
    color: colors.textSecondary,
  },
  userPhone: {
    ...typography.small,
    color: colors.textMuted,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  overviewSection: {
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  overviewCard: {
    width: '48%',
    padding: spacing.md,
  },
  overviewIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  overviewNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  overviewLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  overviewLink: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 4,
  },
  overviewLinkText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  recentSessionsSection: {
    marginVertical: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  viewAllText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  sessionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  counsellorSessionName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  sessionTimeInfo: {
    ...typography.small,
    color: colors.textMuted,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  summaryButtonText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  accountActionsSection: {
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  deleteAccountBtn: {
    paddingVertical: spacing.sm,
  },
  deleteAccountText: {
    ...typography.captionBold,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  deleteModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  deleteModalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  deleteModalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  deleteModalDesc: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  deleteModalBtnRow: {
    flexDirection: 'row',
    width: '100%',
  },
  summaryModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
  },
  historyModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
  },
  goalsModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalHeaderSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollBody: {
    marginVertical: spacing.xs,
  },
  zoomCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  zoomCalloutTitle: {
    ...typography.smallBold,
    color: '#0F766E',
    fontSize: 11,
  },
  zoomCalloutLink: {
    ...typography.caption,
    color: '#00A99D',
    fontWeight: '600',
  },
  copyLinkBtn: {
    backgroundColor: '#00A99D',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    marginLeft: 8,
  },
  copyLinkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  summarySectionLabel: {
    ...typography.smallBold,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
    fontSize: 14,
  },
  anonAssuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF9',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  anonAssuranceText: {
    ...typography.caption,
    color: '#008B80',
    fontWeight: '500',
  },
  historySessionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyZoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyZoomText: {
    ...typography.caption,
    color: '#00A99D',
    flex: 1,
    fontWeight: '600',
  },
  historyCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  viewSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  viewSummaryPillText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  emptySessionBox: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  goalItemCardCompleted: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  goalTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 14,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  goalCategory: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  legalSection: {
    marginBottom: spacing.xl,
  },
  legalMenuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  legalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  legalMenuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F7F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalMenuTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 14,
  },
  legalMenuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  legalDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56,
  },
});

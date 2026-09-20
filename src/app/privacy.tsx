import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Card } from '../components/ui/Card';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}?subject=Privacy%20Inquiry%20-%20CecureUs`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Play Store Compliance Summary Card */}
        <Card style={styles.pledgeCard}>
          <View style={styles.pledgeIconRow}>
            <View style={styles.pledgeIconCircle}>
              <Ionicons name="shield-checkmark" size={26} color="#00A99D" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.pledgeTitle}>CecureUs Privacy & Data Safety</Text>
              <Text style={styles.pledgeSubtitle}>Google Play Store Compliant · Last Updated: September 2026</Text>
            </View>
          </View>
          <Text style={styles.pledgeBody}>
            CecureUs (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your personal identity and health privacy. This Privacy Policy details how our Employee Assistance Program (EAP) mobile application collects, uses, protects, and handles your information.
          </Text>
        </Card>

        {/* Quick Highlights / Data Safety Grid */}
        <Text style={styles.sectionHeading}>Data Safety Highlights</Text>
        <View style={styles.highlightsGrid}>
          <View style={styles.highlightItem}>
            <Ionicons name="lock-closed" size={20} color="#00A99D" />
            <Text style={styles.highlightItemTitle}>End-to-End Encrypted</Text>
            <Text style={styles.highlightItemDesc}>Data encrypted in transit via TLS 1.3 and at rest via AES-256.</Text>
          </View>
          <View style={styles.highlightItem}>
            <Ionicons name="eye-off" size={20} color="#00A99D" />
            <Text style={styles.highlightItemTitle}>100% Anonymous</Text>
            <Text style={styles.highlightItemDesc}>Consultations booked using masked references. No employer tracking.</Text>
          </View>
          <View style={styles.highlightItem}>
            <Ionicons name="ban" size={20} color="#00A99D" />
            <Text style={styles.highlightItemTitle}>No Ads or Selling</Text>
            <Text style={styles.highlightItemDesc}>We never monetize, broker, or sell personal or clinical health data.</Text>
          </View>
          <View style={styles.highlightItem}>
            <Ionicons name="trash-bin" size={20} color="#00A99D" />
            <Text style={styles.highlightItemTitle}>Right to Erasure</Text>
            <Text style={styles.highlightItemDesc}>In-app account and data deletion available at any time in Profile.</Text>
          </View>
        </View>

        {/* Detailed Sections */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            In order to provide our digital Employee Assistance Program (EAP) and mental wellness services, we collect the following categories of information:
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bulletBold}>Account &amp; Authentication Details:</Text> Your full name, email address, mobile phone number, and encrypted authentication tokens. We verify mobile numbers and email addresses via secure One-Time Passwords (OTPs).
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bulletBold}>Consultation &amp; Appointment Records:</Text> Chosen psychologist/counsellor, scheduled date and time, session mode (Video Call, Phone Call, or Chat), and anonymous booking reference codes.
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bulletBold}>Self-Care &amp; Wellness Data:</Text> Responses to standardized wellness assessments (e.g. PHQ-9, GAD-7, stress indices), daily mood check-ins, and personal wellness goals that you voluntarily track.
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bulletBold}>Technical &amp; Diagnostic Information:</Text> Operating system version, device model, and crash logs to troubleshoot errors and guarantee reliability. We do not track precision GPS locations.
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>We use the information we collect strictly for clinical support and app operation:</Text>
          <Text style={styles.bulletPoint}>• To connect you with qualified, verified mental health professionals.</Text>
          <Text style={styles.bulletPoint}>• To send appointment confirmations, reminder SMS alerts, and secure consultation links.</Text>
          <Text style={styles.bulletPoint}>• To authenticate logins securely and prevent unauthorized account access.</Text>
          <Text style={styles.bulletPoint}>• To calculate wellness progress metrics and recommend relevant psychoeducational resources.</Text>
          <Text style={styles.bulletPoint}>• To respond to your customer care inquiries and support tickets.</Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>3. Workplace &amp; Employer Confidentiality</Text>
          <Text style={styles.paragraph}>
            As an Employee Assistance Program provider, CecureUs strictly upholds independent clinical confidentiality:
          </Text>
          <Text style={styles.calloutText}>
            🔒 <Text style={styles.bulletBold}>Employer Shield:</Text> Your employer will <Text style={styles.bulletBold}>NEVER</Text> receive your identity, your session bookings, consultation notes, assessment answers, or the fact that you accessed counselling services. Employers only receive aggregated, de-identified statistical metrics (e.g., &ldquo;Total sessions conducted across the organization&rdquo;).
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>4. Google Play Permissions &amp; Data Access</Text>
          <Text style={styles.paragraph}>
            CecureUs requests only the minimal runtime permissions necessary to deliver core features:
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bulletBold}>Camera (Optional):</Text> Utilized solely when you enter a Video Consultation with your therapist.
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bulletBold}>Microphone (Optional):</Text> Utilized for audio and video tele-therapy sessions.
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bulletBold}>Notifications (Optional):</Text> For session reminder alerts, appointment updates, and daily mindfulness prompts.
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>5. Data Retention &amp; In-App Deletion</Text>
          <Text style={styles.paragraph}>
            In full accordance with Google Play User Data policies, you hold complete autonomy over your personal data:
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bulletBold}>In-App Account Deletion:</Text> You can delete your account and all associated records directly at any time by navigating to <Text style={styles.bulletBold}>Profile &gt; Delete Account &amp; Data</Text>.
          </Text>
          <Text style={styles.paragraph}>
            • Upon confirmation, your profile is permanently anonymized, authentication credentials revoked, and personal data erased from our primary operational database.
          </Text>
          <Text style={styles.paragraph}>
            • You may also contact our Data Protection Officer at <Text style={styles.linkText} onPress={() => handleEmailPress('connect@cecureus.com')}>connect@cecureus.com</Text> to request immediate data erasure.
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>6. Children&rsquo;s Privacy</Text>
          <Text style={styles.paragraph}>
            Our services are designed for working professionals and adults aged 18 and older. We do not knowingly solicit or collect personal information from individuals under the age of 18 without explicit parental or corporate legal consent.
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>7. Contact Us &amp; Grievance Redressal</Text>
          <Text style={styles.paragraph}>
            If you have questions, concerns, or requests regarding this Privacy Policy or our security practices, please contact us:
          </Text>
          <Card style={styles.contactCard}>
            <Text style={styles.contactOrg}>CecureUs Wellness Services</Text>
            <TouchableOpacity onPress={() => handleEmailPress('connect@cecureus.com')}>
              <Text style={styles.contactLine}>✉️ Developer &amp; Play Store Contact: <Text style={styles.contactLink}>connect@cecureus.com</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEmailPress('wellness@cecureus.com')}>
              <Text style={styles.contactLine}>✉️ Clinical Support: <Text style={styles.contactLink}>wellness@cecureus.com</Text></Text>
            </TouchableOpacity>
            <Text style={styles.contactLine}>🌐 Website: https://www.cecureus.com</Text>
            <Text style={styles.contactLine}>📍 Chennai, Tamil Nadu, India</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pledgeCard: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  pledgeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pledgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pledgeTitle: {
    ...typography.bodyBold,
    color: '#0F766E',
    fontSize: 16,
  },
  pledgeSubtitle: {
    ...typography.caption,
    color: '#115E59',
    marginTop: 2,
  },
  pledgeBody: {
    ...typography.caption,
    color: '#334155',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  highlightItem: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  highlightItemTitle: {
    ...typography.captionBold,
    color: colors.text,
    marginTop: 6,
    marginBottom: 4,
  },
  highlightItemDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  sectionBlock: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  paragraph: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  bulletPoint: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 6,
    paddingLeft: spacing.xs,
  },
  bulletBold: {
    fontWeight: '700',
    color: colors.text,
  },
  calloutText: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    ...typography.caption,
    color: '#1E40AF',
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  contactCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  contactOrg: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  contactLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  contactLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});

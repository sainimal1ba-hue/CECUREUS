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

export default function TermsOfServiceScreen() {
  const router = useRouter();

  const handleCall = (num: string) => {
    Linking.openURL(`tel:${num.replace(/[^0-9]/g, '')}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}?subject=Terms%20Inquiry%20-%20CecureUs`);
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent Crisis & Medical Emergency Disclaimer (Play Store Healthcare Requirement) */}
        <View style={styles.warningBanner}>
          <View style={styles.warningTitleRow}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.warningTitle}>Emergency Crisis & Medical Disclaimer</Text>
          </View>
          <Text style={styles.warningText}>
            CecureUs is a digital Employee Assistance Program (EAP) platform offering outpatient counselling, psychological support, and wellness resources. It is <Text style={{ fontWeight: '700' }}>NOT</Text> an emergency response service or crisis suicide intervention facility.
          </Text>
          <Text style={styles.warningSub}>
            If you or someone you know is experiencing acute psychiatric distress, self-harm impulses, or life-threatening medical danger, immediately contact emergency services:
          </Text>

          <View style={styles.emergencyGrid}>
            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => handleCall('112')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.emergencyBtnTitle}>National Emergency: 112</Text>
                <Text style={styles.emergencyBtnSub}>24/7 Police, Ambulance, Fire</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => handleCall('14416')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.emergencyBtnTitle}>Tele-MANAS: 14416</Text>
                <Text style={styles.emergencyBtnSub}>Govt of India 24/7 Mental Health Helpline</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => handleCall('9999666555')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.emergencyBtnTitle}>Vandrevala Foundation: 9999 666 555</Text>
                <Text style={styles.emergencyBtnSub}>24/7 Free Suicide Prevention Helpline</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => handleCall('18001219497')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#00A99D" style={{ marginRight: 6 }} />
              <View>
                <Text style={[styles.emergencyBtnTitle, { color: '#00877D' }]}>CecureUs Careline: 1800 121 9497</Text>
                <Text style={styles.emergencyBtnSub}>Toll-free EAP Support Helpline</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 1: Acceptance of Terms */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, accessing, or using the CecureUs mobile application or website, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must discontinue use immediately.
          </Text>
        </View>

        {/* Section 2: Scope of EAP Services */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>2. Scope of Digital EAP Services</Text>
          <Text style={styles.paragraph}>
            CecureUs provides employees and individuals with access to certified mental health clinicians, counselling psychologists, wellness assessments, self-help articles, and the Ally AI wellness assistant.
          </Text>
          <Text style={styles.bulletPoint}>
            • All counselling sessions booked through CecureUs are confidential and anonymous.
          </Text>
          <Text style={styles.bulletPoint}>
            • No payment is required from authorized enterprise users; sessions are sponsored through your employer&rsquo;s EAP package.
          </Text>
          <Text style={styles.bulletPoint}>
            • Sessions may be conducted via encrypted Video Call, Phone Call, or secure Chat as preferred.
          </Text>
        </View>

        {/* Section 3: User Eligibility & Responsibilities */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>3. User Eligibility &amp; Conduct</Text>
          <Text style={styles.paragraph}>
            You must be at least 18 years of age to register for an account. By using the app, you agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide accurate phone and email verification information.</Text>
          <Text style={styles.bulletPoint}>• Treat psychologists and healthcare staff with respect and dignity.</Text>
          <Text style={styles.bulletPoint}>• Refrain from recording, publishing, or distributing private counselling video/audio streams.</Text>
          <Text style={styles.bulletPoint}>• Abide by all applicable local and national digital healthcare laws.</Text>
        </View>

        {/* Section 4: Anonymity & Workplace Protection */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>4. Complete Anonymity &amp; Confidentiality Guarantee</Text>
          <Text style={styles.paragraph}>
            CecureUs guarantees that your individual consultation history, session content, and assessment responses will <Text style={{ fontWeight: '700' }}>never</Text> be shared with your employer, supervisors, or human resources department. Your privacy is paramount.
          </Text>
        </View>

        {/* Section 5: Clinician Independence & Limitation of Liability */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>5. Clinician Independence &amp; Disclaimer</Text>
          <Text style={styles.paragraph}>
            Psychologists listed on CecureUs are independent, qualified professionals adhering to professional clinical ethics. CecureUs acts as an access platform. To the maximum extent permitted by law, CecureUs is not liable for indirect, incidental, or consequential damages arising from tele-counselling sessions.
          </Text>
        </View>

        {/* Section 6: In-App Account Deletion */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>6. Account Termination &amp; Right to Erasure</Text>
          <Text style={styles.paragraph}>
            In compliance with Google Play Developer Policies, you may delete your account and associated records directly at any time by selecting <Text style={{ fontWeight: '700' }}>Profile &gt; Delete Account &amp; Data</Text> inside the application.
          </Text>
        </View>

        {/* Section 7: Governing Law */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>7. Governing Law &amp; Jurisdiction</Text>
          <Text style={styles.paragraph}>
            These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu, India.
          </Text>
        </View>

        {/* Section 8: Contact & Support */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>8. Contact &amp; Support</Text>
          <Card style={styles.contactCard}>
            <Text style={styles.contactOrg}>CecureUs Wellness Services</Text>
            <TouchableOpacity onPress={() => handleEmailPress('connect@cecureus.com')}>
              <Text style={styles.contactLine}>✉️ Developer &amp; Publishing: <Text style={styles.contactLink}>connect@cecureus.com</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEmailPress('wellness@cecureus.com')}>
              <Text style={styles.contactLine}>✉️ Care Team: <Text style={styles.contactLink}>wellness@cecureus.com</Text></Text>
            </TouchableOpacity>
            <Text style={styles.contactLine}>📞 Support: 1800 121 9497</Text>
            <Text style={styles.contactLine}>💬 WhatsApp: +91 72005 00221</Text>
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
  warningBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  warningTitle: {
    ...typography.bodyBold,
    color: '#DC2626',
    fontSize: 15,
  },
  warningText: {
    ...typography.caption,
    color: '#991B1B',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  warningSub: {
    ...typography.caption,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  emergencyGrid: {
    gap: spacing.xs,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  emergencyBtnTitle: {
    ...typography.captionBold,
    color: '#DC2626',
    fontSize: 12,
  },
  emergencyBtnSub: {
    ...typography.caption,
    color: '#64748B',
    fontSize: 10,
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

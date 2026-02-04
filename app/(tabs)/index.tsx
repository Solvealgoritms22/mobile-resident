import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { VisitDetailModal } from '@/components/VisitDetailModal';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import api from '@/services/api';
import { visitService } from '@/services/visitService';
import { getImageUrl, getInitials } from '@/utils/image';

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const [visitors, setVisitors] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({ active: 0, pending: 0, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [selectedVisit, setSelectedVisit] = React.useState<any>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);


  // Reset image error when profile image changes
  React.useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  const sendEmergency = async () => {
    setLoading(true);
    try {
      await api.post('/emergencies', {
        type: 'RESIDENT_EMERGENCY',
        location: user?.residentProfile?.unitNumber || 'Unit Not Assigned'
      });
      showToast(t('securityNotified'), 'success');
    } catch (e: any) {
      console.error('[Resident Emergency] Error:', e);
      const msg = e.response?.data?.message || e.message || 'Unknown error';
      showToast(`${t('failedAlert')}: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const { onDataRefresh } = useAuth();

  const fetchData = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [statsData, visitorsResponse] = await Promise.all([
        visitService.getStats(),
        visitService.getMyVisits(user.id, 1, 3)
      ]);

      setStats({
        active: statsData.today || 0,
        pending: statsData.pending || 0,
        total: (statsData.today || 0) + (statsData.pending || 0)
      });
      setVisitors(visitorsResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching mobile dashboard data:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    // Subscribe to global data refresh events
    const unsubscribe = onDataRefresh(() => {
      fetchData();
    });

    return unsubscribe;
  }, [fetchData, onDataRefresh]);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <BlurView intensity={80} tint="dark" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.role}>{t('residentAccount').split(' ')[0]}</Text>
              <Text style={styles.userName}>{user?.name || t('resident')}</Text>
              <Text style={styles.badge}>{user?.email}</Text>
            </View>
            {(user?.profileImage && !imageError) ? (
              <View style={styles.headerAvatarContainer}>
                <Image
                  source={{ uri: getImageUrl(user.profileImage) || undefined }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                  transition={500}
                  onError={() => setImageError(true)}
                />
              </View>
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
              </View>
            )}
          </View>
        </BlurView>

        {/* Status Card (Home Access) */}
        <Pressable
          style={({ pressed }) => [
            styles.statusCardWrapper,
            pressed && { transform: [{ scale: 0.98 }] }
          ]}
          onPress={() => router.push('/(tabs)/identity-pass')}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb', '#1d4ed8']}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.statusTitle}>{t('homeAccess')}</Text>
                <Text style={styles.address}>{user?.residentProfile?.unitNumber || t('unitNotAssigned')}</Text>
              </View>
              <View style={styles.qrIconContainer}>
                <Ionicons name="qr-code" size={32} color="#ffffff" />
              </View>
            </View>
            <View style={styles.idButtonPlaceholder}>
              <Text style={styles.idButtonText}>{t('viewIdentityPass')}</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <BlurView intensity={60} tint="dark" style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>{t('active')}</Text>
          </BlurView>
          <BlurView intensity={60} tint="dark" style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>{t('pending')}</Text>
          </BlurView>
          <BlurView intensity={60} tint="dark" style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('total')}</Text>
          </BlurView>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/invite' as any)}
          >
            <BlurView intensity={60} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="person-add" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.actionLabel}>{t('tabInvite')}</Text>
            </BlurView>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/parking' as any)}
          >
            <BlurView intensity={60} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="car-sport" size={24} color="#10b981" />
              </View>
              <Text style={styles.actionLabel}>{t('tabVehicles')}</Text>
            </BlurView>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/report' as any)}
          >
            <BlurView intensity={60} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="document-text" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.actionLabel}>{t('reportIncident')}</Text>
            </BlurView>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/contacts' as any)}
          >
            <BlurView intensity={60} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
                <Ionicons name="call" size={24} color="#f97316" />
              </View>
              <Text style={styles.actionLabel}>{t('securityContacts')}</Text>
            </BlurView>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => {
              const message = t('emergencyConfirm');
              if (Platform.OS === 'web') {
                if (window.confirm(message)) {
                  sendEmergency();
                }
                return;
              }

              Alert.alert(
                t('emergency').toUpperCase(),
                message,
                [
                  { text: t('cancel'), style: 'cancel' },
                  {
                    text: t('getHelp'),
                    style: 'destructive',
                    onPress: sendEmergency
                  }
                ]
              );
            }}
          >
            <BlurView intensity={60} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="warning" size={24} color="#ef4444" />
              </View>
              <Text style={[styles.actionLabel, { color: '#ef4444' }]}>{t('emergency')}</Text>
            </BlurView>
          </Pressable>
        </View>

        {/* Recent Visitors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recentVisitors')}</Text>
          <Link href="/(tabs)/visitors" asChild>
            <Pressable>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </Pressable>
          </Link>
        </View>

        <BlurView intensity={60} tint="dark" style={styles.activityCard}>
          {loading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={60} borderRadius={12} />
              <Skeleton height={60} borderRadius={12} />
              <Skeleton height={60} borderRadius={12} />
            </View>
          ) : visitors.length > 0 ? (
            visitors.map((visitor: any, index) => {
              const getStatusConfig = (status: string) => {
                const s = status?.toUpperCase();
                if (s === 'CHECKED_IN' || s === 'APPROVED') return { icon: 'checkmark', color: '#10b981' };
                if (s === 'CHECKED_OUT') return { icon: 'log-out', color: '#3b82f6' };
                if (s === 'PENDING') return { icon: 'time-outline', color: '#f59e0b' };
                return { icon: 'close', color: '#ef4444' };
              };
              const config = getStatusConfig(visitor.status);

              return (
                <TouchableOpacity
                  key={visitor.id || index}
                  style={[styles.activityItem, index !== 0 && styles.activityBorder]}
                  onPress={() => {
                    setSelectedVisit(visitor);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activityIcon, { backgroundColor: config.color }]}>
                    <Ionicons name={config.icon as any} size={16} color="#ffffff" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{visitor.visitorName || 'Guest'}</Text>
                    <Text style={styles.activitySubtitle}>{visitor.visitorIdNumber || t('identityNotSet')}</Text>
                  </View>
                  <Text style={styles.activityTime}>
                    {new Date(visitor.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t('noRecentVisitors')}</Text>
          )}
        </BlurView>
      </ScrollView>

      <VisitDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        visit={selectedVisit}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingBottom: 140,
  },
  headerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  role: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  badge: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  headerAvatarContainer: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    overflow: 'hidden',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    resizeMode: 'cover',
  },
  headerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statusCardWrapper: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  statusGradient: {
    padding: 24,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  qrIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idButtonPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  idButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  actionButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBlur: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

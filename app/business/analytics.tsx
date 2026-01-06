import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId: Id<"stores"> }>();
  const { t, fonts } = useLanguage();
  
  const analytics = useQuery(api.orders.getStoreAnalytics, storeId ? { storeId } : "skip");

  if (!analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.deepGreen} />
      </View>
    );
  }

  const maxRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.heading }]}>{t('analytics')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainStats}>
          <View style={styles.revenueCard}>
            <Text style={[styles.statLabel, { fontFamily: fonts.body, color: Colors.white, opacity: 0.9 }]}>
              {t('totalRevenue')}
            </Text>
            <Text style={[styles.revenueValue, { fontFamily: fonts.heading }]}>
              ${analytics.totalRevenue.toFixed(2)}
            </Text>
            <View style={styles.revenueBadge}>
              <Ionicons name="trending-up" size={16} color={Colors.white} />
              <Text style={[styles.badgeText, { fontFamily: fonts.body }]}>{t('performance')}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="leaf-outline" size={20} color={Colors.deepGreen} />
              </View>
              <Text style={[styles.statBoxValue, { fontFamily: fonts.heading }]}>{(analytics.itemsSaved * 2.5).toFixed(1)}kg</Text>
              <Text style={[styles.statBoxLabel, { fontFamily: fonts.body }]}>{t('totalCO2eAvoided')}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="cash-outline" size={20} color="#EF6C00" />
              </View>
              <Text style={[styles.statBoxValue, { fontFamily: fonts.heading }]}>${analytics.totalValueSaved.toFixed(0)}</Text>
              <Text style={[styles.statBoxLabel, { fontFamily: fonts.body }]}>{t('totalValueSaved')}</Text>
            </View>
          </View>

          <View style={[styles.statsRow, { marginTop: 16 }]}>
            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="receipt-outline" size={20} color="#1976D2" />
              </View>
              <Text style={[styles.statBoxValue, { fontFamily: fonts.heading }]}>{analytics.totalOrders}</Text>
              <Text style={[styles.statBoxLabel, { fontFamily: fonts.body }]}>{t('totalOrders')}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#7B1FA2" />
              </View>
              <Text style={[styles.statBoxValue, { fontFamily: fonts.heading }]}>
                {analytics.totalOrders > 0 ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(0) : 0}%
              </Text>
              <Text style={[styles.statBoxLabel, { fontFamily: fonts.body }]}>{t('completionRate')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('revenueLast7Days')}</Text>
          <View style={styles.chartContainer}>
            {analytics.revenueByDay.length > 0 ? (
              <View style={styles.chart}>
                {analytics.revenueByDay.map((day, index) => (
                  <View key={index} style={styles.chartColumn}>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar, 
                          { height: `${(day.revenue / maxRevenue) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.dayLabel, { fontFamily: fonts.body }]}>
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noDataText, { fontFamily: fonts.body }]}>{t('noData')}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('orderSummary')}</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryDotLabel}>
                <View style={[styles.dot, { backgroundColor: Colors.deepGreen }]} />
                <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>{t('completedOrders')}</Text>
              </View>
              <Text style={[styles.summaryValue, { fontFamily: fonts.heading }]}>{analytics.completedOrders}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryDotLabel}>
                <View style={[styles.dot, { backgroundColor: '#FFA000' }]} />
                <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>{t('activeOrders')}</Text>
              </View>
              <Text style={[styles.summaryValue, { fontFamily: fonts.heading }]}>{analytics.activeOrders}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryDotLabel}>
                <View style={[styles.dot, { backgroundColor: '#D32F2F' }]} />
                <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>{t('cancelledOrders')}</Text>
              </View>
              <Text style={[styles.summaryValue, { fontFamily: fonts.heading }]}>{analytics.cancelledOrders}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.black,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mainStats: {
    marginBottom: 24,
  },
  revenueCard: {
    backgroundColor: Colors.deepGreen,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    elevation: 8,
    shadowColor: Colors.deepGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 36,
    color: Colors.white,
    marginBottom: 12,
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statBoxValue: {
    fontSize: 20,
    color: Colors.black,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.black,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    height: 200,
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    width: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    backgroundColor: Colors.deepGreen,
    borderRadius: 6,
    width: '100%',
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.gray,
  },
  noDataText: {
    textAlign: 'center',
    color: Colors.gray,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryDotLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.black,
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.black,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  }
});

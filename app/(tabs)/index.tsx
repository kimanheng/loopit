import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { STORES } from '../../data/mockData';
import StoreCard from '../../components/StoreCard';
import SectionHeader from '../../components/SectionHeader';
import CategoryFilter from '../../components/CategoryFilter';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../context/OrdersContext';
import { useLanguage } from '../../context/LanguageContext';

export default function HomeScreen() {
  const { activeOrders } = useOrders();
  const { t, fonts } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();
  // 85% the width in discover page
  const cardWidth = width * 0.85;

  // Base list filtered by category if selected
  const categoryFilteredStores = selectedCategory 
    ? STORES.filter(s => s.category === selectedCategory) 
    : STORES;

  // Helper to filter by time strings (Simple contains check for demo)
  const getStoresByTime = (sourceStores: typeof STORES, timeKeywords: string[]) => {
      return sourceStores.filter(s => {
          const time = s.pickupTime.toLowerCase();
          return timeKeywords.some(k => time.includes(k));
      });
  };

  const breakfastStores = getStoresByTime(categoryFilteredStores, ['06:', '07:', '08:', '09:', '10:']);
  const lunchStores = getStoresByTime(categoryFilteredStores, ['11:', '12:', '13:', '14:']);
  const dinnerStores = getStoresByTime(categoryFilteredStores, ['17:', '18:', '19:', '20:', '21:']);
  
  // "Now" is just a slice or random selection for demo if we don't have real time
  const nowStores = categoryFilteredStores.slice(0, 5); 

  const navigateToSection = (title: string, type: string) => {
    router.push({ 
      pathname: "/list", 
      params: { 
        title, 
        filterType: type,
        category: selectedCategory || '' // Pass selected category
      } 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
             <Ionicons name="location-sharp" size={16} color={Colors.deepGreen} />
             <Text style={[styles.locationText, { fontFamily: fonts.body }]}>Tuel Kork, Phnom Penh</Text>
             <Ionicons name="chevron-down" size={16} color={Colors.deepGreen} />
        </View>
        <View style={styles.titleRow}>
            <Text style={styles.appTitle}>LoopIt</Text>
            <TouchableOpacity style={styles.helpButton}>
                <Text style={[styles.helpText, { fontFamily: fonts.body }]}>{t('howItWorks')}</Text>
                <Ionicons name="information-circle-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
        </View>
      </View>

      <CategoryFilter 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader 
            title={selectedCategory ? `${selectedCategory} near you` : t('recommended')} 
            onPress={() => navigateToSection("Recommended", "recommended")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {categoryFilteredStores.slice(0, 10).map((store) => (
            <StoreCard key={store.id} store={store} containerStyle={{ width: cardWidth }} />
          ))}
        </ScrollView>

        <SectionHeader 
            title={t('pickupNow')} 
            onPress={() => navigateToSection("Pick up now", "now")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {nowStores.map((store) => (
            <StoreCard key={`now-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            ))}
        </ScrollView>

        <SectionHeader 
            title={t('breakfast')} 
            onPress={() => navigateToSection("Pick up for breakfast", "breakfast")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {breakfastStores.length > 0 ? breakfastStores.map((store) => (
            <StoreCard key={`breakfast-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>No breakfast pickup options available.</Text>}
        </ScrollView>

        <SectionHeader 
            title={t('lunch')} 
            onPress={() => navigateToSection("Pick up for lunch", "lunch")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {lunchStores.length > 0 ? lunchStores.map((store) => (
            <StoreCard key={`lunch-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>No lunch pickup options available.</Text>}
        </ScrollView>

        <SectionHeader 
            title={t('dinner')} 
            onPress={() => navigateToSection("Pick up for dinner", "dinner")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {dinnerStores.length > 0 ? dinnerStores.map((store) => (
            <StoreCard key={`dinner-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>No dinner pickup options available.</Text>}
        </ScrollView>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {activeOrders.length > 0 && (
         <TouchableOpacity 
             style={styles.activeOrderBanner}
             onPress={() => router.push({ 
                 pathname: "/order-success", 
                 params: { storeId: activeOrders[0].storeId, orderId: activeOrders[0].id, view: 'true' } 
             })}
         >
             <View style={styles.bannerContent}>
                 <View style={styles.bannerIcon}>
                     <Ionicons name="bag-check" size={20} color={Colors.white} />
                 </View>
                 <View>
                     <Text style={[styles.bannerTitle, { fontFamily: fonts.body }]}>{t('collection')} {activeOrders[0].pickupTime}</Text>
                     <Text style={[styles.bannerSubtitle, { fontFamily: fonts.body }]}>{activeOrders[0].storeName}</Text>
                 </View>
             </View>
             <Ionicons name="chevron-forward" size={20} color={Colors.white} />
         </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    marginHorizontal: 4,
    color: Colors.deepGreen,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  appTitle: {
    fontSize: 28,
    color: Colors.deepGreen,
    fontWeight: 'bold',
    fontFamily: 'Recoleta',
  },
  helpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.deepGreen,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  helpText: {
      fontSize: 12,
      color: Colors.white,
      marginRight: 6,
      fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  emptyText: {
    color: Colors.gray,
    marginLeft: 16,
    fontStyle: 'italic',
  },
  activeOrderBanner: {
      position: 'absolute',
      bottom: 12,
      left: 16,
      right: 16,
      backgroundColor: Colors.deepGreen,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
  },
  bannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  bannerIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  bannerTitle: {
      color: Colors.white,
      fontWeight: 'bold',
      fontSize: 14,
  },
  bannerSubtitle: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import StoreCard from '../../components/StoreCard';
import SectionHeader from '../../components/SectionHeader';
import CategoryFilter from '../../components/CategoryFilter';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../context/OrdersContext';
import { useLanguage } from '../../context/LanguageContext';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isTimeOver } from '../../utils/timeUtils';
import { calculateDistance, DEFAULT_USER_LOCATION, getCurrentLocation, getAddressFromCoords } from '../../utils/locationUtils';

export default function HomeScreen() {
  const { activeOrders } = useOrders();
  const { t, fonts } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [locationName, setLocationName] = useState('Phnom Penh');
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.85;

  const rawStores = useQuery(api.stores.list);

  React.useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      setUserLocation(location);
      
      const name = await getAddressFromCoords(location.latitude, location.longitude);
      setLocationName(name);
    };
    fetchLocation();
  }, []);

  const getDistance = (distanceStr: string) => {
    return parseFloat(distanceStr.replace(/[^0-9.]/g, ''));
  };

  const isSoldOut = (store: any) => {
      return store.itemsLeft === 0 || isTimeOver(store.pickupTime);
  };

  const sortStores = (storesToSort: any[]) => {
      return [...storesToSort].sort((a, b) => {
          const soldOutA = isSoldOut(a);
          const soldOutB = isSoldOut(b);

          if (soldOutA !== soldOutB) {
              return soldOutA ? 1 : -1; // Available first
          }

          const distA = getDistance(a.distance);
          const distB = getDistance(b.distance);
          return distA - distB;
      });
  };

  const stores = sortStores((rawStores || []).map(s => ({ 
      ...s, 
      id: s._id,
      distance: calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          s.latitude, 
          s.longitude
      )
  })));

  const categoryFilteredStores = selectedCategory 
    ? stores.filter(s => s.category === selectedCategory) 
    : stores;
  
  const recommendedStores = categoryFilteredStores.filter(s => !isSoldOut(s));

  const parseTimeRange = (pickupTime: string) => {
      // Handles both "Today 10:00 AM - 11:00 AM" and "10:00 AM - 11:00 AM"
      const timeMatch = pickupTime.match(/(\d{1,2}:\d{2})\s?([AP]M)?\s*-\s*(\d{1,2}:\d{2})\s?([AP]M)?/i);
      if (!timeMatch) return null;

      const to24h = (time: string, period: string) => {
          let [h] = time.split(':').map(Number);
          if (period) {
              if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
              if (period.toUpperCase() === 'AM' && h === 12) h = 0;
          }
          return h;
      };

      return {
          start: to24h(timeMatch[1], timeMatch[2]),
          end: to24h(timeMatch[3], timeMatch[4])
      };
  };

  const filterByTimeRange = (sourceStores: any[], startHour: number, endHour: number) => {
      return sourceStores.filter(s => {
          const range = parseTimeRange(s.pickupTime);
          if (!range) return false;
          // Check overlap: storeStart <= mealEnd && storeEnd >= mealStart
          return range.start <= endHour && range.end >= startHour;
      });
  };

  const isStorePickupNow = (pickupTime: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour + currentMin / 60;

    const range = parseTimeRange(pickupTime);
    if (!range) return false;

    // Handle day-specific logic if Today/Tomorrow is present
    if (pickupTime.includes('Tomorrow') && now.getHours() < 24) return false; 

    // Simple check: current time between start and end
    // (This doesn't handle minutes perfectly, but consistent with hour-based range logic)
    return currentHour >= range.start && currentHour < range.end;
  };

  const breakfastStores = filterByTimeRange(categoryFilteredStores, 6, 11);
  const lunchStores = filterByTimeRange(categoryFilteredStores, 11, 15);
  const dinnerStores = filterByTimeRange(categoryFilteredStores, 17, 22);
  const nowStores = categoryFilteredStores.filter(store => isStorePickupNow(store.pickupTime));
  const bakedGoodsStores = categoryFilteredStores.filter(s => s.category === 'Baked Goods');

  const navigateToSection = (title: string, type: string) => {
    router.push({ 
      pathname: "/list", 
      params: { 
        title, 
        filterType: type,
        category: selectedCategory || '' 
      } 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
             <Ionicons name="location-sharp" size={16} color={Colors.deepGreen} />
             <Text style={[styles.locationText, { fontFamily: fonts.body }]} numberOfLines={1}>{locationName}</Text>
        </View>
        <View style={styles.titleRow}>
            <Text style={styles.appTitle}>LoopIt</Text>
            <TouchableOpacity style={styles.helpButton} onPress={() => router.push('/how-it-works')}>
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
            title={selectedCategory ? `${t(`cat${selectedCategory.replace(/\s+/g, '')}` as any)} ${t('nearYou')}` : t('recommended')} 
            onPress={() => navigateToSection("Recommended", "recommended")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {recommendedStores.length > 0 ? recommendedStores.slice(0, 10).map((store) => (
            <StoreCard key={store.id} store={store} containerStyle={{ width: cardWidth }} />
          )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>{t('noRecommended')}</Text>}
        </ScrollView>

        <SectionHeader 
            title={t('pickupNow')} 
            onPress={() => navigateToSection("Pick up now", "now")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {nowStores.length > 0 ? nowStores.map((store) => (
            <StoreCard key={`now-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>{t('noPickup')}</Text>}
        </ScrollView>

        {bakedGoodsStores.length > 0 && (
            <>
                <SectionHeader 
                    title={t('catBakedGoods')} 
                    onPress={() => navigateToSection("Baked Goods", "baked")} 
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                    {bakedGoodsStores.map((store) => (
                    <StoreCard key={`baked-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
                    ))}
                </ScrollView>
            </>
        )}

        <SectionHeader 
            title={t('breakfast')} 
            onPress={() => navigateToSection("Pick up for breakfast", "breakfast")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {breakfastStores.length > 0 ? breakfastStores.map((store) => (
            <StoreCard key={`breakfast-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>{t('noBreakfast')}</Text>}
        </ScrollView>

        <SectionHeader 
            title={t('lunch')} 
            onPress={() => navigateToSection("Pick up for lunch", "lunch")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {lunchStores.length > 0 ? lunchStores.map((store) => (
            <StoreCard key={`lunch-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>{t('noLunch')}</Text>}
        </ScrollView>

        <SectionHeader 
            title={t('dinner')} 
            onPress={() => navigateToSection("Pick up for dinner", "dinner")} 
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {dinnerStores.length > 0 ? dinnerStores.map((store) => (
            <StoreCard key={`dinner-${store.id}`} store={store} containerStyle={{ width: cardWidth }} />
            )) : <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>{t('noDinner')}</Text>}
        </ScrollView>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {activeOrders.length > 0 && (
         <TouchableOpacity 
             style={styles.activeOrderBanner}
             onPress={() => router.push({ 
                 pathname: "/order-success", 
                 params: { storeId: activeOrders[0].storeId, orderId: activeOrders[0]._id, view: 'true' } 
             })}
         >
             <View style={styles.bannerContent}>
                 <View style={styles.bannerIcon}>
                     <Ionicons name="bag-check" size={20} color={Colors.white} />
                 </View>
                 <View>
                     <Text style={[styles.bannerTitle, { fontFamily: fonts.body }]}>{t('collect')} {activeOrders[0].pickupTime.replace('Today', t('today')).replace('Tomorrow', t('tomorrow'))}</Text>
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
    maxWidth: '80%',
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
    fontFamily: 'RecoletaBold',
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
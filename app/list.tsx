import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { Colors, Fonts } from '../constants/Colors';
import StoreCard from '../components/StoreCard';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { isTimeOver } from '../utils/timeUtils';
import { calculateDistance, DEFAULT_USER_LOCATION, getCurrentLocation } from '../utils/locationUtils';
import { useLanguage } from '../context/LanguageContext';

export default function ListScreen() {
  const { filterType, title, category } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);

  const rawStores = useQuery(api.stores.list);

  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      setUserLocation(location);
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

  // 1. Filter by Category first (if provided)
  let data = stores;
  if (category) {
      data = stores.filter(s => s.category === category);
  }

  // 2. Filter by Type
  if (filterType === 'recommended') {
      data = data.filter(s => !isSoldOut(s));
  } else if (filterType === 'lunch') {
    data = data.filter(s => {
       const time = s.pickupTime.toLowerCase();
       return time.includes('11:') || time.includes('12:') || time.includes('13:') || time.includes('14:');
    });
  } else if (filterType === 'breakfast') {
    data = data.filter(s => {
       const time = s.pickupTime.toLowerCase();
       return time.includes('06:') || time.includes('07:') || time.includes('08:') || time.includes('09:') || time.includes('10:');
    });
  } else if (filterType === 'dinner') {
    data = data.filter(s => {
       const time = s.pickupTime.toLowerCase();
       return time.includes('17:') || time.includes('18:') || time.includes('19:') || time.includes('20:') || time.includes('21:');
    });
  } else if (filterType === 'now') {
      data = data.filter(s => {
        const now = new Date();
        const parts = s.pickupTime.split(' ');
        if (parts.length < 4) return false;

        const dayStr = parts[0];
        const startStr = parts[1];
        const endStr = parts[3];

        let targetDate = new Date();
        
        if (dayStr === 'Tomorrow') {
            targetDate.setDate(targetDate.getDate() + 1);
        } else if (dayStr !== 'Today') {
            return false;
        }

        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);

        const startDate = new Date(targetDate);
        startDate.setHours(startH, startM, 0, 0);

        const endDate = new Date(targetDate);
        endDate.setHours(endH, endM, 0, 0);

        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }

        return now >= startDate && now <= endDate;
      });
  } 
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.deepGreen} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Stores'}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <StoreCard store={item} containerStyle={{ width: '100%' }} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('noStoresFound')}</Text>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 50, // Match favorites/safe area
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 20,
  },
  backButton: {
      marginRight: 16,
  },
  headerTitle: {
      fontSize: 28,
      fontFamily: Fonts.heading,
      color: Colors.deepGreen,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
    // Removed alignItems: center to allow stretch
  },
  itemContainer: {
    marginBottom: 24,
  },
  emptyContainer: {
      marginTop: 50,
      alignItems: 'center',
  },
  emptyText: {
      fontFamily: Fonts.body,
      color: Colors.gray,
      fontSize: 16,
  },
});

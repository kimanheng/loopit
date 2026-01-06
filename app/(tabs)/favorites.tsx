import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useFavorites } from '../../context/FavoritesContext';
import StoreCard from '../../components/StoreCard';
import { useLanguage } from '../../context/LanguageContext';
import { calculateDistance, DEFAULT_USER_LOCATION, getCurrentLocation } from '../../utils/locationUtils';

export default function FavoritesScreen() {
  const { favoriteStores } = useFavorites();
  const { t, fonts } = useLanguage();
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);

  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      setUserLocation(location);
    };
    fetchLocation();
  }, []);

  const storesWithDistance = favoriteStores.map(store => ({
    ...store,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      store.latitude,
      store.longitude
    )
  }));

  if (favoriteStores.length === 0) {
    return (
        <View style={styles.container}>
            <Text style={[styles.text, { fontFamily: fonts.heading }]}>{t('tabFavorites')}</Text>
            <Text style={[styles.subtext, { fontFamily: fonts.body }]}>Heart your favorite stores to see them here.</Text>
        </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <Text style={[styles.headerTitle, { fontFamily: fonts.heading }]}>{t('tabFavorites')}</Text>
      <FlatList
        data={storesWithDistance}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <View style={styles.itemContainer}>
                <StoreCard store={item} containerStyle={{ width: '100%' }} />
            </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 60, 
  },
  headerTitle: {
      fontSize: 28,
      color: Colors.deepGreen,
      marginLeft: 16,
      marginBottom: 20,
  },
  text: {
    fontSize: 24,
    color: Colors.deepGreen,
    marginBottom: 8,
  },
  subtext: {
      color: Colors.gray,
  },
  listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
  },
  itemContainer: {
      marginBottom: 24,
  }
});
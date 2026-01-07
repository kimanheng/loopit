import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isTimeOver } from '../../utils/timeUtils';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { calculateDistance, DEFAULT_USER_LOCATION, getCurrentLocation } from '../../utils/locationUtils';

export default function StoreDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  
  const store = useQuery(api.stores.get, { id: id as any });

  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      setUserLocation(location);
    };
    fetchLocation();
  }, []);

  if (store === undefined) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={Colors.deepGreen} />
          </View>
      );
  }

  if (store === null) {
    return <View><Text>Store not found</Text></View>;
  }

  const timeOver = isTimeOver(store.pickupTime);
  const isSoldOut = store.itemsLeft === 0 || timeOver;
  
  const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      store.latitude,
      store.longitude
  );

  const openDirections = () => {
    if (!store.latitude || !store.longitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    Linking.openURL(url);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
            <View style={styles.imageHeader}>
                <Image source={{ uri: store.image }} style={[styles.image, isSoldOut && styles.imageGrayscale]} />
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                 <View style={styles.logoContainer}>
                    <Image source={{ uri: store.logo }} style={[styles.logo, isSoldOut && styles.imageGrayscale]} />
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { fontFamily: fonts.heading }]}>{store.name}</Text>
                    <View style={styles.subtitleRow}>
                        <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>{t('surpriseBag')}</Text>
                        {isSoldOut ? (
                            <View style={[styles.itemsLeftBadgeInline, styles.badgeSoldOut]}>
                                <Text style={[styles.itemsLeftTextInline, { fontFamily: fonts.body }]}>{t('soldOut')}</Text>
                            </View>
                        ) : (
                            store.itemsLeft <= 5 && (
                                <View style={styles.itemsLeftBadgeInline}>
                                    <Text style={[styles.itemsLeftTextInline, { fontFamily: fonts.body }]}>{store.itemsLeft} {t('left')}</Text>
                                </View>
                            )
                        )}
                    </View>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={16} color={Colors.deepGreen} />
                        <Text style={[styles.rating, { fontFamily: fonts.body }]}>{store.rating} (50+ ratings)</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={[styles.category, { fontFamily: fonts.body }]}>{t(`cat${store.category.replace(/\s+/g, '')}` as any) || store.category}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={[styles.distance, { fontFamily: fonts.body }]}>{distance}</Text>
                    </View>
                    <View style={styles.pickupRow}>
                         <Ionicons name="time-outline" size={16} color={Colors.black} />
                         <Text style={[styles.pickupText, { fontFamily: fonts.body }]}>{t('collect')} {store.pickupTime.replace('Today', t('today')).replace('Tomorrow', t('tomorrow'))}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                 <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('aboutBag')}</Text>
                    <Text style={[styles.description, { fontFamily: fonts.body }]}>
                        {t('aboutDescription')}
                    </Text>
                 </View>

                 <View style={styles.divider} />

                 <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('location')}</Text>
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: store.latitude || 51.5074,
                                longitude: store.longitude || -0.1278,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                        >
                            <Marker
                                coordinate={{
                                    latitude: store.latitude || 51.5074,
                                    longitude: store.longitude || -0.1278,
                                }}
                            >
                                <View style={styles.customMarker}>
                                    <Image source={{ uri: store.logo }} style={styles.markerImage} />
                                </View>
                            </Marker>
                        </MapView>
                    </View>
                    
                    {store.locationDescription && (
                        <View style={styles.locationDetailRow}>
                            <Ionicons name="information-circle-outline" size={16} color={Colors.gray} style={{ marginTop: 2 }} />
                            <Text style={[styles.locationDescription, { fontFamily: fonts.body }]}>{store.locationDescription}</Text>
                        </View>
                    )}
                     {store.plusCode && (
                        <View style={styles.locationDetailRow}>
                            <Ionicons name="map-outline" size={16} color={Colors.gray} />
                            <Text style={[styles.plusCode, { fontFamily: fonts.body }]}>Plus Code: {store.plusCode}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.directionsBtn} onPress={openDirections}>
                        <Text style={[styles.directionsBtnText, { fontFamily: fonts.body }]}>{t('getDirections')}</Text>
                    </TouchableOpacity>
                 </View>

                 <View style={styles.divider} />

                 <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('pickupInstructions')}</Text>
                    <Text style={[styles.description, { fontFamily: fonts.body }]}>
                        {t('pickupDesc')}
                    </Text>
                 </View>

                 <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('packaging')}</Text>
                    <View style={styles.packagingRow}>
                        <View style={styles.packagingCard}>
                            <Ionicons name="cube-outline" size={32} color={Colors.deepGreen} />
                            <Text style={[styles.packagingLabel, { fontFamily: fonts.body }]}>{t('container')}</Text>
                            <Text style={[styles.packagingValue, { fontFamily: fonts.body }]}>{t('provided')}</Text>
                        </View>
                        <View style={styles.packagingCard}>
                            <Ionicons name="bag-handle-outline" size={32} color={Colors.deepGreen} />
                            <Text style={[styles.packagingLabel, { fontFamily: fonts.body }]}>{t('carrierBag')}</Text>
                            <Text style={[styles.packagingValue, { fontFamily: fonts.body }]}>{t('provided')}</Text>
                        </View>
                    </View>
                    <View style={styles.infoBox}>
                         <Ionicons name="information-circle" size={20} color={Colors.deepGreen} />
                         <Text style={[styles.infoBoxText, { fontFamily: fonts.body }]}>{t('bringBag')}</Text>
                    </View>
                 </View>

                 <View style={styles.divider} />

                 <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('moreInfo')}</Text>
                    <View style={styles.moreInfoRow}>
                        <Text style={[styles.moreInfoLabel, { fontFamily: fonts.body }]}>{t('ingredients')}</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                    </View>
                    <Text style={[styles.moreInfoText, { fontFamily: fonts.body }]}>
                        {t('ingredientsDesc')}
                    </Text>
                 </View>
            </View>
            <View style={{ height: 100 }} /> 
        </ScrollView>

        <View style={styles.footer}>
            <View style={styles.priceInfo}>
                 <View style={styles.priceRow}>
                    <Text style={[styles.footerPrice, { fontFamily: fonts.body }]}>${store.price.toFixed(2)}</Text>
                    <Text style={[styles.footerOriginalPrice, { fontFamily: fonts.body }]}>${store.originalPrice.toFixed(2)}</Text>
                </View>
            </View>
            <TouchableOpacity 
                style={[
                    styles.reserveButton, 
                    (isSoldOut || user?.userType === 'business') && styles.reserveButtonDisabled
                ]}
                onPress={() => {
                    if (user?.userType === 'business') {
                        Alert.alert(t('businessAccount'), t('businessNoReserve'));
                        return;
                    }
                    if (!isSoldOut) {
                        router.push({ pathname: "/reserve/[id]", params: { id: store._id } });
                    }
                }}
                disabled={isSoldOut}
            >
                <Text style={[styles.reserveButtonText, { fontFamily: fonts.body }]}>
                    {isSoldOut ? 'Sold Out' : t('reserve')}
                </Text>
            </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  imageHeader: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGrayscale: {
      opacity: 0.8,
      backgroundColor: '#ccc',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
  },
  content: {
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: Colors.deepGreen,
    marginBottom: 4,
  },
  subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.black,
    fontWeight: '600',
    marginRight: 10,
  },
  itemsLeftBadgeInline: {
    backgroundColor: Colors.red,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSoldOut: {
      backgroundColor: Colors.gray,
  },
  itemsLeftTextInline: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.black,
  },
  dot: {
    marginHorizontal: 8,
    color: Colors.gray,
  },
  category: {
    fontSize: 14,
    color: Colors.gray,
  },
  distance: {
    fontSize: 14,
    color: Colors.gray,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pickupText: {
    marginLeft: 8,
    color: Colors.black,
    fontWeight: '500',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.deepGreen,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.gray,
    marginBottom: 16,
  },
  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
      width: '100%',
      height: '100%',
  },
  customMarker: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.white,
      borderWidth: 2,
      borderColor: Colors.deepGreen,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
  },
  markerImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
      resizeMode: 'cover',
  },
  locationDetailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
  },
  locationDescription: {
      marginLeft: 8,
      color: Colors.gray,
      fontSize: 14,
      flex: 1,
  },
  plusCode: {
      marginLeft: 8,
      color: Colors.gray,
      fontSize: 14,
  },
  directionsBtn: {
      borderWidth: 1,
      borderColor: Colors.deepGreen,
      borderRadius: 20,
      paddingVertical: 10,
      alignItems: 'center',
      marginBottom: 8,
  },
  directionsBtnText: {
      color: Colors.deepGreen,
      fontWeight: 'bold',
  },
  packagingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  packagingCard: {
      flex: 1,
      borderWidth: 1,
      borderColor: Colors.lightGray,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginHorizontal: 4,
  },
  packagingLabel: {
      marginTop: 8,
      fontSize: 14,
      color: Colors.black,
      fontWeight: '600',
  },
  packagingValue: {
      marginTop: 4,
      fontSize: 12,
      color: Colors.gray,
  },
  infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.offWhite,
      padding: 12,
      borderRadius: 8,
  },
  infoBoxText: {
      marginLeft: 8,
      fontSize: 13,
      color: Colors.black,
  },
  moreInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  moreInfoLabel: {
      fontSize: 16,
      color: Colors.black,
  },
  moreInfoText: {
      fontSize: 14,
      color: Colors.gray,
      lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
  },
  priceRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.deepGreen,
  },
  footerOriginalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    color: Colors.gray,
  },
  reserveButton: {
    flex: 1,
    marginLeft: 24,
    backgroundColor: Colors.deepGreen,
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reserveButtonDisabled: {
      backgroundColor: Colors.gray,
  },
  reserveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
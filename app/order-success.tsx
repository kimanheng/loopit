import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Platform, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrders } from '../context/OrdersContext';
import { useLanguage } from '../context/LanguageContext';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import MapView, { Marker } from 'react-native-maps';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orders } = useOrders();
  const { t, fonts } = useLanguage();
  const { storeId, view, orderId, code } = useLocalSearchParams();
  
  const store = useQuery(api.stores.get, storeId ? { id: storeId as any } : "skip");
  const isViewMode = view === 'true';

  const existingOrder = isViewMode ? orders.find(o => o._id === orderId) : null;
  const displayCode = isViewMode ? existingOrder?.code : code;

  const handleDone = () => {
    if (isViewMode) {
        router.back();
    } else {
        router.dismissAll(); 
        router.replace('/(tabs)');
    }
  };

  const openDirections = () => {
    if (!store?.latitude || !store?.longitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    Linking.openURL(url);
  };

  if (store === undefined) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={Colors.deepGreen} />
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
            <View style={styles.iconContainer}>
                <Ionicons name={isViewMode ? "receipt-outline" : "checkmark-sharp"} size={60} color={Colors.white} />
            </View>
            
            <Text style={[styles.title, { fontFamily: fonts.heading }]}>
                {isViewMode ? t('yourOrder') : t('reservationConfirmed')}
            </Text>
            
            <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
            You&apos;ve secured a Surprise Bag from <Text style={styles.storeName}>{store?.name || 'the store'}</Text>.
            </Text>

            <View style={styles.codeContainer}>
                <Text style={[styles.codeLabel, { fontFamily: fonts.body }]}>{t('pickupCode')}</Text>
                <Text style={[styles.codeText, { fontFamily: fonts.heading }]}>{displayCode}</Text>
            </View>

            <View style={styles.card}>
                <Text style={[styles.cardTitle, { fontFamily: fonts.body }]}>{t('collect')}</Text>
                <Text style={[styles.cardTime, { fontFamily: fonts.heading }]}>{store?.pickupTime || 'Check store details'}</Text>
                
                <View style={styles.divider} />
                
                <Text style={[styles.cardTitle, { fontFamily: fonts.body }]}>{t('location')}</Text>
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: store?.latitude || 51.5074,
                            longitude: store?.longitude || -0.1278,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        {store?.latitude && store?.longitude && (
                            <Marker coordinate={{ latitude: store.latitude, longitude: store.longitude }}>
                                <View style={styles.customMarker}>
                                    <Image source={{ uri: store.logo }} style={styles.markerImage} />
                                </View>
                            </Marker>
                        )}
                    </MapView>
                </View>

                {store?.locationDescription && (
                    <View style={styles.locationDetailRow}>
                        <Ionicons name="information-circle-outline" size={16} color={Colors.gray} style={{ marginTop: 2 }} />
                        <Text style={[styles.locationDescription, { fontFamily: fonts.body }]}>{store.locationDescription}</Text>
                    </View>
                )}
                {store?.plusCode && (
                    <View style={styles.locationDetailRow}>
                        <Ionicons name="map-outline" size={16} color={Colors.gray} />
                        <Text style={[styles.plusCode, { fontFamily: fonts.body }]}>Plus Code: {store.plusCode}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.directionsBtn} onPress={openDirections}>
                    <Text style={[styles.directionsBtnText, { fontFamily: fonts.body }]}>{t('getDirections')}</Text>
                </TouchableOpacity>
            </View>
            
            <Text style={[styles.instruction, { fontFamily: fonts.body }]}>
                {t('pickupDesc')}
            </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleDone}>
            <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>
                {isViewMode ? t('close') : t('gotIt')}
            </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.deepGreen,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: Colors.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    color: Colors.deepGreen,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  storeName: {
      color: Colors.black,
      fontWeight: 'bold',
  },
  codeContainer: {
      backgroundColor: Colors.white,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 24,
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  codeLabel: {
      fontSize: 12,
      color: Colors.gray,
      textTransform: 'uppercase',
      marginBottom: 4,
  },
  codeText: {
      fontSize: 20,
      color: Colors.deepGreen,
      fontWeight: 'bold',
  },
  card: {
      width: '100%',
      backgroundColor: Colors.white,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  cardTitle: {
      fontSize: 14,
      color: Colors.gray,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
  },
  cardTime: {
      fontSize: 20,
      color: Colors.deepGreen,
      marginBottom: 4,
      textAlign: 'center',
  },
  divider: {
      height: 1,
      backgroundColor: Colors.lightGray,
      width: '100%',
      marginVertical: 16,
  },
  mapContainer: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12,
  },
  map: {
      width: '100%',
      height: '100%',
  },
  customMarker: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Colors.white,
      padding: 2,
      borderWidth: 1,
      borderColor: Colors.deepGreen,
      justifyContent: 'center',
      alignItems: 'center',
  },
  markerImage: {
      width: '100%',
      height: '100%',
      borderRadius: 13,
      resizeMode: 'cover',
  },
  locationDetailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
      width: '100%',
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
      width: '100%',
      borderWidth: 1,
      borderColor: Colors.deepGreen,
      borderRadius: 20,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 8,
  },
  directionsBtnText: {
      color: Colors.deepGreen,
      fontWeight: 'bold',
  },
  instruction: {
      fontSize: 14,
      color: Colors.gray,
      textAlign: 'center',
  },
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors.white,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.lightGray,
  },
  button: {
      backgroundColor: Colors.deepGreen,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
  },
  buttonText: {
      color: Colors.white,
      fontSize: 16,
      fontWeight: 'bold',
  },
});

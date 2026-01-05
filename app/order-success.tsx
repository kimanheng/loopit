import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORES } from '../data/mockData';
import { useOrders } from '../context/OrdersContext';
import { useLanguage } from '../context/LanguageContext';
import { useState } from 'react';

const WORDS = ["Apple", "Breeze", "Cloud", "Dew", "Eagle", "Fern", "Grove", "Hill", "Iris", "Jade", "Kite", "Luna", "Moss", "Nest", "Opal"];

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { addOrder, orders } = useOrders();
  const { t, fonts } = useLanguage();
  const { storeId, view, orderId } = useLocalSearchParams();
  const store = STORES.find(s => s.id === storeId);
  const isViewMode = view === 'true';

  const [newCode] = useState(() => {
      const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
      const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
      const w3 = WORDS[Math.floor(Math.random() * WORDS.length)];
      return `# ${w1} - ${w2} - ${w3}`;
  });

  const existingOrder = isViewMode ? orders.find(o => o.id === orderId) : null;
  const displayCode = isViewMode ? existingOrder?.code : newCode;

  const handleDone = () => {
    if (!isViewMode && store) {
        addOrder({
            id: Math.random().toString(36).substr(2, 9),
            storeId: store.id,
            storeName: store.name,
            storeImage: store.image,
            pickupTime: store.pickupTime,
            date: 'Today', 
            status: 'active',
            price: store.price + (store.price * 0.086),
            originalPrice: store.originalPrice,
            items: 1,
            code: newCode
        });
    }
    
    if (isViewMode) {
        router.back();
    } else {
        router.dismissAll(); 
        router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
            <Ionicons name={isViewMode ? "receipt-outline" : "checkmark-sharp"} size={60} color={Colors.white} />
        </View>
        
        <Text style={[styles.title, { fontFamily: fonts.heading }]}>
            {isViewMode ? t('yourOrder') : t('reservationConfirmed')}
        </Text>
        
        <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
          You've secured a Surprise Bag from <Text style={styles.storeName}>{store?.name || 'the store'}</Text>.
        </Text>

        <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { fontFamily: fonts.body }]}>{t('pickupCode')}</Text>
            <Text style={[styles.codeText, { fontFamily: fonts.heading }]}>{displayCode}</Text>
        </View>

        <View style={styles.card}>
            <Text style={[styles.cardTitle, { fontFamily: fonts.body }]}>{t('collectionTime')}</Text>
            <Text style={[styles.cardTime, { fontFamily: fonts.heading }]}>{store?.pickupTime || 'Check store details'}</Text>
            
            <View style={styles.divider} />
            
            <Text style={[styles.cardTitle, { fontFamily: fonts.body }]}>{t('location')}</Text>
            <View style={styles.mapPlaceholder}>
                 <Ionicons name="map" size={24} color={Colors.gray} />
            </View>
            <Text style={[styles.cardAddress, { fontFamily: fonts.body }]}>123 High Street, London, UK</Text>
        </View>
        
        <Text style={[styles.instruction, { fontFamily: fonts.body }]}>
            {t('pickupDesc')}
        </Text>
      </View>

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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100, 
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
  cardAddress: {
      fontSize: 14,
      color: Colors.black,
  },
  divider: {
      height: 1,
      backgroundColor: Colors.lightGray,
      width: '100%',
      marginVertical: 16,
  },
  mapPlaceholder: {
      width: '100%',
      height: 100,
      backgroundColor: Colors.lightGray,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
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

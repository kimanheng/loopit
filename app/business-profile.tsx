import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import StoreCard from '../components/StoreCard';
import { calculateDistance, DEFAULT_USER_LOCATION, getCurrentLocation } from '../utils/locationUtils';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  
  const store = useQuery(api.stores.getMyStore, user?._id ? { ownerId: user._id } : "skip");
  const orders = useQuery(api.orders.getStoreOrders, store ? { storeId: store._id } : "skip");
  const updateBag = useMutation(api.stores.updateBag);

  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      setUserLocation(location);
    };
    fetchLocation();
  }, []);

  const toggleActive = async (newValue: boolean) => {
    if (!store) {
        Alert.alert('No Store Found', 'Please create your store details first.');
        return;
    }

    try {
        await updateBag({
            storeId: store._id,
            itemsLeft: store.itemsLeft,
            price: store.price,
            originalPrice: store.originalPrice,
            pickupTime: store.pickupTime,
            isActive: newValue
        });
    } catch (e: any) {
        Alert.alert('Activation Error', e.message || 'Failed to update status. Make sure your store details and bag info are complete.');
    }
  };

  // Calculate statistics
  const pendingOrders = orders ? orders.filter(o => o.status === 'active').length : 0;
  
  const soldToday = orders ? orders.filter(o => {
      const today = new Date().toISOString().split('T')[0];
      return o.status === 'completed' && o.date.startsWith(today);
  }).length : 0;

  const handleAddBag = () => {
    if (!store) {
      router.push('/business/create-store');
    } else {
      router.push({ pathname: '/business/manage-bag', params: { storeId: store._id } });
    }
  };

  const handleManageOrders = () => {
    if (!store) {
        Alert.alert('No Store', 'Please create a store first.');
    } else {
        router.push({ pathname: '/business/orders', params: { storeId: store._id } });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily: fonts.heading }]}>
          {t('welcome')}, {user?.name || 'Partner'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={Colors.deepGreen} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.activationSection}>
            <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.activationTitle, { fontFamily: fonts.heading }]}>Activate Listing</Text>
                <Text style={[styles.activationSubtitle, { fontFamily: fonts.body }]}>
                    {!store ? 'Create your store to start' : store.isActive === false ? 'Your store is hidden' : 'Your store is visible'}
                </Text>
            </View>
            <Switch
                value={store?.isActive === true}
                onValueChange={toggleActive}
                trackColor={{ false: Colors.lightGray, true: '#e6f4ea' }}
                thumbColor={store?.isActive === true ? Colors.deepGreen : Colors.gray}
                ios_backgroundColor={Colors.lightGray}
            />
        </View>

        <View style={styles.statsContainer}>
            <View style={[styles.statCard, { width: '31%' }]}>
                <Text style={[styles.statLabel, { fontFamily: fonts.heading, fontSize: 12 }]}>Active Bags</Text>
                <Text style={[
                    styles.statValue, 
                    { fontFamily: fonts.heading, fontSize: 24 },
                    store?.isActive === false && styles.disabledValue
                ]}>{store?.itemsLeft || 0}</Text>
            </View>
            <View style={[styles.statCard, { width: '31%' }]}>
                <Text style={[styles.statLabel, { fontFamily: fonts.heading, fontSize: 12 }]}>Orders</Text>
                <Text style={[styles.statValue, { fontFamily: fonts.heading, fontSize: 24 }]}>{pendingOrders}</Text>
            </View>
            <View style={[styles.statCard, { width: '31%' }]}>
                <Text style={[styles.statLabel, { fontFamily: fonts.heading, fontSize: 12 }]}>Sold Today</Text>
                <Text style={[styles.statValue, { fontFamily: fonts.heading, fontSize: 24 }]}>{soldToday}</Text>
            </View>
        </View>

        <View style={styles.actionSection}>
            {store && (
                <TouchableOpacity 
                    style={[styles.actionButton, { marginBottom: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.deepGreen }]} 
                    onPress={handleManageOrders}
                >
                    <Ionicons name="receipt-outline" size={24} color={Colors.deepGreen} />
                    <Text style={[styles.actionButtonText, { fontFamily: fonts.body, color: Colors.deepGreen }]}>
                        Manage Orders
                    </Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleAddBag}>
                <Ionicons name="bag-handle-outline" size={24} color={Colors.white} />
                <Text style={[styles.actionButtonText, { fontFamily: fonts.body }]}>
                    {store ? 'Manage Surprise Bag' : 'Create Store to Add Bags'}
                </Text>
            </TouchableOpacity>
        </View>

        {store && (
            <View style={styles.previewSection}>
                <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>Store Preview</Text>
                <Text style={[styles.previewSubtitle, { fontFamily: fonts.body }]}>How customers see your store</Text>
                <StoreCard 
                    store={{
                        id: store._id,
                        name: store.name,
                        image: store.image || '',
                        logo: store.logo || '',
                        distance: calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            store.latitude,
                            store.longitude
                        ),
                        rating: store.rating,
                        pickupTime: store.pickupTime,
                        price: store.price,
                        originalPrice: store.originalPrice,
                        itemsLeft: store.itemsLeft,
                    }} 
                    containerStyle={styles.previewCard}
                />
            </View>
        )}

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>Your Store</Text>
            <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                    if (store) {
                        router.push({ pathname: '/business/store-details', params: { storeId: store._id } });
                    } else {
                        router.push('/business/create-store');
                    }
                }}
            >
                <Ionicons name="storefront-outline" size={22} color={Colors.black} />
                <Text style={[styles.menuItemText, { fontFamily: fonts.body }]}>Store Details</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                    if (store) {
                        router.push({ pathname: '/business/orders', params: { storeId: store._id } });
                    } else {
                        Alert.alert('No Store', 'Please create a store first.');
                    }
                }}
            >
                <Ionicons name="receipt-outline" size={22} color={Colors.black} />
                <Text style={[styles.menuItemText, { fontFamily: fonts.body }]}>Orders</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                    if (store) {
                        router.push({ pathname: '/business/analytics', params: { storeId: store._id } });
                    } else {
                        Alert.alert('No Store', 'Please create a store first.');
                    }
                }}
            >
                <Ionicons name="stats-chart-outline" size={22} color={Colors.black} />
                <Text style={[styles.menuItemText, { fontFamily: fonts.body }]}>{t('analytics')}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
            </TouchableOpacity>
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
  scrollContent: {
      paddingBottom: 40,
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
      fontSize: 24,
      color: Colors.deepGreen,
  },
  activationSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#f9f9f9',
      marginHorizontal: 20,
      borderRadius: 16,
      marginTop: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#F0F0F0',
  },
  activationTitle: {
      fontSize: 18,
      color: Colors.black,
  },
  activationSubtitle: {
      fontSize: 13,
      color: Colors.gray,
  },
  statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 24,
      justifyContent: 'space-between',
  },
  statCard: {
      backgroundColor: Colors.white,
      borderRadius: 16,
      padding: 12,
      width: '47%',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: '#F0F0F0',
  },
  statLabel: {
      fontSize: 14,
      color: Colors.gray,
      marginBottom: 8,
  },
  statValue: {
      fontSize: 32,
      color: Colors.deepGreen,
  },
  disabledValue: {
      color: Colors.gray,
      opacity: 0.5,
  },
  actionSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
  },
  actionButton: {
      backgroundColor: Colors.deepGreen,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
  },
  actionButtonText: {
      color: Colors.white,
      fontSize: 16,
      fontWeight: '600',
  },
  section: {
      paddingHorizontal: 20,
  },
  sectionTitle: {
      fontSize: 18,
      color: Colors.black,
      marginBottom: 16,
  },
  previewSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
  },
  previewSubtitle: {
      fontSize: 14,
      color: Colors.gray,
      marginBottom: 12,
      marginTop: -12,
  },
  previewCard: {
      width: '100%',
      marginRight: 0,
  },
  menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.lightGray,
  },
  menuItemText: {
      flex: 1,
      fontSize: 16,
      color: Colors.black,
      marginLeft: 12,
  },
});

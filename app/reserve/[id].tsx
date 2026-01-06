import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ReserveScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t, fonts } = useLanguage();
    const { addOrder } = useOrders();
    const { user } = useAuth();
    
    const store = useQuery(api.stores.get, { id: id as any });

    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user?.userType === 'business') {
        router.back();
        return null;
    }

    if (store === undefined) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.deepGreen} />
            </View>
        );
    }

    if (!store) return <View style={styles.container}><Text>{t('storeNotFound')}</Text></View>;

    const subtotal = store.price * quantity;
    const taxes = subtotal * 0.086; // Approx tax
    const total = subtotal + taxes;

    const increase = () => setQuantity(q => q + 1);
    const decrease = () => setQuantity(q => Math.max(1, q - 1));

    const handleReserve = async () => {
        setIsSubmitting(true);
        const result = await addOrder({
            storeId: store._id,
            storeName: store.name,
            storeImage: store.image || '',
            pickupTime: store.pickupTime,
            price: total,
            originalPrice: store.originalPrice, // Should probably be total original price but keeping per unit for now or simple logic
            items: quantity,
        });
        setIsSubmitting(false);

        if (result) {
            router.push({ 
                pathname: "/order-success", 
                params: { 
                    storeId: store._id,
                    orderId: result.orderId,
                    code: result.code
                } 
            });
        } else {
            // Handle error (e.g. not logged in)
            alert("Failed to create order. Please try again.");
        }
    };

    const localizedTime = store.pickupTime.replace('Today', t('today')).replace('Tomorrow', t('tomorrow'));

    return (
        <SafeAreaView style={styles.container}>
             <Stack.Screen options={{ headerShown: false }} />
             
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.black} />
                </TouchableOpacity>
             </View>

             <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.storeInfo}>
                    <View style={styles.logoContainer}>
                        <Image source={{ uri: store.logo }} style={styles.logo} />
                    </View>
                    <Text style={[styles.storeName, { fontFamily: fonts.heading }]}>{store.name} ({t('surpriseBag')})</Text>
                    
                    <View style={styles.pickupRow}>
                        <View style={styles.pickupBadge}>
                             <Text style={[styles.pickupBadgeText, { fontFamily: fonts.body }]}>{t('collect')}</Text>
                        </View>
                        <Text style={[styles.pickupTime, { fontFamily: fonts.body }]}>{localizedTime}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { fontFamily: fonts.body }]}>{t('payment')}</Text>
                    <View style={styles.paymentOptionRow}>
                        <View style={styles.paymentLeft}>
                            <Ionicons name="cash-outline" size={24} color={Colors.black} />
                            <Text style={[styles.paymentText, { fontFamily: fonts.body }]}>{t('cash')}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.deepGreen} />
                    </View>
                </View>
                
                 <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>{t('subtotal')}</Text>
                        <Text style={[styles.summaryValue, { fontFamily: fonts.body }]}>${subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>{t('salesTax')}</Text>
                        <Text style={[styles.summaryValue, { fontFamily: fonts.body }]}>${taxes.toFixed(2)}</Text>
                    </View>
                     <View style={[styles.summaryRow, { marginTop: 12 }]}>
                        <Text style={[styles.totalLabel, { fontFamily: fonts.body }]}>{t('total')}</Text>
                        <Text style={[styles.totalValue, { fontFamily: fonts.body }]}>${total.toFixed(2)}</Text>
                    </View>
                 </View>

                 <Text style={[styles.legalText, { fontFamily: fonts.body }]}>
                    {t('agreeTerms')} <Text style={styles.link}>{t('terms')}</Text>.
                 </Text>
             </ScrollView>

             <View style={styles.footer}>
                <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={decrease} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={24} color={Colors.black} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { fontFamily: fonts.body }]}>{quantity}</Text>
                    <TouchableOpacity onPress={increase} style={styles.qtyBtn}>
                         <Ionicons name="add" size={24} color={Colors.black} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={[styles.reserveButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleReserve}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={[styles.reserveButtonText, { fontFamily: fonts.body }]}>{t('reserve')}</Text>
                    )}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
      padding: 4,
  },
  scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
  },
  storeInfo: {
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 30,
  },
  logoContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.lightGray,
  },
  logo: {
      width: '100%',
      height: '100%',
  },
  storeName: {
      fontSize: 20,
      color: Colors.black,
      textAlign: 'center',
      marginBottom: 12,
  },
  pickupRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  pickupBadge: {
      backgroundColor: Colors.offWhite,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 10,
  },
  pickupBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.black,
  },
  pickupTime: {
      fontSize: 16,
      color: Colors.black,
  },
  separator: {
      height: 1,
      backgroundColor: Colors.lightGray,
      marginBottom: 24,
  },
  section: {
      marginBottom: 24,
  },
  sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: Colors.black,
      letterSpacing: 1,
      marginBottom: 12,
      textTransform: 'uppercase',
  },
  paymentOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
  },
  paymentLeft: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  paymentText: {
      marginLeft: 12,
      fontSize: 16,
      color: Colors.black,
  },
  summaryContainer: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
  },
  summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
  },
  summaryLabel: {
      fontSize: 15,
      color: Colors.gray,
  },
  summaryValue: {
      fontSize: 15,
      color: Colors.gray,
  },
  totalLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.black,
  },
  totalValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.black,
  },
  legalText: {
      fontSize: 13,
      color: Colors.gray,
      textAlign: 'center',
      paddingHorizontal: 16,
      lineHeight: 18,
  },
  link: {
      textDecorationLine: 'underline',
      color: Colors.deepGreen,
  },
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors.white,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: Colors.lightGray,
  },
  quantityControl: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F0F0',
      borderRadius: 30,
      paddingHorizontal: 8,
      paddingVertical: 8,
      height: 50,
      minWidth: 120,
      justifyContent: 'space-between',
  },
  qtyBtn: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
  },
  qtyText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginHorizontal: 12,
  },
  reserveButton: {
      flex: 1,
      marginLeft: 16,
      backgroundColor: Colors.deepGreen,
      borderRadius: 30,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
  },
  reserveButtonText: {
      color: Colors.white,
      fontSize: 16,
      fontWeight: 'bold',
  },
});

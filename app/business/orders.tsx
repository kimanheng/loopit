import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '../../convex/_generated/dataModel';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function BusinessOrdersScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  
  const orders = useQuery(api.orders.getStoreOrders, { storeId: storeId as Id<"stores"> });
  const completeOrder = useMutation(api.orders.completeOrder);
  const cancelOrder = useMutation(api.orders.cancelOrder);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const handleComplete = (orderId: Id<"orders">) => {
    Alert.alert(
      "Confirm Pickup",
      "Has the customer collected the bag?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              await completeOrder({ orderId });
            } catch (e) {
              Alert.alert("Error", "Failed to complete order");
            }
          } 
        }
      ]
    );
  };

  const handleCancel = (orderId: Id<"orders">) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? Stock will be returned.",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              await cancelOrder({ orderId });
            } catch (e) {
              Alert.alert("Error", "Failed to cancel order");
            }
          } 
        }
      ]
    );
  };

  if (!orders) {
      return (
          <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right']}>
              <ActivityIndicator size="large" color={Colors.deepGreen} />
          </SafeAreaView>
      );
  }

  const activeOrders = orders.filter(o => o.status === 'active');
  const historyOrders = orders.filter(o => o.status !== 'active');
  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
            <Text style={[styles.customerName, { fontFamily: fonts.heading }]}>{item.customer.name}</Text>
            <Text style={[styles.date, { fontFamily: fonts.body }]}>
                {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
        <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { fontFamily: fonts.body }]}>Code</Text>
            <Text style={[styles.code, { fontFamily: fonts.heading }]}>{item.code}</Text>
        </View>
      </View>

      <View style={styles.details}>
          <Text style={[styles.detailText, { fontFamily: fonts.body }]}>
              {item.items} x Surprise Bag
          </Text>
          <Text style={[styles.price, { fontFamily: fonts.heading }]}>
              ${item.price.toFixed(2)}
          </Text>
      </View>

      {item.status === 'active' && (
          <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item._id)}>
                  <Text style={[styles.cancelText, { fontFamily: fonts.body }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(item._id)}>
                  <Text style={[styles.completeText, { fontFamily: fonts.body }]}>Picked Up</Text>
              </TouchableOpacity>
          </View>
      )}

      {item.status !== 'active' && (
          <View style={[styles.statusBadge, item.status === 'completed' ? styles.badgeSuccess : styles.badgeCancel]}>
              <Text style={[styles.statusText, { fontFamily: fonts.body }]}>
                  {item.status === 'completed' ? 'Completed' : 'Cancelled'}
              </Text>
          </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.deepGreen} />
         </TouchableOpacity>
         <Text style={[styles.title, { fontFamily: fonts.heading }]}>Orders</Text>
      </View>

      <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
              <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText, { fontFamily: fonts.body }]}>
                  Active ({activeOrders.length})
              </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText, { fontFamily: fonts.body }]}>
                  History
              </Text>
          </TouchableOpacity>
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={Colors.gray} />
                <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>No orders found</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  center: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
  },
  backBtn: {
      marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: Colors.deepGreen,
  },
  tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: Colors.lightGray,
      marginBottom: 10,
  },
  tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
  },
  activeTab: {
      borderBottomColor: Colors.deepGreen,
  },
  tabText: {
      fontSize: 16,
      color: Colors.gray,
  },
  activeTabText: {
      color: Colors.deepGreen,
      fontWeight: 'bold',
  },
  listContent: {
      padding: 16,
  },
  card: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
  },
  customerName: {
      fontSize: 18,
      color: Colors.black,
      marginBottom: 4,
  },
  date: {
      fontSize: 14,
      color: Colors.gray,
  },
  codeContainer: {
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      padding: 8,
      borderRadius: 8,
  },
  codeLabel: {
      fontSize: 10,
      color: Colors.gray,
      textTransform: 'uppercase',
  },
  code: {
      fontSize: 18,
      color: Colors.deepGreen,
  },
  details: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
  },
  detailText: {
      fontSize: 16,
      color: Colors.black,
  },
  price: {
      fontSize: 16,
      color: Colors.deepGreen,
  },
  actions: {
      flexDirection: 'row',
      gap: 12,
  },
  cancelBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ff4444',
      alignItems: 'center',
  },
  cancelText: {
      color: '#ff4444',
      fontWeight: '600',
  },
  completeBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: Colors.deepGreen,
      alignItems: 'center',
  },
  completeText: {
      color: Colors.white,
      fontWeight: '600',
  },
  statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  badgeSuccess: {
      backgroundColor: '#e6f4ea',
  },
  badgeCancel: {
      backgroundColor: '#ffebee',
  },
  statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.black,
  },
  emptyState: {
      alignItems: 'center',
      marginTop: 40,
  },
  emptyText: {
      color: Colors.gray,
      marginTop: 10,
      fontSize: 16,
  },
});

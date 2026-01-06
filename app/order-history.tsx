import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { useOrders } from '../context/OrdersContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';

export default function OrderHistoryScreen() {
  const { orders } = useOrders();
  const router = useRouter();
  const { t, fonts } = useLanguage();

  const handleOrderPress = (order: any) => {
      if (order.status === 'active') {
          router.push({
              pathname: "/order-success",
              params: { storeId: order.storeId, orderId: order._id, view: 'true' }
          });
      }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
            headerShown: false,
            title: t('orderHistory')
        }} 
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.deepGreen} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.heading }]}>
          {t('orderHistory')}
        </Text>
      </View>

      {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>{t('noOrders')}</Text>
          </View>
      ) : (
          <FlatList
              data={[...orders].reverse()} // Show newest first
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                  const Wrapper = item.status === 'active' ? TouchableOpacity : View;
                  return (
                  <Wrapper 
                    style={styles.orderCard} 
                    onPress={item.status === 'active' ? () => handleOrderPress(item) : undefined}
                    activeOpacity={0.7}
                  >
                       <Image source={{ uri: item.storeImage }} style={styles.orderImage} />
                       <View style={styles.orderInfo}>
                           <Text style={[styles.storeName, { fontFamily: fonts.body }]}>{item.storeName}</Text>
                           <Text style={[styles.orderDate, { fontFamily: fonts.body }]}>{item.pickupTime}</Text>
                           <View style={[styles.statusBadge, item.status === 'active' ? styles.activeBadge : styles.completedBadge]}>
                               <Text style={[styles.statusText, { fontFamily: fonts.body }, item.status === 'active' ? styles.activeText : styles.completedText]}>{item.status}</Text>
                           </View>
                       </View>
                       <View style={styles.priceColumn}>
                           <Text style={[styles.orderOriginalPrice, { fontFamily: fonts.body }]}>${item.originalPrice.toFixed(2)}</Text>
                           <Text style={[styles.orderPrice, { fontFamily: fonts.body }]}>${item.price.toFixed(2)}</Text>
                       </View>
                  </Wrapper>
                  );
              }}
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 60,
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
      fontSize: 24,
      color: Colors.deepGreen,
  },
  listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
  },
  orderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.white,
      marginBottom: 16,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: Colors.lightGray,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
  },
  orderImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: Colors.lightGray,
  },
  orderInfo: {
      flex: 1,
      marginLeft: 12,
  },
  storeName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.black,
      marginBottom: 4,
  },
  orderDate: {
      fontSize: 12,
      color: Colors.gray,
      marginBottom: 6,
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
  },
  activeBadge: {
      backgroundColor: '#e6f4ea',
  },
  completedBadge: {
      backgroundColor: Colors.lightGray,
  },
  statusText: {
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
  },
  activeText: {
      color: Colors.deepGreen,
  },
  completedText: {
      color: Colors.gray,
  },
  priceColumn: {
      alignItems: 'flex-end',
  },
  orderOriginalPrice: {
      fontSize: 12,
      color: Colors.gray,
      textDecorationLine: 'line-through',
      marginBottom: 2,
  },
  orderPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: Colors.deepGreen,
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
  },
  emptyText: {
      fontSize: 16,
      color: Colors.gray,
      textAlign: 'center',
  },
});

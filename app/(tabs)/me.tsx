import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useOrders } from '../../context/OrdersContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';

export default function MeScreen() {
  const { orders } = useOrders();
  const router = useRouter();
  const { t, fonts } = useLanguage();

  const moneySaved = orders.reduce((acc, o) => acc + (o.originalPrice - o.price), 0);
  const co2Saved = orders.length * 2.5;

  const handleOrderPress = (order: any) => {
      if (order.status === 'active') {
          router.push({
              pathname: "/order-success",
              params: { storeId: order.storeId, orderId: order.id, view: 'true' }
          });
      }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily: fonts.heading }]}>{t('myProfile')}</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={Colors.deepGreen} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
           <View style={styles.statCard}>
               <Text style={[styles.statLabel, { fontFamily: fonts.heading }]}>{t('co2Avoided')}</Text>
               <Ionicons name="leaf" size={40} color={Colors.deepGreen} style={styles.statIcon} />
               <Text style={[styles.statValue, { fontFamily: fonts.heading }]}>{co2Saved.toFixed(1)}</Text>
               <Text style={[styles.statUnit, { fontFamily: fonts.body }]}>kg</Text>
           </View>
           <View style={styles.statCard}>
               <Text style={[styles.statLabel, { fontFamily: fonts.heading }]}>{t('moneySaved')}</Text>
               <Ionicons name="cash-outline" size={40} color={Colors.deepGreen} style={styles.statIcon} />
               <Text style={[styles.statValue, { fontFamily: fonts.heading }]}>{Math.max(0, moneySaved).toFixed(2)}</Text>
               <Text style={[styles.statUnit, { fontFamily: fonts.body }]}>$</Text>
           </View>
      </View>
      
      <View style={styles.section}>
          <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>{t('orderHistory')}</Text>
              <TouchableOpacity style={styles.seeAllBtn}>
                  <Text style={[styles.seeAllText, { fontFamily: fonts.body }]}>{t('seeAll')}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.deepGreen} />
              </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
              <Text style={[styles.emptyText, { fontFamily: fonts.body }]}>{t('noOrders')}</Text>
          ) : (
              <FlatList
                  data={orders.slice(0, 2)}
                  keyExtractor={(item) => item.id}
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 20,
  },
  headerTitle: {
      fontSize: 28,
      color: Colors.deepGreen,
  },
  statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 30,
      justifyContent: 'space-between',
  },
  statCard: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.lightGray,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
  },
  statLabel: {
      fontSize: 16,
      color: Colors.black,
      marginBottom: 12,
      textAlign: 'center',
  },
  statIcon: {
      marginBottom: 8,
  },
  statValue: {
      fontSize: 24,
      color: Colors.deepGreen,
      lineHeight: 30,
  },
  statUnit: {
      fontSize: 14,
      color: Colors.gray,
      marginTop: 2,
  },
  section: {
      flex: 1,
      paddingHorizontal: 16,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 18,
      color: Colors.black,
  },
  seeAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  seeAllText: {
      fontSize: 14,
      color: Colors.deepGreen,
      fontWeight: '600',
      marginRight: 4,
  },
  emptyText: {
      color: Colors.gray,
      fontStyle: 'italic',
  },
  listContent: {
      paddingBottom: 20,
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
      shadowRadius: 2,
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
});

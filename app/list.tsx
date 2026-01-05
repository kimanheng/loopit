import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../constants/Colors';
import { STORES } from '../data/mockData';
import StoreCard from '../components/StoreCard';
import { Ionicons } from '@expo/vector-icons';

export default function ListScreen() {
  const { filterType, title, category } = useLocalSearchParams();
  const router = useRouter();

  // 1. Filter by Category first (if provided)
  let data = STORES;
  if (category) {
      data = STORES.filter(s => s.category === category);
  }

  // 2. Filter by Type
  if (filterType === 'lunch') {
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
      data = data.slice(0, 5); // Mock logic
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
                <Text style={styles.emptyText}>No stores found.</Text>
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

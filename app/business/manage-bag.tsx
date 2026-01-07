import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '../../convex/_generated/dataModel';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManageBagScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  
  const updateBag = useMutation(api.stores.updateBag);
  const store = useQuery(api.stores.get, { id: storeId as Id<"stores"> });

  const [itemsLeft, setItemsLeft] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (store) {
      setItemsLeft(store.itemsLeft.toString());
      setPrice(store.price.toString());
      setOriginalPrice(store.originalPrice.toString());
      
      if (store.pickupTime) {
          // Format is like "10:00 AM - 11:00 AM" (without day)
          const times = store.pickupTime.includes(', ') 
            ? store.pickupTime.split(', ')[1].split(' - ')
            : store.pickupTime.split(' - ');
            
          if (times.length === 2) {
              setStartDate(parseTimeString(times[0]));
              setEndDate(parseTimeString(times[1]));
          }
      }
    }
  }, [store]);

  const parseTimeString = (timeStr: string) => {
      const d = new Date();
      try {
        const [time, period] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        d.setHours(hours);
        d.setMinutes(minutes);
        d.setSeconds(0);
      } catch (e) {}
      return d;
  };

  const formatTime = (date: Date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strMinutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${strMinutes} ${ampm}`;
  };

  const handleUpdate = async () => {
    if (!itemsLeft || !price || !originalPrice) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const pickupTime = `${formatTime(startDate)} - ${formatTime(endDate)}`;

    try {
      await updateBag({
        storeId: storeId as Id<"stores">,
        itemsLeft: parseInt(itemsLeft),
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice),
        pickupTime,
      });
      Alert.alert('Success', 'Surprise Bag updated!');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update bag');
    }
  };

  const onStartChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  if (!store) return <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}><Text>Loading...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.deepGreen} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: fonts.heading }]}>Manage Surprise Bag</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { fontFamily: fonts.body }]}>Quantity Available</Text>
          <TextInput
            style={[styles.input, { fontFamily: fonts.body }]}
            keyboardType="numeric"
            value={itemsLeft}
            onChangeText={setItemsLeft}
          />

          <Text style={[styles.label, { fontFamily: fonts.body }]}>Price ($)</Text>
          <TextInput
            style={[styles.input, { fontFamily: fonts.body }]}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={[styles.label, { fontFamily: fonts.body }]}>Original Value ($)</Text>
          <TextInput
            style={[styles.input, { fontFamily: fonts.body }]}
            keyboardType="numeric"
            value={originalPrice}
            onChangeText={setOriginalPrice}
          />

          <View style={styles.timeRow}>
              <View style={{flex: 1}}>
                  <Text style={[styles.label, { fontFamily: fonts.body }]}>Start Time</Text>
                  <TouchableOpacity 
                      style={[styles.timeInput, showStartPicker && styles.timeInputActive]} 
                      onPress={() => {
                          setShowStartPicker(!showStartPicker);
                          setShowEndPicker(false);
                      }}
                  >
                      <Text style={[styles.timeText, { fontFamily: fonts.body }]}>{formatTime(startDate)}</Text>
                      <Ionicons name="time-outline" size={20} color={showStartPicker ? Colors.deepGreen : Colors.gray} />
                  </TouchableOpacity>
              </View>
              <View style={{width: 16}} />
              <View style={{flex: 1}}>
                  <Text style={[styles.label, { fontFamily: fonts.body }]}>End Time</Text>
                  <TouchableOpacity 
                      style={[styles.timeInput, showEndPicker && styles.timeInputActive]} 
                      onPress={() => {
                          setShowEndPicker(!showEndPicker);
                          setShowStartPicker(false);
                      }}
                  >
                      <Text style={[styles.timeText, { fontFamily: fonts.body }]}>{formatTime(endDate)}</Text>
                      <Ionicons name="time-outline" size={20} color={showEndPicker ? Colors.deepGreen : Colors.gray} />
                  </TouchableOpacity>
              </View>
          </View>

          {showStartPicker && (
              <View style={styles.centeredPicker}>
                  <DateTimePicker
                      value={startDate}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onStartChange}
                  />
              </View>
          )}

          {showEndPicker && (
              <View style={styles.centeredPicker}>
                  <DateTimePicker
                      value={endDate}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onEndChange}
                  />
              </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={[styles.buttonText, { fontFamily: fonts.heading }]}>Update Bag</Text>
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
  content: {
      padding: 20,
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
  },
  backBtn: {
      marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: Colors.deepGreen,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    color: Colors.black,
    marginBottom: 8,
  },
  switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: '#f9f9f9',
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 10,
  },
  helperText: {
      fontSize: 13,
      color: Colors.gray,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    height: 56,
    textAlignVertical: 'center',
  },
  timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
  },
  timeInput: {
      borderWidth: 1,
      borderColor: Colors.lightGray,
      borderRadius: 12,
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fafafa',
  },
  timeInputActive: {
      borderColor: Colors.deepGreen,
      backgroundColor: '#fff',
  },
  timeText: {
      fontSize: 16,
      color: Colors.black,
      fontWeight: '500',
  },
  centeredPicker: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: 10,
      backgroundColor: '#fff',
      borderRadius: 12,
  },
  button: {
      backgroundColor: Colors.deepGreen,
      padding: 18,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 40,
      shadowColor: Colors.deepGreen,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

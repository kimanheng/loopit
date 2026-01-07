import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BusinessRegisterScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { registerBusiness } = useAuth();
  
  const [businessName, setBusinessName] = useState('');
  const [storeType, setStoreType] = useState('');
  const [showStoreTypes, setShowStoreTypes] = useState(false);
  const [street, setStreet] = useState('');
  const [sangkat, setSangkat] = useState('');
  const [city, setCity] = useState('Phnom Penh');
  const [contactNumber, setContactNumber] = useState('+855');

  const STORE_TYPES = ['Cafe', 'Restaurant', 'Bakery', 'Grocery', 'Other'];

  const handleRegister = () => {
    // Handle registration logic here
    console.log({
      businessName,
      storeType,
      street,
      sangkat,
      city,
      contactNumber
    });
    registerBusiness();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: fonts.heading }]}>
                {t('businessRegistration')}
            </Text>
            <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('businessName')}</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          <View style={[styles.inputContainer, { zIndex: 10 }]}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('storeType')}</Text>
            <TouchableOpacity 
              style={[styles.input, styles.dropdownButton]} 
              onPress={() => setShowStoreTypes(!showStoreTypes)}
            >
              <Text style={[{ fontFamily: fonts.body, color: storeType ? Colors.black : Colors.gray }]}>
                {storeType || t('storeType')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.gray} />
            </TouchableOpacity>
            
            {showStoreTypes && (
              <View style={styles.dropdownList}>
                {STORE_TYPES.map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStoreType(type);
                      setShowStoreTypes(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { fontFamily: fonts.body }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('streetNameNumber')}</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('sangkat')}</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              value={sangkat}
              onChangeText={setSangkat}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('city')}</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body, color: Colors.black }]}
              value={city}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('contactNumber')}</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { opacity: (businessName && contactNumber && storeType) ? 1 : 0.5 }]} 
            onPress={handleRegister}
            disabled={!businessName || !contactNumber || !storeType}
          >
            <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('register')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.black,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 6,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    fontSize: 16,
    paddingVertical: 8,
    color: Colors.black,
    fontFamily: 'GoogleSans',
    height: 50,
    textAlignVertical: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: Colors.deepGreen,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.black,
  },
});

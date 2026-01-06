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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [businessName, setBusinessName] = useState('');
  const [storeType, setStoreType] = useState('');
  const [showStoreTypes, setShowStoreTypes] = useState(false);
  const [street, setStreet] = useState('');
  const [sangkat, setSangkat] = useState('');
  const [city, setCity] = useState('Phnom Penh');
  const [contactNumber, setContactNumber] = useState('+855');

  const STORE_TYPES = ['Cafe', 'Restaurant', 'Bakery', 'Grocery', 'Other'];

  // Mock function to simulate Google Places API search
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      setIsSearching(true);
      // Simulate API delay
      setTimeout(() => {
        // Mock results
        if (text.toLowerCase().includes('coffee')) {
          setSearchResults([
            {
              id: '1',
              name: 'Best Coffee Phnom Penh',
              types: ['Cafe'],
              formatted_address: '#123, St 456, Sangkat Toul Tom Poung, Phnom Penh',
              sangkat: 'Toul Tom Poung',
              city: 'Phnom Penh',
            },
            {
                id: '2',
                name: 'LoopIt Coffee',
                types: ['Cafe'],
                formatted_address: '#1, St 1, Sangkat Daun Penh, Phnom Penh',
                sangkat: 'Daun Penh',
                city: 'Phnom Penh',
            }
          ]);
        } else {
            setSearchResults([]);
        }
        setIsSearching(false);
      }, 1000);
    } else {
      setSearchResults([]);
    }
  };

  const selectBusiness = (business: any) => {
    setBusinessName(business.name);
    // Map Google types to our types if possible, or default to Other
    const mappedType = STORE_TYPES.find(t => business.types.some((bt: string) => bt.toLowerCase().includes(t.toLowerCase()))) || 'Other';
    setStoreType(mappedType);
    
    // Simple parsing logic for the mock data
    const parts = business.formatted_address.split(', ');
    if (parts.length >= 3) {
        setStreet(parts[0] + ', ' + parts[1]);
        // parts[2] might be Sangkat
        if (parts[2].includes('Sangkat')) {
            setSangkat(parts[2].replace('Sangkat ', ''));
        } else {
             setSangkat(parts[2]);
        }
    }
    
    setCity('Phnom Penh'); // Always Phnom Penh per requirement
    setSearchResults([]);
    setSearchQuery('');
  };

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
          
          <View style={styles.section}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('searchBusiness')}</Text>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
                <TextInput
                style={[styles.searchInput, { fontFamily: fonts.body }]}
                placeholder={t('searchBusiness')}
                value={searchQuery}
                onChangeText={handleSearch}
                />
                {isSearching && <ActivityIndicator size="small" color={Colors.deepGreen} />}
            </View>
            
            {searchResults.length > 0 && (
                <View style={styles.resultsContainer}>
                    {searchResults.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => selectBusiness(item)}>
                            <Text style={[styles.resultName, { fontFamily: fonts.body }]}>{item.name}</Text>
                            <Text style={[styles.resultAddress, { fontFamily: fonts.body }]}>{item.formatted_address}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
          </View>

          <Text style={[styles.dividerText, { fontFamily: fonts.body }]}>{t('manualEntry')}</Text>

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
  section: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.offWhite,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  resultsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: Colors.white,
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
  resultAddress: {
    fontSize: 14,
    color: Colors.gray,
  },
  dividerText: {
    textAlign: 'center',
    color: Colors.gray,
    marginBottom: 20,
    fontSize: 14,
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

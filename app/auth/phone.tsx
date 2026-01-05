import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PhoneScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (phoneNumber.length < 8) {
      setError(t('invalidPhone'));
      return;
    }
    // Navigate to verify with the phone number as a parameter
    router.push({ pathname: '/auth/verify', params: { phone: phoneNumber } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { fontFamily: fonts.heading }]}>
            {t('enterPhone')}
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefixText}>+855</Text>
            </View>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              placeholder="12 345 678"
              keyboardType="number-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setError('');
              }}
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, { opacity: phoneNumber.length >= 8 ? 1 : 0.5 }]} 
            onPress={handleContinue}
            disabled={phoneNumber.length < 8}
          >
            <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('continue')}</Text>
          </TouchableOpacity>

          <View style={styles.helpContainer}>
              <TouchableOpacity style={styles.helpButton}>
                  <Text style={[styles.helpText, { fontFamily: fonts.body }]}>{t('howItWorks')}</Text>
                  <Ionicons name="information-circle-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
          </View>
        </View>
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
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    marginBottom: 40,
    color: Colors.black,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 8,
  },
  prefixContainer: {
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.lightGray,
  },
  prefixText: {
    fontSize: 20,
    color: Colors.black,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: Colors.black,
  },
  errorText: {
    color: Colors.red,
    marginTop: 8,
    fontSize: 14,
  },
  button: {
    marginTop: 40,
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
  helpContainer: {
      marginTop: 20,
      alignItems: 'center',
  },
  helpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.deepGreen,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  helpText: {
      fontSize: 12,
      color: Colors.white,
      marginRight: 6,
      fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
    router.push({ pathname: '/auth/password', params: { phone: phoneNumber } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.headerSection}>
                    <Text style={[styles.title, { fontFamily: fonts.heading }]}>
                        {t('enterPhone')}
                    </Text>
                    <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
                        {t('sendCodeDesc')}
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('contactNumber')}</Text>
                        <View style={styles.inputWrapper}>
                            <View style={styles.prefixContainer}>
                                <Text style={[styles.prefixText, { fontFamily: fonts.body }]}>+855</Text>
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
                                placeholderTextColor={Colors.gray + '80'}
                            />
                        </View>
                        {error ? <Text style={[styles.errorText, { fontFamily: fonts.body }]}>{error}</Text> : null}
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.button, { opacity: phoneNumber.length >= 8 ? 1 : 0.5 }]} 
                        onPress={handleContinue}
                        disabled={phoneNumber.length < 8}
                    >
                        <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('continue')}</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.helpButton} onPress={() => router.push('/how-it-works')}>
                        <Ionicons name="information-circle-outline" size={18} color={Colors.deepGreen} />
                        <Text style={[styles.helpText, { fontFamily: fonts.body }]}>{t('howItWorks')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    color: Colors.black,
    marginBottom: 12,
  },
  subtitle: {
      fontSize: 16,
      color: Colors.gray,
      lineHeight: 22,
  },
  form: {
      flex: 1,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: Colors.lightGray,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: '#FAFAFA',
      height: 56,
  },
  prefixContainer: {
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.lightGray,
  },
  prefixText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.black,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.red,
    marginTop: 8,
    fontSize: 14,
  },
  footer: {
      marginTop: 'auto',
  },
  button: {
    backgroundColor: Colors.deepGreen,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
  },
  helpText: {
      fontSize: 14,
      color: Colors.deepGreen,
      marginLeft: 6,
      fontWeight: '600',
  },
});
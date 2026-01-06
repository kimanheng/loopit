import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function InfoScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { t, fonts } = useLanguage();
  const { signIn, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = async () => {
    if (name.trim().length >= 2) {
        await updateProfile(name, referralCode);
        router.replace('/(tabs)');
    }
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
                        {t('completeProfile')}
                    </Text>
                    <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
                        Just a few more details to get you started on your food saving journey.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('fullName')}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { fontFamily: fonts.body }]}
                                placeholder="e.g. Sok Dara"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor={Colors.gray + '80'}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('referralCode')}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="gift-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { fontFamily: fonts.body }]}
                                placeholder="Enter code"
                                value={referralCode}
                                onChangeText={setReferralCode}
                                autoCapitalize="characters"
                                placeholderTextColor={Colors.gray + '80'}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.button, { opacity: name.trim().length >= 2 ? 1 : 0.5 }]} 
                        onPress={handleSubmit}
                        disabled={name.trim().length < 2}
                    >
                        <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('continue')}</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.termsText, { fontFamily: fonts.body }]}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
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
  inputIcon: {
      marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
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
  termsText: {
      textAlign: 'center',
      fontSize: 12,
      color: Colors.gray,
      lineHeight: 18,
  }
});
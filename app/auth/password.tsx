import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function PasswordScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { t, fonts } = useLanguage();
  const { signIn, signUp } = useAuth();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if user exists by phone number
  const existingUser = useQuery(api.users.getUserByPhoneNumber, phone ? { phoneNumber: phone } : "skip");
  const isQueryLoading = existingUser === undefined;
  const isNewUser = existingUser === null;

  const handleContinue = async () => {
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isNewUser) {
        // For new users, create account and proceed to info screen
        await signUp(phone!, password);
        router.push({ pathname: '/auth/info', params: { phone } });
      } else {
        await signIn(phone!, password);
        router.replace('/');
      }
    } catch (e: any) {
      // If account already exists, automatically try to sign in instead
      if (e?.message?.includes('already exists')) {
        try {
          await signIn(phone!, password);
          router.replace('/');
          return;
        } catch (signInError: any) {
          // Sign in also failed - show the sign in error (likely wrong password)
          setError(signInError?.message || t('invalidCredentials'));
        }
      } else {
        setError(e?.message || t('invalidCredentials'));
      }
    } finally {
      setLoading(false);
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
                        {isNewUser ? t('createAccount') : t('login')}
                    </Text>
                    <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
                        {isNewUser 
                          ? 'Set a password for your new account.' 
                          : t('enterPassword')}
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('password')}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { fontFamily: fonts.body }]}
                                placeholder="******"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError('');
                                }}
                                autoFocus
                                placeholderTextColor={Colors.gray + '80'}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color={Colors.gray} 
                                />
                            </TouchableOpacity>
                        </View>
                        {error ? <Text style={[styles.errorText, { fontFamily: fonts.body }]}>{error}</Text> : null}
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.button, { opacity: password.length >= 6 ? 1 : 0.5 }]} 
                        onPress={handleContinue}
                        disabled={password.length < 6 || loading || existingUser === undefined}
                    >
                        {loading || isQueryLoading ? (
                          <ActivityIndicator color={Colors.white} />
                        ) : (
                          <>
                            <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>
                                {isNewUser ? t('continue') : t('login')}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
                          </>
                        )}
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
});

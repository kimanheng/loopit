import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (phone) {
        signIn(phone);
        updateProfile(name, email);
        router.replace('/(tabs)');
    }
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
            {t('completeProfile')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('fullName')}</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('email')}</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { opacity: (name && email) ? 1 : 0.5 }]} 
            onPress={handleSubmit}
            disabled={!name || !email}
          >
            <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('continue')}</Text>
          </TouchableOpacity>
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
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 40,
    color: Colors.black,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    fontSize: 18,
    paddingVertical: 8,
    color: Colors.black,
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
});

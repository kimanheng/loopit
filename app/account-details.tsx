import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [referralCode, setReferralCode] = useState(user?.referralCode || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setReferralCode(user.referralCode || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(name, referralCode);
      Alert.alert(t('profileUpdated'));
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isChanged = name !== (user?.name || '') || referralCode !== (user?.referralCode || '');
  const isValid = name.trim().length >= 2;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: t('accountDetails'),
          headerTitleStyle: { fontFamily: fonts.heading, fontSize: 18 },
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.white },
        }} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: fonts.body }]}>{t('enterPhone')}</Text>
              <View style={[styles.inputWrapper, styles.disabledInput]}>
                <Ionicons name="call-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
                <Text style={[styles.readOnlyText, { fontFamily: fonts.body }]}>{user?.phoneNumber}</Text>
              </View>
            </View>

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
              style={[
                styles.button, 
                { opacity: (isValid && isChanged && !isSaving) ? 1 : 0.5 }
              ]} 
              onPress={handleSave}
              disabled={!isValid || !isChanged || isSaving}
            >
              <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>
                {isSaving ? '...' : t('saveChanges')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '600',
    marginBottom: 8,
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
  disabledInput: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray,
  },
  footer: {
    marginTop: 40,
  },
  button: {
    backgroundColor: Colors.deepGreen,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

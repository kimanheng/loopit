import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { t, fonts } = useLanguage();
  const { signIn } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError(t('invalidCode'));
      return;
    }

    // Mock Verification Logic
    // If phone ends with '000', treat as new user.
    // Otherwise, treat as existing user.
    
    if (fullCode === '123456') { // Mock valid code
        if (phone?.endsWith('000')) {
             // New User -> Go to Info
             router.push({ pathname: '/auth/info', params: { phone } });
        } else {
             // Existing User -> Login
             if (phone) signIn(phone);
             // Navigation will be handled by the layout or manually here
             router.replace('/(tabs)');
        }
    } else {
        setError(t('invalidCode'));
    }
  };

  const handleChangeCode = (text: string, index: number) => {
    if (text.length > 1) {
        // Handle paste? For now just take first char
        text = text[0];
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError('');

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (text: string, index: number) => {
      if (!text && index > 0) {
          inputs.current[index - 1]?.focus();
      }
  }

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
            {t('verifyCode')}
          </Text>
          
          <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
            {t('verifyDesc')} +855 {phone}
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => inputs.current[index] = ref}
                style={[styles.codeInput, { fontFamily: fonts.body }]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChangeCode(text, index)}
                onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                        handleBackspace(digit, index);
                    }
                }}
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.resendButton}>
            <Text style={[styles.resendText, { fontFamily: fonts.body }]}>{t('resendCode')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { opacity: code.join('').length === 6 ? 1 : 0.5 }]} 
            onPress={handleVerify}
            disabled={code.join('').length < 6}
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
    marginBottom: 8,
    color: Colors.black,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    color: Colors.black,
  },
  errorText: {
    color: Colors.red,
    marginBottom: 10,
    fontSize: 14,
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  resendText: {
    color: Colors.deepGreen,
    fontSize: 16,
  },
  button: {
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

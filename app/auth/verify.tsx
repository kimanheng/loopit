import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError(t('invalidCode'));
      return;
    }

    if (fullCode === '123456') { 
        if (phone?.endsWith('000')) {
             router.push({ pathname: '/auth/info', params: { phone } });
        } else {
             if (phone) signIn(phone, '123456'); // Dummy password for bypass
             router.replace('/');
        }
    } else {
        setError(t('invalidCode'));
    }
  };

  const handleChangeCode = (text: string, index: number) => {
    if (text.length > 1) {
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
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.headerSection}>
                    <Text style={[styles.title, { fontFamily: fonts.heading }]}>
                        {t('verifyCode')}
                    </Text>
                    <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
                        {t('verifyDesc')} <Text style={styles.phoneText}>+855 {phone}</Text>
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.codeContainer}>
                        {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => inputs.current[index] = ref}
                            style={[
                                styles.codeInput, 
                                { fontFamily: fonts.body },
                                digit ? styles.codeInputActive : null,
                                error ? styles.codeInputError : null
                            ]}
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
                    {error ? <Text style={[styles.errorText, { fontFamily: fonts.body }]}>{error}</Text> : null}
                    
                    <TouchableOpacity style={styles.resendContainer}>
                        <Text style={[styles.resendText, { fontFamily: fonts.body }]}>
                            Didn&apos;t receive the code? <Text style={styles.resendLink}>{t('resendCode')}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.button, { opacity: code.join('').length === 6 ? 1 : 0.5 }]} 
                        onPress={handleVerify}
                        disabled={code.join('').length < 6}
                    >
                        <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('continue')}</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
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
  phoneText: {
      color: Colors.black,
      fontWeight: 'bold',
  },
  form: {
      flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codeInput: {
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    color: Colors.black,
    backgroundColor: '#FAFAFA',
  },
  codeInputActive: {
      borderColor: Colors.deepGreen,
      backgroundColor: Colors.white,
  },
  codeInputError: {
      borderColor: Colors.red,
  },
  errorText: {
    color: Colors.red,
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  resendContainer: {
      alignItems: 'center',
      marginTop: 10,
  },
  resendText: {
    color: Colors.gray,
    fontSize: 14,
  },
  resendLink: {
      color: Colors.deepGreen,
      fontWeight: 'bold',
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
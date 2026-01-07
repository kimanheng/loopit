import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';

export default function HowItWorksScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();

  const steps = [
    {
      id: 1,
      title: t('hiwStep1Title'),
      description: t('hiwStep1Desc'),
      icon: 'earth-outline' as const,
    },
    {
      id: 2,
      title: t('hiwStep2Title'),
      description: t('hiwStep2Desc'),
      icon: 'phone-portrait-outline' as const,
    },
    {
      id: 3,
      title: t('hiwStep3Title'),
      description: t('hiwStep3Desc'),
      icon: 'storefront-outline' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={Colors.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.heading }]}>{t('hiwTitle')}</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name={step.icon} size={48} color={Colors.deepGreen} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.stepNumber, { fontFamily: fonts.heading }]}>{index + 1}</Text>
              <Text style={[styles.stepTitle, { fontFamily: fonts.heading }]}>{step.title}</Text>
              <Text style={[styles.stepDescription, { fontFamily: fonts.body }]}>{step.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('gotIt')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray + '40',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.black,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  stepContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGreen + '30', // Assuming lightGreen exists or fallback needed
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.deepGreen + '20',
  },
  textContainer: {
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 40,
    color: Colors.gray,
    position: 'absolute',
    top: -20,
    left: -30,
    opacity: 0.4,
  },
  stepTitle: {
    fontSize: 20,
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  footer: {
    paddingHorizontal: 24,
    height: 85,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray + '40',
    backgroundColor: Colors.white,
  },
  button: {
    backgroundColor: Colors.deepGreen,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
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

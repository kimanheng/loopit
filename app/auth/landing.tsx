import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { Colors, Fonts } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LandingScreen() {
  const router = useRouter();
  const { setLanguage, t, fonts } = useLanguage();

  const handleLanguageSelect = (lang: 'en' | 'km' | 'zh') => {
    setLanguage(lang);
    router.push('/auth/phone');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logoImage} 
            contentFit="contain"
          />
          <Text style={[styles.appName, { fontFamily: 'RecoletaBold' }]}>LoopIt</Text>
        </View>
        
        <View style={styles.sloganContainer}>
          <Text style={[styles.slogan, { fontFamily: fonts.heading, color: Colors.black, marginBottom: 0 }]}>
            {t('sloganLine1')}
          </Text>
          <Text style={[styles.slogan, { fontFamily: fonts.heading, color: Colors.deepGreen }]}>
            {t('sloganLine2')}
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="leaf-outline" size={24} color={Colors.deepGreen} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { fontFamily: fonts.body }]}>{t('hiwStep1Title')}</Text>
              <Text style={[styles.featureDesc, { fontFamily: fonts.body }]}>{t('hiwStep1Desc')}</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="cash-outline" size={24} color={Colors.deepGreen} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { fontFamily: fonts.body }]}>{t('hiwStep2Title')}</Text>
              <Text style={[styles.featureDesc, { fontFamily: fonts.body }]}>{t('hiwStep2Desc')}</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="restaurant-outline" size={24} color={Colors.deepGreen} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { fontFamily: fonts.body }]}>{t('hiwStep3Title')}</Text>
              <Text style={[styles.featureDesc, { fontFamily: fonts.body }]}>{t('hiwStep3Desc')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.languageContainer}>
          <Text style={[styles.selectLanguage, { fontFamily: fonts.body }]}>
            {t('selectLanguage')}
          </Text>
          
          <View style={styles.languageButtons}>
            <TouchableOpacity 
              style={styles.langButton} 
              onPress={() => handleLanguageSelect('en')}
            >
              <Text style={styles.langButtonText}>English</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.langButton} 
              onPress={() => handleLanguageSelect('km')}
            >
              <Text style={styles.langButtonText}>ខ្មែរ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.langButton} 
              onPress={() => handleLanguageSelect('zh')}
            >
              <Text style={styles.langButtonText}>中文</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoImage: {
    width: 60,
    height: 60,
    marginBottom: 0,
    borderRadius: 12,
  },
  appName: {
    fontSize: 28,
    color: Colors.deepGreen,
  },
  sloganContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slogan: {
    fontSize: 28,
    textAlign: 'center',
    color: Colors.deepGreen,
    lineHeight: 36,
    marginBottom: 12,
  },
  subSlogan: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.gray,
    lineHeight: 22,
  },
  featuresContainer: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.gray,
  },
  languageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  selectLanguage: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 16,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  langButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  langButtonText: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: Fonts.body,
  },
});
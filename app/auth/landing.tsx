import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { Colors, Fonts } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            resizeMode="contain"
          />
          <Text style={[styles.appName, { fontFamily: 'RecoletaBold' }]}>LoopIt</Text>
        </View>
        
        <View style={styles.sloganContainer}>
          <Text style={[styles.slogan, { fontFamily: fonts.heading }]}>
            {t('slogan')}
          </Text>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slogan: {
    fontSize: 32,
    textAlign: 'center',
    color: Colors.deepGreen,
    lineHeight: 40,
  },
  languageContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  selectLanguage: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 20,
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

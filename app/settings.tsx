import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'km', label: 'Khmer' },
  { code: 'zh', label: 'Chinese' },
];

interface SettingsItem {
  id: string;
  labelKey: string;
  icon: string;
  isLanguage?: boolean;
  value?: string;
  color?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t, fonts } = useLanguage();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  const SECTIONS: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'SETTINGS',
      items: [
        { id: 'account', labelKey: 'accountDetails', icon: 'person-outline' },
        { id: 'payment', labelKey: 'paymentCards', icon: 'card-outline' },
        { id: 'language', labelKey: 'language', icon: 'globe-outline', isLanguage: true, value: LANGUAGES.find(l => l.code === language)?.label },
        { id: 'notifications', labelKey: 'notifications', icon: 'notifications-outline' },
      ]
    },
    {
      title: 'COMMUNITY',
      items: [
        { id: 'invite', labelKey: 'inviteFriends', icon: 'people-outline' },
        { id: 'recommend', labelKey: 'recommendStore', icon: 'star-outline' },
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 'help', labelKey: 'helpOrder', icon: 'briefcase-outline' },
        { id: 'how', labelKey: 'howItWorks', icon: 'help-circle-outline' },
        { id: 'careers', labelKey: 'careers', icon: 'business-outline' },
      ]
    },
    {
      title: 'OTHER',
      items: [
        { id: 'hidden', labelKey: 'hiddenStores', icon: 'eye-off-outline' },
        { id: 'logout', labelKey: 'logOut', icon: 'log-out-outline', color: Colors.red },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: t('manageAccount'),
          headerTitleStyle: { fontFamily: fonts.heading, fontSize: 18 },
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>
          ),
          headerRight: () => null,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.white },
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section, secIndex) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { fontFamily: fonts.body }]}>{section.title}</Text>
            {section.items.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity 
                  style={styles.row}
                  onPress={() => item.isLanguage ? setShowLanguageOptions(!showLanguageOptions) : null}
                >
                  <View style={styles.rowLeft}>
                    <Ionicons name={item.icon as any} size={24} color={Colors.black} style={styles.icon} />
                    <Text style={[
                        styles.rowLabel, 
                        { fontFamily: fonts.body },
                        item.color && { color: item.color }
                    ]}>
                        {t(item.labelKey as any)}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    {item.value && <Text style={[styles.rowValue, { fontFamily: fonts.body }]}>{item.value}</Text>}
                    <Ionicons name={item.isLanguage && showLanguageOptions ? "chevron-up" : "chevron-forward"} size={20} color={Colors.gray} />
                  </View>
                </TouchableOpacity>
                
                {/* Language Dropdown */}
                {item.isLanguage && showLanguageOptions && (
                  <View style={styles.languageOptions}>
                    {LANGUAGES.map((lang) => (
                      <TouchableOpacity 
                        key={lang.code}
                        style={styles.langOption}
                        onPress={() => {
                          setLanguage(lang.code as any);
                          setShowLanguageOptions(false);
                        }}
                      >
                        <Text style={[
                          styles.langLabel, 
                          { fontFamily: fonts.body },
                          language === lang.code && styles.langLabelSelected
                        ]}>
                          {lang.label}
                        </Text>
                        {language === lang.code && (
                          <Ionicons name="checkmark" size={20} color={Colors.deepGreen} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
    width: 24,
  },
  rowLabel: {
    fontSize: 16,
    color: Colors.black,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 14,
    color: Colors.gray,
    marginRight: 8,
  },
  languageOptions: {
    backgroundColor: '#f9f9f9',
    paddingLeft: 56, 
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  langLabel: {
    fontSize: 15,
    color: Colors.black,
  },
  langLabelSelected: {
    color: Colors.deepGreen,
    fontWeight: 'bold',
  },
});

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

interface SectionHeaderProps {
  title: string;
  onPress?: () => void;
}

export default function SectionHeader({ title, onPress }: SectionHeaderProps) {
  const { t, fonts } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fonts.heading }]}>{title}</Text>
      {onPress && (
        <Pressable onPress={onPress} style={styles.button}>
          <Text style={[styles.buttonText, { fontFamily: fonts.body }]}>{t('seeAll')}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.deepGreen} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 24,
    paddingVertical: 4, 
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold', 
    color: Colors.deepGreen,
    lineHeight: 28, 
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: Colors.deepGreen,
    marginRight: 4,
  },
});
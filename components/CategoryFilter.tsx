import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = [
  { id: '1', name: 'Meals', icon: 'restaurant-outline', key: 'catMeals' },
  { id: '2', name: 'Baked Goods', icon: 'food-croissant', key: 'catBakedGoods', iconSet: 'material' as const },
  { id: '3', name: 'Groceries', icon: 'cart-outline', key: 'catGroceries' },
  { id: '5', name: 'Vegan', icon: 'leaf-outline', key: 'catVegan' },
];

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { fonts, t } = useLanguage();

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity 
          style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]} 
          onPress={() => onSelectCategory(null)}
        >
           <Text style={[
               styles.categoryText, 
               { fontFamily: fonts.body },
               selectedCategory === null && styles.categoryTextActive
           ]}>{t('catAll')}</Text>
        </TouchableOpacity>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
              onPress={() => onSelectCategory(isSelected ? null : cat.name)}
            >
               {'iconSet' in cat && cat.iconSet === 'material' ? (
                <MaterialCommunityIcons 
                  name={cat.icon as any} 
                  size={16} 
                  color={isSelected ? Colors.white : Colors.deepGreen} 
                  style={{ marginRight: 6 }} 
                />
              ) : (
                <Ionicons 
                  name={cat.icon as any} 
                  size={16} 
                  color={isSelected ? Colors.white : Colors.deepGreen} 
                  style={{ marginRight: 6 }} 
                />
              )}
              <Text style={[
                  styles.categoryText, 
                  { fontFamily: fonts.body },
                  isSelected && styles.categoryTextActive
              ]}>{t(cat.key as any)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  categoryChipActive: {
    backgroundColor: Colors.deepGreen,
    borderColor: Colors.deepGreen,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.deepGreen,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: Colors.white,
  },
});

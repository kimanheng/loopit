import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'expo-router';
import { isTimeOver } from '../utils/timeUtils';

interface StoreCardProps {
  store: {
    id: string;
    name: string;
    image: string;
    logo: string;
    distance: string;
    rating: number;
    pickupTime: string;
    price: number;
    originalPrice: number;
    itemsLeft: number;
  };
  containerStyle?: any;
}

export default function StoreCard({ store, containerStyle }: StoreCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, fonts } = useLanguage();
  const favorite = isFavorite(store.id);
  
  const timeOver = isTimeOver(store.pickupTime);
  const isSoldOut = store.itemsLeft === 0 || timeOver;
  const shouldGrayOut = isSoldOut;

  return (
    <View style={[styles.shadowWrapper, containerStyle]}>
      <Link href={`/store/${store.id}`} asChild>
        <Pressable style={[styles.cardContent, shouldGrayOut && styles.cardDisabled]}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: store.image }} style={[styles.image, shouldGrayOut && styles.imageGrayscale]} />
            <View style={styles.logoContainer}>
                <Image source={{ uri: store.logo }} style={[styles.logo, shouldGrayOut && styles.imageGrayscale]} />
            </View>
            {isSoldOut ? (
                <View style={[styles.badge, styles.badgeSoldOut]}>
                    <Text style={[styles.badgeText, { fontFamily: fonts.body }]}>{t('soldOut')}</Text>
                </View>
            ) : store.itemsLeft < 10 ? (
                <View style={styles.badge}>
                    <Text style={[styles.badgeText, { fontFamily: fonts.body }]}>{store.itemsLeft} {t('left')}</Text>
                </View>
            ) : null}
            <TouchableOpacity 
              style={styles.favoriteBtn} 
              onPress={(e) => {
                  e.stopPropagation(); // Prevent navigation when clicking heart
                  toggleFavorite(store.id);
              }}
            >
                <Ionicons name={favorite ? "heart" : "heart-outline"} size={20} color={favorite ? Colors.red : "#fff"} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <View style={styles.headerRow}>
                <Text style={[styles.name, { fontFamily: fonts.body }]} numberOfLines={1}>{store.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
                <Text style={[styles.surpriseBag, { fontFamily: fonts.body }]}>{t('surpriseBag')}</Text>
                <Text style={[styles.pickupTime, { fontFamily: fonts.body }]}>{store.pickupTime.replace('Today', t('today')).replace('Tomorrow', t('tomorrow'))}</Text>
            </View>
            
            <View style={styles.footerRow}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color={Colors.deepGreen} />
                    <Text style={[styles.rating, { fontFamily: fonts.body }]}>{store.rating}</Text>
                    <Text style={styles.ratingSeparator}>•</Text>
                    <Text style={[styles.distance, { fontFamily: fonts.body }]}>{store.distance}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={[styles.originalPrice, { fontFamily: fonts.body }]}>${store.originalPrice.toFixed(2)}</Text>
                    <Text style={[styles.price, { fontFamily: fonts.body }]}>${store.price.toFixed(2)}</Text>
                </View>
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    width: 280, // Default width
    // height: 260, // Removed fixed height to prevent clipping
    marginRight: 16,
    marginBottom: 12, // Space for shadow
    backgroundColor: Colors.white,
    borderRadius: 12,
    // Strong shadow properties for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6, // Android
  },
  cardContent: {
    // flex: 1, // Removed to allow auto height
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden', // Clips the image
    paddingBottom: 12, // Add padding at bottom since height is auto
  },
  cardDisabled: {
      opacity: 0.6,
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageGrayscale: {
      opacity: 0.8, // Optional: add grayscale filter if supported or just dim
      backgroundColor: '#ccc',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -15, // Halfway overlapping
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    padding: 2,
    zIndex: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden', // Essential for Android
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 20, // Match container
    resizeMode: 'contain',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.red,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSoldOut: {
      backgroundColor: Colors.gray,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
  },
  content: {
    padding: 12,
    paddingTop: 20, // Make room for logo
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    flex: 1,
  },
  infoRow: {
    marginBottom: 8,
  },
  surpriseBag: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  pickupTime: {
    fontSize: 13,
    color: Colors.deepGreen,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 13,
    color: Colors.gray,
  },
  ratingSeparator: {
    marginHorizontal: 4,
    color: Colors.gray,
    fontSize: 10,
  },
  distance: {
    fontSize: 13,
    color: Colors.gray,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: Colors.gray,
    fontSize: 12,
    marginRight: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.deepGreen,
  },
});

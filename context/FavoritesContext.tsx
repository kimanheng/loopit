import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Ideally import from generated types, but for now define subset
interface Store {
  _id: string;
  id: string; // Mapped from _id for compatibility
  name: string;
  image: string;
  logo: string;
  distance: string;
  rating: number;
  pickupTime: string;
  price: number;
  originalPrice: number;
  itemsLeft: number;
  category: string;
  latitude?: number;
  longitude?: number;
}

interface FavoritesContextType {
  favorites: string[]; // List of Store IDs
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  favoriteStores: Store[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const favoriteStoresRaw = useQuery(api.favorites.getFavorites, user ? { userId: user._id as any } : "skip");
  const toggleFavoriteMutation = useMutation(api.favorites.toggleFavorite);

  const favoriteStores = (favoriteStoresRaw || []).map(s => ({ ...s, id: s._id })) as Store[];
  const favorites = favoriteStores.map(s => s._id);

  const toggleFavorite = async (storeId: string) => {
    if (user) {
      await toggleFavoriteMutation({ userId: user._id as any, storeId: storeId as any });
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, favoriteStores }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

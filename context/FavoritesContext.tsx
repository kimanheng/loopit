import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORES } from '../data/mockData';

type Store = typeof STORES[0];

interface FavoritesContextType {
  favorites: string[]; // List of Store IDs
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  favoriteStores: Store[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const favoriteStores = STORES.filter((store) => favorites.includes(store.id));

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

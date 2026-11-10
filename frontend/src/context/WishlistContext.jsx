import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch saved listing IDs when authenticated
  const fetchWishlistIds = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistIds(new Set());
      return;
    }

    try {
      setLoading(true);
      const ids = await wishlistService.getWishlistIds();
      setWishlistIds(new Set(ids || []));
    } catch (err) {
      console.error('Failed to load wishlist IDs:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  // Check if a listing is currently saved
  const isSaved = useCallback((listingId) => {
    if (!listingId) return false;
    return wishlistIds.has(Number(listingId));
  }, [wishlistIds]);

  // Toggle saving/unsaving with optimistic updates
  const toggleWishlist = useCallback(async (listingId) => {
    if (!isAuthenticated) {
      return { success: false, reason: 'unauthenticated' };
    }

    const numId = Number(listingId);
    const currentlySaved = wishlistIds.has(numId);

    // Optimistic update
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (currentlySaved) {
        next.delete(numId);
      } else {
        next.add(numId);
      }
      return next;
    });

    try {
      if (currentlySaved) {
        await wishlistService.removeFromWishlist(numId);
        return { success: true, saved: false };
      } else {
        await wishlistService.addToWishlist(numId);
        return { success: true, saved: true };
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err);
      // Revert optimistic state
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) {
          next.add(numId);
        } else {
          next.delete(numId);
        }
        return next;
      });
      throw err;
    }
  }, [isAuthenticated, wishlistIds]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        savedCount: wishlistIds.size,
        isSaved,
        toggleWishlist,
        refreshWishlist: fetchWishlistIds,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;

import * as Haptics from 'expo-haptics';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Business } from '@/data/businesses';
import type { ExplorePost, ExplorePostMediaType } from '@/data/explore-posts';
import type { PromotionFeedItem } from '@/types/promotion-feed';

export type SavedBusinessItem = {
  id: string;
  name: string;
  category: string;
  distance: string;
  rating: number;
  image: string;
  logo: string;
};

export type SavedPostItem = {
  id: string;
  businessId: string;
  businessName: string;
  mediaType: ExplorePostMediaType;
  mediaUri: string;
  caption: string;
};

export type SavedPromotionItem = {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  expiresLabel: string;
  promotionImage: string;
};

type SavedItemsContextValue = {
  savedBusinesses: SavedBusinessItem[];
  savedPosts: SavedPostItem[];
  savedPromotions: SavedPromotionItem[];
  saveBusiness: (business: Business) => void;
  unsaveBusiness: (businessId: string) => void;
  toggleBusinessSaved: (business: Business) => void;
  isBusinessSaved: (businessId: string) => boolean;
  savePost: (post: ExplorePost) => void;
  unsavePost: (postId: string) => void;
  togglePostSaved: (post: ExplorePost) => void;
  isPostSaved: (postId: string) => boolean;
  savePromotion: (promotion: PromotionFeedItem) => void;
  unsavePromotion: (promotionId: string) => void;
  togglePromotionSaved: (promotion: PromotionFeedItem) => void;
  isPromotionSaved: (promotionId: string) => boolean;
};

const SavedItemsContext = createContext<SavedItemsContextValue | null>(null);

function toSavedBusiness(business: Business): SavedBusinessItem {
  return {
    id: business.id,
    name: business.name,
    category: business.category,
    distance: business.distance,
    rating: business.rating,
    image: business.image,
    logo: business.logo,
  };
}

function toSavedPost(post: ExplorePost): SavedPostItem {
  return {
    id: post.id,
    businessId: post.businessId,
    businessName: post.businessName,
    mediaType: post.mediaType,
    mediaUri: post.mediaUri,
    caption: post.caption,
  };
}

function toSavedPromotion(promotion: PromotionFeedItem): SavedPromotionItem {
  return {
    id: promotion.id,
    businessId: promotion.businessId,
    businessName: promotion.businessName,
    title: promotion.title,
    expiresLabel: promotion.expiresLabel,
    promotionImage: promotion.promotionImage,
  };
}

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const [savedBusinesses, setSavedBusinesses] = useState<Map<string, SavedBusinessItem>>(
    () => new Map(),
  );
  const [savedPosts, setSavedPosts] = useState<Map<string, SavedPostItem>>(() => new Map());
  const [savedPromotions, setSavedPromotions] = useState<Map<string, SavedPromotionItem>>(
    () => new Map(),
  );

  const saveBusiness = useCallback((business: Business) => {
    setSavedBusinesses((prev) => {
      if (prev.has(business.id)) return prev;
      const next = new Map(prev);
      next.set(business.id, toSavedBusiness(business));
      return next;
    });
  }, []);

  const unsaveBusiness = useCallback((businessId: string) => {
    setSavedBusinesses((prev) => {
      if (!prev.has(businessId)) return prev;
      const next = new Map(prev);
      next.delete(businessId);
      return next;
    });
  }, []);

  const toggleBusinessSaved = useCallback((business: Business) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedBusinesses((prev) => {
      const next = new Map(prev);
      if (next.has(business.id)) {
        next.delete(business.id);
      } else {
        next.set(business.id, toSavedBusiness(business));
      }
      return next;
    });
  }, []);

  const isBusinessSaved = useCallback(
    (businessId: string) => savedBusinesses.has(businessId),
    [savedBusinesses],
  );

  const savePost = useCallback((post: ExplorePost) => {
    setSavedPosts((prev) => {
      if (prev.has(post.id)) return prev;
      const next = new Map(prev);
      next.set(post.id, toSavedPost(post));
      return next;
    });
  }, []);

  const unsavePost = useCallback((postId: string) => {
    setSavedPosts((prev) => {
      if (!prev.has(postId)) return prev;
      const next = new Map(prev);
      next.delete(postId);
      return next;
    });
  }, []);

  const togglePostSaved = useCallback((post: ExplorePost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedPosts((prev) => {
      const next = new Map(prev);
      if (next.has(post.id)) {
        next.delete(post.id);
      } else {
        next.set(post.id, toSavedPost(post));
      }
      return next;
    });
  }, []);

  const isPostSaved = useCallback((postId: string) => savedPosts.has(postId), [savedPosts]);

  const savePromotion = useCallback((promotion: PromotionFeedItem) => {
    setSavedPromotions((prev) => {
      if (prev.has(promotion.id)) return prev;
      const next = new Map(prev);
      next.set(promotion.id, toSavedPromotion(promotion));
      return next;
    });
  }, []);

  const unsavePromotion = useCallback((promotionId: string) => {
    setSavedPromotions((prev) => {
      if (!prev.has(promotionId)) return prev;
      const next = new Map(prev);
      next.delete(promotionId);
      return next;
    });
  }, []);

  const togglePromotionSaved = useCallback((promotion: PromotionFeedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedPromotions((prev) => {
      const next = new Map(prev);
      if (next.has(promotion.id)) {
        next.delete(promotion.id);
      } else {
        next.set(promotion.id, toSavedPromotion(promotion));
      }
      return next;
    });
  }, []);

  const isPromotionSaved = useCallback(
    (promotionId: string) => savedPromotions.has(promotionId),
    [savedPromotions],
  );

  const value = useMemo(
    () => ({
      savedBusinesses: Array.from(savedBusinesses.values()),
      savedPosts: Array.from(savedPosts.values()),
      savedPromotions: Array.from(savedPromotions.values()),
      saveBusiness,
      unsaveBusiness,
      toggleBusinessSaved,
      isBusinessSaved,
      savePost,
      unsavePost,
      togglePostSaved,
      isPostSaved,
      savePromotion,
      unsavePromotion,
      togglePromotionSaved,
      isPromotionSaved,
    }),
    [
      savedBusinesses,
      savedPosts,
      savedPromotions,
      saveBusiness,
      unsaveBusiness,
      toggleBusinessSaved,
      isBusinessSaved,
      savePost,
      unsavePost,
      togglePostSaved,
      isPostSaved,
      savePromotion,
      unsavePromotion,
      togglePromotionSaved,
      isPromotionSaved,
    ],
  );

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error('useSavedItems must be used within SavedItemsProvider');
  }
  return context;
}

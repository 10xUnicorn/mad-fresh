import { create } from 'zustand';
import type { Recipe } from '@shared/types';

export interface CartItem {
  recipe: Recipe;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (recipe: Recipe) => void;
  removeItem: (recipeId: string) => void;
  updateQuantity: (recipeId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  addItem: (recipe) => {
    set((state) => {
      const existing = state.items.find((i) => i.recipe.id === recipe.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.recipe.id === recipe.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { recipe, quantity: 1 }] };
    });
  },

  removeItem: (recipeId) => {
    set((state) => ({ items: state.items.filter((i) => i.recipe.id !== recipeId) }));
  },

  updateQuantity: (recipeId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(recipeId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.recipe.id === recipeId ? { ...i, quantity } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.recipe.base_price * i.quantity, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

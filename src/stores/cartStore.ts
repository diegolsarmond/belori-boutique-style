import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from '@/types/product';
import { toast } from 'sonner';

interface CartStore {
  items: CartItem[];
  isLoading: boolean;

  addItem: (item: CartItem) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (item) => {
        const { items } = get();
        // Create a unique ID for the configuration
        const uniqueId = `${item.productId}-${item.selectedColor || 'default'}-${item.selectedSize || 'default'}`;

        const existingItemIndex = items.findIndex(i => i.cartItemId === uniqueId);

        if (existingItemIndex > -1) {
          const newItems = [...items];
          newItems[existingItemIndex].quantity += item.quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, cartItemId: uniqueId }] });
        }
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (cartItemId) => {
        set({
          items: get().items.filter(item => item.cartItemId !== cartItemId)
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setLoading: (isLoading) => set({ isLoading }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'belori-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items
      }),
      version: 2,
    }
  )
);

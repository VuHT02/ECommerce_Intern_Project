import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '../services/cartApi';

const mapServerCart = (cart) => (cart?.items || []).map((item) => ({
  id: item.productId,
  cartItemId: item.id,
  name: item.productName,
  sku: item.productSku,
  imageUrl: item.productImageUrl,
  price: Number(item.unitPrice) || 0,
  quantity: item.quantity,
}));

const saveServerCart = (userId, cart) => {
  const state = useCartStore.getState();
  if (String(state.ownerUserId) !== String(userId)) return;
  useCartStore.setState({
    items: mapServerCart(cart),
    isReady: true,
    isLoading: false,
    loadError: null,
  });
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      ownerUserId: null,
      isReady: false,
      isLoading: false,
      loadError: null,

      beginUserSession: (userId) => set({
        // Drop any previous account or guest cart before requesting this user's cart.
        items: [],
        ownerUserId: userId,
        isReady: false,
        isLoading: true,
        loadError: null,
      }),

      setUserCart: saveServerCart,

      refreshUserCart: async (userId) => {
        try {
          const cart = await cartApi.getCart(userId);
          saveServerCart(userId, cart);
          return cart;
        } catch (error) {
          get().failUserCartLoad(userId, error);
          throw error;
        }
      },

      failUserCartLoad: (userId, error) => {
        if (String(get().ownerUserId) !== String(userId)) return;
        set({
          items: [],
          isReady: false,
          isLoading: false,
          loadError: error?.message || 'Không thể tải giỏ hàng từ máy chủ.',
        });
      },

      endUserSession: () => set({
        items: [],
        ownerUserId: null,
        isReady: true,
        isLoading: false,
        loadError: null,
      }),

      addToCart: async (product, quantity = 1) => {
        const { ownerUserId, isReady } = get();
        if (ownerUserId != null) {
          if (!isReady) throw new Error('Giỏ hàng đang được tải. Vui lòng thử lại sau ít giây.');
          const cart = await cartApi.addItem(ownerUserId, product.id, quantity);
          saveServerCart(ownerUserId, cart);
          return;
        }

        set((state) => {
          const index = state.items.findIndex((item) => item.id === product.id);
          if (index >= 0) {
            const items = [...state.items];
            const current = items[index];
            const maxStock = Number(product.stockQuantity ?? current.stockQuantity ?? 999);
            items[index] = {
              ...current,
              ...product,
              quantity: Math.min(current.quantity + quantity, maxStock),
            };
            return { items };
          }

          return {
            items: [...state.items, {
              ...product,
              quantity: Math.min(quantity, Number(product.stockQuantity ?? 999)),
            }],
          };
        });
      },

      removeFromCart: async (productId) => {
        const { ownerUserId, isReady, items } = get();
        if (ownerUserId != null) {
          if (!isReady) throw new Error('Giỏ hàng đang được tải. Vui lòng thử lại sau ít giây.');
          const item = items.find((cartItem) => String(cartItem.id) === String(productId));
          if (!item?.cartItemId) return;
          const cart = await cartApi.removeItem(ownerUserId, item.cartItemId);
          saveServerCart(ownerUserId, cart);
          return;
        }
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) }));
      },

      updateQuantity: async (productId, quantity) => {
        const requestedQuantity = Math.max(1, Number(quantity) || 1);
        const { ownerUserId, isReady, items } = get();
        if (ownerUserId != null) {
          if (!isReady) throw new Error('Giỏ hàng đang được tải. Vui lòng thử lại sau ít giây.');
          const item = items.find((cartItem) => String(cartItem.id) === String(productId));
          if (!item?.cartItemId) return;
          const cart = await cartApi.updateItem(ownerUserId, item.cartItemId, requestedQuantity);
          saveServerCart(ownerUserId, cart);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (String(item.id) !== String(productId)) return item;
            const maxStock = Math.max(1, Number(item.stockQuantity ?? 999));
            return { ...item, quantity: Math.min(requestedQuantity, maxStock) };
          }),
        }));
      },

      clearCart: async () => {
        const { ownerUserId, isReady } = get();
        if (ownerUserId != null) {
          if (!isReady) throw new Error('Giỏ hàng đang được tải. Vui lòng thử lại sau ít giây.');
          await cartApi.clearCart(ownerUserId);
        }
        set({ items: [] });
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0,
      ),
    }),
    {
      name: 'ecommerce-cart-storage',
      version: 2,
      // Ignore data written by the old shared-cart format. A user cart is loaded
      // from the server after authentication and guest items never follow a login.
      migrate: () => ({
        items: [],
        ownerUserId: null,
        isReady: false,
        isLoading: false,
        loadError: null,
      }),
      partialize: ({ items, ownerUserId }) => ({ items, ownerUserId }),
    },
  ),
);

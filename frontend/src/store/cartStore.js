import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand Store quản lý Giỏ hàng toàn cục:
 * - addToCart: Thêm sản phẩm vào giỏ hoặc tăng số lượng nếu đã có
 * - removeFromCart: Xóa sản phẩm khỏi giỏ
 * - updateQuantity: Cập nhật số lượng mặt hàng
 * - clearCart: Xóa sạch toàn bộ giỏ hàng
 * - Middleware persist: Tự động lưu giỏ hàng vào localStorage (tránh mất dữ liệu khi F5)
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // 1. Thêm sản phẩm vào giỏ
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.id === product.id
          );

          if (existingIndex > -1) {
            // Đã tồn tại trong giỏ: Tăng số lượng
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const newQuantity = currentItem.quantity + quantity;

            // Không vượt quá số lượng tồn kho (nếu có stockQuantity)
            const maxStock = product.stockQuantity ?? 999;
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: Math.min(newQuantity, maxStock),
            };

            return { items: updatedItems };
          }

          // Sản phẩm mới: Thêm vào mảng
          return {
            items: [
              ...state.items,
              {
                ...product,
                quantity: Math.min(quantity, product.stockQuantity ?? 999),
              },
            ],
          };
        });
      },

      // 2. Xóa sản phẩm khỏi giỏ hàng
      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      // 3. Cập nhật số lượng sản phẩm
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === productId) {
              const maxStock = item.stockQuantity ?? 999;
              return {
                ...item,
                quantity: Math.min(quantity, maxStock),
              };
            }
            return item;
          }),
        }));
      },

      // 4. Xóa sạch giỏ hàng
      clearCart: () => {
        set({ items: [] });
      },

      // 5. Getter: Tổng số lượng sản phẩm trong giỏ
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // 6. Getter: Tổng giá trị tiền của giỏ hàng
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.price) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'ecommerce-cart-storage', // Khóa lưu trữ trong localStorage
    }
  )
);

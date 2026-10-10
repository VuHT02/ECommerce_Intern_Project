import { useLayoutEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { cartApi } from '../services/cartApi';

/** Keeps the visible cart tied to the authenticated account and hydrates it from the API. */
export default function CartSessionManager() {
  const userId = useAuthStore((state) => state.isLoggedIn ? state.user?.id : null);

  useLayoutEffect(() => {
    if (userId == null) {
      // Preserve an anonymous guest cart on a normal page load. A cart owned by
      // an authenticated account is cleared when that account logs out.
      if (useCartStore.getState().ownerUserId != null) {
        useCartStore.getState().endUserSession();
      }
      return undefined;
    }

    let active = true;
    const cartStore = useCartStore.getState();
    cartStore.beginUserSession(userId);

    cartApi.getCart(userId)
      .then((cart) => {
        if (active) useCartStore.getState().setUserCart(userId, cart);
      })
      .catch((error) => {
        if (active) useCartStore.getState().failUserCartLoad(userId, error);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  return null;
}

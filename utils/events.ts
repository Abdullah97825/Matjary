export const CART_UPDATED_EVENT = 'cart-updated';

export const emitCartUpdated = () => {
  const event = new CustomEvent(CART_UPDATED_EVENT);
  window.dispatchEvent(event);
}; 
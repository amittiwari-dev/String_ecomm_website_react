import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Book } from '../data/mockData';

interface CartItem {
  book: Book;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { book: Book; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { bookId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { bookId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  state: CartState;
  addToCart: (book: Book, quantity?: number) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { book, quantity } = action.payload;
      const existingItem = state.items.find(item => item.book.id === book.id);

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.book.id === book.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
          total: state.total + book.price * quantity
        };
      }

      return {
        ...state,
        items: [...state.items, { book, quantity }],
        total: state.total + book.price * quantity
      };
    }

    case 'REMOVE_FROM_CART': {
      const item = state.items.find(item => item.book.id === action.payload.bookId);
      if (!item) return state;

      return {
        ...state,
        items: state.items.filter(item => item.book.id !== action.payload.bookId),
        total: state.total - (item.book.price * item.quantity)
      };
    }

    case 'UPDATE_QUANTITY': {
      const { bookId, quantity } = action.payload;
      const item = state.items.find(item => item.book.id === bookId);
      if (!item) return state;

      const quantityDiff = quantity - item.quantity;

      return {
        ...state,
        items: state.items.map(item =>
          item.book.id === bookId ? { ...item, quantity } : item
        ),
        total: state.total + (item.book.price * quantityDiff)
      };
    }

    case 'CLEAR_CART':
      return {
        items: [],
        total: 0
      };

    default:
      return state;
  }
};

const CART_STORAGE_KEY = 'bookstore_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      dispatch({ type: 'CLEAR_CART' });
      parsedCart.items.forEach((item: CartItem) => {
        dispatch({
          type: 'ADD_TO_CART',
          payload: { book: item.book, quantity: item.quantity }
        });
      });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addToCart = (book: Book, quantity = 1) => {
    dispatch({ type: 'ADD_TO_CART', payload: { book, quantity } });
  };

  const removeFromCart = (bookId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { bookId } });
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { bookId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{ state, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
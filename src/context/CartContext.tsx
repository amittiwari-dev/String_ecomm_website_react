import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Book } from '../data/mockData';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

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

// Normalize incoming API or legacy book objects to the internal Book interface
const normalizeToBook = (input: any): Book => {
  // If it already looks like our Book type (has id as string and price as number), return as-is
  if (!input) {
    // return a minimal empty Book to avoid runtime crashes
    return {
      id: '0',
      title: 'Unknown',
      slug: 'unknown',
      description: '',
      language: 'English',
      format: 'Paperback',
      price: 0,
      currency: 'INR',
      publication_date: new Date().toISOString(),
      images: ['/img/book-categori/book-placeholder.png'],
      authors: [{ id: '0', name: 'Unknown', slug: 'unknown', bio: '' }],
      category_id: '0',
      tags: [],
      is_latest_release: false,
    } as Book;
  }

  // If input already has `price` as number and `images` array, assume it's a Book-like object
  if (typeof input.price === 'number' && Array.isArray(input.images)) {
    return input as Book;
  }

  // Map API-shaped book (ApiBook) to Book
  const api: any = input;
  const priceNum = Number(api.price) || 0;
  const idStr = api.id != null ? String(api.id) : (api.slug || '0');
  const slug = api.product_slug || api.slug || idStr;
  // Normalize base URL (remove trailing /api or trailing slash) then build full path with a single slash
  const base = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cover = api.product_image
    ? `${base}/images/products/${api.product_image}`
    : '/img/book-categori/book-placeholder.png';
    

  const mapped: Book = {
    id: idStr,
    title: api.product_name || api.title || 'Untitled',
    subtitle: api.subtitle || undefined,
    slug,
    description: api.product_description || api.description || '',
    language: api.language || 'English',
    format: (api.paperback_type as any) || 'Paperback',
    price: priceNum,
    currency: api.currency || 'INR',
    isbn10: api.isbn10 || api.product_isbn || undefined,
    isbn13: api.isbn13 || undefined,
    publication_date: api.publication_date || new Date().toISOString(),
    pages: api.total_pages || api.pages || undefined,
    stock_status: api.is_active === 1 ? 'In Stock' : (api.stock_status || 'Out of Stock'),
    images: [cover],
    authors: [
      {
        id: api.author_id ? String(api.author_id) : `a-${idStr}`,
        name: api.author_name || (api.authors && api.authors[0]?.name) || 'Unknown',
        slug: (api.author_name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
        bio: api.author_bio || ''
      }
    ],
    series: api.series || undefined,
    category_id: api.category_id || (api.category && api.category.id) || '0',
    tags: api.tags || [],
    bestseller_rank: api.bestseller_rank || undefined,
    is_latest_release: !!api.is_latest_release,
    rating: api.rating || undefined,
  };

  return mapped;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'CLEAR_CART' });
        parsedCart.items.forEach((item: any) => {
          const book = normalizeToBook(item.book);
          const qty = Number(item.quantity) || 1;
          dispatch({
            type: 'ADD_TO_CART',
            payload: { book, quantity: qty }
          });
        });
      } catch (err) {
        console.error('Failed to parse saved cart:', err);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addToCart = (bookInput: any, quantity = 1) => {
    const book = normalizeToBook(bookInput);
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
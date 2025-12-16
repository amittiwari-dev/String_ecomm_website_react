import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Book } from '../data/mockData';
import { CartService, Cart as ApiCart } from '../services/api';
import { getToken } from '../lib/auth';
import { handleApiError } from '../lib/errorHandler';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

interface CartItem {
  book: Book;
  quantity: number;
  itemId?: string; // API cart item ID for authenticated users
}

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  isSynced: boolean;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { book: Book; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { bookId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { bookId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNCED'; payload: boolean }
  | { type: 'SET_CART'; payload: { items: CartItem[]; total: number } };

interface CartContextType {
  state: CartState;
  addToCart: (book: Book, quantity?: number) => Promise<void>;
  removeFromCart: (bookId: string) => Promise<void>;
  updateQuantity: (bookId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
  syncCart: () => Promise<void>;
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
        ...state,
        items: [],
        total: 0
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'SET_SYNCED':
      return {
        ...state,
        isSynced: action.payload
      };

    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items,
        total: action.payload.total,
        isLoading: false,
        error: null,
        isSynced: true
      };

    default:
      return state;
  }
};

const CART_STORAGE_KEY = 'bookstore_cart';

// Helper function to convert API cart to local cart format
const convertApiCartToLocal = (apiCart: ApiCart): { items: CartItem[]; total: number } => {
  const items: CartItem[] = apiCart.items.map(apiItem => {
    const book: Book = normalizeToBook({
      id: apiItem.product_id,
      product_name: apiItem.product?.title || 'Unknown',
      price: apiItem.price,
      product_image: apiItem.product?.images?.[0] || '',
      author_name: apiItem.product?.authors?.[0]?.name || 'Unknown',
      ...apiItem.product
    });

    return {
      book,
      quantity: apiItem.quantity,
      itemId: apiItem.id // Store API cart item ID
    };
  });

  return {
    items,
    total: apiCart.total
  };
};

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
  const [state, dispatch] = useReducer(cartReducer, { 
    items: [], 
    total: 0,
    isLoading: false,
    error: null,
    isSynced: false
  });

  // Load cart on mount - fetch from API if authenticated, otherwise from localStorage
  useEffect(() => {
    const token = getToken();
    
    if (token) {
      // User is authenticated, fetch cart from API
      fetchCart();
    } else {
      // Guest user, load from localStorage
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save cart to localStorage only for guest users - watch specific values to prevent infinite loop
  useEffect(() => {
    const token = getToken();
    
    // Only save to localStorage if user is not authenticated
    if (!token && !state.isSynced && state.items.length >= 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: state.items, total: state.total }));
    }
  }, [state.items, state.total, state.isSynced]); // Only watch specific values, not entire state

  const addToCart = async (bookInput: any, quantity = 1) => {
    const book = normalizeToBook(bookInput);
    const token = getToken();

    // In development mode, always use localStorage to avoid API issues
    if (import.meta.env.DEV) {
      dispatch({ type: 'ADD_TO_CART', payload: { book, quantity } });
      toast.success('Added to cart');
      return;
    }

    // If user is authenticated, use API
    if (token) {
      // Optimistic update
      const previousState = { ...state };
      dispatch({ type: 'ADD_TO_CART', payload: { book, quantity } });

      try {
        const apiCart = await CartService.addToCart(token, book.id, quantity);
        const localCart = convertApiCartToLocal(apiCart);
        
        dispatch({ 
          type: 'SET_CART', 
          payload: localCart 
        });

        toast.success('Added to cart');
      } catch (error) {
        // Rollback on error
        dispatch({ 
          type: 'SET_CART', 
          payload: { items: previousState.items, total: previousState.total } 
        });
        
        handleApiError(error, true);
      }
    } else {
      // Guest user - use localStorage
      dispatch({ type: 'ADD_TO_CART', payload: { book, quantity } });
      toast.success('Added to cart');
    }
  };

  const removeFromCart = async (bookId: string) => {
    const token = getToken();

    // If user is authenticated, use API
    if (token) {
      // Find the cart item to get its API ID
      const cartItem = state.items.find(item => item.book.id === bookId);
      
      if (!cartItem || !cartItem.itemId) {
        toast.error('Cart item not found');
        return;
      }

      // Optimistic update
      const previousState = { ...state };
      dispatch({ type: 'REMOVE_FROM_CART', payload: { bookId } });

      try {
        const apiCart = await CartService.removeCartItem(token, cartItem.itemId);
        const localCart = convertApiCartToLocal(apiCart);
        
        dispatch({ 
          type: 'SET_CART', 
          payload: localCart 
        });

        toast.success('Removed from cart');
      } catch (error) {
        // Rollback on error
        dispatch({ 
          type: 'SET_CART', 
          payload: { items: previousState.items, total: previousState.total } 
        });
        
        handleApiError(error, true);
      }
    } else {
      // Guest user - use localStorage
      dispatch({ type: 'REMOVE_FROM_CART', payload: { bookId } });
      toast.success('Removed from cart');
    }
  };

  const updateQuantity = async (bookId: string, quantity: number) => {
    const token = getToken();

    // If user is authenticated, use API
    if (token) {
      // Find the cart item to get its API ID
      const cartItem = state.items.find(item => item.book.id === bookId);
      
      if (!cartItem || !cartItem.itemId) {
        toast.error('Cart item not found');
        return;
      }

      // Optimistic update
      const previousState = { ...state };
      dispatch({ type: 'UPDATE_QUANTITY', payload: { bookId, quantity } });

      try {
        const apiCart = await CartService.updateCartItem(token, cartItem.itemId, quantity);
        const localCart = convertApiCartToLocal(apiCart);
        
        dispatch({ 
          type: 'SET_CART', 
          payload: localCart 
        });
      } catch (error) {
        // Rollback on error
        dispatch({ 
          type: 'SET_CART', 
          payload: { items: previousState.items, total: previousState.total } 
        });
        
        handleApiError(error, true);
      }
    } else {
      // Guest user - use localStorage
      dispatch({ type: 'UPDATE_QUANTITY', payload: { bookId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const fetchCart = async () => {
    const token = getToken();
    
    // Only fetch if user is authenticated
    if (!token) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const apiCart = await CartService.getCart(token);
      const localCart = convertApiCartToLocal(apiCart);
      
      dispatch({ 
        type: 'SET_CART', 
        payload: localCart 
      });
    } catch (error) {
      const errorMessage = handleApiError(error, true);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const syncCart = async () => {
    const token = getToken();
    
    if (!token) {
      return;
    }

    // In development mode, just keep the local cart and mark as synced
    if (import.meta.env.DEV) {
      dispatch({ type: 'SET_SYNCED', payload: true });
      return;
    }

    // Get guest cart items from localStorage
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) {
      // No guest cart to sync, just fetch server cart
      await fetchCart();
      return;
    }

    try {
      const parsedCart = JSON.parse(savedCart);
      
      if (!parsedCart.items || parsedCart.items.length === 0) {
        // Empty guest cart, just fetch server cart
        await fetchCart();
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      // Convert guest cart items to API format
      const guestItems = parsedCart.items.map((item: CartItem) => ({
        productId: item.book.id,
        quantity: item.quantity
      }));

      // Merge guest cart with server cart
      const mergedCart = await CartService.mergeGuestCart(token, guestItems);
      const localCart = convertApiCartToLocal(mergedCart);
      
      dispatch({ 
        type: 'SET_CART', 
        payload: localCart 
      });

      // Clear localStorage cart after successful merge
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      const errorMessage = handleApiError(error, true);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // On error, still try to fetch server cart
      await fetchCart();
    }
  };

  return (
    <CartContext.Provider
      value={{ state, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart, syncCart }}
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
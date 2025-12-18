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

      console.log('➕ ADD_TO_CART action:', { bookTitle: book.title, quantity, existingItem: !!existingItem });

      if (existingItem) {
        const newState = {
          ...state,
          items: state.items.map(item =>
            item.book.id === book.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
          total: state.total + book.price * quantity
        };
        console.log('📊 Updated cart state (existing item):', { itemCount: newState.items.length, total: newState.total });
        return newState;
      }

      const newState = {
        ...state,
        items: [...state.items, { book, quantity }],
        total: state.total + book.price * quantity
      };
      console.log('📊 Updated cart state (new item):', { itemCount: newState.items.length, total: newState.total });
      return newState;
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
      console.log('🗑️ CLEAR_CART action dispatched');
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
  // CRITICAL: ID must be a valid numeric product ID from database, never use slug
  const idStr = api.id != null ? String(api.id) : '0';
  const slug = api.product_slug || api.slug || idStr;
  
  // Handle image URL properly
  let cover = '/img/book-categori/book-placeholder.png';
  if (api.product_image) {
    // If already a full URL, use as is
    if (api.product_image.startsWith('http://') || api.product_image.startsWith('https://')) {
      cover = api.product_image;
    } else {
      // For local development, use Laravel storage path
      cover = `http://127.0.0.1:8000/storage/products/${api.product_image}`;
    }
  }
    

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
    isLoading: true, // Start with loading true
    error: null,
    isSynced: false
  });

  // Load cart on mount - always use localStorage for persistence
  useEffect(() => {
    const token = getToken();
    
    console.log('🔄 Loading cart on mount...', { hasToken: !!token });
    
    // Always load from localStorage for persistence
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    console.log('📦 Saved cart from localStorage:', savedCart);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('📋 Parsed cart:', parsedCart);
        
        if (parsedCart.items && Array.isArray(parsedCart.items)) {
          dispatch({ type: 'CLEAR_CART' });
          parsedCart.items.forEach((item: any) => {
            const book = normalizeToBook(item.book);
            const qty = Number(item.quantity) || 1;
            dispatch({
              type: 'ADD_TO_CART',
              payload: { book, quantity: qty }
            });
          });
          console.log('✅ Cart loaded from localStorage with', parsedCart.items.length, 'items');
        }
      } catch (err) {
        console.error('❌ Failed to parse saved cart:', err);
      }
    } else {
      console.log('📭 No saved cart found in localStorage');
    }
    
    // Mark loading as complete
    dispatch({ type: 'SET_LOADING', payload: false });
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save cart to localStorage - always save for persistence
  useEffect(() => {
    console.log('💾 Saving cart to localStorage:', { itemCount: state.items.length, total: state.total });
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: state.items, total: state.total }));
  }, [state.items, state.total]); // Only watch specific values, not entire state

  const addToCart = async (bookInput: any, quantity = 1) => {
    const book = normalizeToBook(bookInput);
    const token = getToken();

    console.log('🛒 Adding to cart:', { 
      bookTitle: book.title, 
      bookId: book.id,
      quantity, 
      hasToken: !!token,
      bookImage: book.images[0]
    });

    // Always use localStorage for immediate response and persistence
    dispatch({ type: 'ADD_TO_CART', payload: { book, quantity } });
    toast.success(`Added "${book.title}" to cart`);
    console.log('✅ Added to cart successfully');
    console.log('📊 Current cart state after add:', { 
      itemCount: state.items.length + 1, 
      newTotal: state.total + (book.price * quantity)
    });

    // If user is authenticated, also sync with API
    if (token) {
      try {
        await CartService.addToCart(token, book.id, quantity);
        console.log('📡 Cart synced with API');
      } catch (error) {
        console.warn('Failed to sync cart with API:', error);
        // Don't show error to user, cart is still saved locally
      }
    }
  };

  const removeFromCart = async (bookId: string) => {
    const token = getToken();
    const cartItem = state.items.find(item => item.book.id === bookId);
    
    if (!cartItem) {
      toast.error('Cart item not found');
      return;
    }

    // Always update local state first (optimistic update)
    const previousState = { ...state };
    dispatch({ type: 'REMOVE_FROM_CART', payload: { bookId } });
    toast.success('Removed from cart');

    // If user is authenticated and item has API ID, also remove from API
    if (token && cartItem.itemId) {
      try {
        await CartService.removeCartItem(token, cartItem.itemId);
        console.log('📡 Item removed from API cart');
      } catch (error) {
        console.warn('Failed to remove from API cart:', error);
        // Don't rollback - local removal is more important
        // The cart will sync properly on next checkout
      }
    } else if (token && !cartItem.itemId) {
      // Item was added locally but not synced to API yet
      // Just remove from local state (already done above)
      console.log('📦 Item removed from local cart only (not synced to API yet)');
    }
  };

  const updateQuantity = async (bookId: string, quantity: number) => {
    const token = getToken();
    const cartItem = state.items.find(item => item.book.id === bookId);
    
    if (!cartItem) {
      toast.error('Cart item not found');
      return;
    }

    // Always update local state first (optimistic update)
    const previousState = { ...state };
    dispatch({ type: 'UPDATE_QUANTITY', payload: { bookId, quantity } });

    // If user is authenticated and item has API ID, also update in API
    if (token && cartItem.itemId) {
      try {
        await CartService.updateCartItem(token, cartItem.itemId, quantity);
        console.log('📡 Item quantity updated in API cart');
      } catch (error) {
        console.warn('Failed to update quantity in API cart:', error);
        // Don't rollback - local update is more important
        // The cart will sync properly on next checkout
      }
    } else if (token && !cartItem.itemId) {
      // Item was added locally but not synced to API yet
      // Just update local state (already done above)
      console.log('📦 Item quantity updated in local cart only (not synced to API yet)');
    }
  };

  const clearCart = () => {
    console.log('🗑️ Clearing cart...');
    dispatch({ type: 'CLEAR_CART' });
    
    // Also clear localStorage to prevent cart from reloading
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log('✅ Cart cleared from both state and localStorage');
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
      console.warn('⚠️ No token available for cart sync');
      return;
    }

    if (state.items.length === 0) {
      console.warn('⚠️ No items to sync');
      return;
    }

    try {
      console.log(`🔄 Starting cart sync with ${state.items.length} items...`);
      dispatch({ type: 'SET_LOADING', payload: true });

      // Note: We don't clear the cart first because the backend will handle duplicates
      // by updating quantities if the same product is added again
      console.log('📦 Syncing cart items (backend will merge duplicates)...');

      // Add all localStorage items to API cart
      let syncedCount = 0;
      const errors: string[] = [];
      
      for (const item of state.items) {
        try {
          console.log(`🔄 Syncing item: ${item.book.title} (ID: ${item.book.id}, Qty: ${item.quantity})`);
          
          // Validate product ID before sending
          if (!item.book.id || item.book.id === '0') {
            const error = new Error(`Invalid product ID for ${item.book.title}`);
            console.error('❌ Invalid ID:', { bookTitle: item.book.title, bookId: item.book.id, book: item.book });
            throw error;
          }
          
          // Log the exact data being sent
          console.log(`📤 Sending to API: product_id=${item.book.id}, quantity=${item.quantity}`);
          
          await CartService.addToCart(token, item.book.id, item.quantity);
          console.log(`✅ Synced ${item.book.title} to API cart`);
          syncedCount++;
        } catch (error) {
          const errorMsg = `Failed to sync ${item.book.title} (ID: ${item.book.id})`;
          console.error('❌ Sync error details:', errorMsg, error);
          
          // Log the full error for debugging
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
          
          errors.push(errorMsg);
        }
      }

      if (syncedCount === 0) {
        throw new Error('Failed to sync any items to cart. Please try again.');
      }

      if (errors.length > 0 && errors.length < state.items.length) {
        console.warn(`⚠️ Partial sync: ${syncedCount}/${state.items.length} items synced`);
      }

      dispatch({ type: 'SET_SYNCED', payload: true });
      console.log(`✅ Cart fully synced with API (${syncedCount}/${state.items.length} items)`);
    } catch (error) {
      const errorMessage = handleApiError(error, false); // Don't show toast here
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('❌ Failed to sync cart with API:', error);
      // Re-throw the error so checkout knows sync failed
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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
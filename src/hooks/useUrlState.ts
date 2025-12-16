import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Custom hook for managing state that persists in URL search parameters
 * 
 * This hook provides:
 * - Automatic synchronization between component state and URL parameters
 * - State restoration on page refresh
 * - Type-safe state management with URL persistence
 * 
 * Requirements: 2.1, 2.3
 */
export function useUrlState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL or default value
  const [state, setState] = useState<T>(() => {
    const urlValue = searchParams.get(key);
    if (urlValue) {
      try {
        return deserialize(urlValue);
      } catch (error) {
        console.warn(`Failed to deserialize URL parameter "${key}":`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  });

  // Update URL when state changes
  const updateState = useCallback((newValue: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const nextState = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prevState)
        : newValue;

      // Update URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      
      if (nextState === defaultValue || nextState === null || nextState === undefined) {
        // Remove parameter if it's the default value
        newSearchParams.delete(key);
      } else {
        try {
          newSearchParams.set(key, serialize(nextState));
        } catch (error) {
          console.warn(`Failed to serialize state for URL parameter "${key}":`, error);
        }
      }

      setSearchParams(newSearchParams, { replace: true });
      return nextState;
    });
  }, [key, defaultValue, serialize, searchParams, setSearchParams]);

  // Sync state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlValue = searchParams.get(key);
    if (urlValue) {
      try {
        const deserializedValue = deserialize(urlValue);
        setState(deserializedValue);
      } catch (error) {
        console.warn(`Failed to deserialize URL parameter "${key}":`, error);
        setState(defaultValue);
      }
    } else {
      setState(defaultValue);
    }
  }, [searchParams, key, defaultValue, deserialize]);

  return [state, updateState] as const;
}

/**
 * Specialized hook for managing simple string state in URL
 */
export function useUrlStringState(key: string, defaultValue: string = '') {
  return useUrlState(
    key,
    defaultValue,
    (value) => value,
    (value) => value
  );
}

/**
 * Specialized hook for managing number state in URL
 */
export function useUrlNumberState(key: string, defaultValue: number = 0) {
  return useUrlState(
    key,
    defaultValue,
    (value) => value.toString(),
    (value) => {
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    }
  );
}

/**
 * Specialized hook for managing boolean state in URL
 */
export function useUrlBooleanState(key: string, defaultValue: boolean = false) {
  return useUrlState(
    key,
    defaultValue,
    (value) => value.toString(),
    (value) => value === 'true'
  );
}

/**
 * Hook for managing multiple URL state values at once
 */
export function useUrlStateObject<T extends Record<string, any>>(
  defaultValues: T,
  keyPrefix: string = ''
) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL or default values
  const [state, setState] = useState<T>(() => {
    const initialState = { ...defaultValues };
    
    Object.keys(defaultValues).forEach((key) => {
      const urlKey = keyPrefix ? `${keyPrefix}_${key}` : key;
      const urlValue = searchParams.get(urlKey);
      
      if (urlValue !== null) {
        try {
          // Try to parse as JSON first, fallback to string
          try {
            initialState[key as keyof T] = JSON.parse(urlValue);
          } catch {
            initialState[key as keyof T] = urlValue as T[keyof T];
          }
        } catch (error) {
          console.warn(`Failed to parse URL parameter "${urlKey}":`, error);
        }
      }
    });
    
    return initialState;
  });

  // Update state and URL
  const updateState = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setState((prevState) => {
      const updatesObj = typeof updates === 'function' ? updates(prevState) : updates;
      const nextState = { ...prevState, ...updatesObj };

      // Update URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      
      Object.keys(updatesObj).forEach((key) => {
        const urlKey = keyPrefix ? `${keyPrefix}_${key}` : key;
        const value = nextState[key as keyof T];
        const defaultValue = defaultValues[key as keyof T];
        
        if (value === defaultValue || value === null || value === undefined) {
          newSearchParams.delete(urlKey);
        } else {
          try {
            const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            newSearchParams.set(urlKey, serializedValue);
          } catch (error) {
            console.warn(`Failed to serialize URL parameter "${urlKey}":`, error);
          }
        }
      });

      setSearchParams(newSearchParams, { replace: true });
      return nextState;
    });
  }, [defaultValues, keyPrefix, searchParams, setSearchParams]);

  return [state, updateState] as const;
}
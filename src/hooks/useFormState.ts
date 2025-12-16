import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing form state with session storage persistence
 * 
 * This hook provides:
 * - Automatic form state persistence in session storage
 * - State restoration on page refresh
 * - Automatic cleanup when form is submitted successfully
 * 
 * Requirements: 2.1, 2.3
 */
export function useFormState<T extends Record<string, any>>(
  formKey: string,
  initialState: T,
  options: {
    persistOnChange?: boolean;
    clearOnSubmit?: boolean;
    excludeFields?: (keyof T)[];
  } = {}
) {
  const {
    persistOnChange = true,
    clearOnSubmit = true,
    excludeFields = []
  } = options;

  const storageKey = `form-${formKey}`;

  // Initialize state from session storage or default values
  const [formState, setFormState] = useState<T>(() => {
    try {
      const savedState = sessionStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Merge with initial state to handle new fields
        return { ...initialState, ...parsed };
      }
    } catch (error) {
      console.warn(`Failed to restore form state for ${formKey}:`, error);
    }
    return initialState;
  });

  // Save state to session storage
  const saveToStorage = useCallback((state: T) => {
    try {
      // Filter out excluded fields
      const stateToSave = { ...state };
      excludeFields.forEach(field => {
        delete stateToSave[field];
      });
      
      sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn(`Failed to save form state for ${formKey}:`, error);
    }
  }, [storageKey, formKey, excludeFields]);

  // Update form state
  const updateFormState = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setFormState(prevState => {
      const updatesObj = typeof updates === 'function' ? updates(prevState) : updates;
      const newState = { ...prevState, ...updatesObj };
      
      if (persistOnChange) {
        saveToStorage(newState);
      }
      
      return newState;
    });
  }, [persistOnChange, saveToStorage]);

  // Reset form state
  const resetFormState = useCallback(() => {
    setFormState(initialState);
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to clear form state for ${formKey}:`, error);
    }
  }, [initialState, storageKey, formKey]);

  // Clear form state (for successful submissions)
  const clearFormState = useCallback(() => {
    if (clearOnSubmit) {
      resetFormState();
    }
  }, [clearOnSubmit, resetFormState]);

  // Manual save to storage
  const saveFormState = useCallback(() => {
    saveToStorage(formState);
  }, [formState, saveToStorage]);

  // Save state when component unmounts
  useEffect(() => {
    return () => {
      if (persistOnChange) {
        saveToStorage(formState);
      }
    };
  }, [formState, persistOnChange, saveToStorage]);

  return {
    formState,
    updateFormState,
    resetFormState,
    clearFormState,
    saveFormState,
  };
}

/**
 * Hook for managing simple form field state with persistence
 */
export function usePersistedFormField<T>(
  formKey: string,
  fieldName: string,
  initialValue: T
) {
  const storageKey = `form-field-${formKey}-${fieldName}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const savedValue = sessionStorage.getItem(storageKey);
      if (savedValue !== null) {
        return JSON.parse(savedValue);
      }
    } catch (error) {
      console.warn(`Failed to restore form field ${fieldName}:`, error);
    }
    return initialValue;
  });

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prevValue => {
      const nextValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prevValue)
        : newValue;

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(nextValue));
      } catch (error) {
        console.warn(`Failed to save form field ${fieldName}:`, error);
      }

      return nextValue;
    });
  }, [storageKey, fieldName]);

  const clearValue = useCallback(() => {
    setValue(initialValue);
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to clear form field ${fieldName}:`, error);
    }
  }, [initialValue, storageKey, fieldName]);

  return [value, updateValue, clearValue] as const;
}
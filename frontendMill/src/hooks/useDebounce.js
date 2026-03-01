import { useState, useEffect } from 'react';

/**
 * useDebounce hook - Delays updating a value until after a specified delay
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} - The debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useDebouncedCallback - Creates a debounced version of a callback function
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} dependencies - Dependency array for the callback
 * @returns {Function} - Debounced callback
 */
export const useDebouncedCallback = (callback, delay = 500, dependencies = []) => {
  const [timeoutId, setTimeoutId] = useState(null);

  const debouncedCallback = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(id);
  };

  // Clean up on unmount or dependency change
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId, ...dependencies]);

  return debouncedCallback;
};

/**
 * useDebouncedSearch - Specialized hook for search inputs
 * @param {Function} searchFunction - The search function to call
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} - Search state and functions
 */
export const useDebouncedSearch = (searchFunction, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebouncedCallback(
    async (term) => {
      if (!term.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await searchFunction(term);
        setResults(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    delay,
    [searchFunction]
  );

  const handleSearch = (term) => {
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setError(null);
  };

  return {
    searchTerm,
    results,
    loading,
    error,
    handleSearch,
    clearSearch
  };
};

/**
 * useDebouncedValue - Debounces a value with a custom comparison function
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Function} equals - Custom equality function
 * @returns {any} - Debounced value
 */
export const useDebouncedValue = (value, delay = 500, equals = (a, b) => a === b) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);

  useEffect(() => {
    if (!equals(previousValue, value)) {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
        setPreviousValue(value);
      }, delay);

      return () => clearTimeout(handler);
    }
  }, [value, delay, equals, previousValue]);

  return debouncedValue;
};

/**
 * useThrottle - Throttles a value (updates at most once per delay period)
 * @param {any} value - The value to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {any} - Throttled value
 */
export const useThrottle = (value, limit = 500) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const [lastRan, setLastRan] = useState(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan >= limit) {
        setThrottledValue(value);
        setLastRan(Date.now());
      }
    }, limit - (Date.now() - lastRan));

    return () => clearTimeout(handler);
  }, [value, limit, lastRan]);

  return throttledValue;
};

export default useDebounce;
import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling pagination
 * @param {Function} fetchFunction - Function to fetch data with pagination parameters
 * @param {Object} options - Configuration options
 * @returns {Object} - Pagination state and control functions
 */
const usePagination = (fetchFunction, options = {}) => {
  const {
    initialPage = 1,
    pageSize = 10,
    initialData = [],
    dependencyArray = [],
    cacheKey = null,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    enableCaching = false
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Cache management
  const getCachedData = useCallback(() => {
    if (!enableCaching || !cacheKey) return null;
    
    try {
      const cachedItem = localStorage.getItem(`pagination_${cacheKey}`);
      if (!cachedItem) return null;
      
      const { data: cachedData, timestamp, totalItems: cachedTotal, totalPages: cachedPages } = JSON.parse(cachedItem);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < cacheDuration) {
        return { data: cachedData, totalItems: cachedTotal, totalPages: cachedPages };
      }
      
      // Clear expired cache
      localStorage.removeItem(`pagination_${cacheKey}`);
      return null;
    } catch (err) {
      console.error('Error reading from cache:', err);
      return null;
    }
  }, [cacheKey, cacheDuration, enableCaching]);

  const setCachedData = useCallback((data, totalItems, totalPages) => {
    if (!enableCaching || !cacheKey) return;
    
    try {
      const cacheItem = {
        data,
        totalItems,
        totalPages,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`pagination_${cacheKey}`, JSON.stringify(cacheItem));
    } catch (err) {
      console.error('Error writing to cache:', err);
    }
  }, [cacheKey, enableCaching]);

  // Load data with pagination
  const loadData = useCallback(async (pageToLoad = page, reset = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first if it's a fresh load
      if (reset && enableCaching) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData.data);
          setTotalItems(cachedData.totalItems);
          setTotalPages(cachedData.totalPages);
          setHasMore(pageToLoad < cachedData.totalPages);
          setLoading(false);
          return;
        }
      }
      
      // Fetch data from API
      const response = await fetchFunction({
        page: pageToLoad,
        pageSize
      });
      
      const newData = response.data || response.items || response.results || [];
      const total = response.totalItems || response.total || newData.length;
      const pages = response.totalPages || Math.ceil(total / pageSize);
      
      // Update state
      setData(prevData => (reset ? newData : [...prevData, ...newData]));
      setTotalItems(total);
      setTotalPages(pages);
      setHasMore(pageToLoad < pages);
      
      // Cache the results if needed
      if (reset && enableCaching) {
        setCachedData(newData, total, pages);
      }
    } catch (err) {
      console.error('Error loading paginated data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, pageSize, enableCaching, getCachedData, setCachedData]);

  // Load next page
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, false);
    }
  }, [loading, hasMore, page, loadData]);

  // Refresh data (reset to first page)
  const refresh = useCallback(() => {
    setPage(initialPage);
    loadData(initialPage, true);
  }, [initialPage, loadData]);

  // Initial load and dependency changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencyArray]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    hasMore,
    totalItems,
    totalPages,
    loadMore,
    refresh,
    setPage
  };
};

export default usePagination;

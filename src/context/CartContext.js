import React, { createContext, useContext, useState, useEffect } from "react";
import { getCart, addToCart as apiAddToCart } from "../helpers/apiHelpers";

// Create the cart context
const CartContext = createContext();

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now()); // Track last update time

  // Fetch cart data from API
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCart();

      if (
        response &&
        response.success &&
        response.data &&
        response.data.items
      ) {
        const items = response.data.items.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          quantity: item.quantity || 1,
          stock: item.product.stock,
          itemId: item._id,
        }));

        setCartItems(items);
        // Calculate total quantity of items in cart
        setCartCount(items.reduce((total, item) => total + item.quantity, 0));
      } else {
        setCartItems([]);
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError("Failed to load cart data");
      setCartItems([]);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount and when lastUpdated changes
  useEffect(() => {
    fetchCart();

    // Set up interval to periodically check for cart updates
    const intervalId = setInterval(() => {
      fetchCart();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  // Add to cart function that updates the cart state
  const addToCart = async (productData) => {
    try {
      setLoading(true);
      const response = await apiAddToCart(productData);
      // After adding to cart, refresh the cart data
      await fetchCart();
      return response;
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError("Failed to add item to cart");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Force refresh cart
  const refreshCart = () => {
    setLastUpdated(Date.now());
    fetchCart();
  };

  // Value to be provided by the context
  const value = {
    cartItems,
    cartCount,
    loading,
    error,
    fetchCart, // Expose this so components can refresh the cart
    addToCart, // Expose direct add to cart function
    refreshCart, // Force refresh cart
    lastUpdated, // Track when cart was last updated
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;

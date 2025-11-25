// utils/productPriceHelper.js
// Helper functions for calculating product prices with offers

/**
 * Check if a product is currently on sale (within date range)
 * @param {object} product - Product object from database
 * @returns {boolean} - True if product is currently on sale
 */
export const isProductOnSale = (product) => {
  if (!product) return false;
  
  // Check if product has sale enabled
  if (!product.is_on_sale || !product.discount_percentage) {
    return false;
  }
  
  // Check if discount percentage is valid
  if (product.discount_percentage <= 0 || product.discount_percentage >= 100) {
    return false;
  }
  
  // Check if sale dates are valid
  const now = new Date();
  const startDate = product.sale_start_date ? new Date(product.sale_start_date) : null;
  const endDate = product.sale_end_date ? new Date(product.sale_end_date) : null;
  
  if (!startDate || !endDate) {
    return false;
  }
  
  // Check if current date is within sale period
  return now >= startDate && now <= endDate;
};

/**
 * Calculate the final price of a product considering offers
 * @param {object} product - Product object from database
 * @returns {number} - Final price (sale price if on sale, otherwise regular price)
 */
export const calculateProductPrice = (product) => {
  if (!product || !product.price) {
    return 0;
  }
  
  // Check if product is currently on sale
  if (isProductOnSale(product) && product.discount_percentage) {
    const discount = product.discount_percentage / 100;
    return product.price * (1 - discount);
  }
  
  // Return regular price if not on sale
  return product.price;
};


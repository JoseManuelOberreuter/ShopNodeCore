// utils/productValidators.js

/**
 * Valida el ID de un producto
 * @param {string|number} id - ID a validar
 * @returns {{isValid: boolean, productId: number|null, error: string|null}}
 */
export const validateProductId = (id) => {
  if (!id) {
    return { isValid: false, productId: null, error: 'ID de producto requerido' };
  }
  
  const productId = parseInt(id);
  if (isNaN(productId) || productId <= 0) {
    return { isValid: false, productId: null, error: 'ID de producto inválido' };
  }
  
  return { isValid: true, productId, error: null };
};

/**
 * Valida el precio de un producto
 * @param {string|number} price - Precio a validar
 * @returns {{isValid: boolean, price: number|null, error: string|null}}
 */
export const validatePrice = (price) => {
  if (price === undefined || price === null || price === '') {
    return { isValid: false, price: null, error: 'Precio requerido' };
  }
  
  const priceFloat = parseFloat(price);
  if (isNaN(priceFloat) || priceFloat < 0) {
    return { isValid: false, price: null, error: 'El precio debe ser un número válido mayor o igual a 0' };
  }
  
  return { isValid: true, price: priceFloat, error: null };
};

/**
 * Valida el stock de un producto
 * @param {string|number} stock - Stock a validar
 * @param {boolean} allowEmpty - Si permite stock vacío (para updates)
 * @returns {{isValid: boolean, stock: number|null, error: string|null}}
 */
export const validateStock = (stock, allowEmpty = false) => {
  if (allowEmpty && (stock === undefined || stock === null || stock === '')) {
    return { isValid: true, stock: null, error: null };
  }
  
  if (stock === undefined || stock === null || stock === '') {
    return { isValid: false, stock: null, error: 'Stock requerido' };
  }
  
  const stockInt = parseInt(stock);
  if (isNaN(stockInt) || stockInt < 0) {
    return { isValid: false, stock: null, error: 'El stock debe ser un número entero mayor o igual a 0' };
  }
  
  return { isValid: true, stock: stockInt, error: null };
};

/**
 * Valida campos requeridos de producto
 * @param {object} data - Datos del producto
 * @returns {{isValid: boolean, missingFields: string[]}}
 */
export const validateRequiredFields = (data) => {
  const requiredFields = ['name', 'description', 'price', 'category'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};


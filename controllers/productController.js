// Controlador temporal para products
export const getAllProducts = async (req, res) => {
  res.json({ message: 'getAllProducts - En desarrollo' });
};

export const getProductById = async (req, res) => {
  res.json({ message: 'getProductById - En desarrollo' });
};

export const createProduct = async (req, res) => {
  res.json({ message: 'createProduct - En desarrollo' });
};

export const updateProduct = async (req, res) => {
  res.json({ message: 'updateProduct - En desarrollo' });
};

export const deleteProduct = async (req, res) => {
  res.json({ message: 'deleteProduct - En desarrollo' });
};

export const getCategories = async (req, res) => {
  res.json({ message: 'getCategories - En desarrollo' });
};

export const updateStock = async (req, res) => {
  res.json({ message: 'updateStock - En desarrollo' });
};

export const getAllProductsAdmin = async (req, res) => {
  res.json({ message: 'getAllProductsAdmin - En desarrollo' });
};

export const upload = {
  single: (field) => (req, res, next) => {
    console.log('Upload middleware - En desarrollo');
    next();
  }
}; 
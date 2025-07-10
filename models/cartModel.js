import { supabase } from '../database.js';

export const cartService = {
  // Crear carrito para usuario
  async create(userId) {
    const { data, error } = await supabase
      .from('carts')
      .insert([{
        user_id: userId,
        total_amount: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar carrito por usuario
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            description,
            image,
            is_active
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Agregar item al carrito
  async addItem(cartId, productId, quantity, price) {
    // Verificar si el item ya existe
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Actualizar cantidad
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      await this.updateCartTotal(cartId);
      return data;
    } else {
      // Crear nuevo item
      const { data, error } = await supabase
        .from('cart_items')
        .insert([{
          cart_id: cartId,
          product_id: productId,
          quantity,
          price
        }])
        .select()
        .single();

      if (error) throw error;
      await this.updateCartTotal(cartId);
      return data;
    }
  },

  // Actualizar cantidad de item
  async updateItemQuantity(cartId, productId, quantity) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;
    await this.updateCartTotal(cartId);
    return data;
  },

  // Eliminar item del carrito
  async removeItem(cartId, productId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    if (error) throw error;
    await this.updateCartTotal(cartId);
    return true;
  },

  // Limpiar carrito
  async clearCart(cartId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;
    await this.updateCartTotal(cartId);
    return true;
  },

  // Actualizar total del carrito
  async updateCartTotal(cartId) {
    const { data: items, error } = await supabase
      .from('cart_items')
      .select('quantity, price')
      .eq('cart_id', cartId);

    if (error) throw error;

    const totalAmount = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const { data, error: updateError } = await supabase
      .from('carts')
      .update({ total_amount: totalAmount })
      .eq('id', cartId)
      .select()
      .single();

    if (updateError) throw updateError;
    return data;
  }
};

export default cartService; 
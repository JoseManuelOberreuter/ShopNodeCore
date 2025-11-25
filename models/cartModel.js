import { supabaseAdmin } from '../database.js';
import logger from '../utils/logger.js';

function ensureAdminClient() {
  if (!supabaseAdmin) {
    logger.error('supabaseAdmin is not available - SUPABASE_SERVICE_ROLE_KEY may not be configured');
    throw new Error('Service role key not configured. Cart operations are disabled.');
  }
  return supabaseAdmin;
}

export const cartService = {
  // Crear carrito para usuario
  async create(userId) {
    const client = ensureAdminClient();
    const { data, error } = await client
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
    const client = ensureAdminClient();
    const { data, error } = await client
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
            is_active,
            price,
            is_on_sale,
            discount_percentage,
            sale_start_date,
            sale_end_date
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
    const client = ensureAdminClient();
    // Verificar si el item ya existe
    const { data: existingItem } = await client
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Actualizar cantidad y precio (el precio puede haber cambiado si cambió el estado de oferta)
      const { data, error } = await client
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity, price })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      await this.updateCartTotal(cartId);
      return data;
    } else {
      // Crear nuevo item
      const { data, error } = await client
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
    const client = ensureAdminClient();
    const { data, error } = await client
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

  // Actualizar cantidad y precio de item (útil cuando cambia el estado de oferta)
  async updateItemQuantityAndPrice(cartId, productId, quantity, price) {
    const client = ensureAdminClient();
    const { data, error } = await client
      .from('cart_items')
      .update({ quantity, price })
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
    const client = ensureAdminClient();
    const { error } = await client
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
    const client = ensureAdminClient();
    const { error } = await client
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;
    await this.updateCartTotal(cartId);
    return true;
  },

  // Actualizar total del carrito
  async updateCartTotal(cartId) {
    const client = ensureAdminClient();
    const { data: items, error } = await client
      .from('cart_items')
      .select('quantity, price')
      .eq('cart_id', cartId);

    if (error) throw error;

    const totalAmount = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const { data, error: updateError } = await client
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
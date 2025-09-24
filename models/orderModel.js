import { supabase } from '../database.js';

export const orderService = {
  // Crear orden
  async create(orderData) {
    try {
      const orderNumber = this.generateOrderNumber();
      
      console.log('📝 Insertando orden en base de datos:', {
        user_id: orderData.userId,
        order_number: orderNumber,
        total_amount: orderData.totalAmount,
        status: orderData.status || 'pending',
        shipping_street: orderData.shippingAddress?.street,
        shipping_city: orderData.shippingAddress?.city,
        shipping_state: orderData.shippingAddress?.state,
        shipping_zip_code: orderData.shippingAddress?.zipCode,
        shipping_country: orderData.shippingAddress?.country,
        payment_method: orderData.paymentMethod || 'webpay',
        payment_status: orderData.paymentStatus || 'pending',
        transbank_token: orderData.transbankToken || null,
        transbank_status: orderData.transbankStatus || null,
        notes: orderData.notes
      });
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.userId,
          order_number: orderNumber,
          total_amount: orderData.totalAmount,
          status: orderData.status || 'pending',
          shipping_street: orderData.shippingAddress?.street,
          shipping_city: orderData.shippingAddress?.city,
          shipping_state: orderData.shippingAddress?.state,
          shipping_zip_code: orderData.shippingAddress?.zipCode,
          shipping_country: orderData.shippingAddress?.country,
          payment_method: orderData.paymentMethod || 'webpay',
          payment_status: orderData.paymentStatus || 'pending',
          transbank_token: orderData.transbankToken || null,
          transbank_status: orderData.transbankStatus || null,
          notes: orderData.notes
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error de Supabase al crear orden:', error);
        throw new Error(`Error de base de datos: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No se devolvió data de Supabase');
        throw new Error('No se pudo crear la orden');
      }

      console.log('✅ Orden creada exitosamente:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error en orderService.create:', error);
      throw error;
    }
  },

  // Crear items de orden
  async createOrderItems(orderId, items) {
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (error) throw error;
    return data;
  },

  // Buscar orden por ID
  async findById(id) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          subtotal
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar orden por número
  async findByOrderNumber(orderNumber) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          subtotal
        )
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar órdenes por usuario
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          subtotal
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || []; // Devolver array vacío si no hay datos
  },

  // Actualizar estado de orden
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar token de Transbank
  async updateTransbankToken(orderId, token) {
    const { data, error } = await supabase
      .from('orders')
      .update({ transbank_token: token })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar estado de pago
  async updatePaymentStatus(orderId, paymentStatus, transbankStatus = null) {
    const updateData = { payment_status: paymentStatus };
    if (transbankStatus) {
      updateData.transbank_status = transbankStatus;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  // Buscar todas las órdenes
  async findAll() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          subtotal
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || []; // Devolver array vacío si no hay datos
  },

  // Actualizar notas de orden
  async updateNotes(orderId, notes) {
    const { data, error } = await supabase
      .from('orders')
      .update({ notes })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Generar número de orden único
  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
};

export default orderService; 
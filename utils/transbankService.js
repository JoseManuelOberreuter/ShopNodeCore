import pkg from 'transbank-sdk';
const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Verificar que las variables de entorno estén configuradas
const apiKey = process.env.TRANSBANK_API_KEY;
const environment = process.env.TRANSBANK_ENVIRONMENT || 'integration';
const commerceCode = process.env.TRANSBANK_COMMERCE_CODE;

// Configuración de Transbank para la versión 6.1.0
let webpayPlus;

if (environment === 'integration') {
  // Para ambiente de integración, usar las credenciales predefinidas
  const config = new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS, // Código de comercio de integración estándar
    IntegrationApiKeys.WEBPAY, // API Key de integración
    Environment.Integration
  );
  
  webpayPlus = new WebpayPlus.Transaction(config);
} else {
  // Para producción, usar las credenciales del .env
  if (!apiKey || !commerceCode) {
    console.error('❌ Variables de entorno de Transbank no configuradas correctamente');
    throw new Error('Variables de entorno de Transbank requeridas para producción: TRANSBANK_API_KEY, TRANSBANK_COMMERCE_CODE');
  }
  
  const config = new Options(
    commerceCode,
    apiKey,
    Environment.Production
  );
  
  console.log('🔧 Configuración de producción:', {
    apiKey: config.apiKey ? '✅ Configurado' : '❌ Faltante',
    commerceCode: config.commerceCode ? '✅ Configurado' : '❌ Faltante',
    environment: config.environment
  });
  
  webpayPlus = new WebpayPlus.Transaction(config);
}

export const transbankService = {
  // Crear transacción
  async createTransaction(amount, orderId, sessionId, returnUrl) {
    try {
      console.log('💳 Creando transacción con parámetros:', {
        amount,
        orderId,
        sessionId,
        returnUrl
      });

      console.log('🔍 Llamando a webpayPlus.create()...');
      const response = await webpayPlus.create(
        orderId,
        sessionId,
        amount,
        returnUrl
      );

      console.log('✅ Transacción creada exitosamente:', response);
      console.log('🔍 URL devuelta por Transbank:', response.url);
      console.log('🔍 Token devuelto por Transbank:', response.token);
      
      // Validar que la respuesta tenga la estructura esperada
      if (!response || !response.token || !response.url) {
        throw new Error('Respuesta inválida de Transbank: falta token o URL');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creating Transbank transaction:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data || 'No response data',
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Log adicional para debugging
      if (error.response) {
        console.error('❌ Response headers:', error.response.headers);
        console.error('❌ Response config:', {
          url: error.response.config?.url,
          method: error.response.config?.method,
          headers: error.response.config?.headers
        });
      }
      
      throw error;
    }
  },

  // Confirmar transacción
  async confirmTransaction(token) {
    try {
      console.log('🔍 Confirmando transacción con token:', token);
      const response = await webpayPlus.commit(token);
      console.log('✅ Transacción confirmada:', response);
      return response;
    } catch (error) {
      console.error('❌ Error confirming Transbank transaction:', error);
      throw error;
    }
  },

  // Obtener estado de transacción
  async getTransactionStatus(token) {
    try {
      console.log('📊 Obteniendo estado de transacción:', token);
      const response = await webpayPlus.status(token);
      console.log('✅ Estado obtenido:', response);
      return response;
    } catch (error) {
      console.error('❌ Error getting transaction status:', error);
      throw error;
    }
  },

  // Anular transacción
  async refundTransaction(token, amount) {
    try {
      console.log('💰 Anulando transacción:', { token, amount });
      const response = await webpayPlus.refund(token, amount);
      console.log('✅ Transacción anulada:', response);
      return response;
    } catch (error) {
      console.error('❌ Error refunding transaction:', error);
      throw error;
    }
  }
};
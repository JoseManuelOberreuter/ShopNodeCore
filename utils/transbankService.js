import pkg from 'transbank-sdk';
const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = pkg;
import dotenv from 'dotenv';
import logger from './logger.js';

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
    logger.error('Variables de entorno de Transbank no configuradas correctamente');
    throw new Error('Variables de entorno de Transbank requeridas para producción: TRANSBANK_API_KEY, TRANSBANK_COMMERCE_CODE');
  }
  
  const config = new Options(
    commerceCode,
    apiKey,
    Environment.Production
  );
  
  logger.info('Configuración de producción:', {
    apiKey: config.apiKey ? '✅ Configurado' : '❌ Faltante',
    commerceCode: config.commerceCode ? '✅ Configurado' : '❌ Faltante',
    environment: config.environment
  });
  
  webpayPlus = new WebpayPlus.Transaction(config);
}

export const transbankService = {
  // Crear transacción
  // Parameters according to Transbank SDK: (buy_order, session_id, amount, return_url)
  async createTransaction(amount, orderId, sessionId, returnUrl) {
    try {
      // Validate parameters
      if (!orderId || typeof orderId !== 'string') {
        throw new Error('orderId debe ser un string válido');
      }
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('sessionId debe ser un string válido');
      }
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('amount debe ser un número mayor a 0');
      }
      if (!returnUrl || typeof returnUrl !== 'string') {
        throw new Error('returnUrl debe ser un string válido');
      }

      // Ensure orderId and sessionId are strings (SDK requirement)
      const buyOrder = String(orderId);
      const sessionIdStr = String(sessionId);
      
      logger.info('Creating Transbank transaction:', {
        buyOrder,
        sessionId: sessionIdStr,
        amount,
        returnUrl: returnUrl.substring(0, 50) + '...' // Log partial URL for security
      });

      // Call Transbank SDK: create(buy_order, session_id, amount, return_url)
      const response = await webpayPlus.create(
        buyOrder,
        sessionIdStr,
        amount,
        returnUrl
      );
      
      // Validate that the response has the expected structure
      if (!response || !response.token || !response.url) {
        logger.error('Invalid Transbank response structure:', {
          hasResponse: !!response,
          hasToken: !!response?.token,
          hasUrl: !!response?.url,
          responseKeys: response ? Object.keys(response) : []
        });
        throw new Error('Respuesta inválida de Transbank: falta token o URL');
      }
      
      logger.info('Transbank transaction created successfully:', {
        token: response.token.substring(0, 10) + '...', // Log partial token for security
        hasUrl: !!response.url
      });
      
      return response;
    } catch (error) {
      logger.error('Error creating Transbank transaction:', {
        message: error.message,
        stack: error.stack,
        orderId: String(orderId || 'N/A'),
        amount,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      throw error;
    }
  },

  // Confirmar transacción
  async confirmTransaction(token) {
    try {
      logger.safe('Confirmando transacción con token:', token);
      const response = await webpayPlus.commit(token);
      logger.info('Transacción confirmada');
      return response;
    } catch (error) {
      logger.error('Error confirming Transbank transaction:', { message: error.message });
      throw error;
    }
  },

  // Obtener estado de transacción
  async getTransactionStatus(token) {
    try {
      logger.safe('Obteniendo estado de transacción:', token);
      const response = await webpayPlus.status(token);
      logger.debug('Estado obtenido');
      return response;
    } catch (error) {
      logger.error('Error getting transaction status:', { message: error.message });
      throw error;
    }
  },

  // Anular transacción
  async refundTransaction(token, amount) {
    try {
      logger.safe('Anulando transacción:', { token, amount });
      const response = await webpayPlus.refund(token, amount);
      logger.info('Transacción anulada', { amount });
      return response;
    } catch (error) {
      logger.error('Error refunding transaction:', { message: error.message });
      throw error;
    }
  }
};
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
  async createTransaction(amount, orderId, sessionId, returnUrl) {
    try {
      logger.info('Creando transacción con parámetros:', {
        amount,
        orderId,
        sessionId,
        returnUrl
      });

      logger.debug('Llamando a webpayPlus.create()...');
      const response = await webpayPlus.create(
        orderId,
        sessionId,
        amount,
        returnUrl
      );

      logger.info('Transacción creada exitosamente', { orderId, sessionId });
      logger.debug('URL devuelta por Transbank:', response.url);
      logger.safe('Token devuelto por Transbank:', response.token);
      
      // Validar que la respuesta tenga la estructura esperada
      if (!response || !response.token || !response.url) {
        throw new Error('Respuesta inválida de Transbank: falta token o URL');
      }
      
      return response;
    } catch (error) {
      logger.error('Error creating Transbank transaction:', {
        message: error.message,
        orderId,
        status: error.response?.status,
        statusText: error.response?.statusText
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
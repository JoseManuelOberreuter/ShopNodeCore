import { sendContactEmail } from '../utils/mailer.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/responseHelper.js';
import { validateRequiredFields, validateEmail } from '../utils/validators.js';

// Submit contact form
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    const requiredValidation = validateRequiredFields(
      { name, email, subject, message },
      ['name', 'email', 'subject', 'message']
    );
    if (!requiredValidation.isValid) {
      return errorResponse(
        res,
        `Campos requeridos faltantes: ${requiredValidation.missingFields.join(', ')}`,
        400
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return errorResponse(res, emailValidation.error, 400);
    }

    // Validate field lengths to prevent abuse
    if (name.trim().length < 2 || name.trim().length > 100) {
      return errorResponse(res, 'El nombre debe tener entre 2 y 100 caracteres', 400);
    }

    if (subject.trim().length < 3 || subject.trim().length > 200) {
      return errorResponse(res, 'El asunto debe tener entre 3 y 200 caracteres', 400);
    }

    if (message.trim().length < 10 || message.trim().length > 5000) {
      return errorResponse(res, 'El mensaje debe tener entre 10 y 5000 caracteres', 400);
    }

    // Send contact email
    await sendContactEmail(name.trim(), email.trim(), subject.trim(), message.trim());

    return successResponse(
      res,
      null,
      'Mensaje enviado exitosamente. Nos pondremos en contacto contigo pronto.',
      200
    );

  } catch (error) {
    logger.error('Error en submitContactForm:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al enviar el mensaje de contacto');
  }
};


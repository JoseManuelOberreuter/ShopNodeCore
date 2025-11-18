import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

const mockSendContactEmail = jest.fn();
jest.unstable_mockModule('../utils/mailer.js', () => ({
  sendContactEmail: mockSendContactEmail
}));

const mockValidators = {
  validateRequiredFields: jest.fn(),
  validateEmail: jest.fn()
};
jest.unstable_mockModule('../utils/validators.js', () => mockValidators);

let submitContactForm;
beforeAll(async () => {
  const controller = await import('../controllers/contactController.js');
  submitContactForm = controller.submitContactForm;
});

const createResponseMock = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('contactController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends contact email successfully with valid data', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters to pass validation.'
      }
    };
    const res = createResponseMock();

    mockValidators.validateRequiredFields.mockReturnValue({
      isValid: true,
      missingFields: []
    });
    mockValidators.validateEmail.mockReturnValue({
      isValid: true,
      error: null
    });
    mockSendContactEmail.mockResolvedValue();

    await submitContactForm(req, res);

    expect(mockValidators.validateRequiredFields).toHaveBeenCalledWith(
      req.body,
      ['name', 'email', 'subject', 'message']
    );
    expect(mockValidators.validateEmail).toHaveBeenCalledWith('john@example.com');
    expect(mockSendContactEmail).toHaveBeenCalledWith(
      'John Doe',
      'john@example.com',
      'Test Subject',
      'This is a test message with enough characters to pass validation.'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Mensaje enviado exitosamente. Nos pondremos en contacto contigo pronto.'
      })
    );
  });

  it('returns 400 when required fields are missing', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: '',
        subject: '',
        message: ''
      }
    };
    const res = createResponseMock();

    mockValidators.validateRequiredFields.mockReturnValue({
      isValid: false,
      missingFields: ['email', 'subject', 'message']
    });

    await submitContactForm(req, res);

    expect(mockValidators.validateRequiredFields).toHaveBeenCalled();
    expect(mockSendContactEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Campos requeridos faltantes')
      })
    );
  });

  it('returns 400 when email format is invalid', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters to pass validation.'
      }
    };
    const res = createResponseMock();

    mockValidators.validateRequiredFields.mockReturnValue({
      isValid: true,
      missingFields: []
    });
    mockValidators.validateEmail.mockReturnValue({
      isValid: false,
      error: 'Formato de email inválido'
    });

    await submitContactForm(req, res);

    expect(mockValidators.validateEmail).toHaveBeenCalledWith('invalid-email');
    expect(mockSendContactEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Formato de email inválido'
      })
    );
  });

  it('returns 400 when name is too short', async () => {
    const req = {
      body: {
        name: 'J',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters to pass validation.'
      }
    };
    const res = createResponseMock();

    mockValidators.validateRequiredFields.mockReturnValue({
      isValid: true,
      missingFields: []
    });
    mockValidators.validateEmail.mockReturnValue({
      isValid: true,
      error: null
    });

    await submitContactForm(req, res);

    expect(mockSendContactEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'El nombre debe tener entre 2 y 100 caracteres'
      })
    );
  });

  it('returns 400 when message is too short', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Short'
      }
    };
    const res = createResponseMock();

    mockValidators.validateRequiredFields.mockReturnValue({
      isValid: true,
      missingFields: []
    });
    mockValidators.validateEmail.mockReturnValue({
      isValid: true,
      error: null
    });

    await submitContactForm(req, res);

    expect(mockSendContactEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'El mensaje debe tener entre 10 y 5000 caracteres'
      })
    );
  });

  it('handles email sending error', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters to pass validation.'
      }
    };
    const res = createResponseMock();

    mockValidators.validateRequiredFields.mockReturnValue({
      isValid: true,
      missingFields: []
    });
    mockValidators.validateEmail.mockReturnValue({
      isValid: true,
      error: null
    });
    mockSendContactEmail.mockRejectedValue(new Error('Email service unavailable'));

    await submitContactForm(req, res);

    expect(mockSendContactEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Error al enviar el mensaje de contacto'
      })
    );
  });

  it('trims whitespace from form fields', async () => {
    const req = {
      body: {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        subject: '  Test Subject  ',
        message: '  This is a test message with enough characters to pass validation.  '
      }
    };
    const res = createResponseMock();

    mockValidators.validateRequiredFields.mockReturnValue({
      isValid: true,
      missingFields: []
    });
    mockValidators.validateEmail.mockReturnValue({
      isValid: true,
      error: null
    });
    mockSendContactEmail.mockResolvedValue();

    await submitContactForm(req, res);

    expect(mockSendContactEmail).toHaveBeenCalledWith(
      'John Doe',
      'john@example.com',
      'Test Subject',
      'This is a test message with enough characters to pass validation.'
    );
  });
});


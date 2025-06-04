const request = require('supertest');
const express = require('express');
const userRouter = require('../routes/userRouter');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock de los servicios de correo
jest.mock('../utils/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

// Mock de la validación de contraseña
jest.mock('../utils/passwordValidator', () => ({
  validatePassword: jest.fn().mockReturnValue({ isValid: true, message: '' })
}));

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock de jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token')
}));

// Configuración de la aplicación de prueba
const app = express();
app.use(express.json());
app.use('/api/users', userRouter);

describe('User Routes', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      };

      // Mock de la búsqueda de usuario existente
      User.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock del guardado de usuario
      const mockUser = {
        _id: '123',
        name: userData.name,
        email: userData.email,
        isVerified: false,
        save: jest.fn().mockResolvedValue(true)
      };
      User.mockImplementation(() => mockUser);

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
    });

    it('should return 400 if email is missing', async () => {
      const userData = {
        password: 'Password123!',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/users/login', () => {
    it('should login a user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      // Mock de la búsqueda de usuario
      const mockUser = {
        _id: '123',
        email: loginData.email,
        password: 'hashed_password',
        isVerified: true
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Mock de la búsqueda de usuario
      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(401);
    });
  });
}); 
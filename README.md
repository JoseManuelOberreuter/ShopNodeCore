# E-commerce Backend API

A RESTful API for an e-commerce platform built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Product management (CRUD operations)
- Order management
- Role-based access control
- Input validation
- MongoDB integration
- Environment variable configuration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Products

- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create new product (Admin only)
- `PUT /api/v1/products/:id` - Update product (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

### Orders

- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders` - Get order history
- `GET /api/v1/orders/:id` - Get single order

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Input Validation

The API validates all input data using express-validator. Required fields and validation rules are specified in the route files.

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation and sanitization
- Role-based access control
- Environment variables for sensitive data 
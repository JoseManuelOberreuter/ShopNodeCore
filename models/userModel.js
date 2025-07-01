const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }, // 📌 Nuevo campo para rol
  isVerified: { type: Boolean, default: false }, // 📌 Usuario NO verificado por defecto
  verificationToken: { type: String }, // 📌 Token de verificación único
  avatar: { type: String, default: "" },
  telefono: { type: String, default: "" }, // 📌 Teléfono del usuario
  fechaNacimiento: { type: Date, default: null }, // 📌 Fecha de nacimiento
  direccion: { type: String, default: "" } // 📌 Dirección del usuario
});

module.exports = mongoose.model('User', userSchema);

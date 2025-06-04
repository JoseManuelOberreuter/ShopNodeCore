// 📌 utils/passwordValidator.js

/**
 * Verifica si una contraseña cumple con los requisitos de seguridad:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un carácter especial (!@#$%^&*)
 * 
 * @param {string} password - La contraseña a validar.
 * @returns {Object} - Resultado de la validación (isValid, message).
 */
const validatePassword = (password) => {
    const minLength = 8;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!@#$%^&*.]/;
  
    if (password.length < minLength) {
      return { isValid: false, message: "La contraseña debe tener al menos 8 caracteres." };
    }
    if (!uppercaseRegex.test(password)) {
      return { isValid: false, message: "La contraseña debe contener al menos una letra mayúscula." };
    }
    if (!lowercaseRegex.test(password)) {
      return { isValid: false, message: "La contraseña debe contener al menos una letra minúscula." };
    }
    if (!numberRegex.test(password)) {
      return { isValid: false, message: "La contraseña debe contener al menos un número." };
    }
    if (!specialCharRegex.test(password)) {
      return { isValid: false, message: "La contraseña debe contener al menos un carácter especial (!@#$%^&*.)." };
    }
  
    return { isValid: true, message: "Contraseña válida." };
  };
  
  module.exports = { validatePassword };
  
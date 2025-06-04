const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  //! Hay que cambiar el link de verificacion
  const verificationLink = `http://localhost:5173/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Confirma tu cuenta en AsesoriaBot',
    html: `
      <h2>¡Bienvenido a AsesoriaBot! 🚀</h2>
      <p>Gracias por registrarte. Para confirmar tu cuenta, haz clic en el siguiente enlace:</p>
      <a href="${verificationLink}" style="display:inline-block;padding:10px 20px;background:#AD8B73;color:white;border-radius:5px;text-decoration:none;">
        Confirmar Cuenta
      </a>
      <p>Si no creaste esta cuenta, ignora este correo.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// 📌 Enviar correo de recuperación de contraseña
const sendPasswordResetEmail = async (email, token) => {
  console.log("📧 Enviando correo de recuperación a:", email);
  console.log("🔗 Enlace de recuperación generado:", `http://localhost:5173/resetpassword?token=${token}`);

  const resetLink = `http://localhost:5173/resetpassword?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER, 
    to: email,
    subject: "Recuperación de Contraseña - AsesoriaBot",
    html: `
      <h2>Recuperación de Contraseña</h2>
      <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
      <p>Para continuar, haz clic en el siguiente enlace:</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#AD8B73;color:white;border-radius:5px;text-decoration:none;">
        Restablecer Contraseña
      </a>
      <p>Este enlace es válido por 1 hora.</p>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Correo de recuperación enviado:", info.response);
  } catch (error) {
    console.error("❌ Error enviando el correo de recuperación:", error);
  }
};


module.exports = { sendVerificationEmail, sendPasswordResetEmail };

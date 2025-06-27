const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  //ahora apunta al backend directamente
  const verificationLink = `http://localhost:4005/users/verify/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Confirma tu cuenta en ShopNodeCore',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">🛒 ShopNodeCore</h1>
          <h2 style="color: #4CAF50;">¡Bienvenido! 🚀</h2>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Gracias por registrarte en <strong>ShopNodeCore</strong>, tu tienda online de tecnología favorita.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Para activar tu cuenta y comenzar a comprar, confirma tu correo haciendo clic en el botón de abajo:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="display:inline-block;padding:15px 30px;background:#4CAF50;color:white;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              ✅ Confirmar mi Cuenta
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${verificationLink}" style="color: #4CAF50; word-break: break-all;">${verificationLink}</a>
          </p>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
          <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
          <p>© 2024 ShopNodeCore - Tu tienda online de confianza</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Correo de verificación enviado a:", email);
  } catch (error) {
    console.error("❌ Error enviando correo de verificación:", error);
    throw error;
  }
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

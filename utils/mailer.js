import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Centralized branding configuration for all outgoing emails
const brandConfig = {
  name: process.env.BRAND_NAME || 'ShopNodeCore',
  logoUrl: process.env.BRAND_LOGO_URL || 'https://via.placeholder.com/140x40?text=ShopCore',
  supportEmail: process.env.BRAND_SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@example.com',
  primaryColor: process.env.BRAND_PRIMARY_COLOR || '#27667B',
  secondaryColor: process.env.BRAND_SECONDARY_COLOR || '#A0C878',
  accentColor: process.env.BRAND_ACCENT_COLOR || '#DDEB9D',
  textColor: process.env.BRAND_TEXT_COLOR || '#143D60',
  footerText: process.env.BRAND_FOOTER_TEXT || '© 2024 ShopNodeCore - Tu tienda online de confianza'
};

const buildBrandedEmail = ({ title, subtitle, bodyHtml }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: ${brandConfig.textColor};">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${brandConfig.logoUrl}" alt="${brandConfig.name}" style="max-height: 48px; margin-bottom: 12px;" />
      <h1 style="color: ${brandConfig.primaryColor}; margin: 0;">${brandConfig.name}</h1>
      ${subtitle ? `<p style="color: ${brandConfig.secondaryColor}; margin: 8px 0 0;">${subtitle}</p>` : ''}
    </div>
    <div style="background: ${brandConfig.accentColor}1A; padding: 24px; border-radius: 12px;">
      <h2 style="color: ${brandConfig.primaryColor}; margin-top: 0;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="text-align: center; font-size: 12px; color: #888; margin-top: 24px;">
      <p style="margin: 4px 0;">¿Necesitas ayuda? Escríbenos a <a href="mailto:${brandConfig.supportEmail}" style="color: ${brandConfig.primaryColor};">${brandConfig.supportEmail}</a></p>
      <p style="margin: 4px 0;">${brandConfig.footerText}</p>
    </div>
  </div>
`;

const sendVerificationEmail = async (email, token) => {
  // Enlace apunta al frontend que manejará la verificación
  // Usar FRONTEND_URL del .env (obligatorio en producción)
  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL no está configurado en las variables de entorno');
  }
  const frontendUrl = process.env.FRONTEND_URL;
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  const bodyHtml = `
    <p style="font-size: 16px; margin-bottom: 20px;">
      Gracias por registrarte en <strong>${brandConfig.name}</strong>.
    </p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Para activar tu cuenta y comenzar a comprar, confirma tu correo haciendo clic en el botón de abajo:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}"
         style="display:inline-block;padding:15px 30px;background:${brandConfig.primaryColor};color:white;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
        Confirmar mi Cuenta
      </a>
    </div>
    <p style="font-size: 14px; color: #555;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
      <a href="${verificationLink}" style="color: ${brandConfig.primaryColor}; word-break: break-all;">${verificationLink}</a>
    </p>
    <p style="font-size: 14px; color: #888; margin-top: 20px;">
      Si no creaste esta cuenta, puedes ignorar este correo.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Confirma tu cuenta en ${brandConfig.name}`,
    html: buildBrandedEmail({
      title: '¡Bienvenido! 🚀',
      subtitle: 'Confirma tu cuenta',
      bodyHtml
    })
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

// 📌 Enviar correo de recuperación de contraseña
const sendPasswordResetEmail = async (email, token) => {
  // Usar FRONTEND_URL del .env (obligatorio en producción)
  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL no está configurado en las variables de entorno');
  }
  const frontendUrl = process.env.FRONTEND_URL;
  const resetLink = `${frontendUrl}/resetpassword?token=${token}`;

  const bodyHtml = `
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>${brandConfig.name}</strong>.
    </p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Para continuar con el proceso de recuperación, haz clic en el botón de abajo:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="display:inline-block;padding:15px 30px;background:${brandConfig.secondaryColor};color:white;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
        Restablecer Contraseña
      </a>
    </div>
    <p style="font-size: 14px; color: #555;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${resetLink}" style="color: ${brandConfig.secondaryColor}; word-break: break-all;">${resetLink}</a>
    </p>
    <p style="font-size: 14px; color: #e74c3c; margin-top: 20px; padding: 10px; background: #ffeaa7; border-radius: 5px;">
      ⚠️ <strong>Importante:</strong> Este enlace es válido por 1 hora solamente.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER, 
    to: email,
    subject: `Recuperación de Contraseña - ${brandConfig.name}`,
    html: buildBrandedEmail({
      title: 'Recuperación de Contraseña',
      subtitle: 'Protegemos tu cuenta',
      bodyHtml
    })
  };

  try {
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

// 📌 Enviar correo de contacto desde formulario
const sendContactEmail = async (name, email, subject, message) => {
  if (!process.env.EMAIL_USER) {
    throw new Error('EMAIL_USER no está configurado en las variables de entorno');
  }

  const bodyHtml = `
    <p style="font-size: 16px; margin-bottom: 15px;">
      Has recibido un nuevo mensaje de contacto desde el sitio web.
    </p>
    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 10px 0;"><strong>Nombre:</strong> ${name}</p>
      <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p style="margin: 10px 0;"><strong>Asunto:</strong> ${subject}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Mensaje:</strong></p>
      <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
    </div>
    <p style="font-size: 14px; color: #666;">
      Puedes responder directamente a este correo para contactar a ${name}.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `Contacto desde ${brandConfig.name}: ${subject}`,
    html: buildBrandedEmail({
      title: 'Nuevo mensaje de contacto',
      subtitle: 'Formulario del sitio',
      bodyHtml
    })
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

const sendContactAcknowledgementEmail = async (name, email, subject, message) => {
  const bodyHtml = `
    <p style="font-size: 16px; margin-bottom: 15px;">
      Hola ${name.split(' ')[0] || name}, gracias por contactarte con <strong>${brandConfig.name}</strong>.
    </p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hemos recibido tu mensaje y nuestro equipo te responderá lo antes posible.
    </p>
    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 10px 0;"><strong>Asunto:</strong> ${subject}</p>
      <p style="margin: 0 0 10px 0;"><strong>Mensaje enviado:</strong></p>
      <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
    </div>
    <p style="font-size: 14px; color: #555;">
      Si necesitas actualizar tu solicitud, responde a este correo o escríbenos a <a href="mailto:${brandConfig.supportEmail}" style="color: ${brandConfig.primaryColor};">${brandConfig.supportEmail}</a>.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Gracias por contactarnos - ${brandConfig.name}`,
    html: buildBrandedEmail({
      title: '¡Gracias por tu mensaje!',
      subtitle: 'Hemos recibido tu solicitud',
      bodyHtml
    })
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

export { sendVerificationEmail, sendPasswordResetEmail, sendContactEmail, sendContactAcknowledgementEmail };

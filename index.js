import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno

import connectDB from './database.js'; // Importa la conexión a la base de datos
import app from './server.js'; // Importa la configuración del servidor

const PORT = process.env.PORT || 4005; // Puerto del servidor

const startMessage = `                                                

░██████╗██╗░░██╗░█████╗░██████╗░███╗░░██╗░█████╗░██████╗░███████╗░█████╗░░█████╗░██████╗░███████╗
██╔════╝██║░░██║██╔══██╗██╔══██╗████╗░██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝
╚█████╗░███████║██║░░██║██████╔╝██╔██╗██║██║░░██║██║░░██║█████╗░░██║░░╚═╝██║░░██║██████╔╝█████╗░░
░╚═══██╗██╔══██║██║░░██║██╔═══╝░██║╚████║██║░░██║██║░░██║██╔══╝░░██║░░██╗██║░░██║██╔══██╗██╔══╝░░
██████╔╝██║░░██║╚█████╔╝██║░░░░░██║░╚███║╚█████╔╝██████╔╝███████╗╚█████╔╝╚█████╔╝██║░░██║███████╗
╚═════╝░╚═╝░░╚═╝░╚════╝░╚═╝░░░░░╚═╝░░╚══╝░╚════╝░╚═════╝░╚══════╝░╚════╝░░╚════╝░╚═╝░░╚═╝╚══════╝
`;

console.log(startMessage);

// Conectar a la base de datos antes de iniciar el servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
    console.log(`📁 Sistema de Gestión de Documentos iniciado correctamente`);
  });
}).catch(err => {
  console.error("❌ Error al conectar a la base de datos:", err);
  process.exit(1); // Detiene la ejecución si la conexión falla
});

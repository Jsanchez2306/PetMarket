const nodemailer = require('nodemailer');

// Configurar transporter reutilizable con múltiples opciones
const configurarTransporter = () => {
  // En producción, deshabilitar email si hay problemas de conexión
  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_EMAIL === 'true') {
    console.log('⚠️ Email deshabilitado en producción por configuración');
    return null;
  }

  // Gmail con configuración robusta para desarrollo Y producción
  console.log('📧 Configurando transporter con Gmail (configuración robusta)');
  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // usar STARTTLS
    auth: {
      user: process.env.EMAIL_USER || 'andresbmx11@gmail.com',
      pass: process.env.EMAIL_PASS || 'vziu xkmz sice gikb'
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    // Configuración robusta para producción
    connectionTimeout: 60000,  // 60 segundos
    greetingTimeout: 30000,    // 30 segundos  
    socketTimeout: 60000,      // 60 segundos
    pool: true,                // usar pool de conexiones
    maxConnections: 5,         // max 5 conexiones simultáneas
    maxMessages: 100,          // max 100 mensajes per connection
    rateLimit: 14,             // max 14 mensajes por segundo
    debug: process.env.NODE_ENV === 'production', // debug en producción
    logger: process.env.NODE_ENV === 'production'  // logs en producción
  });
};

// Función helper para enviar email con retry
async function enviarEmailConRetry(transporter, mailOptions, maxReintentos = 3) {
  for (let intento = 1; intento <= maxReintentos; intento++) {
    try {
      console.log(`📧 Intento ${intento}/${maxReintentos} enviando email a: ${mailOptions.to}`);
      const resultado = await transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado exitosamente en intento ${intento}`);
      return resultado;
    } catch (error) {
      console.error(`❌ Error en intento ${intento}:`, error.message);
      
      if (intento === maxReintentos) {
        throw error; // Lanzar error en el último intento
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      const tiempoEspera = Math.pow(2, intento) * 1000; // 2s, 4s, 8s...
      console.log(`⏳ Esperando ${tiempoEspera/1000}s antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, tiempoEspera));
    }
  }
}

// Función para enviar factura por correo
exports.enviarFacturaPorCorreo = async (clienteEmail, clienteNombre, datosFactura) => {
  try {
    console.log('📧 Enviando factura por correo a:', clienteEmail);
    
    const transporter = configurarTransporter();
    
    // Si el transporter está deshabilitado, simular envío exitoso
    if (!transporter) {
      console.log('⚠️ Email deshabilitado - simulando envío exitoso');
      return {
        success: true,
        mensaje: `Factura registrada para ${clienteEmail} (email deshabilitado en producción)`
      };
    }
    
    // Generar HTML de la factura
    const htmlFactura = generarHTMLFactura(clienteNombre, datosFactura);
    
    const emailFrom = process.env.EMAIL_USER || 'andresbmx11@gmail.com';
    
    const mailOptions = {
      from: emailFrom,
      to: clienteEmail,
      subject: `PetMarket - Factura de Compra #${datosFactura.paymentId || 'N/A'}`,
      html: htmlFactura
    };

    // Usar función de retry
    await enviarEmailConRetry(transporter, mailOptions, 3);
    console.log('✅ Factura enviada exitosamente a:', clienteEmail);
    
    return {
      success: true,
      mensaje: `Factura enviada exitosamente a ${clienteEmail}`
    };
    
  } catch (error) {
    console.error('❌ Error enviando factura por correo después de reintentos:', error);
    
    // En producción, no fallar si el email falla - solo loggear
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ Email falló en producción después de reintentos, continuando sin email');
      return {
        success: false,
        mensaje: `Factura registrada para ${clienteEmail} (envío de email falló después de reintentos)`
      };
    }
    
    // En desarrollo, lanzar error
    if (error.code === 'ETIMEDOUT' || error.code === 'EAUTH' || error.code === 'ECONNREFUSED') {
      throw new Error('Error en el servicio de correo. Por favor, intenta más tarde.');
    }
    
    throw new Error('Error al enviar la factura por correo');
  }
};

// Función para generar HTML de la factura
function generarHTMLFactura(clienteNombre, datosFactura) {
  const {
    paymentId,
    status,
    reference,
    productosComprados = [],
    totalCompra = 0,
    fechaCompra = new Date()
  } = datosFactura;

  const productosHTML = productosComprados.map(producto => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${producto.nombre}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${producto.cantidad}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${Number(producto.precio).toLocaleString('es-CO')}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        <strong>$${Number(producto.subtotal).toLocaleString('es-CO')}</strong>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura PetMarket</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4CAF50;">
        <h1 style="color: #4CAF50; margin: 0;">🐾 PetMarket</h1>
        <p style="color: #666; margin: 5px 0;">Cuidamos de tus mascotas</p>
      </div>

      <!-- Información de la factura -->
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #28a745; margin-top: 0;">✅ ¡Compra Exitosa!</h2>
        <p style="margin: 0; color: #666;">Hola <strong>${clienteNombre}</strong>,</p>
        <p style="color: #666;">Tu compra ha sido procesada exitosamente. A continuación encontrarás los detalles de tu pedido:</p>
      </div>

      <!-- Detalles del pago -->
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">📋 Detalles del Pago</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">ID de Pago:</td>
            <td style="padding: 5px 0;">${paymentId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Estado:</td>
            <td style="padding: 5px 0;">
              <span style="background-color: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                ${status || 'APROBADO'}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Fecha:</td>
            <td style="padding: 5px 0;">${fechaCompra.toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
          </tr>
          ${reference ? `
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Referencia:</td>
            <td style="padding: 5px 0;">${reference}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Productos comprados -->
      ${productosComprados.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px;">🛒 Productos Comprados</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Cant.</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Precio Unit.</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productosHTML}
          </tbody>
          <tfoot>
            <tr style="background-color: #e8f5e8;">
              <td colspan="3" style="padding: 15px; font-weight: bold; text-align: right; border-top: 2px solid #28a745;">
                Total Pagado:
              </td>
              <td style="padding: 15px; font-weight: bold; text-align: right; border-top: 2px solid #28a745; color: #28a745; font-size: 18px;">
                $${Number(totalCompra).toLocaleString('es-CO')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      ` : ''}

      <!-- Qué sigue ahora -->
      <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #f57c00; margin-top: 0;">📦 ¿Qué sigue ahora?</h3>
        <div style="display: flex; justify-content: space-between; text-align: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px; margin: 10px;">
            <div style="font-size: 30px; margin-bottom: 10px;">📧</div>
            <h4 style="color: #333; margin: 5px 0;">Confirmación</h4>
            <p style="color: #666; font-size: 14px; margin: 0;">Ya tienes este correo como comprobante</p>
          </div>
          <div style="flex: 1; min-width: 150px; margin: 10px;">
            <div style="font-size: 30px; margin-bottom: 10px;">📦</div>
            <h4 style="color: #333; margin: 5px 0;">Preparación</h4>
            <p style="color: #666; font-size: 14px; margin: 0;">Comenzamos a preparar tu pedido</p>
          </div>
          <div style="flex: 1; min-width: 150px; margin: 10px;">
            <div style="font-size: 30px; margin-bottom: 10px;">🚚</div>
            <h4 style="color: #333; margin: 5px 0;">Envío</h4>
            <p style="color: #666; font-size: 14px; margin: 0;">Te notificaremos el estado del envío</p>
          </div>
        </div>
      </div>

      <!-- Botones de acción -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.BASE_URL || 'http://localhost:3191'}/productos/catalogo" 
           style="background-color: #4CAF50; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; margin: 5px; font-weight: bold;">
          🛒 Seguir Comprando
        </a>
        <a href="${process.env.BASE_URL || 'http://localhost:3191'}/panel" 
           style="background-color: #2196F3; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; margin: 5px; font-weight: bold;">
          👤 Mi Cuenta
        </a>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; text-align: center;">
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #28a745;">
            🔒 <strong>Pago Seguro:</strong> Tu pago fue procesado de forma segura a través de Mercado Pago.
          </p>
        </div>
        
        <div style="color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">Este correo se envió automáticamente, por favor no respondas a este mensaje.</p>
          <p style="margin: 5px 0;">Si tienes alguna pregunta, contacta nuestro servicio al cliente.</p>
          <p style="margin: 15px 0 5px 0; font-weight: bold;">© 2025 PetMarket - Cuidamos de tus mascotas 🐾</p>
        </div>
      </div>

    </body>
    </html>
  `;
}
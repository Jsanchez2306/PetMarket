const Factura = require('../models/factura.model');
const Cliente = require('../models/cliente.model');
const Producto = require('../models/producto.model');
const Empleado = require('../models/empleado.model');
const Venta = require('../models/venta.model');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');


/**
 * Renderizar la vista para crear factura.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página de creación de factura
 * @author codenova
 */
exports.renderizarCrearFactura = async (req, res) => {
  try {
    // Obtener información del usuario de la sesión
    const usuario = req.session?.user || null;
    const tipoUsuario = usuario?.tipoUsuario || null;
    const esEmpleado = tipoUsuario === 'empleado';
    const esCliente = tipoUsuario === 'cliente';
    const esAdmin = usuario?.rol === 'admin';

    res.render('crearFactura', {
      usuario,
      tipoUsuario,
      esEmpleado,
      esCliente,
      esAdmin
    });
  } catch (error) {
    console.error('Error al renderizar crear factura:', error);
    res.status(500).send('Error al cargar la página de crear factura');
  }
};

/**
 * Renderiza la gestión de facturas (vista EJS)
 */
/**
 * Renderizar la vista de gestión de facturas.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página con la lista de facturas
 * @author codenova
 */
exports.renderizarGestionFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find();
    
    // Obtener información del usuario de la sesión
    const usuario = req.session?.user || null;
    const tipoUsuario = usuario?.tipoUsuario || null;
    const esEmpleado = tipoUsuario === 'empleado';
    const esCliente = tipoUsuario === 'cliente';
    const esAdmin = usuario?.rol === 'admin';

    res.render('gestionFacturas', { 
      facturas,
      usuario,
      tipoUsuario,
      esEmpleado,
      esCliente,
      esAdmin
    });
  } catch (err) {
    console.error('Error al obtener facturas para la vista:', err);
    res.status(500).send('Error al obtener facturas');
  }
};


/**
 * Crear una nueva factura.
 * @params req, res - datos de la factura en req.body
 * @return Factura creada o errores de validación
 * @author codenova
 */
exports.crearFactura = async (req, res) => {
  try {
    const { cliente, productos, metodoPago, observaciones } = req.body;
    const empleadoId = req.user.id; // Obtenido del middleware de autenticación

    if (!cliente || !productos || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Cliente y productos son requeridos' });
    }

    // Manejar diferentes tipos de cliente
    let clienteInfo = {};
    let clienteId = null;

    if (cliente.tipo === 'registrado') {
      // Cliente registrado en el sistema
      const clienteExiste = await Cliente.findById(cliente.id);
      if (!clienteExiste) {
        return res.status(404).json({ mensaje: 'Cliente registrado no encontrado' });
      }
      clienteInfo = {
        nombre: clienteExiste.nombre,
        email: clienteExiste.email
      };
      clienteId = clienteExiste._id;
    } else if (cliente.tipo === 'manual') {
      // Cliente con email manual
      clienteInfo = {
        nombre: cliente.nombre || 'Cliente Manual',
        email: cliente.email
      };
      clienteId = null; // No hay referencia a cliente registrado
    } else if (cliente.tipo === 'no-especificado') {
      // Cliente no especificado
      clienteInfo = {
        nombre: 'Cliente No Especificado',
        email: 'no-especificado@petmarket.com'
      };
      clienteId = null;
    } else {
      return res.status(400).json({ mensaje: 'Tipo de cliente no válido' });
    }

    // Verificar productos y calcular totales
    let subtotal = 0;
    const productosFactura = [];

    for (const item of productos) {
      const producto = await Producto.findById(item.id);
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto ${item.nombre} no encontrado` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ 
          mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}` 
        });
      }

      const subtotalProducto = producto.precio * item.cantidad;
      subtotal += subtotalProducto;

      productosFactura.push({
        producto: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
        subtotal: subtotalProducto
      });

      // Actualizar stock del producto
      producto.stock -= item.cantidad;
      await producto.save();
    }

    const iva = 0; // Sin IVA
    const total = subtotal;

    // Crear la factura
    const nuevaFactura = new Factura({
      cliente: clienteId, // Puede ser null para clientes manuales o no especificados
      nombreCliente: clienteInfo.nombre,
      emailCliente: clienteInfo.email,
      productos: productosFactura,
      subtotal: subtotal,
      iva: iva,
      total: total,
      metodoPago: metodoPago || 'efectivo',
      observaciones: observaciones || '',
      empleado: empleadoId,
      fecha: new Date(),
      estado: 'pagada'
    });

    const facturaGuardada = await nuevaFactura.save();

    // También crear una venta para llevar el control en gestión de ventas
    try {
      // Generar un paymentId único para la venta manual
      const paymentId = `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Preparar productos para la venta (formato diferente al de factura)
      const productosVenta = productosFactura.map(item => ({
        producto: item.producto, // ID del producto
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.subtotal,
        imagen: '' // Se puede poblar desde el producto si es necesario
      }));

      const nuevaVenta = new Venta({
        paymentId: paymentId,
        cliente: clienteId, // Puede ser null para clientes manuales
        clienteEmail: clienteInfo.email,
        clienteNombre: clienteInfo.nombre,
        clienteTelefono: '', // No tenemos este dato en facturas manuales
        clienteDireccion: '', // No tenemos este dato en facturas manuales
        productos: productosVenta,
        subtotal: subtotal,
        total: total,
        metodoPago: metodoPago || 'efectivo',
        estadoPago: 'approved', // Venta manual siempre aprobada
        estadoEntrega: 'entregado', // Venta manual siempre entregada
        reference: `Factura Manual: ${facturaGuardada._id}`,
        observaciones: observaciones || '',
        fechaCompra: new Date(),
        fechaEnvio: new Date(), // Inmediatamente enviado
        fechaEntrega: new Date() // Inmediatamente entregado
      });

  await nuevaVenta.save();
      
    } catch (ventaError) {
      console.error(' Error al crear venta desde factura manual:', ventaError);
      // No devolvemos error porque la factura se creó exitosamente
    }

    res.status(201).json({ 
      mensaje: 'Factura creada exitosamente', 
      factura: facturaGuardada 
    });
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ mensaje: 'Error al crear factura', error: error.message });
  }
};

/**
 * Obtener todas las facturas (API).
 * @params req, res - solicitud y respuesta HTTP
 * @return Lista de facturas en formato JSON
 * @author codenova
 */
exports.obtenerFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find()
      .populate('cliente', 'nombre email')
      .populate('empleado', 'nombre email')
      .sort({ fecha: -1 });

    res.status(200).json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas (API):', error);
    res.status(500).json({ mensaje: 'Error al obtener las facturas', error: error.message });
  }
};

/**
 * Obtener una factura por ID.
 * @params req, res - id de la factura en req.params
 * @return Factura encontrada o mensaje de error
 * @author codenova
 */
exports.obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const factura = await Factura.findById(id)
      .populate('cliente', 'nombre email telefono direccion')
      .populate('empleado', 'nombre email');

    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    res.status(200).json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ mensaje: 'Error al obtener factura', error: error.message });
  }
};

/**
 * Actualizar una factura por ID.
 * @params req, res - id de la factura y datos a actualizar
 * @return Factura actualizada o mensaje de error
 * @author codenova
 */
exports.actualizarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Factura.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    res.json(actualizado);
  } catch (err) {
    console.error('Error al actualizar factura:', err);
    res.status(400).json({ mensaje: 'Error al actualizar factura', error: err.message });
  }
};

/**
 * Eliminar una factura por ID.
 * @params req, res - id de la factura en req.params
 * @return Estado de eliminación o mensaje de error
 * @author codenova
 */
exports.eliminarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Factura.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.sendStatus(500);
  }
};

/**
 * Configurar cliente de Resend.
 * @return Instancia de Resend o null si no hay API Key
 * @author codenova
 */
const configurarResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(' RESEND_API_KEY no está configurado');
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Generar HTML de la factura para correo.
 * @params factura, clienteInfo, empleado - datos de la factura y participantes
 * @return HTML en formato string
 * @author codenova
 */
const generarHTMLFactura = (factura, clienteInfo, empleado) => {
  const fechaFormateada = new Date(factura.fecha).toLocaleDateString('es-CO');
  
  let productosHTML = '';
  factura.productos.forEach(item => {
    productosHTML += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nombre}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.precio.toLocaleString('es-CO')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.subtotal.toLocaleString('es-CO')}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factura PetMarket</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #007bff; padding-bottom: 20px; }
        .logo { color: #007bff; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .info-section { display: flex; justify-content: space-between; margin: 20px 0; }
        .info-box { flex: 1; margin: 0 10px; }
        .info-box h4 { color: #333; margin-bottom: 10px; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #007bff; color: white; padding: 12px; text-align: left; }
        .totals { text-align: right; margin-top: 20px; }
        .totals table { width: 300px; margin-left: auto; }
        .total-row { font-weight: bold; font-size: 18px; color: #007bff; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🐾 PetMarket</div>
          <h2>Factura de Venta</h2>
          <p>Factura #${factura._id.toString().slice(-8).toUpperCase()}</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h4>📋 Información de la Factura</h4>
            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
            <p><strong>Método de Pago:</strong> ${factura.metodoPago}</p>
            <p><strong>Estado:</strong> ${factura.estado}</p>
          </div>
          
          <div class="info-box">
            <h4>👤 Datos del Cliente</h4>
            <p><strong>Nombre:</strong> ${clienteInfo.nombre}</p>
            <p><strong>Email:</strong> ${clienteInfo.email}</p>
            <p><strong>Teléfono:</strong> ${clienteInfo.telefono}</p>
          </div>
          
          <div class="info-box">
            <h4>👨‍💼 Vendedor</h4>
            <p><strong>Nombre:</strong> ${empleado.nombre}</p>
            <p><strong>Email:</strong> ${empleado.email}</p>
          </div>
        </div>

        <h4>🛒 Productos Comprados</h4>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio Unit.</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productosHTML}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td><strong>Subtotal:</strong></td>
              <td style="text-align: right;">$${factura.subtotal.toLocaleString('es-CO')}</td>
            </tr>
            <tr>
              <td><strong>IVA (19%):</strong></td>
              <td style="text-align: right;">$${factura.iva.toLocaleString('es-CO')}</td>
            </tr>
            <tr class="total-row">
              <td><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>$${factura.total.toLocaleString('es-CO')}</strong></td>
            </tr>
          </table>
        </div>

        ${factura.observaciones ? `
          <div style="margin-top: 20px;">
            <h4>📝 Observaciones</h4>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px;">${factura.observaciones}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>¡Gracias por confiar en PetMarket! 🐾</p>
          <p>Para cualquier consulta, contáctanos en info@petmarket.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Enviar factura por correo electrónico.
 * @params req, res - id de la factura en req.params
 * @return Estado del envío y detalles del email
 * @author codenova
 */
exports.enviarFacturaPorCorreo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener la factura con datos completos
    const factura = await Factura.findById(id);
    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    // Obtener datos del empleado
    const empleado = await Empleado.findById(factura.empleado);
    
    // Manejar cliente registrado vs manual
    let clienteInfo = {};
    if (factura.cliente) {
      // Cliente registrado
      const cliente = await Cliente.findById(factura.cliente);
      if (!cliente) {
        return res.status(404).json({ mensaje: 'Cliente registrado no encontrado' });
      }
      clienteInfo = {
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono || 'No especificado'
      };
    } else {
      // Cliente manual - usar datos guardados en la factura
      clienteInfo = {
        nombre: factura.nombreCliente,
        email: factura.emailCliente,
        telefono: 'No especificado'
      };
    }

    // Configurar Resend
    const resend = configurarResend();
    
    if (!resend) {
      console.error(' Servicio de email no disponible - API Key no configurado');
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ 
          mensaje: 'Servicio de correo temporalmente no disponible.' 
        });
      }
      return res.status(500).json({ mensaje: 'Servicio de email no configurado en desarrollo' });
    }
    
    // Generar HTML de la factura
    const htmlFactura = generarHTMLFactura(factura, clienteInfo, empleado);
    
    // Configurar email con Resend
    const emailOptions = {
      from: process.env.EMAIL_FROM || 'PetMarket <onboarding@resend.dev>',
      to: clienteInfo.email,
      subject: `Factura PetMarket #${factura._id.toString().slice(-8).toUpperCase()}`,
      html: htmlFactura,
      text: `Hola ${clienteInfo.nombre}, adjunto encontrarás tu factura de PetMarket.`
    };

    // Enviar email con retry
    console.log(' Enviando factura con Resend...');
    
    let lastError = null;
    for (let intento = 1; intento <= 3; intento++) {
      try {
        console.log(` Intento ${intento}/3 - Enviando factura a: ${clienteInfo.email}`);
        
        const { data, error } = await resend.emails.send(emailOptions);

        if (error) {
          lastError = error;
          console.error(` Error en intento ${intento}:`, error);
          
          if (intento < 3) {
            const tiempoEspera = Math.pow(2, intento) * 1000;
            console.log(` Esperando ${tiempoEspera/1000}s antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));
          }
          continue;
        }

        console.log(' Factura enviada exitosamente:', data);
        console.log(` Factura enviada por correo a ${clienteInfo.email}`);
        return res.status(200).json({ 
          mensaje: 'Factura enviada exitosamente por correo electrónico',
          email: clienteInfo.email,
          emailId: data.id
        });
        
      } catch (error) {
        lastError = error;
        console.error(` Excepción en intento ${intento}:`, error.message);
        
        if (intento < 3) {
          const tiempoEspera = Math.pow(2, intento) * 1000;
          await new Promise(resolve => setTimeout(resolve, tiempoEspera));
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error('Falló después de 3 intentos');

  } catch (error) {
    console.error(' Error al enviar factura por correo:', error);
    
    // En producción, no fallar completamente
    if (process.env.NODE_ENV === 'production') {
      console.error(' Email de factura falló en producción');
      return res.status(500).json({ 
        mensaje: `Factura generada correctamente, pero falló el envío por email: ${error.message || 'Error desconocido'}` 
      });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al enviar factura por correo', 
      error: error.message 
    });
  }
};

/**
 * Generar PDF de la factura para impresión.
 * @params req, res - id de la factura en req.params
 * @return HTML de la factura para impresión
 * @author codenova
 */
exports.generarFacturaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener la factura con datos completos
    const factura = await Factura.findById(id);
    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    // Obtener datos del empleado
    const empleado = await Empleado.findById(factura.empleado);
    
    // Manejar cliente registrado vs manual
    let clienteInfo = {};
    if (factura.cliente) {
      // Cliente registrado
      const cliente = await Cliente.findById(factura.cliente);
      if (!cliente) {
        return res.status(404).json({ mensaje: 'Cliente registrado no encontrado' });
      }
      clienteInfo = {
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono || 'No especificado'
      };
    } else {
      // Cliente manual - usar datos guardados en la factura
      clienteInfo = {
        nombre: factura.nombreCliente,
        email: factura.emailCliente,
        telefono: 'No especificado'
      };
    }

    // Generar HTML de la factura
    const htmlFactura = generarHTMLFactura(factura, clienteInfo, empleado);
    
    // Configurar respuesta para descarga
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="factura-${factura._id.toString().slice(-8)}.html"`);
    
    res.send(htmlFactura);
    
    console.log(` PDF de factura generado para impresión: ${factura._id}`);

  } catch (error) {
    console.error('Error al generar PDF de factura:', error);
    res.status(500).json({ 
      mensaje: 'Error al generar PDF de factura', 
      error: error.message 
    });
  }
};

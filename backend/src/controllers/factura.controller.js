const Factura = require('../models/factura.model');
const Cliente = require('../models/cliente.model');
const Producto = require('../models/producto.model');
const Empleado = require('../models/empleado.model');
const Venta = require('../models/venta.model');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Renderiza la página de crear factura (vista EJS)
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
 * Crear una nueva factura manual (empleados)
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
      console.log('✅ Venta creada desde factura manual:', nuevaVenta._id);
      
    } catch (ventaError) {
      console.error('⚠️ Error al crear venta desde factura manual:', ventaError);
      // No devolvemos error porque la factura se creó exitosamente
    }

    res.status(201).json({ 
      mensaje: 'Factura creada exitosamente', 
      factura: facturaGuardada 
    });

    console.log('✅ Factura creada:', facturaGuardada._id, '- Total:', total);
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ mensaje: 'Error al crear factura', error: error.message });
  }
};

/**
 * Obtener todas las facturas (API)
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
 * Obtener una factura por ID
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
 * Actualizar una factura por ID
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
 * Eliminar una factura por ID
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
 * Configurar transporter de nodemailer
 */
const configureMailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // O el servicio que uses
    auth: {
      user: process.env.EMAIL_USER || 'tu-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'tu-password-app'
    }
  });
};

/**
 * Generar HTML de la factura para correo
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
 * Enviar factura por correo electrónico
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

    // Configurar transporter
    const transporter = configureMailTransporter();
    
    // Generar HTML de la factura
    const htmlFactura = generarHTMLFactura(factura, clienteInfo, empleado);
    
    // Configurar email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@petmarket.com',
      to: clienteInfo.email,
      subject: `Factura PetMarket #${factura._id.toString().slice(-8).toUpperCase()}`,
      html: htmlFactura
    };

    // Enviar email
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Factura enviada por correo a ${clienteInfo.email}`);
    res.status(200).json({ 
      mensaje: 'Factura enviada exitosamente por correo electrónico',
      email: clienteInfo.email
    });

  } catch (error) {
    console.error('Error al enviar factura por correo:', error);
    res.status(500).json({ 
      mensaje: 'Error al enviar factura por correo', 
      error: error.message 
    });
  }
};

/**
 * Generar PDF de la factura para impresión
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
    
    console.log(`✅ PDF de factura generado para impresión: ${factura._id}`);

  } catch (error) {
    console.error('Error al generar PDF de factura:', error);
    res.status(500).json({ 
      mensaje: 'Error al generar PDF de factura', 
      error: error.message 
    });
  }
};

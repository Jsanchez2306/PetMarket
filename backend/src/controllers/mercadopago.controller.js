const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const Cart = require('../models/cart.model');
const Factura = require('../models/factura.model');
const Producto = require('../models/producto.model');
const Cliente = require('../models/cliente.model');
const Venta = require('../models/venta.model');
const { enviarFacturaPorCorreo } = require('../services/email.service');
const crypto = require('crypto');

// Configurar Mercado Pago

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-4753465907432673-093012-6a41fd026329faee121a3570c2a47a6a-516025911'
});

const payment = new Payment(client);


/**
 * Función de prueba para verificar configuración básica de Mercado Pago.
 * @params req, res - solicitud y respuesta HTTP
 * @return Preferencia de prueba creada y URL
 * @author codenova
 */
exports.testPreferencia = async (req, res) => {
  try {
    // Configuración mínima de prueba
    const testPreferenceData = {
      items: [
        {
          title: 'Producto de prueba',
          unit_price: 1000,
          quantity: 1,
          currency_id: 'COP'
        }
      ],
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/pending`
      },
      notification_url: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/webhook`,
      external_reference: `TEST-${Date.now()}`
    };

    

    const preference = new Preference(client);
    const response = await preference.create({ body: testPreferenceData });

  console.log('Prueba exitosa:', response.id);
    

    res.json({
      success: true,
      message: 'Configuración de Mercado Pago funcionando correctamente',
      preferenceId: response.id,
      initPoint: response.init_point
    });

  } catch (error) {
    console.error(' Error en prueba de Mercado Pago:', error);
    res.status(500).json({
      error: 'Error en configuración de Mercado Pago',
      message: error.message,
      details: error
    });
  }
};


/**
 * Función para probar si el token de acceso es válido.
 * @params req, res - solicitud y respuesta HTTP
 * @return Preferencia de prueba creada y estado del token
 * @author codenova
 */
exports.testToken = async (req, res) => {
  try {
    // Crear una preferencia mínima para probar el token
    const testPreferenceData = {
      items: [
        {
          title: 'Test Token',
          unit_price: 1000,
          quantity: 1,
          currency_id: 'COP'
        }
      ],
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/pending`
      },
      notification_url: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/webhook`
    };

  console.log('Probando token de acceso...');
    

    const preference = new Preference(client);
    const response = await preference.create({ body: testPreferenceData });

  console.log('Token válido! Preferencia creada:', response.id);
    

    res.json({
      success: true,
      message: 'Token de acceso válido',
      preferenceId: response.id,
      initPoint: response.init_point
    });

  } catch (error) {
    console.error(' Token inválido:', error.message);
    res.status(500).json({
      error: 'Token de acceso inválido',
      message: error.message,
      status: error.status
    });
  }
};


/**
 * Función de prueba para descontar stock manualmente.
 * @params req, res - solicitud y respuesta HTTP
 * @return Estado del descuento de stock
 * @author codenova
 */
exports.testDescuentoStock = async (req, res) => {
  try {
  console.log('TEST: Descontando stock de golosinas Dogjoy...');
    

    // Buscar las golosinas Dogjoy
    const producto = await Producto.findOne({
      nombre: { $regex: /golosinas.*dogjoy/i }
    });

    if (!producto) {
      
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

  console.log(`Producto encontrado: ${producto.nombre}`);
      
  console.log(`Stock actual: ${producto.stock}`);
      

    // Descontar 2 unidades
    const cantidadADescontar = 2;

    if (producto.stock >= cantidadADescontar) {
      const resultado = await Producto.findByIdAndUpdate(
        producto._id,
        { $inc: { stock: -cantidadADescontar } },
        { new: true }
      );

  console.log(`Stock actualizado: ${producto.stock} -> ${resultado.stock}`);
      

      res.json({
        mensaje: 'Stock descontado exitosamente',
        producto: producto.nombre,
        stockAnterior: producto.stock,
        stockActual: resultado.stock,
        cantidadDescontada: cantidadADescontar
      });
    } else {
      res.status(400).json({
        mensaje: 'Stock insuficiente',
        stockDisponible: producto.stock,
        cantidadSolicitada: cantidadADescontar
      });
    }

  } catch (error) {
    console.error(' Error en test de descuento:', error);
    res.status(500).json({
      mensaje: 'Error en test de descuento',
      error: error.message
    });
  }
};


/**
 * Función de prueba específica para Colombia.
 * @params req, res - solicitud y respuesta HTTP
 * @return Preferencia de prueba creada para Colombia
 * @author codenova
 */
exports.testColombia = async (req, res) => {
  try {
    // Configuración específica para Colombia
    const testPreferenceData = {
      items: [
        {
          title: 'Producto de prueba Colombia',
          unit_price: 10000,
          quantity: 1,
          currency_id: 'COP'
        }
      ],
      payer: {
        name: 'Juan',
        surname: 'Perez',
        email: 'test@example.com',
        identification: {
          type: 'CC',
          number: '12345678'
        },
        address: {
          zip_code: '110111',
          street_name: 'Calle 123',
          street_number: 123
        }
      },
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/pending`
      },
      notification_url: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/webhook`,
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      },
      shipments: {
        cost: 0,
        mode: 'not_specified'
      },
      external_reference: `TEST-COLOMBIA-${Date.now()}`
    };

  console.log('Probando configuración específica para Colombia');
    
  console.log('Preferencia Colombia:', JSON.stringify(testPreferenceData, null, 2));

  const preference = new Preference(client);
    const response = await preference.create({ body: testPreferenceData });

  console.log('Prueba Colombia exitosa:', response.id);
    

    res.json({
      success: true,
      message: 'Configuración Colombia funcionando',
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error(' Error en prueba Colombia:', error);
    res.status(500).json({
      error: 'Error en configuración Colombia',
      message: error.message,
      details: error
    });
  }
};


/**
 * Crear preferencia de pago desde localStorage.
 * @params req, res - items del carrito en req.body
 * @return Preferencia creada y URL de Mercado Pago
 * @author codenova
 */
exports.crearPreferenciaLocalStorage = async (req, res) => {
  try {
  console.log('===== CREAR PREFERENCIA LOCALSTORAGE - DEBUG =====');
    const userId = req.session.user?.id || req.user?.id;
    

    if (!userId) {
  console.log('Usuario no autenticado');
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const { items } = req.body; // Recibir items del localStorage
  console.log('Body completo recibido:', req.body);
    

    if (!items || items.length === 0) {
  console.log('Carrito vacío');
      return res.status(400).json({ mensaje: 'El carrito está vacío' });
    }

    // Verificar y obtener productos de la base de datos
    const itemsVerificados = [];

    for (const item of items) {
      const producto = await Producto.findById(item.productId);

      if (!producto) {
        return res.status(400).json({ mensaje: `Producto no encontrado: ${item.productId}` });
      }

      if (item.cantidad > producto.stock) {
        return res.status(400).json({
          mensaje: `Stock insuficiente para ${producto.nombre}`,
          stockDisponible: producto.stock,
          cantidadSolicitada: item.cantidad
        });
      }

      itemsVerificados.push({
        id: producto._id.toString(),
        title: producto.nombre,
        description: producto.descripcion || 'Producto PetMarket',
        picture_url: producto.imagen || '',
        category_id: producto.categoria,
        quantity: item.cantidad,
        unit_price: parseFloat(producto.precio),
        currency_id: 'COP'
      });
    }

    // Obtener datos del usuario
    const usuario = await Cliente.findById(userId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Configuración de preferencia
    const preferenceData = {
      items: itemsVerificados,
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/pending`
      },
      notification_url: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/webhook`,
      external_reference: `LSCART-${userId}-${Date.now()}` // LSCART = LocalStorage Cart
    };

  console.log('Creando preferencia de Mercado Pago desde localStorage para usuario:', usuario.email);
    
  console.log('Items verificados:', JSON.stringify(itemsVerificados, null, 2));
    

    // Crear preferencia en Mercado Pago
    const preference = new Preference(client);
    const response = await preference.create({ body: preferenceData });

  console.log('Preferencia creada desde localStorage:', response.id);
    
    

    res.status(200).json({
      mensaje: 'Preferencia creada exitosamente',
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error(' Error al crear preferencia desde localStorage:', error);
    res.status(500).json({
      mensaje: 'Error al crear preferencia de pago',
      error: error.message
    });
  }
};


/**
 * Crear preferencia de pago en Mercado Pago (carrito en base de datos).
 * @params req, res - usuario autenticado y carrito en BD
 * @return Preferencia creada y URL de Mercado Pago
 * @author codenova
 */
exports.crearPreferencia = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    // Obtener carrito del usuario
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ mensaje: 'El carrito está vacío' });
    }

    // Verificar stock antes de crear la preferencia
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({ mensaje: 'Producto no encontrado en el carrito' });
      }
      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          mensaje: `Stock insuficiente para ${item.product.nombre}`,
          stockDisponible: item.product.stock,
          cantidadSolicitada: item.quantity
        });
      }
    }

    // Obtener datos del usuario
    const usuario = await Cliente.findById(userId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Crear items para Mercado Pago
    const items = cart.items.map(item => ({
      id: item.product._id.toString(),
      title: item.product.nombre,
      description: item.product.descripcion || 'Producto PetMarket',
      picture_url: item.product.imagen || '',
      category_id: item.product.categoria,
      quantity: item.quantity,
      unit_price: parseFloat(item.product.precio),
      currency_id: 'COP'
    }));

    // Configuración ULTRA SIMPLE para evitar errores
    const preferenceData = {
      items: items,
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/pending`
      },
      notification_url: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/webhook`,
      external_reference: `CART-${userId}-${Date.now()}`
    };

  console.log('Creando preferencia de Mercado Pago para usuario:', usuario.email);
    
  console.log('Items del carrito:', JSON.stringify(items, null, 2));
    
  // Crear preferencia en Mercado Pago usando SDK v2.x
    const preference = new Preference(client);
    const response = await preference.create({ body: preferenceData });

  console.log('Preferencia creada:', response.id);
    

    res.status(200).json({
      mensaje: 'Preferencia creada exitosamente',
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error(' Error al crear preferencia de Mercado Pago:', error);
    res.status(500).json({
      mensaje: 'Error al crear preferencia de pago',
      error: error.message
    });
  }
};


/**
 * Validar firma del webhook de MercadoPago para seguridad.
 * @params req - solicitud HTTP con headers y body
 * @return true si la firma es válida, false si no
 * @author codenova
 */
function validarFirmaWebhook(req) {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  if (!xSignature || !xRequestId) {
  console.log('Headers de firma faltantes');
    return false;
  }

  // En modo TEST, la validación es menos estricta
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
  console.log('MERCADOPAGO_WEBHOOK_SECRET no configurado - omitiendo validación en desarrollo');
    return true; // Permitir en desarrollo
  }


  try {
    const parts = xSignature.split(',');
    let ts, hash;

    parts.forEach(part => {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    });

    if (!ts || !hash) {
    console.log('Formato de firma inválido');
      return false;
    }

    // Crear la cadena para validar
    const manifest = `id:${req.body.data?.id || ''};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const sha = hmac.digest('hex');

    const isValid = sha === hash;
  console.log('Validación de firma:', isValid ? 'VÁLIDA' : 'INVÁLIDA');

    return isValid;
  } catch (error) {
    console.error(' Error validando firma:', error);
    return false;
  }
}


/**
 * Webhook para recibir notificaciones de Mercado Pago.
 * @params req, res - datos del webhook en req.body
 * @return Estado de procesamiento del webhook
 * @author codenova
 */
exports.webhook = async (req, res) => {
  try {
    console.log('Webhook recibido:', {
      body: req.body,
      headers: {
        'x-signature': req.headers['x-signature'],
        'x-request-id': req.headers['x-request-id']
      }
    });

    // Validar firma del webhook para seguridad
    const firmaValida = validarFirmaWebhook(req);
    if (!firmaValida) {
      console.log(' Firma de webhook inválida - rechazando');
      return res.status(401).json({ mensaje: 'Firma inválida' });
    }

    const { type, data } = req.body;
    // console.log(' Webhook validado correctamente:', { type, data });

    if (type === 'payment') {
      const paymentId = data.id;

      // Obtener información del pago
      const paymentResponse = await payment.get({ id: paymentId });

      console.log('Información del pago:', {
        id: paymentResponse.id,
        status: paymentResponse.status,
        external_reference: paymentResponse.external_reference
      });

      // Si el pago fue aprobado, procesar la orden
      if (paymentResponse.status === 'approved') {
        await procesarPagoAprobado(paymentResponse);
      }
    }

    res.status(200).json({ mensaje: 'Webhook procesado' });
  } catch (error) {
    console.error(' Error en webhook:', error);
    res.status(500).json({ mensaje: 'Error en webhook' });
  }
};


/**
 * Página de éxito después del pago.
 * @params req, res - parámetros de pago en req.query
 * @return Renderiza la página de éxito y procesa venta/factura
 * @author codenova
 */
exports.success = async (req, res) => {
  try {
    const { collection_id, collection_status, external_reference, payment_id } = req.query;

    console.log('===== PAGINA DE EXITO - INICIO DEBUG COMPLETO =====');
    console.log('Llegada a página de éxito:', {
      collection_id,
      collection_status,
      external_reference,
      payment_id,
      fullQuery: req.query
    });
    console.log('Timestamp:', new Date().toISOString());
    console.log('External Reference recibido:', external_reference);
    console.log('¿Empieza con LSCART?', external_reference?.startsWith('LSCART-') || false);

    // Usar payment_id o collection_id
    const paymentId = payment_id || collection_id;

    let pagoAprobado = false;

    // Inicializar variables antes de su uso
    let productosComprados = [];
    let totalCompra = 0;

    // Si llegamos a la página de éxito, el pago fue exitoso
    if (paymentId) {
  console.log('Pago considerado aprobado por llegada a página de éxito');
      pagoAprobado = true;

      // CORREGIDO: Obtener external_reference del pago en lugar de la URL
      let externalReferenceFromPayment = external_reference; // URL parameter (puede ser undefined)

      // Si no hay external_reference en URL, obtenerlo del pago
      if (!externalReferenceFromPayment && paymentId) {
        try {
          console.log('Obteniendo external_reference desde el pago...');
          const paymentResponse = await payment.get({ id: paymentId });
          externalReferenceFromPayment = paymentResponse.external_reference;
          console.log('External_reference desde pago:', externalReferenceFromPayment);
        } catch (error) {
          console.error(' Error obteniendo external_reference del pago:', error);
        }
      }

      // Si hay external_reference (desde URL o desde pago), procesar checkout localStorage
      if (externalReferenceFromPayment && externalReferenceFromPayment.startsWith('LSCART-')) {
  console.log('PROCESANDO PAGO EXITOSO DESDE localStorage CHECKOUT');
  console.log('External Reference:', externalReferenceFromPayment);
  console.log('Procesando pago exitoso desde localStorage checkout');

        try {
          // Format: LSCART-userId-timestamp
          const [, userId, timestamp] = externalReferenceFromPayment.split('-');
          console.log('Usuario:', userId, 'Timestamp:', timestamp);

          // NUEVO: Descontar stock de productos comprados
          console.log('INICIANDO DESCUENTO DE STOCK DE PRODUCTOS');

          try {
            const paymentResponse = await payment.get({ id: paymentId });
            console.log('Obteniendo items del pago para descuento de stock...');

            if (paymentResponse.additional_info && paymentResponse.additional_info.items) {
              const items = paymentResponse.additional_info.items;
              console.log('Items encontrados para descuento:', items.length);

              for (const item of items) {
                console.log(`Procesando item: ${item.title} (cantidad: ${item.quantity})`);

                // Buscar producto por ID si está disponible, sino por nombre
                let producto = null;

                if (item.id) {
                  producto = await Producto.findById(item.id);
                  console.log(`Búsqueda por ID (${item.id}):`, producto ? 'ENCONTRADO' : 'NO ENCONTRADO');
                }

                if (!producto) {
                  producto = await Producto.findOne({
                    nombre: { $regex: new RegExp(item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
                  });
                  console.log(`Búsqueda por nombre ("${item.title}"):`, producto ? 'ENCONTRADO' : 'NO ENCONTRADO');
                }

                if (producto) {
                  const cantidadComprada = item.quantity;
                  const stockAntes = producto.stock;

                  console.log(`PRODUCTO: ${producto.nombre}`);
                  console.log(`Stock antes: ${stockAntes}, Cantidad comprada: ${cantidadComprada}`);

                  if (stockAntes >= cantidadComprada) {
                    const resultado = await Producto.findByIdAndUpdate(
                      producto._id,
                      { $inc: { stock: -cantidadComprada } },
                      { new: true }
                    );

                    console.log(`STOCK ACTUALIZADO EXITOSAMENTE!`);
                    console.log(`${producto.nombre}: ${stockAntes} -> ${resultado.stock}`);
                  } else {
                    console.warn(`Stock insuficiente para ${producto.nombre}`);
                    if (stockAntes > 0) {
                      const resultado = await Producto.findByIdAndUpdate(
                        producto._id,
                        { $inc: { stock: -stockAntes } },
                        { new: true }
                      );
                      console.log(`Stock parcial actualizado: ${stockAntes} -> ${resultado.stock}`);
                    }
                  }
                } else {
                  console.error(`No se encontró producto: "${item.title}"`);
                }
              }

              console.log('DESCUENTO DE STOCK COMPLETADO');
            } else {
              console.warn('No se encontraron items en el pago');
            }
          } catch (stockError) {
            console.error(' Error en descuento de stock:', stockError);
          }

          // Mensaje informativo: el carrito se limpiará por el script del frontend
          console.log('El carrito será limpiado automáticamente por el script del frontend');

        } catch (lsError) {
          console.error(' Error procesando checkout localStorage:', lsError);
        }
      } else {
  console.log('Pago exitoso sin external_reference (posible pago manual o de prueba)');
      }
    }

    // Intentar obtener detalles del pago si hay paymentId (para mostrar información)

    if (paymentId) {
      try {
        const paymentResponse = await payment.get({ id: paymentId });
    console.log('Estado del pago desde MP API:', paymentResponse.status);

        if (paymentResponse.status === 'approved') {
          pagoAprobado = true;
        }

        // Intentar obtener productos del pago
        if (paymentResponse.additional_info && paymentResponse.additional_info.items) {
          productosComprados = paymentResponse.additional_info.items.map(item => ({
            nombre: item.title,
            cantidad: item.quantity,
            precio: item.unit_price,
            subtotal: item.unit_price * item.quantity
          }));
        } else if (paymentResponse.metadata && paymentResponse.metadata.items) {
          // Si no hay items en additional_info, usar metadata
          const metadataItems = JSON.parse(paymentResponse.metadata.items);
          for (const item of metadataItems) {
            try {
              const Producto = require('../models/producto.model');
              const producto = await Producto.findById(item.productId);
              if (producto) {
                productosComprados.push({
                  nombre: producto.nombre,
                  cantidad: item.cantidad,
                  precio: item.precio,
                  subtotal: item.precio * item.cantidad,
                  imagen: producto.imagen
                });
              }
            } catch (err) {
              console.warn(' No se pudo obtener detalles del producto:', item.productId);
            }
          }
        }

        // Calcular total
        totalCompra = productosComprados.reduce((total, item) => total + item.subtotal, 0);

  console.log('Productos encontrados:', productosComprados.length);

      } catch (paymentError) {
        console.error(' Error al obtener detalles del pago desde MP API:', paymentError);
        // No impedimos continuar si no podemos consultar la API
      }
    }

    // Si no se pudieron obtener productos y hay un paymentId, mostrar productos de ejemplo
    if (productosComprados.length === 0 && paymentId && pagoAprobado) {
  console.log('No se encontraron productos específicos, usando información genérica');
      productosComprados = [{
        nombre: 'Compra realizada con éxito',
        cantidad: 1,
        precio: 0,
        subtotal: 0
      }];
    }

    //  ENVIAR FACTURA POR CORREO AUTOMÁTICAMENTE - DESPUÉS DE OBTENER PRODUCTOS
    console.log('Estado antes de enviar factura:', {
      pagoAprobado,
      productosLength: productosComprados.length,
      hasUser: !!req.session.user,
      userEmail: req.session.user?.email,
      reference: external_reference
    });

    if (pagoAprobado && productosComprados.length > 0) {
      try {
  console.log('Enviando factura automática por correo...');
        await enviarFacturaAutomatica(req.session.user, {
          paymentId,
          status: collection_status || 'approved',
          reference: external_reference,
          productosComprados,
          totalCompra,
          fechaCompra: new Date()
        });
        console.log(' Factura enviada exitosamente por correo');
      } catch (emailError) {
        console.error(' Error enviando factura por correo (no crítico):', emailError.message);
        console.error(' Stack del error:', emailError.stack);
        // No bloqueamos la página de éxito si falla el correo
      }

      //  GUARDAR VENTA EN BASE DE DATOS
      try {
        console.log(' Guardando venta en base de datos...');
        await guardarVentaEnBaseDatos({
          paymentId,
          status: collection_status || 'approved',
          reference: external_reference,
          productosComprados,
          totalCompra,
          usuario: req.session.user
        });
        console.log(' Venta guardada exitosamente en base de datos');
      } catch (ventaError) {
        console.error(' Error guardando venta en base de datos (no crítico):', ventaError.message);
        console.error(' Stack del error:', ventaError.stack);
        // No bloqueamos la página de éxito si falla guardar la venta
      }
    } else {
      console.log(' No se procesaron datos adicionales - condiciones no cumplidas');
    }

    res.render('mercadopagoSuccess', {
      usuario: req.session.user,
      paymentId: paymentId,
      status: collection_status,
      reference: external_reference,
      pagoAprobado: pagoAprobado,
      productosComprados: productosComprados,
      totalCompra: totalCompra
    });
  } catch (error) {
    console.error(' Error en página de éxito:', error);
    res.render('mercadopagoSuccess', {
      usuario: req.session.user,
      error: 'Error al procesar el pago'
    });
  }
};


/**
 * Página de pago fallido.
 * @params req, res - parámetros de pago en req.query
 * @return Renderiza la página de fallo
 * @author codenova
 */
exports.failure = (req, res) => {
  const { collection_id, collection_status, external_reference, payment_id } = req.query;

  console.log(' Llegada a página de fallo:', {
    collection_id,
    collection_status,
    external_reference,
    payment_id,
    fullQuery: req.query
  });

  res.render('mercadopagoFailure', {
    usuario: req.session.user,
    paymentId: payment_id || collection_id,
    status: collection_status,
    reference: external_reference
  });
};


/**
 * Página de pago pendiente.
 * @params req, res - parámetros de pago en req.query
 * @return Renderiza la página de pendiente o redirige en modo test
 * @author codenova
 */
exports.pending = async (req, res) => {
  const { collection_id, collection_status, external_reference, payment_id } = req.query;

  console.log('⏳ Llegada a página de pendiente:', {
    collection_id,
    collection_status,
    external_reference,
    payment_id,
    fullQuery: req.query
  });

  const paymentId = payment_id || collection_id;

  //  MODO TEST AUTOMÁTICO: Si detecta un token de TEST, los pagos "pendientes" se tratan como exitosos
  const isTestMode = process.env.MERCADOPAGO_ACCESS_TOKEN?.includes('TEST-');

  if (isTestMode && paymentId) {
    console.log(' Modo TEST detectado - tratando pago pendiente como exitoso');
    console.log(' Redirigiendo automáticamente a página de éxito...');

    // Redirigir a la página de éxito con los mismos parámetros
    const successUrl = `/mercadopago/success?payment_id=${paymentId}&collection_status=approved${external_reference ? `&external_reference=${external_reference}` : ''}`;
    return res.redirect(successUrl);
  }

  console.log(' Pago pendiente real:', { collection_id, collection_status, external_reference });

  res.render('mercadopagoPending', {
    usuario: req.session.user,
    paymentId: paymentId,
    status: collection_status,
    reference: external_reference
  });
};


/**
 * Procesar pago aprobado - crear factura y actualizar stock.
 * @params payment - datos del pago aprobado
 * @return Factura creada
 * @author codenova
 */
async function procesarPagoAprobado(payment) {
  try {
    const externalReference = payment.external_reference;
    const userId = externalReference.split('-')[1]; // Extraer userId de la referencia

    console.log(' Procesando pago aprobado para usuario:', userId);

    // Obtener carrito del usuario
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      console.log(' Carrito no encontrado o vacío');
      return;
    }

    // Obtener datos del cliente
    const cliente = await Cliente.findById(userId);
    if (!cliente) {
      console.log(' Cliente no encontrado');
      return;
    }

    // Crear factura
    const nuevaFactura = new Factura({
      cliente: userId,
      nombreCliente: cliente.nombre,
      emailCliente: cliente.email,
      productos: cart.items.map(item => ({
        producto: item.product._id,
        nombre: item.product.nombre,
        precio: item.price,
        cantidad: item.quantity,
        subtotal: item.price * item.quantity
      })),
      subtotal: cart.subtotal,
      iva: cart.iva,
      total: cart.total,
      metodoPago: 'mercadopago',
      observaciones: `Pago procesado con Mercado Pago. ID: ${payment.id}`,
      fecha: new Date(),
      estado: 'pagada'
    });

    const facturaGuardada = await nuevaFactura.save();
    console.log(' Factura creada:', facturaGuardada._id);

    // Actualizar stock de productos
    for (const item of cart.items) {
      await Producto.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
      console.log(` Stock actualizado para ${item.product.nombre}: -${item.quantity}`);
    }

    // Limpiar carrito
    cart.clearCart();
    await cart.save();
    console.log(' Carrito limpiado');

    return facturaGuardada;
  } catch (error) {
    console.error(' Error al procesar pago aprobado:', error);
    throw error;
  }
}


/**
 * Procesar descuento de stock de productos en localStorage checkout.
 * @params items, externalReference - productos comprados y referencia
 * @return Estado del descuento de stock
 * @author codenova
 */
async function procesarDescuentoStock(items, externalReference) {
  try {
    console.log(' Iniciando descuento de stock para localStorage checkout');
    console.log(' Items a procesar:', items);

    for (const item of items) {
      // Buscar el producto en la base de datos
      const producto = await Producto.findById(item.id);

      if (!producto) {
        console.error(` Producto no encontrado: ${item.id}`);
        continue;
      }

      // Verificar que hay suficiente stock
      if (producto.stock < item.quantity) {
        console.warn(` Stock insuficiente para ${producto.nombre}: disponible ${producto.stock}, solicitado ${item.quantity}`);
        // Descontar el stock disponible
        const cantidadADescontar = Math.min(producto.stock, item.quantity);
        await Producto.findByIdAndUpdate(
          item.id,
          { $inc: { stock: -cantidadADescontar } }
        );
        console.log(` Stock actualizado para ${producto.nombre}: -${cantidadADescontar} (parcial)`);
      } else {
        // Descontar la cantidad completa
        await Producto.findByIdAndUpdate(
          item.id,
          { $inc: { stock: -item.quantity } }
        );
        console.log(` Stock actualizado para ${producto.nombre}: -${item.quantity}`);
      }
    }

    console.log(' Descuento de stock completado para:', externalReference);

  } catch (error) {
    console.error(' Error procesando descuento de stock:', error);
    throw error;
  }
}


/**
 * Enviar factura automáticamente después de pago exitoso.
 * @params usuario, datosFactura - datos del usuario y factura
 * @return Resultado del envío de factura
 * @author codenova
 */
async function enviarFacturaAutomatica(usuario, datosFactura) {
  try {
    console.log(' Iniciando envío automático de factura...');

    // Obtener información del cliente
    let clienteEmail = null;
    let clienteNombre = 'Cliente';

    if (usuario && usuario.email) {
      clienteEmail = usuario.email;
      clienteNombre = usuario.nombre || 'Cliente';
    } else if (datosFactura.reference && datosFactura.reference.startsWith('LSCART-')) {
      // Intentar obtener usuario desde external_reference
      const [, userId] = datosFactura.reference.split('-');
      try {
        const cliente = await Cliente.findById(userId);
        if (cliente) {
          clienteEmail = cliente.email;
          clienteNombre = cliente.nombre;
        }
      } catch (err) {
        console.warn(' No se pudo obtener cliente desde reference:', err.message);
      }
    }

    if (!clienteEmail) {
      console.warn(' No se pudo determinar email del cliente para envío de factura');
      return;
    }

    console.log(` Enviando factura a: ${clienteEmail} (${clienteNombre})`);

    // Enviar factura por correo
    const resultado = await enviarFacturaPorCorreo(clienteEmail, clienteNombre, datosFactura);

    console.log(' Factura enviada exitosamente por correo');
    return resultado;

  } catch (error) {
    console.error(' Error en envío automático de factura:', error);
    throw error;
  }
}


/**
 * Guardar la venta en la base de datos.
 * @params datosVenta - información de la venta
 * @return Venta guardada
 * @author codenova
 */
async function guardarVentaEnBaseDatos(datosVenta) {
  try {
    console.log('💾 Iniciando guardado de venta...');

    // Obtener información del cliente
    let clienteInfo = {
      cliente: null,
      email: 'cliente@ejemplo.com',
      nombre: 'Cliente',
      telefono: '',
      direccion: ''
    };

    if (datosVenta.usuario && datosVenta.usuario.email) {
      // Usuario logueado
      clienteInfo.email = datosVenta.usuario.email;
      clienteInfo.nombre = datosVenta.usuario.nombre || 'Cliente';
      clienteInfo.telefono = datosVenta.usuario.telefono || '';
      clienteInfo.direccion = datosVenta.usuario.direccion || '';

      // Buscar cliente en BD
      try {
        const cliente = await Cliente.findOne({ email: datosVenta.usuario.email });
        if (cliente) {
          clienteInfo.cliente = cliente._id;
          clienteInfo.nombre = cliente.nombre;
          clienteInfo.telefono = cliente.telefono || '';
          clienteInfo.direccion = cliente.direccion || '';
        }
      } catch (err) {
        console.warn(' No se pudo obtener cliente desde BD:', err.message);
      }
    } else if (datosVenta.reference && datosVenta.reference.startsWith('LSCART-')) {
      // Intentar obtener usuario desde external_reference
      const [, userId] = datosVenta.reference.split('-');
      try {
        const cliente = await Cliente.findById(userId);
        if (cliente) {
          clienteInfo.cliente = cliente._id;
          clienteInfo.email = cliente.email;
          clienteInfo.nombre = cliente.nombre;
          clienteInfo.telefono = cliente.telefono || '';
          clienteInfo.direccion = cliente.direccion || '';
        }
      } catch (err) {
        console.warn(' No se pudo obtener cliente desde reference:', err.message);
      }
    }

    // Verificar que no exista ya una venta con este paymentId
    const ventaExistente = await Venta.findOne({ paymentId: datosVenta.paymentId });
    if (ventaExistente) {
      console.log(' Ya existe una venta con este paymentId:', datosVenta.paymentId);
      return ventaExistente;
    }

    // Calcular totales (sin IVA)
    const subtotal = datosVenta.totalCompra || 0;
    const total = subtotal;

    // Crear nueva venta
    const nuevaVenta = new Venta({
      paymentId: datosVenta.paymentId,

      // Información del cliente
      cliente: clienteInfo.cliente,
      clienteEmail: clienteInfo.email,
      clienteNombre: clienteInfo.nombre,
      clienteTelefono: clienteInfo.telefono,
      clienteDireccion: clienteInfo.direccion,

      // Productos
      productos: datosVenta.productosComprados.map(producto => ({
        producto: producto.producto || null, // ID del producto si existe
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        precio: producto.precio,
        subtotal: producto.subtotal,
        imagen: producto.imagen || ''
      })),

      // Información financiera
      subtotal: subtotal,
      total: total,

      // Información del pago
      metodoPago: 'mercadopago',
      estadoPago: datosVenta.status || 'approved',
      estadoEntrega: 'sin entregar',

      // Información adicional
      reference: datosVenta.reference || '',
      fechaCompra: new Date()
    });

    await nuevaVenta.save();
    console.log('Venta guardada exitosamente con ID:', nuevaVenta._id);

    return nuevaVenta;

  } catch (error) {
    console.error(' Error guardando venta en base de datos:', error);
    throw error;
  }
}
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const Cart = require('../models/cart.model');
const Factura = require('../models/factura.model');
const Producto = require('../models/producto.model');
const Cliente = require('../models/cliente.model');

// Configurar Mercado Pago (SDK v2.x)
console.log('🔑 Variables de entorno Mercado Pago:', {
  ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'ENCONTRADO' : 'NO ENCONTRADO',
  PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY ? 'ENCONTRADO' : 'NO ENCONTRADO',
  BASE_URL: process.env.BASE_URL || 'NO ENCONTRADO'
});

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-4753465907432673-093012-6a41fd026329faee121a3570c2a47a6a-516025911'
});

const payment = new Payment(client);

/**
 * Función de prueba para verificar configuración básica de Mercado Pago
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
        success: 'http://localhost:3191/mercadopago/success',
        failure: 'http://localhost:3191/mercadopago/failure',
        pending: 'http://localhost:3191/mercadopago/pending'
      },
      external_reference: `TEST-${Date.now()}`
    };

    console.log('🧪 Probando configuración básica de Mercado Pago');
    console.log('📋 Preferencia de prueba:', JSON.stringify(testPreferenceData, null, 2));

    const preference = new Preference(client);
    const response = await preference.create({ body: testPreferenceData });

    console.log('✅ Prueba exitosa:', response.id);
    
    res.json({
      success: true,
      message: 'Configuración de Mercado Pago funcionando correctamente',
      preferenceId: response.id,
      initPoint: response.init_point
    });

  } catch (error) {
    console.error('❌ Error en prueba de Mercado Pago:', error);
    res.status(500).json({ 
      error: 'Error en configuración de Mercado Pago',
      message: error.message,
      details: error
    });
  }
};

/**
 * Función para probar si el token de acceso es válido
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
        success: 'http://localhost:3191/mercadopago/success',
        failure: 'http://localhost:3191/mercadopago/failure',
        pending: 'http://localhost:3191/mercadopago/pending'
      }
    };

    console.log('🔑 Probando token de acceso...');
    console.log('🔑 Token actual:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20) + '...');

    const preference = new Preference(client);
    const response = await preference.create({ body: testPreferenceData });

    console.log('✅ Token válido! Preferencia creada:', response.id);
    
    res.json({
      success: true,
      message: 'Token de acceso válido',
      preferenceId: response.id,
      initPoint: response.init_point
    });

  } catch (error) {
    console.error('❌ Token inválido:', error.message);
    res.status(500).json({ 
      error: 'Token de acceso inválido',
      message: error.message,
      status: error.status
    });
  }
};

/**
 * Función de prueba específica para Colombia
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
        success: 'http://localhost:3191/mercadopago/success',
        failure: 'http://localhost:3191/mercadopago/failure',
        pending: 'http://localhost:3191/mercadopago/pending'
      },
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

    console.log('🇨🇴 Probando configuración específica para Colombia');
    console.log('📋 Preferencia Colombia:', JSON.stringify(testPreferenceData, null, 2));

    const preference = new Preference(client);
    const response = await preference.create({ body: testPreferenceData });

    console.log('✅ Prueba Colombia exitosa:', response.id);
    
    res.json({
      success: true,
      message: 'Configuración Colombia funcionando',
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Error en prueba Colombia:', error);
    res.status(500).json({ 
      error: 'Error en configuración Colombia',
      message: error.message,
      details: error
    });
  }
};

/**
 * Crear preferencia de pago en Mercado Pago
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
        success: 'http://localhost:3191/mercadopago/success',
        failure: 'http://localhost:3191/mercadopago/failure',
        pending: 'http://localhost:3191/mercadopago/pending'
      },
      external_reference: `CART-${userId}-${Date.now()}`
    };

    console.log('🛒 Creando preferencia de Mercado Pago para usuario:', usuario.email);
    console.log('🔗 URLs configuradas:', {
      success: preferenceData.back_urls.success,
      failure: preferenceData.back_urls.failure,
      pending: preferenceData.back_urls.pending,
      webhook: preferenceData.notification_url
    });
    console.log('🛍️ Items del carrito:', JSON.stringify(items, null, 2));
    console.log('📋 Preferencia completa:', JSON.stringify(preferenceData, null, 2));
    
    // Crear preferencia en Mercado Pago usando SDK v2.x
    const preference = new Preference(client);
    const response = await preference.create({ body: preferenceData });

    console.log('✅ Preferencia creada:', response.id);

    res.status(200).json({
      mensaje: 'Preferencia creada exitosamente',
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Error al crear preferencia de Mercado Pago:', error);
    res.status(500).json({ 
      mensaje: 'Error al crear preferencia de pago', 
      error: error.message 
    });
  }
};

/**
 * Webhook para recibir notificaciones de Mercado Pago
 */
exports.webhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log('🔔 Webhook recibido:', { type, data });

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información del pago
      const payment = await mercadopago.payment.get(paymentId);
      
      console.log('💳 Información del pago:', {
        id: payment.body.id,
        status: payment.body.status,
        external_reference: payment.body.external_reference
      });

      // Si el pago fue aprobado, procesar la orden
      if (payment.body.status === 'approved') {
        await procesarPagoAprobado(payment.body);
      }
    }

    res.status(200).json({ mensaje: 'Webhook procesado' });
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).json({ mensaje: 'Error en webhook' });
  }
};

/**
 * Página de éxito después del pago
 */
exports.success = async (req, res) => {
  try {
    const { collection_id, collection_status, external_reference, payment_id } = req.query;
    
    console.log('✅ Llegada a página de éxito:', { 
      collection_id, 
      collection_status, 
      external_reference, 
      payment_id,
      fullQuery: req.query 
    });

    // Usar payment_id o collection_id
    const paymentId = payment_id || collection_id;

    // Si hay paymentId, obtener detalles del pago
    if (paymentId) {
      try {
        const paymentResponse = await payment.get({ id: paymentId });
        console.log('💳 Estado del pago:', paymentResponse.status);
        
        if (paymentResponse.status === 'approved') {
          console.log('🎉 Pago aprobado, procesando...');
          // Aquí puedes agregar la lógica para procesar el pago aprobado
        }
      } catch (paymentError) {
        console.error('⚠️ Error al obtener detalles del pago:', paymentError);
      }
    }

    res.render('mercadopagoSuccess', {
      usuario: req.session.user,
      paymentId: paymentId,
      status: collection_status,
      reference: external_reference
    });
  } catch (error) {
    console.error('❌ Error en página de éxito:', error);
    res.render('mercadopagoSuccess', {
      usuario: req.session.user,
      error: 'Error al procesar el pago'
    });
  }
};

/**
 * Página de pago fallido
 */
exports.failure = (req, res) => {
  const { collection_id, collection_status, external_reference, payment_id } = req.query;
  
  console.log('❌ Llegada a página de fallo:', { 
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
 * Página de pago pendiente
 */
exports.pending = (req, res) => {
  const { collection_id, collection_status, external_reference, payment_id } = req.query;
  
  console.log('⏳ Llegada a página de pendiente:', { 
    collection_id, 
    collection_status, 
    external_reference, 
    payment_id,
    fullQuery: req.query 
  });
  
  console.log('⏳ Pago pendiente:', { collection_id, collection_status, external_reference });

  res.render('mercadopagoPending', {
    usuario: req.session.user,
    paymentId: collection_id,
    status: collection_status,
    reference: external_reference
  });
};

/**
 * Procesar pago aprobado - crear factura y actualizar stock
 */
async function procesarPagoAprobado(payment) {
  try {
    const externalReference = payment.external_reference;
    const userId = externalReference.split('-')[1]; // Extraer userId de la referencia
    
    console.log('🔄 Procesando pago aprobado para usuario:', userId);

    // Obtener carrito del usuario
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      console.log('❌ Carrito no encontrado o vacío');
      return;
    }

    // Obtener datos del cliente
    const cliente = await Cliente.findById(userId);
    if (!cliente) {
      console.log('❌ Cliente no encontrado');
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
    console.log('✅ Factura creada:', facturaGuardada._id);

    // Actualizar stock de productos
    for (const item of cart.items) {
      await Producto.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
      console.log(`📦 Stock actualizado para ${item.product.nombre}: -${item.quantity}`);
    }

    // Limpiar carrito
    cart.clearCart();
    await cart.save();
    console.log('🧹 Carrito limpiado');

    return facturaGuardada;
  } catch (error) {
    console.error('❌ Error al procesar pago aprobado:', error);
    throw error;
  }
}
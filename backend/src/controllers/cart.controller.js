const Cart = require('../models/cart.model');
const Producto = require('../models/producto.model');

/**
 * Renderizar la vista del carrito (AHORA SIN AUTENTICACIÓN - localStorage)
 */
exports.renderizarCarrito = async (req, res) => {
  try {
    // CAMBIO: Carrito ahora funciona con localStorage, no requiere autenticación para ver
    return res.render('carrito', { 
      cart: { items: [], subtotal: 0, iva: 0, total: 0 },
      message: 'Carrito manejado con localStorage' 
    });
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      return res.render('carrito', { cart: { items: [], subtotal: 0, iva: 0, total: 0 } });
    }

    // Filtrar items con productos eliminados (product es null)
    const validItems = cart.items.filter(item => {
      if (item.product === null) {
        return false;
      }
      
      // Verificar que price y quantity sean números válidos
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      
      if (isNaN(price) || isNaN(quantity) || price < 0 || quantity <= 0) {
        return false;
      }
      
      return true;
    });
    
    // Si hay items inválidos, limpiar y recalcular
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      
      // Usar el método del modelo para recalcular
      cart.recalculateTotals();
      await cart.save();
    }

    // Asegurarse de que los totales sean números válidos
    const cartData = {
      items: cart.items,
      subtotal: Number(cart.subtotal) || 0,
      iva: Number(cart.iva) || 0,
      total: Number(cart.total) || 0
    };

  res.render('carrito', { cart: cartData });
  } catch (error) {
    console.error('❌ Error al renderizar carrito:', error);
    res.status(500).send('Error al cargar el carrito');
  }
};

/**
 * Obtener el carrito del usuario (API) - DESPROTEGIDA para localStorage
 */
exports.obtenerCarrito = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    
    // Si no hay usuario, devolver carrito vacío (localStorage maneja los datos)
    if (!userId) {
      return res.status(200).json({ 
        items: [], 
        subtotal: 0, 
        iva: 0, 
        total: 0,
        mensaje: 'Carrito manejado por localStorage' 
      });
    }

  const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      return res.status(200).json({
        items: [],
        subtotal: 0,
        iva: 0,
        total: 0,
        itemCount: 0
      });
    }

    // Filtrar items válidos
    const validItems = cart.items.filter(item => {
      if (item.product === null) {
        return false;
      }
      
      // Verificar que price y quantity sean números válidos
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      
      if (isNaN(price) || isNaN(quantity) || price < 0 || quantity <= 0) {
        return false;
      }
      
      return true;
    });
    
    // Si hay items inválidos, limpiar y recalcular
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      cart.recalculateTotals();
      await cart.save();
    }

    // Preparar respuesta con números válidos
    const response = {
      items: cart.items,
      subtotal: Number(cart.subtotal) || 0,
      iva: Number(cart.iva) || 0,
      total: Number(cart.total) || 0,
      itemCount: cart.items.reduce((sum, item) => sum + Number(item.quantity), 0)
    };

  res.status(200).json(response);
  } catch (error) {
    console.error('❌ API: Error al obtener carrito:', error);
    res.status(500).json({ mensaje: 'Error al obtener el carrito', error: error.message });
  }
};

/**
 * Agregar producto al carrito - DESPROTEGIDA para localStorage
 */
exports.agregarAlCarrito = async (req, res) => {
  
  
  try {
    const userId = req.session?.user?.id || req.user?.id;
    
    
    // Si no hay usuario, devolver respuesta para localStorage
    if (!userId) {
      return res.status(200).json({ 
        mensaje: 'Operación manejada por localStorage en el frontend',
        localStorage: true 
      });
    }
    const { productId, quantity = 1 } = req.body;
    // Verificar que el producto existe
    const producto = await Producto.findById(productId);
    
    
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    

    // Verificar stock disponible
    if (producto.stock < quantity) {
      return res.status(400).json({ 
        mensaje: 'Stock insuficiente', 
        stockDisponible: producto.stock 
      });
    }

  // Buscar o crear carrito
  let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );

    

    if (existingItemIndex > -1) {
      // Verificar que la cantidad total no exceda el stock
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      if (newQuantity > producto.stock) {
        return res.status(400).json({ 
          mensaje: 'La cantidad total excede el stock disponible',
          stockDisponible: producto.stock,
          cantidadEnCarrito: cart.items[existingItemIndex].quantity
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
      
    } else {
      // Agregar nuevo item
      const newItem = {
        product: productId,
        quantity: parseInt(quantity),
        price: producto.precio
      };
      cart.items.push(newItem);
      
    }

    await cart.save();
    
    // Obtener carrito actualizado con productos populados
    const updatedCart = await Cart.findOne({ user: userId }).populate('items.product');
    const itemCount = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
    const response = {
      mensaje: 'Producto agregado al carrito',
      cart: updatedCart,
      itemCount: itemCount
    };
    res.status(200).json(response);
    
  } catch (error) {
    console.error('💥 ERROR COMPLETO:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error message:', error.message);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
  
  
};

/**
 * Actualizar cantidad de un producto en el carrito
 */
exports.actualizarCantidad = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({ mensaje: 'La cantidad no puede ser negativa' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ mensaje: 'Carrito no encontrado' });
    }

    // Verificar stock si la cantidad es mayor a 0
    if (quantity > 0) {
      const producto = await Producto.findById(productId);
      if (!producto) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
      }
      
      if (quantity > producto.stock) {
        return res.status(400).json({ 
          mensaje: 'Stock insuficiente', 
          stockDisponible: producto.stock 
        });
      }
    }

    // Actualizar cantidad (elimina si es 0)
    cart.updateItemQuantity(productId, quantity);
    await cart.save();

    // Obtener carrito actualizado
    const updatedCart = await Cart.findOne({ user: userId }).populate('items.product');
    
    res.status(200).json({
      mensaje: quantity === 0 ? 'Producto eliminado del carrito' : 'Cantidad actualizada',
      cart: updatedCart,
      itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    res.status(500).json({ mensaje: 'Error al actualizar cantidad', error: error.message });
  }
};

/**
 * Eliminar producto del carrito
 */
exports.eliminarDelCarrito = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ mensaje: 'Carrito no encontrado' });
    }

    cart.removeItem(productId);
    await cart.save();

    const updatedCart = await Cart.findOne({ user: userId }).populate('items.product');
    
    res.status(200).json({
      mensaje: 'Producto eliminado del carrito',
      cart: updatedCart,
      itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ mensaje: 'Error al eliminar producto del carrito', error: error.message });
  }
};

/**
 * Limpiar todo el carrito
 */
exports.limpiarCarrito = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ mensaje: 'Carrito no encontrado' });
    }

    cart.clearCart();
    await cart.save();

    res.status(200).json({
      mensaje: 'Carrito limpiado',
      cart: { items: [], subtotal: 0, iva: 0, total: 0 },
      itemCount: 0
    });
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
    res.status(500).json({ mensaje: 'Error al limpiar el carrito', error: error.message });
  }
};

/**
 * Procesar pago del carrito (redirige a Mercado Pago)
 */
exports.procesarPago = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ mensaje: 'El carrito está vacío' });
    }

    // Verificar stock de todos los productos antes del pago
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({ 
          mensaje: `Stock insuficiente para ${item.product.nombre}`,
          producto: item.product.nombre,
          stockDisponible: item.product.stock,
          cantidadSolicitada: item.quantity
        });
      }
    }

    // Redirigir al proceso de creación de preferencia en Mercado Pago
    res.status(200).json({
      mensaje: 'Redirigiendo a Mercado Pago',
      redirectToMercadoPago: true,
      total: cart.total
    });
  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({ mensaje: 'Error al procesar el pago', error: error.message });
  }
};

/**
 * Contar items en el carrito del usuario - DESPROTEGIDA para localStorage
 */
exports.contarItems = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    
    // Si no hay usuario, devolver 0 (localStorage maneja el conteo)
    if (!userId) {
      return res.status(200).json({ 
        itemCount: 0,
        mensaje: 'Conteo manejado por localStorage' 
      });
    }

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(200).json({ itemCount: 0 });
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    res.status(200).json({ itemCount });
  } catch (error) {
    console.error('Error al contar items del carrito:', error);
    res.status(500).json({ mensaje: 'Error al contar items del carrito', error: error.message });
  }
};

/**
 * NUEVA FUNCIÓN: Checkout desde localStorage (requiere autenticación)
 * Crea preferencia de Mercado Pago para el pago
 */
exports.checkoutLocalStorage = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const { items, subtotal, iva, total } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ mensaje: 'No hay productos en el carrito' });
    }

    console.log('💳 Procesando checkout localStorage para usuario:', userId);
    console.log('🛒 Items recibidos:', items.length);

    // Verificar stock de todos los productos
    const productDetails = [];

    for (const item of items) {
      const producto = await Producto.findById(item.productId);
      
      if (!producto) {
        return res.status(400).json({ 
          mensaje: `Producto no encontrado: ${item.productId}` 
        });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ 
          mensaje: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}` 
        });
      }

      productDetails.push({
        id: producto._id.toString(),
        nombre: producto.nombre,
        descripcion: producto.descripcion || 'Producto PetMarket',
        imagen: producto.imagen || '',
        categoria: producto.categoria,
        precio: producto.precio,
        cantidad: item.cantidad,
        subtotal: producto.precio * item.cantidad
      });
    }

    // Obtener datos del usuario
    const Cliente = require('../models/cliente.model');
    const usuario = await Cliente.findById(userId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Crear items para Mercado Pago
    const mpItems = productDetails.map(item => ({
      id: item.id,
      title: item.nombre,
      description: item.descripcion,
      picture_url: item.imagen,
      category_id: item.categoria,
      quantity: item.cantidad,
      unit_price: parseFloat(item.precio),
      currency_id: 'COP'
    }));

    // Crear preferencia de Mercado Pago
    const { MercadoPagoConfig, Preference } = require('mercadopago');
    
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-4753465907432673-093012-6a41fd026329faee121a3570c2a47a6a-516025911'
    });

    const preferenceData = {
      items: mpItems,
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/pending`
      },
      notification_url: `${process.env.BASE_URL || 'http://localhost:3191'}/mercadopago/webhook`,
      external_reference: `LSCART-${userId}-${Date.now()}`,
      metadata: {
        user_id: userId,
        cart_type: 'localStorage',
        items: JSON.stringify(productDetails.map(item => ({
          productId: item.id,
          cantidad: item.cantidad,
          precio: item.precio
        })))
      }
    };

    console.log('🛒 Creando preferencia de Mercado Pago para checkout localStorage');
    console.log('📦 Items para MP:', mpItems.length);
    console.log('💰 Total:', total);

    const preference = new Preference(client);
    const response = await preference.create({ body: preferenceData });

    console.log('✅ Preferencia creada exitosamente:', response.id);
    console.log('� URL de pago:', response.init_point);

    // Responder con la URL de Mercado Pago
    res.status(200).json({
      mensaje: 'Preferencia de pago creada exitosamente',
      preferenceId: response.id,
      redirectUrl: response.init_point, // URL de Mercado Pago
      total: total,
      itemsCount: items.length
    });

  } catch (error) {
    console.error('❌ Error en checkout localStorage:', error);
    res.status(500).json({ 
      mensaje: 'Error al procesar el pago', 
      error: error.message 
    });
  }
};
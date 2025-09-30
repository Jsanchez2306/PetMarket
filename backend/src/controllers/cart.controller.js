const Cart = require('../models/cart.model');
const Producto = require('../models/producto.model');

/**
 * Renderizar la vista del carrito
 */
exports.renderizarCarrito = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.redirect('/login');
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    let cartData = cart || { items: [], subtotal: 0, iva: 0, total: 0 };

    // Filtrar items con productos eliminados (product es null)
    if (cartData.items && cartData.items.length > 0) {
      const validItems = cartData.items.filter(item => item.product !== null);
      
      // Si hay items con productos eliminados, actualizar el carrito
      if (validItems.length !== cartData.items.length) {
        console.log(`🧹 Limpiando ${cartData.items.length - validItems.length} productos eliminados del carrito`);
        cartData.items = validItems;
        
        // Recalcular totales
        cartData.subtotal = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartData.iva = Math.round(cartData.subtotal * 0.19);
        cartData.total = cartData.subtotal + cartData.iva;
        
        // Guardar cambios en la base de datos
        if (cart) {
          cart.items = validItems;
          await cart.save();
        }
      }
    }

    res.render('carrito', { cart: cartData });
  } catch (error) {
    console.error('Error al renderizar carrito:', error);
    res.status(500).send('Error al cargar el carrito');
  }
};

/**
 * Obtener el carrito del usuario (API)
 */
exports.obtenerCarrito = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
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

    // Filtrar items con productos eliminados (product es null)
    const validItems = cart.items.filter(item => item.product !== null);
    
    // Si hay items con productos eliminados, actualizar el carrito
    if (validItems.length !== cart.items.length) {
      console.log(`🧹 Limpiando ${cart.items.length - validItems.length} productos eliminados del carrito API`);
      cart.items = validItems;
      
      // Recalcular totales
      cart.subtotal = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cart.iva = Math.round(cart.subtotal * 0.19);
      cart.total = cart.subtotal + cart.iva;
      
      await cart.save();
    }

    res.status(200).json({
      ...cart.toObject(),
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ mensaje: 'Error al obtener el carrito', error: error.message });
  }
};

/**
 * Agregar producto al carrito
 */
exports.agregarAlCarrito = async (req, res) => {
  console.log('🛒 === INICIO AGREGAR AL CARRITO ===');
  
  try {
    console.log('🔍 Verificando usuario...');
    console.log('Session completa:', JSON.stringify(req.session, null, 2));
    console.log('User from middleware:', req.user);
    
    const userId = req.session?.user?.id || req.user?.id;
    console.log('UserId extraído:', userId);
    
    if (!userId) {
      console.log('❌ Usuario no autenticado - userId es:', userId);
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const { productId, quantity = 1 } = req.body;
    console.log('📦 Datos del request:', { productId, quantity });

    console.log('🔍 Buscando producto en BD...');
    // Verificar que el producto existe
    const producto = await Producto.findById(productId);
    console.log('Producto encontrado:', producto ? 'SÍ' : 'NO');
    
    if (!producto) {
      console.log('❌ Producto no encontrado en BD:', productId);
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    console.log('✅ Producto:', { 
      id: producto._id, 
      nombre: producto.nombre, 
      stock: producto.stock, 
      precio: producto.precio 
    });

    // Verificar stock disponible
    if (producto.stock < quantity) {
      console.log('❌ Stock insuficiente:', { disponible: producto.stock, solicitado: quantity });
      return res.status(400).json({ 
        mensaje: 'Stock insuficiente', 
        stockDisponible: producto.stock 
      });
    }

    console.log('🔍 Buscando carrito existente...');
    // Buscar o crear carrito
    let cart = await Cart.findOne({ user: userId });
    console.log('Carrito existente:', cart ? 'SÍ' : 'NO');
    
    if (!cart) {
      console.log('🆕 Creando nuevo carrito...');
      cart = new Cart({ user: userId, items: [] });
      console.log('Nuevo carrito creado:', cart);
    }

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );

    console.log('Producto ya en carrito:', existingItemIndex > -1 ? 'SÍ' : 'NO');

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
      console.log('📝 Cantidad actualizada a:', newQuantity);
    } else {
      // Agregar nuevo item
      const newItem = {
        product: productId,
        quantity: parseInt(quantity),
        price: producto.precio
      };
      cart.items.push(newItem);
      console.log('➕ Nuevo item agregado:', newItem);
    }

    console.log('💾 Guardando carrito...');
    await cart.save();
    console.log('✅ Carrito guardado');
    
    console.log('🔍 Obteniendo carrito actualizado...');
    // Obtener carrito actualizado con productos populados
    const updatedCart = await Cart.findOne({ user: userId }).populate('items.product');
    console.log('Carrito actualizado obtenido:', !!updatedCart);
    
    const itemCount = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
    console.log('Total de items en carrito:', itemCount);
    
    const response = {
      mensaje: 'Producto agregado al carrito',
      cart: updatedCart,
      itemCount: itemCount
    };
    
    console.log('✅ Enviando respuesta exitosa');
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
  
  console.log('🛒 === FIN AGREGAR AL CARRITO ===');
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
 * Contar items en el carrito del usuario
 */
exports.contarItems = async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
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
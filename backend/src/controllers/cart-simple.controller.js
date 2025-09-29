const Cart = require('../models/cart.model');
const Producto = require('../models/producto.model');

/**
 * Renderizar la vista del carrito
 */
exports.renderizarCarrito = async (req, res) => {
  try {
    console.log('🛒 === RENDERIZAR CARRITO ===');
    console.log('Session user:', req.session.user);
    console.log('JWT user:', req.user);
    
    const userId = req.session.user?.id || req.user?.id;
    console.log('User ID encontrado:', userId);
    
    if (!userId) {
      console.log('❌ No hay userId, redirigiendo a home');
      return res.redirect('/');
    }

    console.log('🔍 Buscando carrito para usuario:', userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    console.log('Carrito encontrado:', cart);
    
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

    console.log('Datos del carrito a renderizar:', cartData);

    res.render('carrito', { cart: cartData });
  } catch (error) {
    console.error('💥 Error al renderizar carrito:', error);
    res.status(500).send('Error al cargar el carrito');
  }
};

/**
 * Obtener el carrito del usuario (API)
 */
exports.obtenerCarrito = async (req, res) => {
  try {
    console.log('🛒 === OBTENER CARRITO API ===');
    console.log('Session user:', req.session.user);
    console.log('JWT user:', req.user);
    
    const userId = req.session.user?.id || req.user?.id;
    console.log('User ID encontrado:', userId);
    
    if (!userId) {
      console.log('❌ Usuario no autenticado');
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    console.log('🔍 Buscando carrito para usuario:', userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    console.log('Carrito encontrado:', cart);
    
    if (!cart) {
      console.log('📪 No hay carrito, devolviendo carrito vacío');
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

    const response = {
      ...cart.toObject(),
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    };
    
    console.log('📤 Enviando respuesta:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('💥 Error al obtener carrito:', error);
    res.status(500).json({ mensaje: 'Error al obtener el carrito', error: error.message });
  }
};

/**
 * Agregar producto al carrito
 */
exports.agregarAlCarrito = async (req, res) => {
  try {
    console.log('🛒 === AGREGAR AL CARRITO ===');
    console.log('🛒 El middleware de autenticación pasó correctamente');
    console.log('Body recibido:', req.body);
    console.log('Session user:', req.session.user);
    console.log('JWT user:', req.user);
    
    const userId = req.session.user?.id || req.user?.id;
    console.log('User ID encontrado:', userId);
    
    if (!userId) {
      console.log('❌ Usuario no autenticado');
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const { productId, quantity = 1 } = req.body;
    console.log('Producto a agregar:', productId, 'Cantidad:', quantity);

    // Verificar que el producto existe
    console.log('🔍 Verificando producto...');
    const producto = await Producto.findById(productId);
    console.log('Producto encontrado:', producto);
    
    if (!producto) {
      console.log('❌ Producto no encontrado');
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Verificar stock disponible
    if (producto.stock < quantity) {
      console.log('❌ Stock insuficiente:', producto.stock, '<', quantity);
      return res.status(400).json({ 
        mensaje: 'Stock insuficiente', 
        stockDisponible: producto.stock 
      });
    }

    // Buscar o crear carrito
    console.log('🔍 Buscando carrito existente...');
    let cart = await Cart.findOne({ user: userId });
    console.log('Carrito existente:', cart);
    
    if (!cart) {
      console.log('📦 Creando nuevo carrito...');
      cart = new Cart({ user: userId, items: [] });
    }

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );
    console.log('Índice de producto existente:', existingItemIndex);

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      console.log('Actualizando cantidad:', cart.items[existingItemIndex].quantity, '+', quantity, '=', newQuantity);
      
      if (newQuantity > producto.stock) {
        console.log('❌ La cantidad total excede el stock');
        return res.status(400).json({ 
          mensaje: 'La cantidad total excede el stock disponible',
          stockDisponible: producto.stock,
          cantidadEnCarrito: cart.items[existingItemIndex].quantity
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      console.log('➕ Agregando nuevo producto al carrito');
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity),
        price: producto.precio
      });
    }

    console.log('💾 Guardando carrito...');
    await cart.save();
    console.log('✅ Carrito guardado');
    
    console.log('🔍 Obteniendo carrito actualizado...');
    const updatedCart = await Cart.findOne({ user: userId }).populate('items.product');
    console.log('Carrito actualizado:', updatedCart);
    
    const response = {
      mensaje: 'Producto agregado al carrito',
      cart: updatedCart,
      itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
    };
    
    console.log('📤 Enviando respuesta:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('💥 Error al agregar al carrito:', error);
    res.status(500).json({ mensaje: 'Error al agregar producto al carrito', error: error.message });
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

    cart.updateItemQuantity(productId, quantity);
    await cart.save();

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
 * Procesar pago del carrito
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

    // Verificar stock de todos los productos
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

    // Crear factura
    const facturaData = {
      cliente: userId,
      productos: cart.items.map(item => ({
        producto: item.product._id,
        cantidad: item.quantity,
        precio: item.price,
        subtotal: item.price * item.quantity
      })),
      subtotal: cart.subtotal,
      iva: cart.iva,
      total: cart.total,
      fecha: new Date(),
      estado: 'pagada'
    };

    // Actualizar stock de productos
    for (const item of cart.items) {
      await Producto.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Limpiar carrito
    cart.clearCart();
    await cart.save();

    res.status(200).json({
      mensaje: 'Pago procesado exitosamente',
      factura: facturaData,
      numeroOrden: `ORD-${Date.now()}`
    });
  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({ mensaje: 'Error al procesar el pago', error: error.message });
  }
};
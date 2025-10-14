const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  _id: false // No necesitamos _id para subdocumentos
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
    unique: true // Un carrito por usuario
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  iva: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware para calcular totales antes de guardar
cartSchema.pre('save', function(next) {
  // Calcular subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  
  // Calcular IVA redondeado (19%)
  this.iva = Math.round(this.subtotal * 0.19);
  
  // Calcular total
  this.total = this.subtotal + this.iva;
  
  
  
  next();
});

// Método para agregar item al carrito
cartSchema.methods.addItem = function(productId, quantity, price) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    // Si el producto ya existe, actualizar cantidad
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Si no existe, agregar nuevo item
    this.items.push({
      product: productId,
      quantity: quantity,
      price: price
    });
  }
};

// Método para actualizar cantidad de un item
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const itemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      // Si la cantidad es 0 o menor, eliminar el item
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = quantity;
    }
  }
};

// Método para eliminar item del carrito
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.product.toString() !== productId.toString()
  );
};

// Método para limpiar el carrito
cartSchema.methods.clearCart = function() {
  this.items = [];
};

// Método para recalcular totales manualmente
cartSchema.methods.recalculateTotals = function() {
  // Filtrar items válidos (con precio y cantidad válidos)
  const validItems = this.items.filter(item => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    return !isNaN(price) && !isNaN(quantity) && price >= 0 && quantity > 0;
  });

  // Recalcular subtotal
  this.subtotal = validItems.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  
  // Calcular IVA redondeado (19%)
  this.iva = Math.round(this.subtotal * 0.19);
  
  // Calcular total
  this.total = this.subtotal + this.iva;
  
  
  
  return {
    subtotal: this.subtotal,
    iva: this.iva,
    total: this.total,
    validItems: validItems.length
  };
};

module.exports = mongoose.model('Cart', cartSchema);
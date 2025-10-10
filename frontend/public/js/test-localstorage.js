// Script de prueba para localStorage del carrito
// Para ejecutar en la consola del navegador

function testLocalStorageCart() {
    console.log('🧪 Iniciando prueba del carrito localStorage');
    
    // Limpiar carrito existente
    localStorage.removeItem('petmarket_cart');
    
    // Producto de prueba
    const productoTest = {
        productId: 'test123',
        nombre: 'Producto de Prueba',
        precio: 25000,
        imagen: '/Imagenes/product-placeholder.svg',
        cantidad: 1,
        stock: 10,
        addedAt: new Date().toISOString()
    };
    
    // Agregar producto
    const cart = [];
    cart.push(productoTest);
    localStorage.setItem('petmarket_cart', JSON.stringify(cart));
    
    // Verificar que se guardó
    const savedCart = JSON.parse(localStorage.getItem('petmarket_cart') || '[]');
    console.log('✅ Carrito guardado:', savedCart);
    
    // Actualizar contador si existe
    if (window.headerUnificado) {
        window.headerUnificado.loadCartCountFromLocalStorage();
        console.log('✅ Contador actualizado');
    }
    
    return savedCart;
}

// Función para agregar producto específico (usar con ID real)
function agregarProductoReal(productoId, nombre, precio, imagen, stock) {
    try {
        const cart = JSON.parse(localStorage.getItem('petmarket_cart') || '[]');
        const existingItemIndex = cart.findIndex(item => item.productId === productoId);
        
        if (existingItemIndex >= 0) {
            cart[existingItemIndex].cantidad += 1;
        } else {
            cart.push({
                productId: productoId,
                nombre: nombre,
                precio: precio,
                imagen: imagen,
                cantidad: 1,
                stock: stock,
                addedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('petmarket_cart', JSON.stringify(cart));
        
        if (window.headerUnificado) {
            window.headerUnificado.loadCartCountFromLocalStorage();
        }
        
        console.log('✅ Producto agregado:', { productoId, nombre });
        return true;
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// Ejecutar prueba automáticamente
testLocalStorageCart();
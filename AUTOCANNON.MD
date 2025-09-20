# Autocannon Tests - PetMarket

Documento con comandos Autocannon para realizar pruebas de rendimiento y estrés en todos los endpoints del proyecto PetMarket.

## 📋 Índice

- [Instalación](#instalación)
- [Configuración Base](#configuración-base)
- [Tests de Index Routes](#tests-de-index-routes)
- [Tests de Auth Routes](#tests-de-auth-routes)
- [Tests de Productos Routes](#tests-de-productos-routes)
- [Tests de Cart Routes](#tests-de-cart-routes)
- [Tests de Estrés](#tests-de-estrés)
- [Scripts de Automatización](#scripts-de-automatización)

## 🚀 Instalación

```bash
# Instalar Autocannon globalmente
npm install -g autocannon

# O instalar localmente en el proyecto
npm install autocannon --save-dev
```

## ⚙️ Configuración Base

**URL Base del servidor:** `http://localhost:3191`
**Criterios de evaluación:**
- ✅ **Excelente:** >100 req/s, <50ms latencia, 0% errores
- 🟡 **Bueno:** 50-100 req/s, 50-100ms latencia, <1% errores
- 🟠 **Aceptable:** 20-50 req/s, 100-300ms latencia, 1-5% errores
- 🔴 **Problemático:** <20 req/s, >300ms latencia, >5% errores

---

## 🏠 Tests de Index Routes

### Test 1: Homepage
```bash
# Prueba básica
autocannon -c 5 -d 10 http://localhost:3191/

# Prueba de estrés
autocannon -c 20 -d 15 http://localhost:3191/

# Con output JSON
autocannon -c 5 -d 10 -j http://localhost:3191/ > homepage-results.json
```

### Test 2: Catálogo de Productos
```bash
# Prueba básica
autocannon -c 5 -d 10 http://localhost:3191/productos/catalogo

# Prueba intensiva
autocannon -c 15 -d 12 http://localhost:3191/productos/catalogo

# Con JSON output
autocannon -c 5 -d 10 -j http://localhost:3191/productos/catalogo > catalogo-results.json
```

### Test 3: Página Nosotros
```bash
# Prueba básica
autocannon -c 5 -d 10 http://localhost:3191/nosotros

# Prueba de carga
autocannon -c 10 -d 8 http://localhost:3191/nosotros
```

### Test 4: Página de Restricción
```bash
# Prueba básica
autocannon -c 5 -d 10 http://localhost:3191/restriccion

# Prueba rápida
autocannon -c 3 -d 5 http://localhost:3191/restriccion
```

---

## 🔐 Tests de Auth Routes

### Test 5: Verificar Autenticación
```bash
# Prueba básica
autocannon -c 5 -d 10 http://localhost:3191/auth/verify

# Prueba de estrés
autocannon -c 15 -d 12 http://localhost:3191/auth/verify

# Con JSON output
autocannon -c 5 -d 10 -j http://localhost:3191/auth/verify > auth-verify-results.json
```

### Test 6: Login (POST)
```bash
# Prueba básica de login
autocannon -c 5 -d 10 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"email":"test@petmarket.com","password":"test123"}' \
  http://localhost:3191/auth/login

# Prueba de estrés para login
autocannon -c 10 -d 8 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"email":"test@petmarket.com","password":"test123"}' \
  http://localhost:3191/auth/login

# Con JSON output
autocannon -c 3 -d 5 -m POST -j \
  -H 'Content-Type: application/json' \
  -b '{"email":"test@petmarket.com","password":"test123"}' \
  http://localhost:3191/auth/login > login-results.json
```

### Test 7: Registro (POST)
```bash
# Prueba básica de registro (cuidado con spam en DB)
autocannon -c 3 -d 5 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"nombre":"TestUser","email":"test@test.com","password":"123456","rol":"cliente"}' \
  http://localhost:3191/auth/registro

# Registro con email único por timestamp
autocannon -c 2 -d 3 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"nombre":"AutoTest","email":"autotest@test.com","password":"123456","rol":"cliente"}' \
  http://localhost:3191/auth/registro
```

### Test 8: Recuperar Contraseña (POST)
```bash
# Prueba básica
autocannon -c 3 -d 5 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"email":"test@test.com"}' \
  http://localhost:3191/auth/recuperar-password

# Con JSON output
autocannon -c 2 -d 3 -m POST -j \
  -H 'Content-Type: application/json' \
  -b '{"email":"test@test.com"}' \
  http://localhost:3191/auth/recuperar-password > recuperar-results.json
```

### Test 9: Logout (POST)
```bash
# Prueba básica de logout
autocannon -c 5 -d 8 -m POST http://localhost:3191/auth/logout

# Con JSON output
autocannon -c 3 -d 5 -m POST -j http://localhost:3191/auth/logout > logout-results.json
```

---

## 🛍️ Tests de Productos Routes

### Test 10: Búsqueda de Productos
```bash
# Búsqueda básica
autocannon -c 5 -d 10 "http://localhost:3191/productos/buscar?q=comida"

# Búsqueda por categoría
autocannon -c 5 -d 8 "http://localhost:3191/productos/buscar?categoria=perros"

# Búsqueda compleja
autocannon -c 3 -d 5 "http://localhost:3191/productos/buscar?q=collar&categoria=perros&precio_min=10&precio_max=50"
```

### Test 11: Detalle de Producto
```bash
# Producto específico (reemplazar ID)
autocannon -c 5 -d 10 http://localhost:3191/productos/1

# Con JSON output
autocannon -c 5 -d 10 -j http://localhost:3191/productos/1 > producto-detalle-results.json
```

### Test 12: Productos por Categoría
```bash
# Categoría perros
autocannon -c 5 -d 10 http://localhost:3191/productos/categoria/perros

# Categoría gatos
autocannon -c 5 -d 10 http://localhost:3191/productos/categoria/gatos

# Categoría aves
autocannon -c 3 -d 8 http://localhost:3191/productos/categoria/aves
```

### Test 13: API Productos
```bash
# Lista todos los productos (API)
autocannon -c 5 -d 10 http://localhost:3191/productos/api

# Con filtros
autocannon -c 5 -d 8 "http://localhost:3191/productos/api?categoria=perros&disponible=true"

# Con JSON output
autocannon -c 3 -d 5 -j http://localhost:3191/productos/api > productos-api-results.json
```

---

## 🛒 Tests de Cart Routes

### Test 14: Carrito de Compras (Rutas de Prueba)
```bash
# Ruta de prueba sin autenticación
autocannon -c 5 -d 10 http://localhost:3191/carrito/test

# Prueba agregar al carrito (sin auth)
autocannon -c 3 -d 5 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"productoId":"1","cantidad":2}' \
  http://localhost:3191/carrito/api/agregar-test

# Con JSON output
autocannon -c 3 -d 5 -m POST -j \
  -H 'Content-Type: application/json' \
  -b '{"productoId":"1","cantidad":1}' \
  http://localhost:3191/carrito/api/agregar-test > carrito-test-results.json
```

### Test 15: Carrito con Autenticación (Requiere Token)
```bash
# Obtener carrito (requiere autenticación)
# Nota: Necesitas obtener un token válido primero
autocannon -c 3 -d 5 \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  http://localhost:3191/carrito/api

# Agregar al carrito (con auth)
autocannon -c 2 -d 3 -m POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -b '{"productoId":"1","cantidad":1}' \
  http://localhost:3191/carrito/api/agregar
```

---

## 🔥 Tests de Estrés

### Test 16: Estrés Homepage
```bash
# Estrés alto
autocannon -c 30 -d 20 http://localhost:3191/

# Estrés extremo (cuidado!)
autocannon -c 50 -d 15 http://localhost:3191/

# Con JSON output
autocannon -c 25 -d 10 -j http://localhost:3191/ > stress-homepage-results.json
```

### Test 17: Estrés Auth Verify
```bash
# Estrés medio en verificación
autocannon -c 20 -d 15 http://localhost:3191/auth/verify

# Estrés alto
autocannon -c 35 -d 12 http://localhost:3191/auth/verify
```

### Test 18: Estrés Catálogo
```bash
# Estrés en catálogo
autocannon -c 25 -d 15 http://localhost:3191/productos/catalogo

# Con JSON output
autocannon -c 20 -d 10 -j http://localhost:3191/productos/catalogo > stress-catalogo-results.json
```

### Test 19: Estrés Login
```bash
# Estrés en login
autocannon -c 15 -d 10 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"email":"test@petmarket.com","password":"test123"}' \
  http://localhost:3191/auth/login

# Con JSON output
autocannon -c 10 -d 8 -m POST -j \
  -H 'Content-Type: application/json' \
  -b '{"email":"test@petmarket.com","password":"test123"}' \
  http://localhost:3191/auth/login > stress-login-results.json
```

---

## 🤖 Scripts de Automatización

### Script Bash para Tests Básicos
```bash
#!/bin/bash
# save as: basic-tests.sh

echo "=== TESTS BÁSICOS PETMARKET ==="
echo "Testing Homepage..."
autocannon -c 5 -d 5 -j http://localhost:3191/ > results/homepage.json

echo "Testing Auth Verify..."
autocannon -c 5 -d 5 -j http://localhost:3191/auth/verify > results/auth-verify.json

echo "Testing Catalogo..."
autocannon -c 5 -d 5 -j http://localhost:3191/productos/catalogo > results/catalogo.json

echo "Testing Cart Test..."
autocannon -c 3 -d 3 -j http://localhost:3191/carrito/test > results/cart-test.json

echo "Tests básicos completados. Resultados en /results/"
```

### Script Bash para Tests de Estrés
```bash
#!/bin/bash
# save as: stress-tests.sh

echo "=== TESTS DE ESTRÉS PETMARKET ==="
echo "ADVERTENCIA: Estos tests pueden impactar el rendimiento del servidor"
read -p "¿Continuar? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stress test Homepage..."
    autocannon -c 20 -d 10 -j http://localhost:3191/ > results/stress-homepage.json
    
    echo "Stress test Auth..."
    autocannon -c 15 -d 8 -j http://localhost:3191/auth/verify > results/stress-auth.json
    
    echo "Stress test Catalogo..."
    autocannon -c 18 -d 10 -j http://localhost:3191/productos/catalogo > results/stress-catalogo.json
    
    echo "Tests de estrés completados."
fi
```

### Package.json Scripts
```json
{
  "scripts": {
    "test:performance": "node test-runner.js performance",
    "test:stress": "node test-runner.js stress",
    "test:auth": "node test-runner.js auth",
    "test:index": "node test-runner.js index",
    "test:all": "node test-runner.js all",
    "autocannon:basic": "./basic-tests.sh",
    "autocannon:stress": "./stress-tests.sh"
  }
}
```

---

## 📊 Interpretación de Resultados

### Métricas Importantes
- **Requests/sec:** Número de peticiones por segundo
- **Latency:** Tiempo de respuesta promedio
- **Throughput:** Datos transferidos por segundo
- **Errors:** Número de errores (timeouts, 4xx, 5xx)

### Comandos de Análisis
```bash
# Ver solo el resumen de un archivo JSON
cat results/homepage.json | jq '.requests.average, .latency.average'

# Comparar múltiples resultados
echo "Homepage vs Catalogo:"
echo "Homepage: $(cat results/homepage.json | jq '.requests.average') req/s"
echo "Catalogo: $(cat results/catalogo.json | jq '.requests.average') req/s"
```

---

## 🛠️ Preparación para Tests

### 1. Crear directorio de resultados
```bash
mkdir -p results
```

### 2. Verificar servidor activo
```bash
curl http://localhost:3191/
```

### 3. Ejecutar test simple
```bash
autocannon -c 1 -d 1 http://localhost:3191/
```

---

## ⚠️ Advertencias y Buenas Prácticas

1. **Tests de Registro:** Usar con moderación para evitar spam en la base de datos
2. **Tests de Estrés:** Pueden afectar el rendimiento del servidor, usar con precaución
3. **Autenticación:** Los tests con auth requieren tokens válidos
4. **Base de Datos:** Considerar usar una BD de pruebas para tests intensivos
5. **Monitoreo:** Observar el uso de CPU y memoria durante las pruebas

---

## 📝 Notas Adicionales

- Todos los comandos asumen que el servidor está ejecutándose en `localhost:3191`
- Los resultados JSON se pueden procesar con herramientas como `jq`
- Para pruebas en producción, ajustar las URLs según corresponda
- Considerar implementar rate limiting antes de ejecutar tests de estrés

---

**Creado para PetMarket - Pruebas de Rendimiento y Estrés**
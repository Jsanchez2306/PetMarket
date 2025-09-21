# 🧪 AUTOCANNON - Guía Completa de Pruebas de Rendimiento PetMarket

## 📋 **CONFIGURACIÓN INICIAL**

**Puerto del servidor:** 3191  
**Base URL:** http://localhost:3191

**Tipos de pruebas disponibles:**
- 🟢 **Rendimiento básico**: 5 conexiones, 10 segundos
- 🟡 **Carga media**: 10 conexiones, 15 segundos  
- 🟠 **Estrés**: 20 conexiones, 20 segundos
- 🔴 **Carga extrema**: 50 conexiones, 30 segundos

---

## 🌐 **1. RUTAS DE INDEX (Páginas Públicas)**

### **🏠 Homepage - Página Principal**
```bash
# Rendimiento básico
npx autocannon -c 5 -d 10 http://localhost:3191/

# Carga media
npx autocannon -c 10 -d 15 http://localhost:3191/

# Test de estrés
npx autocannon -c 20 -d 20 http://localhost:3191/

# Carga extrema
npx autocannon -c 50 -d 30 http://localhost:3191/
```

### **🛍️ Catálogo de Productos**
```bash
# Rendimiento básico
npx autocannon -c 5 -d 10 http://localhost:3191/productos/catalogo

# Carga media
npx autocannon -c 10 -d 15 http://localhost:3191/productos/catalogo

# Test de estrés
npx autocannon -c 20 -d 20 http://localhost:3191/productos/catalogo

# Carga extrema
npx autocannon -c 50 -d 30 http://localhost:3191/productos/catalogo
```

### **ℹ️ Página Nosotros**
```bash
# Rendimiento básico
npx autocannon -c 5 -d 10 http://localhost:3191/nosotros

# Carga media
npx autocannon -c 10 -d 15 http://localhost:3191/nosotros

# Test de estrés
npx autocannon -c 20 -d 20 http://localhost:3191/nosotros
```

### **🚫 Página de Restricción**
```bash
# Rendimiento básico
npx autocannon -c 5 -d 10 http://localhost:3191/restriccion

# Test de estrés
npx autocannon -c 15 -d 15 http://localhost:3191/restriccion
```

---

## 🔐 **2. RUTAS DE AUTENTICACIÓN (AUTH)**

### **✅ Verificar Autenticación (GET)**
```bash
# Rendimiento básico
npx autocannon -c 5 -d 10 http://localhost:3191/auth/verify

# Carga media
npx autocannon -c 10 -d 15 http://localhost:3191/auth/verify

# Test de estrés
npx autocannon -c 20 -d 20 http://localhost:3191/auth/verify

# Carga extrema
npx autocannon -c 50 -d 30 http://localhost:3191/auth/verify
```

### **📝 Registro de Usuario (POST)**
```bash
# Rendimiento básico con datos de prueba
npx autocannon -c 5 -d 10 -m POST -H "Content-Type: application/json" -b '{"nombre":"TestUser","email":"test@test.com","password":"123456","rol":"cliente"}' http://localhost:3191/auth/registro

# Carga media
npx autocannon -c 8 -d 12 -m POST -H "Content-Type: application/json" -b '{"nombre":"TestUser","email":"test@test.com","password":"123456","rol":"cliente"}' http://localhost:3191/auth/registro

# Test de estrés (cuidado - puede crear muchos usuarios)
npx autocannon -c 10 -d 10 -m POST -H "Content-Type: application/json" -b '{"nombre":"TestUser","email":"test@test.com","password":"123456","rol":"cliente"}' http://localhost:3191/auth/registro
```

### **🔑 Login de Usuario (POST)**
```bash
# Rendimiento básico
npx autocannon -c 5 -d 10 -m POST -H "Content-Type: application/json" -b '{"email":"admin@petmarket.com","password":"admin123"}' http://localhost:3191/auth/login

# Carga media
npx autocannon -c 10 -d 15 -m POST -H "Content-Type: application/json" -b '{"email":"admin@petmarket.com","password":"admin123"}' http://localhost:3191/auth/login

# Test de estrés
npx autocannon -c 15 -d 20 -m POST -H "Content-Type: application/json" -b '{"email":"admin@petmarket.com","password":"admin123"}' http://localhost:3191/auth/login
```

### **🔄 Recuperar Contraseña (POST)**
```bash
# Rendimiento básico
npx autocannon -c 3 -d 8 -m POST -H "Content-Type: application/json" -b '{"email":"test@test.com"}' http://localhost:3191/auth/recuperar-password

# Carga media
npx autocannon -c 5 -d 10 -m POST -H "Content-Type: application/json" -b '{"email":"test@test.com"}' http://localhost:3191/auth/recuperar-password
```

---

## 🎯 **3. PRUEBAS COMBINADAS Y MIXTAS**

### **🔄 Test de Flujo de Usuario Completo**
```bash
# Simular navegación típica de usuario
npx autocannon -c 5 -d 5 http://localhost:3191/ && \
npx autocannon -c 5 -d 5 http://localhost:3191/productos/catalogo && \
npx autocannon -c 5 -d 5 http://localhost:3191/nosotros
```

### **⚡ Test de Carga Progresiva**
```bash
# Incrementar carga gradualmente
npx autocannon -c 5 -d 10 http://localhost:3191/
npx autocannon -c 10 -d 10 http://localhost:3191/
npx autocannon -c 15 -d 10 http://localhost:3191/
npx autocannon -c 20 -d 10 http://localhost:3191/
```

---

## 📊 **4. PRUEBAS ESPECIALIZADAS**

### **🌡️ Test de Resistencia (Endurance)**
```bash
# Carga sostenida por largo tiempo
npx autocannon -c 8 -d 60 http://localhost:3191/

# Test de resistencia en endpoints críticos
npx autocannon -c 10 -d 45 http://localhost:3191/auth/verify
```

### **💥 Test de Picos de Tráfico (Spike)**
```bash
# Pico súbito de conexiones
npx autocannon -c 100 -d 5 http://localhost:3191/

# Pico en endpoint de autenticación
npx autocannon -c 80 -d 8 http://localhost:3191/auth/verify
```

### **📈 Test de Escalabilidad**
```bash
# Prueba de límites del servidor
npx autocannon -c 200 -d 10 http://localhost:3191/
npx autocannon -c 300 -d 15 http://localhost:3191/
npx autocannon -c 500 -d 20 http://localhost:3191/
```

---

## 🚀 **5. SCRIPTS DE AUTOMATIZACIÓN**

### **Script PowerShell para Batería Completa**
```powershell
# Guardar como: test-completo.ps1

Write-Host "🧪 === INICIANDO BATERÍA DE TESTS PETMARKET ===" -ForegroundColor Green
Write-Host "📅 Fecha: $(Get-Date)" -ForegroundColor Cyan

# Tests básicos de páginas
Write-Host "`n🌐 === TESTS DE PÁGINAS PÚBLICAS ===" -ForegroundColor Yellow
npx autocannon -c 5 -d 10 http://localhost:3191/
Start-Sleep -Seconds 3
npx autocannon -c 5 -d 10 http://localhost:3191/productos/catalogo
Start-Sleep -Seconds 3
npx autocannon -c 5 -d 10 http://localhost:3191/nosotros

# Tests de autenticación
Write-Host "`n🔐 === TESTS DE AUTENTICACIÓN ===" -ForegroundColor Yellow
npx autocannon -c 5 -d 10 http://localhost:3191/auth/verify
Start-Sleep -Seconds 3

# Tests de estrés
Write-Host "`n💥 === TESTS DE ESTRÉS ===" -ForegroundColor Red
npx autocannon -c 20 -d 20 http://localhost:3191/
Start-Sleep -Seconds 5
npx autocannon -c 15 -d 15 http://localhost:3191/auth/verify

Write-Host "`n✅ === BATERÍA COMPLETADA ===" -ForegroundColor Green
```

### **Comando Rápido para Test Express**
```bash
# Test rápido de todos los endpoints GET
npx autocannon -c 3 -d 5 http://localhost:3191/ ; npx autocannon -c 3 -d 5 http://localhost:3191/productos/catalogo ; npx autocannon -c 3 -d 5 http://localhost:3191/auth/verify ; npx autocannon -c 3 -d 5 http://localhost:3191/nosotros
```

---

## 📋 **6. MÉTRICAS IMPORTANTES A MONITOREAR**

### **📊 Indicadores Clave de Rendimiento (KPIs)**
- **Requests/seg**: Debería ser > 100 req/s en condiciones normales
- **Latencia promedio**: < 100ms para buena experiencia
- **Percentil 95**: < 300ms para endpoints críticos
- **Tasa de errores**: < 1% en condiciones normales
- **Throughput**: > 1 MB/s para endpoints con contenido

### **🎯 Umbrales Recomendados**
```
🟢 EXCELENTE:  > 200 req/s, < 50ms latencia
🟡 BUENO:      100-200 req/s, 50-100ms latencia
🟠 ACEPTABLE:  50-100 req/s, 100-300ms latencia
🔴 PROBLEMÁTICO: < 50 req/s, > 300ms latencia
```

---

## ⚠️ **7. CONSIDERACIONES IMPORTANTES**

### **🔒 Seguridad**
- No ejecutar tests de carga en producción
- Limitar tests POST para evitar spam en la base de datos
- Usar datos de prueba, no datos reales

### **🖥️ Recursos del Sistema**
- Monitorear CPU y memoria durante tests
- Verificar conexiones de base de datos
- Revisar logs del servidor

### **📝 Buenas Prácticas**
1. Ejecutar tests en horarios de baja actividad
2. Hacer backup antes de tests intensivos
3. Documentar resultados para comparaciones futuras
4. Graduar la intensidad de las pruebas

---

## 🎮 **8. COMANDOS DE EJECUCIÓN INMEDIATA**

**Copia y pega estos comandos directamente en tu terminal:**

```bash
# Test básico de todos los endpoints principales
npx autocannon -c 5 -d 10 http://localhost:3191/
npx autocannon -c 5 -d 10 http://localhost:3191/productos/catalogo
npx autocannon -c 5 -d 10 http://localhost:3191/auth/verify
npx autocannon -c 5 -d 10 http://localhost:3191/nosotros

# Test de estrés
npx autocannon -c 20 -d 20 http://localhost:3191/
npx autocannon -c 15 -d 15 http://localhost:3191/auth/verify
```

**¡Ahora tienes una guía completa para probar el rendimiento de tu aplicación PetMarket! 🚀**
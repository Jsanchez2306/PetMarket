const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos (CSS, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
  res.render('index'); // tu página principal
});

// 👉 Ruta de restricción
app.get('/restriccion', (req, res) => {
  res.render('restriccion');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

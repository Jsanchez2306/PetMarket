const express = require('express');
const app = express();

app.use(express.json());

app.post('/registro', (req, res) => {
  console.log('Body recibido:', req.body);
  res.json({ recibido: req.body });
});

app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
// index.js
const express = require('express');
const modeloCliente = require('../backend/models/cliente.model')
const app = express();
const PORT = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/assets', express.static('assets'));


require('dotenv').config();
require('../backend/config/conect.js'); 

app.get('/', (req, res) => {
    res.render('indexadmin.ejs');
});

app.get('/comida', (req, res) => {
    res.render('comida.ejs');
});

app.get('/juguetes', (req, res) => {
    res.render('juguetes.ejs');
});


app.get('/accesorios', (req, res) => {
    res.render('accesorios.ejs');
});

app.get('/nosotros', (req, res) => {
    res.render('nosotros.ejs');
});

app.get('/aggempleados', (req, res) => {
    res.render('aggempleados.ejs');
});

app.get('/aggproductos', (req, res) => {
    res.render('aggproductos.ejs');
});

app.get('/gestionClientes', (req, res) => {
    res.render('gestionClientes.ejs');
});

app.get('/nostrosadmin', (req, res) => {
    res.render('nostrosadmin.ejs');
});

app.get('/panel', (req, res) => {
    res.render('panel.ejs');
});

app.get('/perfil', (req, res) => {
    res.render('perfil.ejs');
});

app.get('/indexadmin', (req, res) => {
    res.render('indexadmin.ejs');
});

app.get('/comprarproducto', (req, res) => {
    res.render('comprarproducto.ejs');
});

app.get('/carrito', (req, res) => {
    res.render('carrito.ejs');
});



app.post('/registrarCliente', (req, res) => {

    const datos = req.body;
    let correo = datos.email;
    let contrasena = datos.password;
    let passwordVerify = datos.passwordVerify;
    let check = datos.condiciones;

    const nuevoCliente = new modeloCliente({
        correo: correo,
        contrasena: contrasena,
        fechaRegistro: new Date()
    });

    nuevoCliente.save()
        .then(cliente => {
            console.log('Cliente creado:', cliente);
            res.status(201).json(cliente);
        })
        .catch(err => {
            console.error('Error al crear Cliente:', err);
            res.status(500).json({ error: 'Error al crear Cliente' });
        });
});




app.get('/api/clientes', async (req, res) => {
    try {
        const clientes = await modeloCliente.find();
        res.json(clientes);
        console.log('Clientes obtenidos:', clientes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await Cliente.findByIdAndDelete(req.params.id);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const cliente = await modeloCliente.findByIdAndUpdate(req.params.id, { correo, contrasena }, { new: true });
        res.json(cliente);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });

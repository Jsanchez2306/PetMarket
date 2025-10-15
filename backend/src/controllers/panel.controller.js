const Producto = require('../models/producto.model');
const Cliente = require('../models/cliente.model');
const Empleado = require('../models/empleado.model');

/**
 * Renderizar la vista del panel principal.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página del panel con estadísticas
 * @author codenova
 */
exports.mostrarPanel = async (req, res) => {
    try {
        const cantidadProductos = await Producto.countDocuments();
        const cantidadClientes = await Cliente.countDocuments();
        const cantidadEmpleados = await Empleado.countDocuments();

        // Obtener información del usuario de la sesión
        const usuario = req.session?.user || null;
        const tipoUsuario = usuario?.tipoUsuario || null;
        const esEmpleado = tipoUsuario === 'empleado';
        const esCliente = tipoUsuario === 'cliente';
        const esAdmin = usuario?.rol === 'admin';

        res.render('panel', { 
            cantidadProductos, 
            cantidadClientes, 
            cantidadEmpleados,
            usuario,
            tipoUsuario,
            esEmpleado,
            esCliente,
            esAdmin
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el panel');
    }
};

/**
 * Obtener estadísticas para el panel.
 * @params req, res - solicitud y respuesta HTTP
 * @return Estadísticas de productos, clientes y empleados
 * @author codenova
 */
exports.obtenerEstadisticas = async (req, res) => {
    try {
        console.log('📊 Endpoint /api/estadisticas llamado');
        
        const cantidadProductos = await Producto.countDocuments();
        const cantidadClientes = await Cliente.countDocuments();
        const cantidadEmpleados = await Empleado.countDocuments();

        console.log('📊 Estadísticas obtenidas:', {
            productos: cantidadProductos,
            clientes: cantidadClientes,
            empleados: cantidadEmpleados
        });

        res.json({
            productos: cantidadProductos,
            clientes: cantidadClientes,
            empleados: cantidadEmpleados
        });
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PetMarket API',
            version: '1.0.0',
            description: 'Documentación de la API de PetMarket',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor local',
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Aquí Swagger busca anotaciones
};

const specs = swaggerJSDoc(options);

module.exports = {
    swaggerUi,
    specs,
};

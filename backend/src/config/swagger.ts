import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ProTrack-Auto API',
            version: '1.0.0',
            description:
                'Academic Project Lifecycle Management System — REST API documentation.',
        },
        servers: [
            {
                url: 'http://localhost:5001',
                description: 'Local development server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    // Point at compiled JS files in dist/routes (populated after tsc)
    apis: ['./dist/routes/*.js', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

export const setupSwagger = (app: Express) => {
    // Swagger configuration options
    const options: swaggerJsdoc.Options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'E-Commerce Analytics API',
                version: '1.0.0',
                description: 'API documentation for E-Commerce Analytics Platform',
                contact: {
                    name: 'Your Name',
                    email: 'your.email@example.com'
                }
            },
            servers: [
                {
                    url: process.env.API_URL || 'http://localhost:3000/api'
                }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            },
            security: [
                {
                    bearerAuth: []
                }
            ]
        },
        apis: [
            './src/routes/*.ts',  // Path to route files
            './src/controllers/*.ts',  // Optional: include controller definitions
            './src/models/*.ts'  // Optional: include model definitions
        ]
    };

    // Generate Swagger documentation
    const swaggerDocs = swaggerJsdoc(options);

    // Setup Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { background-color: #333; }',
        customSiteTitle: 'E-Commerce Analytics API Docs'
    }));
};

export default setupSwagger;
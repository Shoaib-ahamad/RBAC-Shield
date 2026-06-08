// src/config/swagger.ts
import { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';

// OpenAPI Specification Configuration
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scalable REST API with RBAC',
      version: '1.0.0',
      description: 'Production-ready REST API with Role-Based Access Control and Task management.',
      contact: {
        name: 'API Support',
        email: 'support@system.com'
      }
    },
    servers: [
      {
        url: `${env.APP_URL}/api/v1`,
        description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Input your Bearer Access Token in the format: Bearer <token>'
        }
      }
    }
  },
  // Paths to files containing OpenAPI annotations
  apis: ['./src/routes/*.ts', './dist/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  // Serve interactive documentation via Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Expose raw JSON spec if needed for external tools
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  const { logger } = require('../utils/logger'); // Avoid circular imports
  logger.info(`📖 API Documentation available at ${env.APP_URL}/api-docs`);
}
export { swaggerSpec };

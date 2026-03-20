import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { openApiSpec } from './openapi.js';

export const swaggerSetup = (app: Express) => {
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
};

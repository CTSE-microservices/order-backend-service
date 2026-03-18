import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import orderRoutes from './api/order/order.routes.js';
import { swaggerSetup } from './api/swagger.js';

dotenv.config({ quiet: true });

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

swaggerSetup(app);

app.use('/api/orders', orderRoutes);

app.use(errorHandler);

export default app;

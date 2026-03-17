import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import cartRoutes from './api/routes/cartRoutes';
import orderRoutes from './api/routes/orderRoutes';
import discountRoutes from './api/routes/discountRoutes';
import { swaggerSetup } from './api/swagger';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

swaggerSetup(app);

app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/discounts', discountRoutes);

app.use(errorHandler);

export default app;

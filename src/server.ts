import app from './app.js';
import { logger } from './utils/logger.js';

const parsedPort = Number(process.env.PORT);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Order Service running on port ${PORT}`);
});

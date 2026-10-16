import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.routes.js';
import config from './config/config.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
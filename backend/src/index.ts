import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { campaignsRouter } from './routes/campaigns';

const app = express();

app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:4201'] }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/campaigns', campaignsRouter);

app.listen(Number(env.port), () => {
  console.log(`Backend running on http://localhost:${env.port}`);
});

// server.ts / app.ts
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { registerHealthRoute } from './routes/health';
import { registerExportPdfRoute } from './routes/exportPdf';

export const createServer = () => {
  const app = express();

  app.use(cors());

  // ⬇️ 용량 상향 (예: 25MB; 필요시 조절)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  app.use(morgan('dev'));

  registerHealthRoute(app);
  registerExportPdfRoute(app);

  app.get('/', (_req, res) => {
    res.json({ message: 'Editor backend is running' });
  });

  // ⬇️ 너무 큰 바디를 깔끔히 413으로 응답
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ message: 'Payload too large' });
    }
    next(err);
  });

  return app;
};

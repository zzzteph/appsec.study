import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api', router);

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// VULN[verbose-errors]: unhandled errors return the message AND stack trace.
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log('shoppy REST + SPA on :' + PORT));

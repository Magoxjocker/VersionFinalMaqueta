import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import encargadoRoutes from './src/routes/encargadoRoutes.js';
import guardiaRoutes from './src/routes/guardiaRoutes.js';
import { ensureAuthenticated } from './src/middlewares/authMiddleware.js';
import { formatDate, formatTime, formatDateTime, stateClass } from './src/helpers/viewHelpers.js';
import { testConnection } from './src/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const MIN_PORT = 3000;
const MAX_PORT = 3010;
const requestedPort = Number(process.env.APP_PORT || process.env.PORT || MIN_PORT);
const START_PORT = Number.isFinite(requestedPort) ? Math.min(Math.max(requestedPort, MIN_PORT), MAX_PORT) : MIN_PORT;

app.disable('x-powered-by');
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'SistemaEventosST_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      sameSite: 'lax',
    },
  })
);

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[REQ] ${req.method} ${req.originalUrl} | rol=${req.session?.user?.rol || 'anon'}`);
  }
  next();
});

app.locals.formatDate = formatDate;
app.locals.formatTime = formatTime;
app.locals.formatDateTime = formatDateTime;
app.locals.stateClass = stateClass;

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

app.use('/', authRoutes);
app.use('/admin', ensureAuthenticated, adminRoutes);
app.use('/encargado', ensureAuthenticated, encargadoRoutes);
app.use('/guardia', ensureAuthenticated, guardiaRoutes);

app.use((req, res) => {
  res.status(404).render('layouts/error', {
    title: 'No encontrado',
    message: 'La pagina solicitada no existe.',
    user: req.session.user || null,
  });
});

app.use((err, req, res, next) => {
  console.error('[server.error]', {
    route: req.originalUrl,
    role: req.session?.user?.rol || 'anon',
    message: err.message,
    stack: err.stack,
  });
  res.status(500).render('layouts/error', {
    title: 'Error interno',
    message: 'No fue posible procesar la solicitud.',
    user: req.session.user || null,
  });
});

function startServer(port, maxPort = MAX_PORT) {
  const server = app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && port < maxPort) {
      console.warn(`Puerto ${port} ocupado. Probando ${port + 1}...`);
      startServer(port + 1, maxPort);
      return;
    }

    console.error('[server.start]', error);
    process.exit(1);
  });
}

async function bootstrap() {
  try {
    await testConnection();
    startServer(START_PORT);
  } catch (error) {
    console.error('[server.bootstrap]', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

bootstrap();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import passport from 'passport';
import session from 'express-session';
import { printStartupStatus } from './service/startupStatus';
import 'colors';
const createError = require('http-errors');

const app = express();

/* =========================
   CORS
   Every frontend app that talks to this API needs its origin allowed, because
   the auth cookies are sent with credentials: 'include'.
========================= */
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',        // userfrontend
  process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001',  // adminvendorfrontend
];

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Passport & Session
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Static folders (uploaded/served assets only - the UI is its own Next.js app)
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);

// Error handling
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(req.app.get('env') === 'development' ? { stack: err.stack } : {}),
  });
});

// Start server, then connect MongoDB and check every outside service (see service/startupStatus.ts)
const port = process.env.PORT || 2556;
const server = app.listen(port as number, '0.0.0.0', () => {
  printStartupStatus(port);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`❌ Server could not start: port ${port} is already in use`.red.bold);
  } else {
    console.log(`❌ Server could not start: ${error.message}`.red.bold);
  }
  process.exit(1);
});

export default app;

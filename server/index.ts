import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import SQLiteStore from "connect-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { WebSocketServer } from 'ws';
import http from 'http';
import { storage } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// MODIFIÉ POUR RENDER: Configuration CORS (monorepo = même domaine)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [/\.onrender\.com$/]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MODIFIÉ POUR RENDER: Configuration du stockage des sessions
const SQLiteStoreSession = SQLiteStore(session);
const sessionDbPath = process.env.RENDER_DISK_PATH 
  ? path.join(process.env.RENDER_DISK_PATH, 'sessions.db')
  : 'data/sessions.db';

const sessionParser = session({
  store: new SQLiteStoreSession({
    db: sessionDbPath,
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
  }
}); 

app.use(sessionParser);

// Configuration de WebSocket
const wss = new WebSocketServer({ server });

// Map pour stocker les connexions WebSocket par userId
const clients = new Map<number, WebSocket>();

wss.on('connection', (ws, req) => {
  // Utiliser le sessionParser pour obtenir la session
  sessionParser(req as any, {} as any, () => {
    const session = (req as any).session;
    if (!session?.userId) {
      ws.close();
      return;
    }

    // Stocker la connexion WebSocket avec l'ID de l'utilisateur
    clients.set(session.userId, ws);

    ws.on('close', () => {
      clients.delete(session.userId);
    });
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server2 = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup vite en développement et servir les fichiers statiques en production
  if (app.get("env") === "development") {
    await setupVite(app, server2);
  } else {
    serveStatic(app);
  }

  // MODIFIÉ POUR RENDER: Servir les fichiers statiques Vue en production (monorepo)
  if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '..', 'client-vue', 'dist');
    
    log(`[Static] Serving from: ${clientDistPath}`);
    app.use(express.static(clientDistPath));
    
    // Route catch-all pour Vue Router (mode history)
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // MODIFIÉ POUR RENDER: Port et host
  const PORT = parseInt(process.env.PORT || '10000', 10);
  
  server2.listen(PORT, '0.0.0.0', () => {
    log(`🚀 Server running on port ${PORT}`);
    log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`💾 Data directory: ${process.env.RENDER_DISK_PATH || 'data/'}`);
  });
})();

// Fonction pour envoyer des notifications aux administrateurs
export const notifyAdmins = async (type: string, data: any) => {
  try {
    // Récupérer tous les administrateurs depuis la base de données
    const admins = await storage.getAdminUsers();
    
    // Envoyer la notification à tous les administrateurs connectés
    admins.forEach(admin => {
      const ws = clients.get(admin.id);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type,
          userRole: 'admin',
          ...data
        }));
      }
    });
  } catch (error) {
    console.error('Error sending WebSocket notification:', error);
  }
};
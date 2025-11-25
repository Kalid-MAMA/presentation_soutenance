import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import SQLiteStore from "connect-sqlite3";
import { join } from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const server = http.createServer(app);

// Configuration CORS
app.use(cors({
  origin: true, // Autoriser toutes les origines en développement
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuration du stockage des sessions
const SQLiteStoreSession = SQLiteStore(session);
const sessionParser = session({
  store: new SQLiteStoreSession({
    db: 'data/sessions.db',
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "localhost",
  }, () => {
    log(`serving on port ${port}`);
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
}

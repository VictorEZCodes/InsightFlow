import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';

const prisma = new PrismaClient();
const app = express();
const server = createServer(app);

const wss = new WebSocketServer({ server });
const clients = new Map();
const activeVisitors = new Map();

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, ws);

  ws.on('close', () => {
    clients.delete(clientId);
  });
});

const broadcast = (data) => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// pageview endpoint with unique visitor tracking
app.post('/api/analytics/:websiteId/pageview', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { visitorId, path, referrer, userAgent } = req.body;

    // check if visitor has already viewed page in the last 24 hours
    const existingView = await prisma.pageView.findFirst({
      where: {
        websiteId,
        visitorId,
        path,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // only create a new pageview if this is a unique view
    if (!existingView) {
      const pageView = await prisma.pageView.create({
        data: {
          websiteId,
          visitorId,
          path,
          referrer,
          userAgent
        }
      });

      // add visitor to active visitors
      activeVisitors.set(visitorId, {
        ...req.body,
        lastSeen: new Date()
      });

      // broadcast to all connected clients
      broadcast({
        type: 'pageview',
        visitorId,
        ...req.body
      });

      // remove inactive visitors after 5 minutes
      setTimeout(() => {
        const visitor = activeVisitors.get(visitorId);
        if (visitor && Date.now() - visitor.lastSeen > 5 * 60 * 1000) {
          activeVisitors.delete(visitorId);
          broadcast({
            type: 'visitor_left',
            visitorId
          });
        }
      }, 5 * 60 * 1000);

      res.json({ success: true, pageView });
    } else {
      res.json({ success: true, message: 'View already recorded' });
    }
  } catch (error) {
    console.error('Error tracking pageview:', error);
    res.status(500).json({ error: 'Failed to track pageview' });
  }
});

// endpoint for when visitors leave
app.post('/api/analytics/:websiteId/leave', (req, res) => {
  const { visitorId } = req.body;
  if (visitorId && activeVisitors.has(visitorId)) {
    activeVisitors.delete(visitorId);
    broadcast({
      type: 'visitor_left',
      visitorId
    });
  }
  res.status(200).end();
});

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
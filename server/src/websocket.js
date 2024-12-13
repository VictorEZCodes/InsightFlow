import { WebSocketServer } from 'ws';
import { createServer } from 'http';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  const clients = new Map();
  const visitors = new Map();

  wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substr(2, 9);
    clients.set(clientId, ws);

    ws.on('close', () => {
      clients.delete(clientId);
    });
  });

  // broadcast to all connected clients
  const broadcast = (data) => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  return {
    notifyPageView: (data) => {
      const visitorId = data.visitorId || Math.random().toString(36).substr(2, 9);
      visitors.set(visitorId, {
        ...data,
        lastSeen: new Date()
      });

      broadcast({
        type: 'pageview',
        visitorId,
        ...data
      });

      // remove visitor after 5 minutes of inactivity
      setTimeout(() => {
        const visitor = visitors.get(visitorId);
        if (visitor && Date.now() - visitor.lastSeen > 5 * 60 * 1000) {
          visitors.delete(visitorId);
          broadcast({
            type: 'visitor_left',
            visitorId
          });
        }
      }, 5 * 60 * 1000);
    }
  };
}
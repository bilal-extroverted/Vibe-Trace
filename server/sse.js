// Server-Sent Events (SSE) Manager
class SSEManager {
  constructor() {
    this.clients = new Set();
  }

  // Handle new client connection
  subscribe(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write('data: {"type":"connected","message":"Connected to VibeTrace Telemetry Stream"}\n\n');
    this.clients.add(res);

    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  // Broadcast an event payload to all connected clients
  broadcast(event) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  // Keep connection alive with periodic comments
  sendHeartbeat() {
    for (const client of this.clients) {
      try {
        client.write(': heartbeat\n\n');
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

module.exports = new SSEManager();

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

// Avvia server HTTP richiesto da Render
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Signaling server attivo');
});

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
  if (clients.length >= 2) {
    ws.send(JSON.stringify({ type: 'error', message: 'Server pieno, solo 2 utenti permessi' }));
    ws.close();
    return;
  }

  clients.push(ws);
  console.log('Client connesso, totale:', clients.length);

  ws.on('message', (message) => {
    const otherClient = clients.find(client => client !== ws);
    if (otherClient && otherClient.readyState === WebSocket.OPEN) {
      otherClient.send(message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnesso');
    clients = clients.filter(client => client !== ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket errore:', err);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Signaling server WebSocket avviato sulla porta ${PORT}`);
});

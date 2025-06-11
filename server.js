const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

// Server HTTP base richiesto da Render
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
    // Assicuriamoci che il messaggio sia una stringa JSON
    let parsed;
    try {
      // message potrebbe essere buffer, lo converto in stringa se serve
      const msgString = (typeof message === 'string') ? message : message.toString();
      parsed = JSON.parse(msgString);
    } catch (e) {
      console.warn('Messaggio non JSON ricevuto, ignoro:', message);
      return;
    }

    // Inoltra il messaggio (serializzato di nuovo) solo all'altro client
    const otherClient = clients.find(client => client !== ws && client.readyState === WebSocket.OPEN);
    if (otherClient) {
      try {
        otherClient.send(JSON.stringify(parsed));
      } catch (e) {
        console.error('Errore invio messaggio all\'altro client:', e);
      }
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

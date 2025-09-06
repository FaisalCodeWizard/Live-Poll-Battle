import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// In-memory room store
// rooms[code] = {
//   code, question, options, createdAt, endsAt,
//   votes: { [name]: 0|1 },
//   counts: [number, number],
//   clients: Map<WebSocket, { name }>, 
//   status: 'active' | 'ended'
// }
const rooms = {};

const QUESTION = 'Cats vs Dogs';
const OPTIONS = ['Cats', 'Dogs'];
const VOTE_DURATION_MS = 60_000;

// Generate 4-letter room codes
function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function now() {
  return Date.now();
}

function makeSnapshot(room) {
  return {
    code: room.code,
    question: room.question,
    options: room.options,
    counts: room.counts,
    voters: Object.keys(room.votes),
    endsAt: room.endsAt,
    status: room.status,
  };
}

function broadcast(room, type, payload) {
  const msg = JSON.stringify({ type, ...payload });
  for (const ws of room.clients.keys()) {
    if (ws.readyState === ws.OPEN) {
      ws.send(msg);
    }
  }
}

function endRoom(room) {
  if (room.status === 'ended') return;
  room.status = 'ended';
  broadcast(room, 'state', { state: makeSnapshot(room) });
}

// Sweep rooms to auto-end after timer
setInterval(() => {
  const t = now();
  for (const code in rooms) {
    const room = rooms[code];
    if (room.status === 'active' && room.endsAt <= t) {
      endRoom(room);
    }
  }
}, 1000);

function createRoom() {
  const code = makeRoomCode();
  const createdAt = now();
  const endsAt = createdAt + VOTE_DURATION_MS;
  rooms[code] = {
    code,
    question: QUESTION,
    options: OPTIONS,
    createdAt,
    endsAt,
    votes: {},
    counts: [0, 0],
    clients: new Map(),
    status: 'active',
  };
  return rooms[code];
}

// Safely parse JSON
function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

wss.on('connection', (ws) => {
  ws.ctx = { room: null, name: null, alive: true };

  ws.on('pong', () => {
    ws.ctx.alive = true;
  });

  ws.on('message', (data) => {
    const msg = safeParse(data);
    if (!msg || typeof msg.type !== 'string') {
      ws.send(JSON.stringify({ type: 'error', message: 'Bad message' }));
      return;
    }

    switch (msg.type) {
      // Create or join room
      case 'hello': {
        let { intent, roomCode, name } = msg;
        name = (name || '').trim();
        if (!name) {
          ws.send(JSON.stringify({ type: 'error', message: 'Name is required' }));
          return;
        }

        let room;
        if (intent === 'create') {
          room = createRoom();
        } else if (intent === 'join') {
          room = rooms[(roomCode || '').toUpperCase()];
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown intent' }));
          return;
        }

        // Check if name already used
        if (Object.prototype.hasOwnProperty.call(room.votes, name)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Name already voted in this room' }));
          return;
        }
        for (const meta of room.clients.values()) {
          if (meta.name === name) {
            ws.send(JSON.stringify({ type: 'error', message: 'Name already in use' }));
            return;
          }
        }

        ws.ctx.room = room;
        ws.ctx.name = name;
        room.clients.set(ws, { name });

        ws.send(JSON.stringify({ type: 'welcome', state: makeSnapshot(room), you: { name } }));
        broadcast(room, 'peer-join', { name });
        break;
      }

      // Handle votes
      case 'vote': {
        const room = ws.ctx.room;
        const name = ws.ctx.name;
        if (!room || !name) {
          ws.send(JSON.stringify({ type: 'error', message: 'Join a room first' }));
          return;
        }
        if (room.status !== 'active' || room.endsAt <= now()) {
          endRoom(room);
          ws.send(JSON.stringify({ type: 'error', message: 'Voting has ended' }));
          return;
        }
        const { choice } = msg;
        if (choice !== 0 && choice !== 1) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid choice' }));
          return;
        }
        if (Object.prototype.hasOwnProperty.call(room.votes, name)) {
          ws.send(JSON.stringify({ type: 'error', message: 'You already voted' }));
          return;
        }

        room.votes[name] = choice;
        room.counts[choice] += 1;

        broadcast(room, 'state', { state: makeSnapshot(room) });
        break;
      }

      // Client requests full state
      case 'get_state': {
        const room = ws.ctx.room;
        if (room) {
          ws.send(JSON.stringify({ type: 'state', state: makeSnapshot(room) }));
        }
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown type: ${msg.type}` }));
    }
  });

  ws.on('close', () => {
    const room = ws.ctx.room;
    if (room) {
      const meta = room.clients.get(ws);
      room.clients.delete(ws);
      if (meta?.name) {
        broadcast(room, 'peer-leave', { name: meta.name });
      }
    }
  });
});

// Keep-alive ping
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.ctx) continue;
    if (!ws.ctx.alive) {
      ws.terminate();
      continue;
    }
    ws.ctx.alive = false;
    try {
      ws.ping();
    } catch {}
  }
}, 15000);

server.listen(PORT, () => {
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
});

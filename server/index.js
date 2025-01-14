import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Store waiting users
const waitingUsers = new Set();
// Store active connections
const activeConnections = new Map();

// Handle random matching
function findMatch(socket) {
  console.log('Finding match for user:', socket.id);
  console.log('Current waiting users:', Array.from(waitingUsers));

  // Remove user from waiting pool if they were there
  waitingUsers.delete(socket.id);

  // Find a random user from the waiting pool
  const waitingArray = Array.from(waitingUsers);
  if (waitingArray.length === 0) {
    // If no one is waiting, add this user to waiting pool
    waitingUsers.add(socket.id);
    console.log('No matches available, added to waiting pool:', socket.id);
    return null;
  }

  // Get random user from waiting pool
  const randomIndex = Math.floor(Math.random() * waitingArray.length);
  const matchedUserId = waitingArray[randomIndex];
  
  // Remove matched user from waiting pool
  waitingUsers.delete(matchedUserId);
  
  // Store the connection
  activeConnections.set(socket.id, matchedUserId);
  activeConnections.set(matchedUserId, socket.id);

  console.log('Match found:', socket.id, '<->', matchedUserId);
  return matchedUserId;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Current connections:', io.engine.clientsCount);

  socket.on('find-match', () => {
    console.log('User looking for match:', socket.id);
    const match = findMatch(socket);
    
    if (match) {
      // Notify both users of the match
      socket.emit('matched', match);
      io.to(match).emit('matched', socket.id);
    }
  });

  socket.on('signal', ({ peerId, signal }) => {
    console.log('Forwarding signal from', socket.id, 'to', peerId);
    io.to(peerId).emit('signal', {
      peerId: socket.id,
      signal: signal
    });
  });

  socket.on('skip', () => {
    console.log('User skipping:', socket.id);
    // Clean up old connection
    const oldPeer = activeConnections.get(socket.id);
    if (oldPeer) {
      activeConnections.delete(socket.id);
      activeConnections.delete(oldPeer);
      io.to(oldPeer).emit('peer-left', socket.id);
    }

    // Find new match
    const match = findMatch(socket);
    if (match) {
      socket.emit('matched', match);
      io.to(match).emit('matched', socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove from waiting pool if they were waiting
    waitingUsers.delete(socket.id);
    
    // Notify peer if they were connected
    const peer = activeConnections.get(socket.id);
    if (peer) {
      io.to(peer).emit('peer-left', socket.id);
      activeConnections.delete(socket.id);
      activeConnections.delete(peer);
    }

    console.log('Remaining connections:', io.engine.clientsCount);
    console.log('Waiting users:', Array.from(waitingUsers));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

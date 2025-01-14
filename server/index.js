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

// Store waiting users with their tags
const waitingUsers = new Map(); // userId -> { tags: string[], roomId: string }
// Store active connections
const activeConnections = new Map();
// Store room information
const rooms = new Map(); // roomId -> { creator: string, joined: string }

// Handle random matching
function findMatch(socket, userTags = []) {
  console.log('Finding match for user:', socket.id, 'with tags:', userTags);
  
  // Remove user from waiting pool if they were there
  waitingUsers.delete(socket.id);

  // Convert waiting users to array for filtering
  const waitingArray = Array.from(waitingUsers.entries());
  
  // Find users with matching tags
  const matchingUsers = waitingArray.filter(([userId, userData]) => {
    // If no tags provided, match with anyone
    if (!userTags.length || !userData.tags?.length) return true;
    const commonTags = userData.tags.filter(tag => userTags.includes(tag));
    return commonTags.length > 0;
  });

  if (matchingUsers.length === 0) {
    // If no matching users are waiting, add this user to waiting pool
    waitingUsers.set(socket.id, { tags: userTags });
    console.log('No matches available, added to waiting pool:', socket.id);
    return null;
  }

  // Get random user from matching users
  const randomIndex = Math.floor(Math.random() * matchingUsers.length);
  const [matchedUserId] = matchingUsers[randomIndex];
  
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

  socket.on('find-match', ({ tags, roomId }) => {
    console.log('User looking for match:', socket.id, 'with tags:', tags, 'roomId:', roomId);
    
    if (roomId) {
      // Create a new room
      rooms.set(roomId, { creator: socket.id });
      waitingUsers.set(socket.id, { tags, roomId });
      console.log('Created new room:', roomId, 'creator:', socket.id);
      
      // Log all current rooms
      console.log('Current rooms:', Array.from(rooms.entries()).map(([id, room]) => ({
        id,
        creator: room.creator,
        joined: room.joined
      })));
    } else {
      const match = findMatch(socket, tags);
      if (match) {
        // Notify both users of the match
        socket.emit('matched', match);
        io.to(match).emit('matched', socket.id);
      }
    }
  });

  socket.on('join-room', ({ roomId }) => {
    console.log('User joining room:', socket.id, 'roomId:', roomId);
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log('Room not found:', roomId);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.joined) {
      console.log('Room already full:', roomId);
      socket.emit('error', { message: 'Room already full' });
      return;
    }

    console.log('Room found:', roomId, 'creator:', room.creator);
    room.joined = socket.id;
    
    // Connect the users
    socket.emit('matched', room.creator);
    io.to(room.creator).emit('matched', socket.id);
    
    console.log('Connected users in room:', roomId, 'creator:', room.creator, 'joiner:', socket.id);
  });

  socket.on('signal', ({ peerId, signal }) => {
    console.log('Forwarding signal from', socket.id, 'to', peerId);
    io.to(peerId).emit('signal', {
      peerId: socket.id,
      signal: signal
    });
  });

  socket.on('skip', ({ tags }) => {
    console.log('User skipping:', socket.id, 'with tags:', tags);
    // Clean up old connection
    const oldPeer = activeConnections.get(socket.id);
    if (oldPeer) {
      io.to(oldPeer).emit('peer-left', socket.id);
    }

    // Find new match
    const match = findMatch(socket, tags);
      activeConnections.delete(socket.id);
      activeConnections.delete(oldPeer);
    // Get user's tags from waiting pool or use empty array
    const userTags = waitingUsers.get(socket.id)?.tags || [];
    const match = findMatch(socket, userTags);
    if (match) {
      socket.emit('matched', match);
      io.to(match).emit('matched', socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.creator === socket.id || room.joined === socket.id) {
        rooms.delete(roomId);
      }
    }
    
    // Remove from waiting pool if they were waiting
    waitingUsers.delete(socket.id);
    console.log('Current waiting users:', Array.from(waitingUsers.entries()));
    
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

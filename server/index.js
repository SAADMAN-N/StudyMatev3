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
  console.log('Current waiting users:', Array.from(waitingUsers.entries()));
  
  // Remove user from waiting pool if they were there
  waitingUsers.delete(socket.id);

  // Convert waiting users to array for filtering
  const waitingArray = Array.from(waitingUsers.entries());
  
  let matchedUserId = null;
  
  // First try to find users with matching tags
  if (userTags.length > 0) {
    const matchingUsers = waitingArray.filter(([userId, userData]) => {
      const userDataTags = userData.tags || [];
      const commonTags = userDataTags.filter(tag => userTags.includes(tag));
      return commonTags.length > 0;
    });

    if (matchingUsers.length > 0) {
      // Get random user from matching users
      const randomIndex = Math.floor(Math.random() * matchingUsers.length);
      [matchedUserId] = matchingUsers[randomIndex];
    }
  }
  
  // If no tag matches found, try to match with any waiting user
  if (!matchedUserId && waitingArray.length > 0) {
    const randomIndex = Math.floor(Math.random() * waitingArray.length);
    [matchedUserId] = waitingArray[randomIndex];
  }

  if (!matchedUserId) {
    // If no matches available, add user to waiting pool
    waitingUsers.set(socket.id, { tags: userTags });
    console.log('No matches available, added to waiting pool:', socket.id);
    return null;
  }

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

  socket.on('find-match', ({ tags }) => {
    console.log('User looking for match:', socket.id, 'with tags:', tags);
    const match = findMatch(socket, tags);
    if (match) {
      // Notify both users of the match
      socket.emit('matched', match);
      io.to(match).emit('matched', socket.id);
    }
  });

  socket.on('join-room', ({ roomId }) => {
    console.log('User joining room:', socket.id, 'roomId:', roomId);
    console.log('Available rooms:', Array.from(rooms.entries()));
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log('Room not found:', roomId);
      console.log('Current rooms:', Array.from(rooms.entries()).map(([id, room]) => ({
        id,
        creator: room.creator,
        joined: room.joined
      })));
      socket.emit('error', { message: 'Room not found or has expired. Please create a new room.' });
      return;
    }
    
    if (room.joined) {
      console.log('Room already full:', roomId);
      console.log('Room details:', {
        creator: room.creator,
        joined: room.joined
      });
      socket.emit('error', { message: 'This room is already full. Please create a new room or try a different room ID.' });
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
    console.log('Signal type:', signal.type);
    console.log('Active connections:', Array.from(activeConnections.entries()));
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
      activeConnections.delete(socket.id);
      activeConnections.delete(oldPeer);
    }

    // Find new match with provided tags
    const match = findMatch(socket, tags);
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

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { WebRTCManager } from './webrtc';
import { toast } from '@/components/ui/use-toast';

export class SignalingService {
  private socket: Socket;
  private webrtcManager: WebRTCManager;
  private onPeerConnectedCallback?: () => void;
  private onPeerDisconnectedCallback?: () => void;
  private joinTimeoutId?: NodeJS.Timeout;

  constructor(webrtcManager: WebRTCManager) {
    this.webrtcManager = webrtcManager;
    
    // In production, force HTTPS
    const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3002' : 'https://studymate-signaling.onrender.com');
    
    console.log('Connecting to signaling server:', SIGNALING_SERVER);
    console.log('Environment:', import.meta.env.MODE);
    console.log('VITE_SIGNALING_SERVER:', import.meta.env.VITE_SIGNALING_SERVER);

    this.socket = io(SIGNALING_SERVER, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Basic connection events
    this.socket.on('connect', () => console.log('Connected to signaling server'));
    this.socket.on('disconnect', () => console.log('Disconnected from signaling server'));
    this.socket.on('connect_error', (error) => console.error('Connection error:', error));

    // Handle peer matching
    this.socket.on('matched', async (peerId: string) => {
      try {
        const peer = await this.webrtcManager.initializePeer(peerId, true);
        peer.on('signal', (signal) => {
          this.socket.emit('signal', { peerId, signal });
        });
        peer.on('connect', () => {
          if (this.onPeerConnectedCallback) {
            this.onPeerConnectedCallback();
          }
        });
      } catch (error) {
        console.error('Failed to initialize peer:', error);
      }
    });

    // Handle signaling
    this.socket.on('signal', async ({ peerId, signal }) => {
      try {
        let connection = this.webrtcManager.getConnection(peerId);
        if (!connection) {
          const peer = await this.webrtcManager.initializePeer(peerId, false);
          peer.on('signal', (signal) => {
            this.socket.emit('signal', { peerId, signal });
          });
          peer.on('connect', () => {
            if (this.onPeerConnectedCallback) {
              this.onPeerConnectedCallback();
            }
          });
        }
        await this.webrtcManager.handleSignal(peerId, signal);
      } catch (error) {
        console.error('Failed to handle signal:', error);
      }
    });

    // Handle peer disconnection
    this.socket.on('peer-left', (peerId: string) => {
      this.webrtcManager.closeConnection(peerId);
      this.onPeerDisconnectedCallback?.();
    });
  }

  public findMatch(tags: string[]) {
    console.log('Looking for a match with tags:', tags);
    console.log('Current socket ID:', this.socket.id);
    console.log('Socket connection status:', this.socket.connected);
    this.socket.emit('find-match', { tags });
  }

  public joinRoom(roomId: string) {
    console.log('Joining room:', roomId);
    console.log('Current socket ID:', this.socket.id);
    console.log('Socket connection status:', this.socket.connected);
    
    // Clear any existing timeouts
    if (this.joinTimeoutId) {
      clearTimeout(this.joinTimeoutId);
    }
    
    // Reset connection state
    const existingConnection = this.webrtcManager.getConnection(roomId);
    if (existingConnection) {
      this.webrtcManager.closeConnection(roomId);
    }
    
    this.socket.emit('join-room', { roomId });
    
    // Add error handler for room joining
    const errorHandler = (error: any) => {
      console.error('Failed to join room:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    };
    
    this.socket.once('error', errorHandler);
    
    // Add timeout to detect if connection is taking too long
    this.joinTimeoutId = setTimeout(() => {
      const connection = this.webrtcManager.getConnection(roomId);
      if (!connection) {
        console.error('Connection timeout - no peer connection established');
        toast({
          title: "Connection Timeout",
          description: "Failed to establish connection. Please try again.",
          variant: "destructive",
        });
        // Clean up the error handler
        this.socket.off('error', errorHandler);
        // Close any partial connections
        this.webrtcManager.closeConnection(roomId);
      }
    }, 15000); // 15 second timeout
  }

  public skipPeer(tags: string[]) {
    console.log('Skipping current peer with tags:', tags);
    this.socket.emit('skip', { tags });
  }

  public disconnect() {
    console.log('Disconnecting from signaling server...');
    if (this.joinTimeoutId) {
      clearTimeout(this.joinTimeoutId);
    }
    this.socket.disconnect();
  }

  public onPeerConnected(callback: (peerId: string) => void) {
    this.onPeerConnectedCallback = () => {
      const connections = Array.from(this.webrtcManager.connections.keys());
      if (connections.length > 0) {
        callback(connections[0]);
      }
    };
  }

  public onPeerDisconnected(callback: () => void) {
    this.onPeerDisconnectedCallback = callback;
  }
}

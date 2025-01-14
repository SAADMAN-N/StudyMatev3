import { io, Socket } from 'socket.io-client';
import { WebRTCManager } from './webrtc';

export class SignalingService {
  private socket: Socket;
  private webrtcManager: WebRTCManager;
  private onPeerConnectedCallback?: () => void;
  private onPeerDisconnectedCallback?: () => void;

  constructor(webrtcManager: WebRTCManager) {
    this.webrtcManager = webrtcManager;
    console.log('Connecting to signaling server...');
    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to signaling server with ID:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Failed to connect to signaling server:', error);
    });

    this.socket.on('matched', async (peerId: string) => {
      console.log('Matched with peer:', peerId);
      try {
        // Initialize peer with correct initiator flag
        const peer = await this.webrtcManager.initializePeer(peerId, true);
        
        peer.on('signal', (signal) => {
          console.log('Sending signal to peer:', peerId, 'signal type:', signal.type);
          this.socket.emit('signal', { peerId, signal });
        });

        peer.on('error', (err) => {
          console.error('WebRTC peer error:', err);
        });

        peer.on('connect', () => {
          console.log('Direct peer connection established with:', peerId);
          this.onPeerConnectedCallback?.();
        });

      } catch (error) {
        console.error('Failed to initialize peer:', error);
      }
    });

    this.socket.on('signal', async ({ peerId, signal }) => {
      console.log('Received signal from peer:', peerId, 'signal type:', signal.type);
      try {
        // If we don't have a peer instance yet, create one as non-initiator
        let connection = this.webrtcManager.getConnection(peerId);
        if (!connection) {
          console.log('Creating new peer as receiver for:', peerId);
          const peer = await this.webrtcManager.initializePeer(peerId, false);
          
          peer.on('signal', (signal) => {
            console.log('Sending signal back to peer:', peerId, 'signal type:', signal.type);
            this.socket.emit('signal', { peerId, signal });
          });

          peer.on('connect', () => {
            console.log('Direct peer connection established with:', peerId);
            this.onPeerConnectedCallback?.();
          });
        }
        
        await this.webrtcManager.handleSignal(peerId, signal);
      } catch (error) {
        console.error('Failed to handle signal:', error);
      }
    });

    this.socket.on('peer-left', (peerId: string) => {
      console.log('Peer left:', peerId);
      this.webrtcManager.closeConnection(peerId);
      this.onPeerDisconnectedCallback?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });
  }

  public findMatch() {
    console.log('Looking for a match...');
    this.socket.emit('find-match');
  }

  public skipPeer() {
    console.log('Skipping current peer...');
    this.socket.emit('skip');
  }

  public disconnect() {
    console.log('Disconnecting from signaling server...');
    this.socket.disconnect();
  }

  public onPeerConnected(callback: () => void) {
    this.onPeerConnectedCallback = callback;
  }

  public onPeerDisconnected(callback: () => void) {
    this.onPeerDisconnectedCallback = callback;
  }
}

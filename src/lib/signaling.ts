import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { WebRTCManager } from './webrtc';

export class SignalingService {
  private socket: Socket;
  private webrtcManager: WebRTCManager;
  private onPeerConnectedCallback?: () => void;
  private onPeerDisconnectedCallback?: () => void;

  constructor(webrtcManager: WebRTCManager) {
    this.webrtcManager = webrtcManager;
    
    const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3002' : 'https://studymate-signaling.onrender.com');
    
    this.socket = io(SIGNALING_SERVER, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => console.log('Connected to signaling server'));
    this.socket.on('disconnect', () => console.log('Disconnected from signaling server'));
    this.socket.on('connect_error', (error) => console.error('Connection error:', error));

    this.socket.on('matched', async (peerId: string) => {
      try {
        console.log('Matched with peer:', peerId);
        const peer = await this.webrtcManager.initializePeer(peerId, true);
        
        peer.on('signal', (signal) => {
          console.log('Sending signal to peer:', signal.type);
          this.socket.emit('signal', { peerId, signal });
        });

        peer.on('connect', () => {
          console.log('Peer connection established');
          if (this.onPeerConnectedCallback) {
            this.onPeerConnectedCallback();
          }
        });
      } catch (error) {
        console.error('Failed to initialize peer:', error);
      }
    });

    this.socket.on('signal', async ({ peerId, signal }) => {
      // Ignore candidate signals if we don't have a connection yet
      if (!this.webrtcManager.getConnection(peerId) && signal.type === undefined) {
        return;
      }
      try {
        console.log('Received signal from peer:', signal.type);
        let connection = this.webrtcManager.getConnection(peerId);
        
        if (!connection) {
          console.log('Creating new peer connection');
          const peer = await this.webrtcManager.initializePeer(peerId, false);
          
          peer.on('signal', (signal) => {
            console.log('Sending signal back:', signal.type);
            this.socket.emit('signal', { peerId, signal });
          });

          peer.on('connect', () => {
            console.log('Peer connection established');
            if (this.onPeerConnectedCallback) {
              this.onPeerConnectedCallback();
            }
          });
        }

        this.webrtcManager.handleSignal(peerId, signal);
      } catch (error) {
        console.error('Failed to handle signal:', error);
      }
    });

    this.socket.on('peer-left', (peerId: string) => {
      console.log('Peer left:', peerId);
      this.webrtcManager.closeConnection(peerId);
      if (this.onPeerDisconnectedCallback) {
        this.onPeerDisconnectedCallback();
      }
    });
  }

  public findMatch(tags: string[]) {
    console.log('Looking for match with tags:', tags);
    this.socket.emit('find-match', { tags });
  }

  public skipPeer(tags: string[]) {
    console.log('Skipping current peer');
    this.socket.emit('skip', { tags });
  }

  public disconnect() {
    console.log('Disconnecting from signaling server');
    this.socket.disconnect();
  }

  public onPeerConnected(callback: () => void) {
    this.onPeerConnectedCallback = callback;
  }

  public onPeerDisconnected(callback: () => void) {
    this.onPeerDisconnectedCallback = callback;
  }
}

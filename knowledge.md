## Project Structure

## Deployment

### Signaling Server (Render.com)
- Deploy server directory as a Node.js service
- Set PORT environment variable to 3001
- Enable CORS for frontend domain

### Frontend (Vercel)
- Environment Variables:
  - VITE_SIGNALING_SERVER: URL of the signaling server
- Build Command: npm run build
- Output Directory: dist

### Local Development
1. Copy .env.example to .env
2. Set VITE_SIGNALING_SERVER to local or deployed signaling server
3. Run server: cd server && npm start
4. Run frontend: npm run dev

```
src/
  components/     # React components
    ui/          # shadcn/ui components
    study-room/  # Study room specific components
      tools/     # Individual study tools
  lib/           # Utility functions and API clients
  types/         # TypeScript type definitions
  stories/       # Storybook stories
```

## Study Room Features

### Video Panel (60% width)
- Video chat interface
- Camera/microphone controls
- User information display
- Theme toggle
- Settings access

### Tools Panel (40% width)
1. Pomodoro Timer
   - Customizable intervals
   - Visual progress
   - Preset configurations

2. Spotify Integration
   - Web Playback SDK
   - Playlist management
   - Playback controls
   - Volume control

3. AI Tutor Chat
   - OpenAI integration
   - Chat interface
   - Study assistance
   - API key management

4. Collaborative Notes
   - Real-time collaboration
   - Rich text editing

## Authentication
- Spotify OAuth
- OpenAI API key management
- Supabase authentication (planned)

## Real-time Collaboration
For collaborative editing features:
- Use wss://y-websocket.fly.dev instead of wss://demos.yjs.dev for more reliable WebSocket connections
- Each collaborative document should have a unique room name to prevent conflicts

## State Management
- React Context for theme
- Local storage for preferences
- Real-time updates for collaboration

## Video Chat Implementation
- Uses WebRTC via simple-peer library for peer-to-peer video calls
- Local media streams are cleaned up on component unmount
- Video/audio tracks can be individually toggled  - When using simple-peer with Vite:
    - Need to polyfill global with globalThis in vite.config.ts
    - Create SimplePeer instance directly without using call
    - Use type assertion for proper TypeScript support
    - Required Node.js polyfills:
      - stream-browserify
      - events
      - inherits
      - readable-stream
      - util (must be aliased as 'util' not 'util/')
- Random matching system similar to Omegle requires:
  - Signaling server for WebRTC handshake
  - Socket.io for real-time communication
  - Peer connection management for video streams
- Requirements for WebRTC:
  - HTTPS or localhost for getUserMedia API
  - Browser support for MediaDevices API (Chrome, Firefox, Safari, Edge supported)
  - Camera and microphone permissions
  - When testing on different devices:
    - Must use HTTPS (not IP addresses)
    - Configure Vite with https: true and host: true
    - Accept self-signed certificates in development
    - For local development:
      - Use localhost instead of IP address
      - Access via http://localhost:5173
      - WebRTC will work on localhost without HTTPS
      - When testing on different devices:
        - Must use HTTPS (not IP addresses)
        - Configure Vite with https: true and host: true
        - Accept self-signed certificates in development
  - STUN/TURN servers for NAT traversal
  - Polyfills needed for older browsers (webkitGetUserMedia, mozGetUserMedia)
  - Must check for secure context and browser compatibility before accessing media devices
  - When handling WebRTC streams:
    - Both peers must handle signal events in both directions
    - Remote stream must be played explicitly with .play()
    - Stream callbacks must be set before peer connection is established
    - Remote video element needs:
      - autoPlay and playsInline attributes
      - muted={false} to hear remote audio
      - Small delay when setting srcObject to ensure ref is mounted
      - Both peers must handle signal events in both directions
      - Remote stream must be played explicitly with .play()
      - Stream callbacks must be set before peer connection is established
      - Remote video element needs:
        - autoPlay and playsInline attributes
        - muted={false} to hear remote audio
        - Small delay when setting srcObject to ensure ref is mounted
      - Both peers must handle signal events in both directions
      - Remote stream must be played explicitly with .play()
      - Stream callbacks must be set before peer connection is established
      - Remote video element needs:
        - autoPlay and playsInline attributes
        - muted={false} to hear remote audio
        - Small delay when setting srcObject to ensure ref is mounted
      - When testing on different browsers:
        - Safari should initiate the connection
        - Both peers must handle signal events in both directions
        - Remote stream must be played explicitly with .play()
        - Handle autoplay restrictions:
          - Call play() after setting srcObject
          - Catch play() promise rejection
          - Provide fallback play button for browsers blocking autoplay
          - Check track states when receiving stream

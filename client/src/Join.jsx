import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './SessionContext';

export default function Join() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('create');
  const navigate = useNavigate();
  const { setSession } = useSession();

  function connect() {
    const ws = new WebSocket(
      process.env.NODE_ENV === "production"
        ? `wss://${window.location.host}`
        : "ws://localhost:4000"
    );
    ws.onopen = () => {
      ws.send(
        JSON.stringify(
          mode === 'create'
            ? { type: 'hello', intent: 'create', name }
            : { type: 'hello', intent: 'join', roomCode, name }
        )
      );
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'welcome') {
        // Save session in context
        setSession({ ws, you: msg.you, state: msg.state });
        navigate('/room');
      } else if (msg.type === 'error') {
        alert(msg.message);
        ws.close();
      }
    };
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '500px' }}>
      <h2 className="mb-4">Join or Create Room</h2>

      <div className="mb-3">
        <label className="form-label">Your Name</label>
        <input
          type="text"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            checked={mode === 'create'}
            onChange={() => setMode('create')}
          />
          <label className="form-check-label">Create Room</label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            checked={mode === 'join'}
            onChange={() => setMode('join')}
          />
          <label className="form-check-label">Join Room</label>
        </div>
      </div>

      {mode === 'join' && (
        <div className="mb-3">
          <label className="form-label">Room Code</label>
          <input
            type="text"
            className="form-control"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
        </div>
      )}

      <button
        className="btn btn-success w-100"
        onClick={connect}
        disabled={!name}
      >
        {mode === 'create' ? 'Create Room' : 'Join Room'}
      </button>
    </div>
  );
}

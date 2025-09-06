import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './SessionContext';

export default function Room() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();

  // Hooks must be declared unconditionally
  const [state, setState] = useState(session ? session.state : null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!session?.ws) return;

    const ws = session.ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'state') setState(msg.state);
      if (msg.type === 'welcome') setState(msg.state);

      if (msg.type === 'peer-join') {
        setMessages((prev) => [...prev, `${msg.name} joined the room`]);
      }
      if (msg.type === 'peer-leave') {
        setMessages((prev) => [...prev, `${msg.name} left the room`]);
      }
      if (msg.type === 'state' && msg.state.status === 'ended') {
        setMessages((prev) => [...prev, `Voting ended`]);
      }
    };
    ws.onclose = () => alert('Connection closed');
  }, [session]);

  if (!session) {
    return (
      <div className="container mt-5 text-center">
        <p>No active session.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }

  const { ws, you } = session;
  const hasVoted = state?.voters?.includes(you.name) ?? false;

  function sendVote(choice) {
    if (hasVoted || state.status !== 'active') return;
    ws.send(JSON.stringify({ type: 'vote', choice }));
  }

  const remaining = state ? Math.max(0, state.endsAt - Date.now()) : 0;
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="container mt-5" style={{ maxWidth: '500px' }}>
      {/* Alerts */}
      {messages.length > 0 && (
        <div className="mb-3">
          {messages.slice(-3).map((m, i) => (
            <div key={i} className="alert alert-info py-2 mb-2">
              {m}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3">Room {state?.code}</h2>
      <p className="mb-4">
        <strong>Question:</strong> {state?.question}
      </p>

      <div className="d-grid gap-3 mb-4">
        {state?.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => sendVote(i)}
            className={`btn btn-lg ${
              hasVoted ? 'btn-secondary' : 'btn-outline-success'
            }`}
            disabled={hasVoted || state.status !== 'active'}
          >
            {opt} ({state.counts[i]})
          </button>
        ))}
      </div>

      <p className="fw-bold">
        {state?.status === 'ended' ? 'Voting ended' : `Time left: ${seconds}s`}
      </p>

      <button
        className="btn btn-link text-danger mt-3"
        onClick={() => {
          ws.close();
          setSession(null);
          navigate('/');
        }}
      >
        Leave Room
      </button>
    </div>
  );
}

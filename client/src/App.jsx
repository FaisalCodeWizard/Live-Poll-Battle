import { Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="d-flex flex-column" style={{ minHeight: '85vh' }}>
      <div className="container text-center mt-5 mb-auto">
        <h3 className="mb-4">Welcome</h3>
        <h1 className="display-4 mb-5">Live Poll Battle</h1>

        <Link to="/join" className="btn btn-outline-success btn-lg">
          Join / Create Room
        </Link>
      </div>

      <footer className="text-center text-muted small">
        Developed by MOHD FAISAL
      </footer>
    </div>
  );
}

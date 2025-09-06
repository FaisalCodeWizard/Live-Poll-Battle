Live Poll Battle

This project is a web application to host and participate in live polls (Cats vs Dogs). Users can create a room, share the code, and vote in real-time.

Frontend

Frontend of this application is made using React.js with Bootstrap for styling.

Steps to run frontend:

cd client

npm install

npm run dev

Open the shown URL (usually http://localhost:5173) in your browser.

Backend

Backend of this application is made using Node.js, Express, and WebSockets (ws package).

Steps to run backend:

cd server

npm install

npm run dev (or npm start)

The WebSocket server will run on ws://localhost:4000

Application Flow

Home Page → Button to join/create a room.

Join/Create Room → User enters a name and either creates a new room (system generates a code) or joins an existing one using a code.

Room Page →

Displays room code, question (Cats vs Dogs), timer (60s), and voting buttons.

Vote counts update instantly across all connected clients.

Bootstrap alerts show when someone joins/leaves or when voting ends.

Voting is disabled after one vote per user or when timer expires.

Data Handling & State Sharing

Room State is stored in-memory on the backend and includes:

code (unique identifier)

question & options

votes (mapping of user → choice)

counts (current tallies)

endsAt (auto-expiry timestamp, 60s)

WebSocket Events:

hello → client requests to create/join a room.

welcome → server sends initial state.

vote → client submits a vote, server updates counts and broadcasts.

state → current room state pushed to all clients.

peer-join / peer-leave → alerts for room activity.

Frontend State:

Session stored in React Context (SessionContext) so it persists across routes.

LocalStorage is used to mark if a user has already voted.

Components update instantly on state broadcasts.

Admin / Special Notes

No database is used — all rooms and votes live in server memory.

Rooms auto-expire when their timer ends.

This is a demo assignment project showcasing real-time WebSocket communication.

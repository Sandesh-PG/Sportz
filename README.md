# Sportz

> A real-time sports match platform for live scores, ball-by-ball
> commentary, match fixtures, and WebSocket-powered updates.

Sportz is a full-stack sports application designed to simulate and
deliver live football and cricket match data in real time. The platform
combines a Node.js/Express backend, PostgreSQL with Drizzle ORM, a
WebSocket layer for real-time communication, and a React/Vite frontend.

## ✨ Features

### Live Match Experience

-   Real-time live scores without page refreshes
-   Live football match updates
-   Live cricket scores with:
    -   Runs and wickets
    -   Overs
    -   Current run rate
    -   Required run rate
    -   Target
    -   Current batters
    -   Current bowler
    -   Last-over breakdown
-   Real-time football commentary
-   Real-time cricket ball-by-ball commentary

### Match Management

-   Live, upcoming, and finished matches
-   Match status derived from match schedule
-   Match-specific detail pages
-   Search and filtering of matches
-   Football and cricket sport filtering

### Real-Time Communication

-   WebSocket-based live updates
-   Global score updates for connected clients
-   Match-specific commentary subscriptions
-   Subscribe / unsubscribe support
-   Automatic UI updates without polling or manual refresh
-   Proper WebSocket cleanup when leaving a match

### Backend Simulation

-   Event-driven match simulator
-   Scheduled event processing
-   Cricket scoring engine
-   Football event processing
-   Catch-up handling when multiple events become due
-   Database-backed match and commentary state

## 🏗️ Architecture

``` text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │    React + Vite     │
                         └──────────┬──────────┘
                                    │
                         REST API + WebSocket
                                    │
                         ┌──────────▼──────────┐
                         │      Express        │
                         │       Server        │
                         └───────┬───────┬──────┘
                                 │       │
                    REST API     │       │ WebSocket
                                 │       │
                    ┌────────────▼─┐   ┌─▼────────────────┐
                    │   Services   │   │   WS Server      │
                    │              │   │ Match Subscribers│
                    └──────┬───────┘   └────────┬─────────┘
                           │                    │
                    ┌──────▼────────────────────▼─────┐
                    │         Live Engine              │
                    │  Event Processing + Publishing  │
                    └────────────────┬─────────────────┘
                                     │
                    ┌────────────────▼─────────────────┐
                    │       PostgreSQL + Drizzle       │
                    │     Matches / Commentary Data    │
                    └──────────────────────────────────┘
```

### Real-Time Event Flow

``` text
Simulator
   │
   ▼
Live Engine
   │
   ▼
Event Processing
   │
   ├── Update match score
   ├── Update commentary
   └── Publish realtime event
           │
           ├── score_update ───────► connected clients
           │
           └── commentary_update ──► subscribed clients
```

## 📁 Project Structure

``` text
sportz/
├── backend/
│   ├── scripts/
│   │   └── generate-data.js
│   ├── src/
│   │   ├── data/
│   │   ├── db/
│   │   │   ├── db.js
│   │   │   └── schema.js
│   │   ├── routes/
│   │   │   ├── commentary.js
│   │   │   └── matches.js
│   │   ├── seed/
│   │   │   └── seed.js
│   │   ├── services/
│   │   │   ├── liveEngine.js
│   │   │   └── publishEvent.js
│   │   ├── simulator/
│   │   │   └── simulator.js
│   │   ├── utils/
│   │   │   ├── events.js
│   │   │   ├── matches-status.js
│   │   │   ├── schedule.js
│   │   │   └── scoring.js
│   │   ├── validation/
│   │   ├── ws/
│   │   │   └── server.js
│   │   ├── arcjet.js
│   │   └── index.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── cricket/
│   │   │   └── football/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
└── README.md
```

## 🛠️ Tech Stack

### Frontend

-   React
-   Vite
-   JavaScript
-   CSS
-   WebSocket client

### Backend

-   Node.js
-   Express
-   WebSocket (`ws`)
-   Drizzle ORM
-   PostgreSQL / Neon
-   Arcjet

### Development

-   npm
-   Git
-   Docker where required by the development environment

## 🚀 Getting Started

### Prerequisites

Make sure you have:

-   Node.js installed
-   npm installed
-   A PostgreSQL-compatible database
-   Git

### 1. Clone the repository

``` bash
git clone <your-repository-url>
cd sportz
```

### 2. Configure the backend

``` bash
cd backend
npm install
```

Create the required environment configuration based on your backend
setup.

Typical configuration includes:

``` env
DATABASE_URL=your_database_connection_string
PORT=10000
```

> Add any other environment variables required by your current
> Arcjet/database configuration.

### 3. Prepare the database

Run your project's database migration/setup commands.

Then seed the development data:

``` bash
npm run seed
```

### 4. Start the backend

``` bash
npm run dev
```

The development backend runs on:

``` text
http://localhost:10000
```

WebSocket endpoint:

``` text
ws://localhost:10000/ws
```

### 5. Start the frontend

Open another terminal:

``` bash
cd frontend
npm install
npm run dev
```

Open the Vite development URL shown in the terminal.

## 🔌 API

### Matches

``` http
GET /matches
```

Returns available matches with their current status and score.

### Match Commentary

``` http
GET /matches/:matchId/commentary
```

Returns commentary available for the requested match.

### WebSocket

``` text
ws://localhost:10000/ws
```

### Subscribe to a Match

``` json
{
  "type": "subscribe",
  "matchId": 3
}
```

### Unsubscribe from a Match

``` json
{
  "type": "unsubscribe",
  "matchId": 3
}
```

### Realtime Score Event

The server publishes score changes using a `score_update` event.

``` json
{
  "type": "score_update",
  "data": {
    "matchId": 3,
    "homeScore": 176,
    "awayScore": 125
  }
}
```

### Realtime Commentary Event

Subscribed clients receive commentary through `commentary_update`.

``` json
{
  "type": "commentary_update",
  "data": {
    "matchId": 3,
    "eventType": "four",
    "message": "FOUR! Driven through the covers."
  }
}
```

## ⚡ Realtime Design

Sportz intentionally uses WebSockets instead of frontend polling for
live updates.

### Scores

Score updates are broadcast to connected clients so that match lists can
update immediately:

``` text
Backend score change
       ↓
score_update
       ↓
React state
       ↓
Match card updates
```

### Commentary

Commentary is match-specific:

``` text
Client
  │
  │ subscribe(matchId)
  ▼
WebSocket Server
  │
  ▼
Match subscriber set
  │
  ▼
commentary_update
```

This prevents a client watching one match from receiving commentary
belonging to another match.

## 🏏 Cricket Scoring

The backend contains a cricket scoring engine that derives match state
from ball events.

The live cricket state includes:

-   Runs
-   Wickets
-   Balls
-   Overs
-   Batting side
-   Target
-   Current batters
-   Current bowler
-   Last-ball/last-over information
-   Current run rate
-   Required run rate
-   Runs needed
-   Balls remaining

The frontend consumes this state rather than maintaining a separate
cricket scoring implementation.

## ⚽ Football

Football matches support event-based live commentary including events
such as:

-   Goals
-   Shots
-   Corners
-   Yellow cards
-   Substitutions
-   Half-time events
-   Other match commentary

Scores and commentary are updated through the same realtime event
pipeline.

## 🧪 Development Workflow

A typical local development workflow is:

``` text
1. Start PostgreSQL / Neon
2. Seed database
3. Start backend
4. Start frontend
5. Open Matches
6. Open a live match
7. Subscribe to live updates
8. Observe realtime scores and commentary
```

For a fresh local demo, reseed the database before starting the
simulator if the existing matches have already moved past their
scheduled windows.

## 🔍 Current Status

### Completed

-   [x] Match listing
-   [x] Live / upcoming / finished match states
-   [x] Dynamic match scores
-   [x] Realtime score updates
-   [x] Dynamic football commentary
-   [x] Dynamic cricket commentary
-   [x] Cricket scoring state
-   [x] Realtime ball-by-ball updates
-   [x] Match-specific WebSocket subscriptions
-   [x] Subscribe / unsubscribe interaction
-   [x] Scrollable commentary panels
-   [x] Backend event simulator
-   [x] Database-backed match state

### Ongoing Improvements

-   [ ] UI/UX refinement
-   [ ] Further frontend performance optimization
-   [ ] WebSocket reconnection strategy
-   [ ] Backend query optimization
-   [ ] Production deployment configuration
-   [ ] Additional sports and event types

## 🔐 Security & Production Notes

Before deploying publicly:

-   Keep secrets in environment variables.
-   Never commit database credentials or API keys.
-   Configure production CORS appropriately.
-   Configure WebSocket authentication/authorization if required.
-   Use `wss://` behind HTTPS in production.
-   Review Arcjet configuration for the production environment.
-   Add rate limiting and abuse protection where appropriate.
-   Add structured logging and monitoring.

## 📌 Design Principles

Sportz follows a few core principles:

1.  **Realtime first** --- live state should arrive through WebSockets
    rather than repeated polling.
2.  **Backend as the source of truth** --- scoring and match state are
    maintained by the backend.
3.  **Match-specific subscriptions** --- commentary is delivered only to
    clients subscribed to the relevant match.
4.  **Reusable event pipeline** --- match events flow through a common
    simulation and publishing architecture.
5.  **Separation of concerns** --- routes, scoring, simulation, event
    publishing, WebSockets, and UI rendering remain separate.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch:

``` bash
git checkout -b feature/your-feature
```

3.  Make your changes.
4.  Test both frontend and backend.
5.  Commit your changes:

``` bash
git commit -m "feat: add your feature"
```

6.  Push the branch:

``` bash
git push origin feature/your-feature
```

7.  Open a pull request.

## 📄 License

This project currently does not specify a license.

If this repository will be publicly distributed, add an appropriate
license before publishing.

------------------------------------------------------------------------

Built with React, Node.js, WebSockets, PostgreSQL, and a lot of
live-match events. 🏏⚽

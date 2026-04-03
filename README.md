# SPORTLYTICS

SPORTLYTICS is a grassroots sports analytics and management platform focused on digitizing local tournaments, tracking player performance, and making amateur sports data visible and useful.

## Day 1 Scope

- Express backend setup
- MongoDB connection scaffolding
- Player and Match APIs
- Basic cricket stats utility

## Day 2 Scope

- Tournament API
- Ball-by-ball innings storage
- Scorecard-ready cricket match structure
- Automatic innings and match total calculation

## Project Structure

```text
src/
  app.js
  server.js
  config/
  controllers/
  models/
  routes/
  utils/
```

## Run Locally

1. Install dependencies:

```bash
npm install express mongoose dotenv cors
npm install -D nodemon
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Start MongoDB locally or update `.env` with MongoDB Atlas URI.

4. Run the backend:

```bash
npm run dev
```

If MongoDB is not running yet, set `SKIP_DB=true` in `.env` for a quick API boot test.

## API Endpoints

- `GET /api/health`
- `POST /api/players`
- `GET /api/players`
- `POST /api/matches`
- `GET /api/matches`
- `GET /api/matches/:id`
- `POST /api/matches/:id/innings`
- `POST /api/tournaments`
- `GET /api/tournaments`

## Example Player Payload

```json
{
  "name": "Aman Verma",
  "age": 21,
  "sport": "cricket",
  "teamName": "Rising Stars",
  "role": "all-rounder"
}
```

## Example Match Payload

```json
{
  "title": "Rising Stars vs Thunder XI",
  "sport": "cricket",
  "tournamentName": "City Premier League",
  "teamA": "Rising Stars",
  "teamB": "Thunder XI",
  "matchDate": "2026-04-03T10:00:00.000Z",
  "venue": "Community Ground",
  "status": "scheduled",
  "format": "T20",
  "tossWinner": "Rising Stars",
  "tossDecision": "bat"
}
```

## Example Tournament Payload

```json
{
  "name": "City Premier League",
  "sport": "cricket",
  "organizerName": "Local Sports Association",
  "venue": "Community Ground",
  "format": "T20",
  "status": "scheduled",
  "teams": [
    { "name": "Rising Stars", "captainName": "Aman Verma" },
    { "name": "Thunder XI", "captainName": "Rahul Singh" }
  ]
}
```

## Example Innings Payload

```json
{
  "inningsNumber": 1,
  "battingTeam": "Rising Stars",
  "bowlingTeam": "Thunder XI",
  "overs": [
    {
      "overNumber": 1,
      "deliveries": [
        { "ballInOver": 1, "runsBat": 0, "extras": 0, "totalRuns": 0, "extrasType": "none", "isWicket": false },
        { "ballInOver": 2, "runsBat": 4, "extras": 0, "totalRuns": 4, "extrasType": "none", "isWicket": false },
        { "ballInOver": 3, "runsBat": 1, "extras": 0, "totalRuns": 1, "extrasType": "none", "isWicket": false }
      ]
    }
  ]
}
```

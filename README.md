# D&D Session Planner

A private scheduling tool for your D&D group. The DM creates a campaign and shares unique invite links with each player. Players set their availability. The DM sees when everyone is free.

## Setup (first time only)

You'll need [Node.js](https://nodejs.org) installed. If you're not sure, download the LTS version from that link.

Open Terminal (Mac: press Cmd+Space, type "Terminal", press Enter).

Then run these commands one at a time, pressing Enter after each:

```
npm install
npm run db:seed
```

## Running the app

Every time you want to use the app, run:

```
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

To stop the app, go back to Terminal and press Ctrl+C.

## Configuration

Copy `.env.example` to `.env` — the default settings work locally without any changes.

## Resetting demo data

If you want to start fresh with the original demo campaign:

```
npm run db:reset
```

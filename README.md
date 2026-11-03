# Imposter

A multiplayer social deduction game by [burlin25](https://github.com/burlin25). Give clues, read the room, and find the player who doesn't know the secret topic.

## How to Play

1. Create a room and share its code with friends. You need at least four players, including the moderator; bots can fill open spots.
2. The round's moderator chooses a topic and category. Innocents see the topic, while the imposter only sees the category.
3. Share clues out loud in Party mode or take turns typing them in Remote mode.
4. Vote for the player you suspect. The imposter gets a final chance to guess the topic before scores are awarded.
5. Rotate moderators and compete for the highest score.

## Screenshots

<div align="center">
  <img width="1000" height="600" alt="image" src="https://github.com/user-attachments/assets/050cd10d-7dbc-45da-bc1d-8fb150606282" />
  <br/>
  <img width="1000" height="600" alt="game_photo2" src="https://github.com/user-attachments/assets/f6697863-f38f-4888-814a-e62948023267" />
  <br/>
  <img width="1000" height="600" alt="game_photo3" src="https://github.com/user-attachments/assets/6d0b8cf6-6602-4056-8dc6-fa43c6b67965" />
</div>

## Run Locally

Install Node.js and npm, then run these commands from the project folder:

```sh
npm ci
npm run dev
```

Open the local URL printed in your terminal. No API key is required to start the game; automatic suggestions and bots use basic fallback responses when no external service is configured.

## Build and Check

```sh
npm run lint
npm run build
npm run preview
```

The production build is written to `dist/`.

## Multiplayer Notes

The player who creates the room keeps the session running. Keep that browser tab open throughout the game; reloading or closing it currently ends the hosted session. For friends on other devices, use a shared deployment URL rather than a localhost link.

## Built With

React, TypeScript, Vite, PeerJS, Tailwind CSS, and Framer Motion.

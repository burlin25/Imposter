<div align="center">
<img width="1200" alt="Odd One Out Banner" src="assets/game_photo3.png" />
</div>

# Odd One Out

A social deduction word game where players give clues to prove they know the secret topic, while imposters try to blend in.

View your app in AI Studio: [https://ai.studio/apps/a6a543f9-c731-4c2b-af10-0127aa6211dc](https://ai.studio/apps/a6a543f9-c731-4c2b-af10-0127aa6211dc)

## Screenshots

<div align="center">
  <img width="45%" alt="Lobby" src="assets/game_photo2.png" />
  <img width="45%" alt="Gameplay" src="assets/game_photo1.png" />
</div>

## Run Locally

**Prerequisites:** Node.js (v18+)

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. **Run the app:**
   ```bash
   npm run dev
   ```

## How to Play

1. **Join the Lobby**: Create a game and share the room code with friends.
2. **Receive Roles**: Most players are "Innocents" and see the secret topic. One player is the "Imposter" and only sees the category.
3. **Give Clues**: Take turns giving one-word clues. Innocents want to be subtle; Imposters want to blend in.
4. **Vote**: Discuss and vote on who the Imposter is.
5. **The Reveal**: If the Imposter is caught, they get one chance to guess the topic to steal the win!

## Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Multiplayer**: PeerJS (WebRTC)
- **AI**: Google Gemini API (@google/genai)
- **Animations**: Framer Motion

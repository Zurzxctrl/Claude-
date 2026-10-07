# unheard — guess the song, underground edition

A guess-the-song game for iPhone and Android. You hear a tiny clip of a track and get five guesses. Every wrong guess or skip unlocks more of the clip. Every track comes from independent artists on [Audius](https://audius.co), mostly with under 20K followers, so you're digging rather than hearing radio hits.

Built with Expo (React Native), so one codebase runs on both platforms.

## What's in it

- **Play**: genre chips (All underground, Hip Hop, Trap, Electronic, House, Drum & Bass, Lo-Fi, Hyperpop, Alt, Experimental, R&B), five guess slots, Easy/Medium/Hard, a segmented clip timeline, search with artwork, and skip.
  - Clips are 1s / 0.5s / 0.1s to start, growing with each miss.
  - Yellow means right artist, wrong song.
- **Result sheet**: artwork, artist and follower count, an emoji grid to share, and a link to the track on Audius.
- **Leaderboard**: profile card (editable name, rank, points, played, win rate, streak, best streak), World or your country, This week or All time, and Challenge a friend.
- **Settings and How to play**, both as modals.
- **Stats** are saved on the device. The global leaderboard turns on once you connect Supabase (below).

## Run it on your phone (5 minutes)

1. Install [Node.js](https://nodejs.org) (LTS).
2. Install **Expo Go** from the App Store or Google Play.
3. In this folder, run:
   ```bash
   npm install
   npx expo start
   ```
4. Scan the QR code. On iPhone use the Camera app; on Android scan from inside Expo Go.

Your phone and computer need to be on the same Wi-Fi. If they aren't, use `npx expo start --tunnel`.

## Global leaderboard (optional, free tier is enough)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Go to **Authentication → Sign In / Providers** and turn on **Allow anonymous sign-ins**. Players get an account automatically, with no sign-up screen.
4. Copy `.env.example` to `.env.local` and fill in the Project URL and the `anon` public key from **Project Settings → API**.
5. Restart with `npx expo start --clear`. The `--clear` matters, because env values are baked in at build time.

Scores go through a `submit_round` database function. It rejects impossible point totals and bursts of submissions, and row-level security stops anyone from writing other players' data.

## Before you publish to the stores

- Fill in `src/config.ts`. Apple and Google both require a **privacy policy URL**. Add your app link, terms and contact email there too; empty rows stay hidden.
- Change `ios.bundleIdentifier` / `android.package` in `app.json` if you want something other than `com.zurzx.unheard`.
- Read the [Audius API terms](https://docs.audius.org). The app credits Audius and links every track back to the artist.
- Build and submit with EAS. You'll need an Apple Developer account ($99/yr) and a Google Play developer account ($25 once):
  ```bash
  npx eas-cli@latest build --platform all
  npx eas-cli@latest submit --platform ios   # and/or android
  ```

## Preview build (no internet needed)

`EXPO_PUBLIC_DEMO=1` swaps Audius for 20 original demo tracks synthesized on the device. All titles and artists are made up. Use it to show the app somewhere that can't reach outside services, such as a sandboxed web preview:

```bash
EXPO_PUBLIC_DEMO=1 npx expo export --clear --platform web
```

## Develop

```bash
npm test            # game logic, Audius client and demo synth unit tests
npm run typecheck
npm run lint
npm run web         # quick preview in a browser
```

| Path | What lives there |
| --- | --- |
| `src/app/` | Screens (Expo Router): home, settings, how-to-play |
| `src/screens/` | Play and Leaderboard tabs |
| `src/components/` | UI pieces: top bar, chips, guess slots, clip bar, search, result sheet |
| `src/game/` | Rules: clip schedule, scoring, stats, share text, names |
| `src/services/` | Audius client, demo tracks, Supabase leaderboard, on-device storage |
| `src/hooks/useClipPlayer.ts` | Plays exact-length clips by watching the player's clock |
| `supabase/schema.sql` | Leaderboard tables, security rules and functions |

To tweak the game, edit `src/game/config.ts`: clip lengths, difficulty multipliers, genres and colors, and the underground follower cap.

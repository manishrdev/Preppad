# PrepPad - Interview Prep

A local-first interview preparation web app (React + Vite, fully static).

- **Mock interviews** - pick topics, levels, count and an optional timer. Answer in your own words; model answers are revealed only when you finish, then you self-grade. Missed questions drop into your flash cards.
- **Flash cards** - spaced repetition (Leitner boxes). Modes: due & new, weak spots, everything. Keyboard: `Space` flip, `1/2/3` rate.
- **Hand-written concept notes** - lined-paper notes with hand-drawn diagrams and code stickies.
- **Question bank** - 200+ curated questions across 17 topics (Java, OOP, Data Structures, Java Versions, Spring, Spring Boot, REST API, Maven, Jenkins, CI/CD, AWS, Architecture, React, JavaScript, HTML/CSS, Python, SQL), each tagged Junior / Mid / Senior / Lead.
- **Experience-aware** - set your years of experience (or pick levels manually); questions are weighted toward your level with fundamentals from the level below mixed in.
- **AI top-up (needs internet + your own key)** - generate fresh questions or a concept note for any topic, including ones not in the list (Kafka, Kubernetes, Terraform...). Works with Google Gemini (free tier), Anthropic, or OpenAI. Keys stay in your browser only.
- **Optional free cloud sync** - Firebase Auth + Firestore keep progress across devices. Without it everything is saved in the browser.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve the production build
npm run validate   # sanity-check the question bank
```

Requires Node 18+.

## Optional: cloud sync with Firebase (about 5 minutes)

1. Create a project at https://console.firebase.google.com (Spark plan is free, no card).
2. **Build > Authentication > Get started**, enable **Google** and/or **Email/Password**.
3. **Build > Firestore Database > Create database**, then set these rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
4. **Project settings > Your apps > Web app**, copy the config object.
5. Either paste it in the app under **Settings > Cloud sync**, or put the values in `.env` (see `.env.example`). For GitHub Pages add them as repository *Variables* (Settings > Secrets and variables > Actions > Variables) named `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. **Authentication > Settings > Authorized domains**: add `<your-username>.github.io` (or your other host).

The Firebase web config is not a secret; the Firestore rules above are what protect user data.

> Full step-by-step deployment guide: see [DEPLOY.md](DEPLOY.md).

## Put it on GitHub and host it free

```bash
git init && git add . && git commit -m "PrepPad"
git branch -M main
git remote add origin https://github.com/<you>/preppad.git
git push -u origin main
```

Then in the repo: **Settings > Pages > Source: GitHub Actions**. The included workflow (`.github/workflows/deploy.yml`) builds and publishes on every push to `main`. Your site appears at `https://<you>.github.io/preppad/`. The app uses hash routing and relative asset paths, so no extra config is needed for sub-path hosting.


## Project structure

```
src/data/        question bank + notes (edit these to add content)
src/lib/         store (local state), ai (BYO-key), cloud (Firebase), router
src/components/  Home, Mock, Flashcards, Notes, Browse, Generate, Settings
```

To add questions, append `[level, question, answer]` rows in `src/data/*.js` (level 1=Junior, 2=Mid, 3=Senior, 4=Lead) and run `npm run validate`.

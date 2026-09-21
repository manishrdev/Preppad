# Deploying PrepPad to GitHub and hosting it for free

**Recommended setup: GitHub Pages (hosting) + Firebase Auth/Firestore (optional login and sync).**
No credit card is needed for either.

## Why this combination

| Need | Choice | Free limits (checked Sept 2026 against official docs) |
| --- | --- | --- |
| Hosting the static site | **GitHub Pages** | Site up to 1 GB, soft 100 GB/month bandwidth. Free plan requires a **public** repo. Not meant for commercial or e-commerce use. |
| Login + cloud sync (optional) | **Firebase Spark plan** | 50K monthly active users for Auth; Firestore 1 GiB storage, 50K reads/day, 20K writes/day. No card required. |
| AI question generation (optional) | Your own Gemini / Anthropic / OpenAI key | Kept in the browser only. Gemini has a free tier. |

PrepPad is a fully static site, so GitHub Pages is the simplest and lowest-maintenance host: the code and the hosting live in one place and every push to `main` redeploys automatically. Limits change over time, so glance at the provider pricing pages before relying on them.

**If you need a private repo:** GitHub Pages on the free plan only works for public repos. Use **Netlify** or **Vercel** instead (see "Alternative hosts" at the end). Both can deploy from a private GitHub repo on their free plans.

---

## Part 1 - Put the code on GitHub

### 1. Prepare
1. Install [Git](https://git-scm.com/downloads) and [Node.js 18+](https://nodejs.org).
2. Unzip `preppad.zip` and open a terminal inside the `interview-prep` folder.
3. Check that it runs: `npm install` then `npm run dev` (opens at http://localhost:5173). Stop it with Ctrl+C.

### 2. Create the repository
1. Sign in at https://github.com and click **New repository**.
2. Name it, for example, `preppad`. Choose **Public**. Do **not** add a README, .gitignore or license (the project already has them).
3. Click **Create repository**.

### 3. Push the code
Replace `YOUR-USERNAME` with your GitHub username:

```bash
git init
git add .
git commit -m "Initial commit: PrepPad"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/preppad.git
git push -u origin main
```

If GitHub asks for a password, use a **Personal Access Token** (GitHub > Settings > Developer settings > Personal access tokens) or sign in through the GitHub CLI (`gh auth login`).

Check the repo page: you should see `src/`, `package.json`, `.github/workflows/deploy.yml` and so on. `node_modules/` and `dist/` are excluded by `.gitignore`, which is correct.

---

## Part 2 - Turn on GitHub Pages (automatic deploys)

1. In your repo, go to **Settings > Pages**.
2. Under **Build and deployment > Source**, choose **GitHub Actions**.
3. Go to the **Actions** tab. The workflow **Deploy to GitHub Pages** should be running (or click it and choose **Run workflow**). Wait for the green check, about 1-2 minutes.
4. Your site is live at:
   **`https://YOUR-USERNAME.github.io/preppad/`**
   The exact URL is also shown in Settings > Pages and on the workflow run.

From now on, every `git push` to `main` rebuilds and redeploys the site.

### If the workflow fails
- **"Get Pages site failed" / permissions error**: Settings > Pages > Source must be set to *GitHub Actions* (step 2), then re-run the workflow.
- **`npm ci` error about a lock file**: run `npm install` locally, commit `package-lock.json`, and push.
- **Blank page**: make sure you open the URL with the repo name in it. PrepPad uses relative paths and hash routing, so it works under `/preppad/` with no extra config.

---

## Part 3 - Optional: login and cloud sync with Firebase

Skip this if local browser storage is enough. Progress is then saved per browser and can be moved with Settings > Export/Import backup.

### 1. Create the Firebase project
1. Go to https://console.firebase.google.com and click **Create a project**. Stay on the free **Spark** plan. Google Analytics can be turned off.
2. **Build > Authentication > Get started > Sign-in method**. Enable **Google** and/or **Email/Password**.
3. **Build > Firestore Database > Create database**. Pick a region near you and start in production mode.
4. Open the **Rules** tab, paste this, and **Publish**:
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
   This makes each user able to read and write only their own document.

### 2. Get the web config
1. **Project settings (gear icon) > General > Your apps > Add app > Web (`</>`)**.
2. Register the app (skip Firebase Hosting). Copy the `firebaseConfig` values: `apiKey`, `authDomain`, `projectId`, `appId`.

### 3. Give the config to the deployed site
Firebase web config values are identifiers, not secrets. Access is protected by the Firestore rules above.

1. In your GitHub repo: **Settings > Secrets and variables > Actions > Variables tab > New repository variable**.
2. Add four variables with exactly these names:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
3. **Actions > Deploy to GitHub Pages > Run workflow** to rebuild with the values.

(Alternative with no rebuild: open the live site, go to **Settings > Cloud sync** and paste the config object there. It is then saved in that browser only.)

### 4. Authorize your domain
In Firebase: **Authentication > Settings > Authorized domains > Add domain** and add `YOUR-USERNAME.github.io`. Without this, Google sign-in fails with an "unauthorized domain" error.

### 5. Test
Open the live site, go to **Settings > Cloud sync**, sign in, do a flash card, then sign in on another device or browser. The top-right indicator shows **Synced** when data is saved.

---

## Part 4 - Optional: AI question generation
1. Get a free key at https://aistudio.google.com/apikey (Gemini), or use an Anthropic or OpenAI key.
2. In the live app: **Settings > AI top-up**, choose the provider, paste the key, **Save**.
3. **Generate** page: pick a topic and level and generate questions or a concept note.

The key is stored only in that browser's local storage and is sent only to the AI provider you chose. Anyone using your public site needs their own key.

---

## Updating the site later
```bash
git add .
git commit -m "Add more Spring questions"
git push
```
Questions live in `src/data/*.js` as `[level, question, answer]` rows (1 = Junior, 2 = Mid, 3 = Senior, 4 = Lead). Run `npm run validate` before pushing. The site redeploys automatically.

## Custom domain (optional, still free)
Settings > Pages > **Custom domain**, then add the DNS records GitHub shows at your domain registrar. HTTPS is issued automatically. Add the new domain to Firebase Authorized domains too.

---

## Alternative hosts (all work with build command `npm run build`, output folder `dist`)

| Host | When to pick it | How |
| --- | --- | --- |
| **Netlify** | Private repo, or you want preview deploys per pull request | netlify.com > Add new site > Import from Git > pick the repo. Build `npm run build`, publish `dist`. |
| **Vercel** | Private repo, very quick setup | vercel.com > Add New > Project > import the repo. Framework preset **Vite**. |
| **Firebase Hosting** | You already use Firebase and want everything in one console | `npm i -g firebase-tools`, `firebase login`, `firebase init hosting` (public dir `dist`, single-page app: yes), `npm run build`, `firebase deploy`. Free quota is small (about 360 MB/day transfer), fine for personal use. |
| **Render / Koyeb static** | Another free static tier as a backup | Connect the repo, build `npm run build`, publish `dist`. |

On any host, remember to add the site's domain to Firebase **Authorized domains** if you use cloud sync.

## Quick troubleshooting
| Symptom | Fix |
| --- | --- |
| Google sign-in says unauthorized domain | Add the domain in Firebase > Authentication > Settings > Authorized domains. |
| "Missing or insufficient permissions" | Publish the Firestore rules from Part 3 step 1.4. |
| Sync stays "Signed out" after adding variables | Re-run the deploy workflow so the build picks up the variables. |
| AI generate fails with CORS or 4xx error | Check the key and model name in Settings. Try the Gemini provider first. |
| Progress missing on a new device | Sign in on both devices; without login data stays in that browser. |

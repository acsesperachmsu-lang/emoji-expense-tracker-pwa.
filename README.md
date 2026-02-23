# Emoji Expense Tracker (PWA)

A simple Progressive Web App to track your allowance, expenses with emojis, and borrowed money. Works offline and can be installed on your iPhone.

## Files

| File | Purpose |
|------|--------|
| `index.html` | Main app page |
| `style.css` | Styling |
| `script.js` | All app logic |
| `manifest.json` | PWA manifest (name, icons, display) |
| `service-worker.js` | Offline caching |
| `create-icons.html` | Optional: generate app icons |

## Try It on Windows (Development)

1. **Option A – Open directly**  
   Double-click `index.html` to open in your browser. The app works, but the service worker will not register (needs HTTPS or localhost).

2. **Option B – Simple local server (recommended)**  
   So that "Add to Home Screen" and offline work when you test:
   - Install Python if you don’t have it: [python.org](https://www.python.org/)
   - In a terminal, go to this folder and run:
     - **Python 3:** `python -m http.server 8080`
     - **Python 2:** `python -m SimpleHTTPServer 8080`
   - Open in browser: `http://localhost:8080`

## App Icons (Optional but Recommended)

For a proper home screen icon on iPhone:

1. Open `create-icons.html` in your browser.
2. Click **Download icon-192.png** and **Download icon-512.png**.
3. Save both files in the **same folder** as `index.html`.

If you skip this, the app still works; the home screen may use a generic icon or screenshot.

## Install on iPhone

1. **Host the app online** (required for install on iPhone). For example:
   - **GitHub Pages:** Create a repo, upload all files, enable Pages in Settings.
   - **Netlify:** Drag and drop this folder to [netlify.com/drop](https://app.netlify.com/drop).
   - Any other static hosting that serves files over **HTTPS**.

2. On your iPhone, open **Safari** (not Chrome).

3. Go to your app’s URL (e.g. `https://yourusername.github.io/emoji-expense-tracker-pwa/`).

4. Tap the **Share** button (square with arrow).

5. Tap **Add to Home Screen**.

6. Tap **Add**. The app will appear on your home screen and open like an app.

## Features

- **Set allowance** – Enter starting money; remaining balance updates automatically.
- **Add expense** – Emoji + name + amount; balance decreases.
- **Add borrow** – Person + amount; does **not** change your balance; you can mark as **Paid** in History.
- **View history** – List of all expenses and borrows with dates.
- **Offline** – After first load, the app works without internet (service worker caches files).
- **Data saved locally** – Allowance, expenses, and borrows are stored in the browser (Local Storage) on your device.

## Tech

- HTML, CSS, and JavaScript only (no frameworks).
- Local Storage for data.
- PWA: manifest + service worker for install and offline.

No Mac or paid developer account needed. Free to use and modify.

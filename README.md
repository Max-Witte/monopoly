# 🎩 Monopoly – Custom Edition

A fully playable Monopoly game you can host for free on GitHub Pages and play online with a friend.

## ▶ Play Now (Local or Online)

Just open `index.html` in your browser for local play.  
For online play with your girlfriend, deploy to GitHub Pages (see below).

---

## 📁 File Structure

```
monopoly/
├── index.html          ← Main page (open this)
├── README.md
└── js/
    ├── data.js         ← All board spaces, cards, prices (customize here!)
    ├── engine.js       ← Pure game logic (no UI)
    ├── board.js        ← Board renderer
    ├── ui.js           ← Controls, panels, modals
    └── network.js      ← PeerJS P2P online multiplayer
```

---

## 🚀 Deploying to GitHub Pages (Free Hosting)

1. **Create a GitHub account** at https://github.com if you don't have one
2. **Create a new repository** — name it anything (e.g. `our-monopoly`)
3. **Upload all files**, keeping the folder structure:
   - `index.html` goes in the root
   - `js/` folder with all 4 JS files inside
4. Go to your repo → **Settings** → **Pages**
5. Under *Source*, select **Deploy from a branch** → `main` → `/ (root)`
6. Click **Save** — GitHub will give you a URL like `https://yourusername.github.io/our-monopoly`
7. Share that link with your girlfriend!

---

## 🎮 How to Play Online

**You (host):**
1. Open the game URL
2. Click **Host Online**
3. Enter your name → click **Create Game**
4. You'll see a 6-character code (e.g. `A3BX92`)
5. Send that code to your girlfriend

**Your girlfriend (guest):**
1. Opens the same game URL
2. Clicks **Join Online**
3. Enters her name and your code → **Join Game**

The game starts automatically! Each player can only take actions on their own turn.

---

## 🎨 Customization Guide

### Change Street Names
Open `js/data.js` and edit the `name` field of any space in the `SPACES` array.

### Change Card Texts
In `js/data.js`, edit `CHANCE_CARDS` or `COMMUNITY_CHEST_CARDS` text fields.

### Change Player Tokens
In `js/data.js`, edit `PLAYER_TOKENS` (any emoji works!).

### Change Colors / Theme
In `index.html`, edit the CSS variables at the top of the `<style>` block:
```css
--bg:      #1a2639;   /* Page background */
--accent:  #e8b86d;   /* Gold highlight color */
--board-bg: #dff0e0;  /* Board green */
```

### Add Custom Images
Add `<img>` tags inside the space HTML in `js/board.js` — or replace the emoji tokens with `<img>` tags in `js/data.js`.

---

## 🎲 Rules Implemented

- All 40 spaces with correct prices, rents, and actions
- Full property buying and rent collection
- Railroads (×1–4 multiplier) and utilities (4× or 10× dice)
- Monopoly double-rent bonus
- Houses and hotels (even-build rule enforced)
- Mortgage / unmortgage (10% interest to lift)
- Chance and Community Chest (all 16 cards each)
- Jail: roll doubles, pay $50 fine, or use Get Out of Jail Free card
- Go to Jail, Income Tax, Luxury Tax
- Bankruptcy detection and win condition
- Doubles = roll again (3 doubles in a row = jail)

---

## 📌 Tech Stack

- Vanilla HTML/CSS/JavaScript — zero dependencies except PeerJS
- [PeerJS](https://peerjs.com/) for free P2P multiplayer (no server needed)
- Runs entirely in the browser, hosted free on GitHub Pages

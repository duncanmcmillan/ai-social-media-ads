# AI Social Media Ads — Installation Guide

This guide covers how to install and run AI Social Media Ads on macOS and Windows.

---

## Prerequisites

- **Node.js 22 LTS** — [nodejs.org/en/download](https://nodejs.org/en/download)
- **npm** (included with Node.js)
- **Git** — [git-scm.com](https://git-scm.com)

> Note: Node.js v25 (odd-numbered) is not an LTS release. Use v22 LTS for stability.

---

## macOS

### 1. Clone the repository

```bash
git clone https://github.com/duncanmcmillan/ai-social-media-ads.git
cd ai-social-media-ads
```

### 2. Install dependencies

```bash
npm install
```

### 3. Launch the app

```bash
npm run dev
```

This builds the Angular front-end and opens the Electron desktop window.

### Building a distributable (.dmg)

```bash
npm run make
```

The packaged app is output to `out/make/`. Open the `.dmg` file, drag **AI Social Media Ads** to your Applications folder, then launch it from Applications or Spotlight.

---

## Windows

### 1. Clone the repository

Open **Command Prompt** or **PowerShell** and run:

```bash
git clone https://github.com/duncanmcmillan/ai-social-media-ads.git
cd ai-social-media-ads
```

### 2. Install dependencies

```bash
npm install
```

### 3. Launch the app

```bash
npm run dev
```

This builds the Angular front-end and opens the Electron desktop window.

### Building a distributable (.exe installer)

```bash
npm run make
```

The packaged installer is output to `out/make/`. Run the `.exe` file and follow the on-screen installer steps.

---

## First-time setup

Once the app is open you will see a **consent gate** — accept the privacy notice to proceed.

Next, go to the **Meta Setup** tab and enter your Facebook App credentials:

1. **App ID** — from your Facebook App Dashboard → Settings → Basic
2. **App Secret** — from your Facebook App Dashboard → Settings → Basic → App Secret → Show

Save the credentials, then click **Connect Facebook** to authenticate via your Facebook account. After login the app will load your ad accounts and you can begin creating campaigns.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `EADDRINUSE` port error | A previous instance is still running. Quit the app fully and relaunch. |
| White screen on launch | Rebuild: `npm run dev` from a fresh terminal. |
| "No ad accounts found" | Ensure the Facebook account you logged in with has access to at least one ad account. |
| App crashes on macOS after update | Delete `node_modules` and run `npm install` again. |

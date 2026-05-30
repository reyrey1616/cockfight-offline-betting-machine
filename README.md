# FMJ offline betting — machine client

React admin UI + teller web routes, and **Electron kiosk** packaging in one repo.

| Use | Command | Docs |
|-----|---------|------|
| **Admin / dev (browser)** | `npm run dev` → http://localhost:5173 | API on port 8000 |
| **Electron kiosk (dev)** | `npm run dev:electron` | Starts Vite + Electron `/kiosk` |
| **Kiosk installer** | `npm run dist` | [BUILD-KIOSK.md](./BUILD-KIOSK.md) |

**LAN deployment:** [../MULTI-COMPUTER.md](../MULTI-COMPUTER.md), [../IT-SUPPORT.md](../IT-SUPPORT.md), [../INSTALL.md](../INSTALL.md)

## Web app

```bash
npm install
npm run dev
```

## Electron kiosk

```bash
npm install
cp config.example.json config.json   # edit apiBaseUrl → server LAN IP
npm run dev:electron                 # dev: Vite + Electron
npm run dist                         # .dmg (Mac) or .exe (Windows on Windows PC)
```

Installers output: `release/`

## Structure

```text
src/           React UI (admin, kiosk, payout, display)
electron/      Electron main process (print, config)
scripts/       dev:electron, dist helpers
config.json    Kiosk API URL (not committed — use config.example.json)
dist/          Vite production build (bundled into Electron)
release/       Installers from electron-builder
```

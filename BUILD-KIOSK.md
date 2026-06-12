# Build kiosk installer (.exe / .dmg)

Electron kiosk shell lives in this repo (`electron/`, `scripts/`, `config.json`). Produces **FMJ offline betting machine** for teller machines; UI is bundled from `dist/` after `npm run build`.

> **Multiple computers:** One **server** PC + **many** kiosk PCs (Mac/Windows). Install the same build on each teller machine; they all use the **server’s LAN IP**, never `localhost` on the kiosk. Full rules: [../MULTI-COMPUTER.md](../MULTI-COMPUTER.md).

## Before you build

1. **Server is set up** — see [../cockfigh-offline-betting-api/SERVER-SETUP.md](../cockfigh-offline-betting-api/SERVER-SETUP.md)
2. **Know server LAN IP** — e.g. `192.168.1.6`

## 1. Kiosk config (server URL on the LAN)

```bash
cd cockfight-offline-betting-machine-client
cp config.example.json config.json
# See config.example.README.md and ../MULTI-COMPUTER.md
```

Edit **`config.json`**:

```json
{
  "apiBaseUrl": "http://192.168.1.6:8000",
  "printerName": "",
  "silentPrint": true,
  "kioskFullscreen": true
}
```

| Field | Meaning |
|-------|---------|
| `apiBaseUrl` | **Required** — **server** LAN IP, same on every kiosk at this site (never `localhost` on teller PCs) |
| `printerName` | `""` = **Windows default** physical printer (same as the print dialog). If you have several copies of the same driver (e.g. `XP-80C (copy 1)` vs `copy 3`), set the exact online name here — silent print used to pick the first thermal in list order, not your default. |
| `silentPrint` | `true` = print ticket after each bet, no dialog (requires the **installed Electron app**, not Chrome at `localhost:5173`) |
| `kioskFullscreen` | `true` = fullscreen kiosk window |

This file is copied into the installer. Change IP here and rebuild if the server moves.

Optional build-time fallback in `machine-client/.env.production` (same URL) — kiosk `config.json` wins when set.

## 2. Install & build

`npm run dist` runs **`npm run eject-dmg`** first to unmount leftover installer volumes.

If DMG build still fails with `hdiutil detach` / exit code **16**:

1. Quit **Finder** windows showing the old installer disk.
2. In Finder sidebar, eject **FMJ offline betting machine** (or old **Cockfight Betting Kiosk**).
3. Or run:

```bash
npm run eject-dmg
# manual:
hdiutil detach "/Volumes/FMJ offline betting machine" -force
```

**You already have a working app without DMG:** after a failed `dist`, use:

```bash
open "release/mac-arm64/FMJ offline betting machine.app"
```

Or copy that `.app` to Applications. Re-run `npm run dist` only when you need a fresh `.dmg` to copy to other Macs.

```bash
npm install
npm run dist
```

| Platform | Build on | Output |
|----------|----------|--------|
| **macOS .dmg** | Mac | `release/FMJ offline betting machine *.dmg` |
| **Windows .exe** | Windows | `release/FMJ offline betting machine Setup *.exe` |

**Windows “Cannot create symbolic link” (winCodeSign):** `package.json` sets `win.signAndEditExecutable: false` so unsigned installers build without extracting winCodeSign (which needs symlink privileges on Windows). For code-signed builds, enable **Developer Mode** in Windows settings and remove that flag.

**No installer needed:** `npm run pack` → runnable app in `release/win-unpacked/`.

## 3. Install on each teller PC (repeat for every kiosk)

Use the **same** `.dmg` / `.exe` on each teller computer. Each PC only needs the app + its own printer; no Node.js.

1. Copy installer (USB / network share)
2. Run installer → desktop shortcut
3. Connect **XP-K200L**, set as **default printer**
4. Open **FMJ offline betting machine**
5. Login as **teller**

No Node.js on kiosks. No `localhost:5173`.

## 4. If server IP changes later

1. Edit `config.json` on each kiosk (next to the installed app, or reinstall with new build)
2. Or rebuild with updated `config.json` and reinstall

Locations for `config.json` (first match wins):

- macOS: `FMJ offline betting machine.app/Contents/Resources/config.json` (edit without rebuild)
- Same folder as the `.exe` / `.app` on Windows
- macOS: `config.json` next to `FMJ offline betting machine.app` in Applications

## Sign-in stuck / “not connected to API”

Usually one of these:

1. **Wrong `apiBaseUrl`** — must be the **server** LAN IP (e.g. `http://192.168.1.6:8000`), not `localhost` on the kiosk.
2. **API not running** or firewall blocking port **8000** on the server.
3. **CORS (older API)** — packaged kiosk loads UI from `http://127.0.0.1:<port>`; the API must allow that origin. Update `cockfigh-offline-betting-api` and **restart** the server (`npm run start`).
4. **Stale installer** — rebuild after fixing `config.json` and API, then reinstall the `.dmg` / `.exe`.

**Quick checks on the kiosk Mac:**

```bash
# Replace with your server IP from config.json
curl -s -o /dev/null -w "%{http_code}\n" http://192.168.1.6:8000/documentation
```

Should print `200` (or `301`), not `000` / connection refused.

**Without rebuilding the kiosk app:** on the login page, set **Server URL** (e.g. `http://192.168.1.6:8000`) and sign in — saved on that PC.

Or edit `config.json` (Mac):

```text
/Applications/FMJ offline betting machine.app/Contents/Resources/config.json
```

Quit the app, edit `apiBaseUrl`, save, reopen. Login-page URL overrides `config.json` when set.

## 5. Dev on your Mac (not for kiosks)

```bash
npm run dev:electron
```

Starts Vite and opens Electron at `http://localhost:5173/kiosk` (API from `.env.development`).

**Do not** open `http://localhost:5173` in Chrome/Edge for kiosk testing — printing will show the system dialog (blob print preview). Silent thermal print only works through the Electron shell.

## 6. Windows — print dialog instead of auto-print

If you see **Save as PDF** / a print popup:

1. Use the **installed `.exe`**, not a browser tab at `localhost:5173`.
2. Set the thermal printer as **Windows default** (not “Microsoft Print to PDF”).
3. Confirm `config.json` next to the app has `"silentPrint": true`.
4. Optional: set `"printerName"` to the exact printer name from Windows Settings.
5. Rebuild/reinstall after pulling print fixes, then fully quit and reopen the app.

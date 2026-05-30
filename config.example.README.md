# config.json (many kiosk PCs)

Copy to `config.json` before `npm run dist`.

- **`apiBaseUrl`** — LAN IP of the **server** PC. Use the **same** value on every teller kiosk at this site. Do not use `localhost` on kiosk machines.
- **`printerName`** — Usually `""` (OS default). Set only if that **specific** kiosk has multiple printers.
- **`startPath`** — `/kiosk` on teller PCs (default). On the **server PC** when using Electron only to print collector badges: `/admin/collectors`.

See [../MULTI-COMPUTER.md](../MULTI-COMPUTER.md).

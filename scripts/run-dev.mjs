import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import waitOn from 'wait-on'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const appUrl = process.env.ELECTRON_APP_URL ?? 'http://localhost:5173/kiosk'

const vite = spawn('npm', ['run', 'dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
})

function shutdown(code = 0) {
  vite.kill('SIGTERM')
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

try {
  const probe = appUrl.replace(/\/kiosk.*$/, '')
  await waitOn({ resources: [`${probe}`], timeout: 120000, interval: 500 })
} catch (err) {
  console.error('Vite dev server did not start in time:', err)
  shutdown(1)
}

const electron = spawn('npx', ['electron', '.'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    ELECTRON_APP_URL: appUrl
  }
})

electron.on('exit', (code) => shutdown(code ?? 0))

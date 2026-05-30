import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const build = spawn('npm', ['run', 'build'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
})

build.on('exit', (code) => {
  if (code !== 0) process.exit(code ?? 1)
  const electron = spawn('npx', ['electron', '.'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' }
  })
  electron.on('exit', (c) => process.exit(c ?? 0))
})

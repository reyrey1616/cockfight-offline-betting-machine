import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2'
}

/**
 * Serves a Vite `dist` folder so React Router path URLs work in Electron prod.
 * @param {string} distDir
 * @returns {Promise<{ baseUrl: string, close: () => void }>}
 */
export function startStaticServer(distDir) {
  const indexPath = path.join(distDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Client build not found at ${distDir}. Run npm run build:client first.`)
  }

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      let rel = decodeURIComponent(url.pathname)
      if (rel === '/' || !path.extname(rel)) {
        rel = '/index.html'
      }
      const filePath = path.normalize(path.join(distDir, rel))
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403)
        res.end()
        return
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        const html = fs.readFileSync(indexPath)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
        return
      }
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
      res.end(fs.readFileSync(filePath))
    } catch {
      res.writeHead(500)
      res.end()
    }
  })

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind static server'))
        return
      }
      resolve({
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => server.close()
      })
    })
    server.on('error', reject)
  })
}

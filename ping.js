import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dns from 'node:dns'
import { promisify } from 'node:util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_PATH = path.join(__dirname, 'state.json')
const LOG_PATH = path.join(__dirname, 'ping.log')

const dnsResolve = promisify(dns.resolve4)

function formatDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function log(message) {
  const line = `[${formatDateTime(new Date())}] ${message}\n`
  fs.appendFileSync(LOG_PATH, line)
}

function calcNextHeartbeat(lastHeartbeat) {
  const reset = new Date(lastHeartbeat)
  reset.setMinutes(0, 0, 0)
  reset.setHours(reset.getHours() + 5)

  const minute = Math.floor(Math.random() * 21)
  const second = Math.floor(Math.random() * 60)
  reset.setMinutes(minute, second, 0)

  return reset
}

function readNextHeartbeat() {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'))
    const date = new Date(data.nextHeartbeat)
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

function shouldSendHeartbeat() {
  const next = readNextHeartbeat()
  return next === null || Date.now() >= next.getTime()
}

async function checkNetworkConnection() {
  try {
    await dnsResolve('google.com')
    return true
  } catch {
    return false
  }
}

function sendHeartbeat() {
  const TIMEOUT_MS = 15_000

  return new Promise((resolve, reject) => {
    const child = exec('claude -p "Say hi" --system-prompt "You must respond with exactly \\"hi\\" to every single message from the user. Do not provide any other response, explanation, or variation. Only output: hi" --mcp-config .mcp.json --strict-mcp-config --disable-slash-commands --no-chrome', (error, stdout, stderr) => {
      clearTimeout(timer)
      if (error) reject(error)
      else resolve({ stdout, stderr })
    })
    child.stdin.end()

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`Claude process timed out after ${TIMEOUT_MS / 1000}s with no response`))
    }, TIMEOUT_MS)
  })
}

function writeState() {
  const now = new Date()
  const nextHeartbeat = calcNextHeartbeat(now)
  const data = {
    lastHeartbeat: formatDateTime(now),
    nextHeartbeat: formatDateTime(nextHeartbeat),
  }
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(data, null, 2)}\n`)
  return nextHeartbeat
}

async function tick() {
  if (!shouldSendHeartbeat()) return

  try {
    const isNetworkConnected = await checkNetworkConnection()
    if (!isNetworkConnected) {
      log('Error: Network disconnected, skipping heartbeat')
      return
    }

    const result = await sendHeartbeat()

    if (result.stderr) {
      log(`Error: ${result.stderr}`)
    } else {
      const nextHeartbeat = writeState()
      log(`Heartbeat sent, next: ${
        formatDateTime(nextHeartbeat)
      }, out=${
        JSON.stringify(result.stdout)
      }`)
    }
  } catch (err) {
    log(`Error: ${err.message}`)
  }
}

log('Started')
tick()
setInterval(tick, 60 * 1000)

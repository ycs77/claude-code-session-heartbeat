import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const STATE_PATH = path.join(__dirname, 'state.json')
const LOG_PATH = path.join(__dirname, 'ping.log')

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`
  fs.appendFileSync(LOG_PATH, line)
}

function calcNextHeartbeat(lastHeartbeat) {
  const reset = new Date(lastHeartbeat)
  reset.setMinutes(0, 0, 0)
  reset.setHours(reset.getHours() + 5)

  const minute = Math.floor(Math.random() * 60)
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

function sendHeartbeat() {
  return new Promise((resolve, reject) => {
    const child = exec('claude -p "Say hi"', err => {
      if (err) reject(err)
      else resolve()
    })
    child.stdin.end()
  })
}

function writeState() {
  const now = new Date()
  const nextHeartbeat = calcNextHeartbeat(now)
  const data = {
    lastHeartbeat: now.toISOString(),
    nextHeartbeat: nextHeartbeat.toISOString(),
  }
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(data, null, 2)}\n`)
  return nextHeartbeat
}

async function tick() {
  if (!shouldSendHeartbeat()) return

  try {
    await sendHeartbeat()
    const nextHeartbeat = writeState()
    log(`Heartbeat sent, next: ${nextHeartbeat.toISOString()}`)
  } catch (err) {
    log(`Heartbeat failed: ${err.message}`)
  }
}

log('Started')
tick()
setInterval(tick, 60 * 1000)

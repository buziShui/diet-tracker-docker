import express from 'express'
import fs from 'node:fs'
import path from 'node:path'

const app = express()
const port = Number(process.env.PORT || 80)
const dataDir = process.env.DATA_DIR || '/data'
const stateFile = path.join(dataDir, 'state.json')

app.use(express.json({ limit: '2mb' }))

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true })
}

function defaultState() {
  return {
    records: [],
    llmConfig: {
      enabled: false,
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-3.5-turbo'
    },
    profile: null,
    customFoods: []
  }
}

function readState() {
  ensureDataDir()
  if (!fs.existsSync(stateFile)) {
    const init = defaultState()
    fs.writeFileSync(stateFile, JSON.stringify(init, null, 2), 'utf-8')
    return init
  }
  try {
    const raw = fs.readFileSync(stateFile, 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...defaultState(), ...parsed }
  } catch {
    const fallback = defaultState()
    fs.writeFileSync(stateFile, JSON.stringify(fallback, null, 2), 'utf-8')
    return fallback
  }
}

function writeState(next) {
  ensureDataDir()
  fs.writeFileSync(stateFile, JSON.stringify({ ...defaultState(), ...next }, null, 2), 'utf-8')
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/state', (_req, res) => {
  res.json(readState())
})

app.put('/api/state', (req, res) => {
  writeState(req.body || {})
  res.json({ ok: true })
})

const distDir = path.join(process.cwd(), 'dist')
app.use(express.static(distDir))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(port, () => {
  console.log(`diet-tracker server running on :${port}`)
})

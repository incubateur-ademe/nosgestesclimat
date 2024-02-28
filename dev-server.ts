import express from 'express'
import cors from 'cors'
import fs from 'fs'
import { Server } from 'socket.io'
import { createServer } from 'http'

const app = express()
app.use(cors())

const server = createServer(app)
const port = 4000
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173'
  }
})

console.log('Initializing server...')
compileRules()
compilePersonas()
generateMigrationReport()
generateSituationCoverage()

io.on('connection', (_socket) => {
  console.log('a user connected')
})

///------------------ Compiles rules on change ---------------------
// TODO:
// - [ ] Add a flag to only watch and compile but don't start the server

// TODO:
// - [ ] could be faster if we track the rules in memory and only compile the ones that changed
const compilationWatcher = fs.watch(
  './data/',
  { recursive: true },
  (evt, name) => {
    if (name?.includes('.publicodes')) {
      console.log(`[rules:watcher] ${evt} ${name}`)
      console.log(`[rules:watcher] compiling rules...`)
      compileRules()
      generateSituationCoverage()
      generateMigrationReport()
    }
  }
)

const personaWatcher = fs.watch('./personas/', (evt, name) => {
  if (name?.includes('.yaml')) {
    console.log(`[personas:watcher] ${evt} ${name}`)
    console.log(`[personas:watcher] compiling personas...`)
    compilePersonas()
    generateSituationCoverage()
  }
})

const migrationWatcher = fs.watch('./migration/migration.yaml', (evt, name) => {
  console.log(`[migration:watcher] ${evt} ${name}`)
  console.log(`[migration:watcher] report generation...`)
  generateMigrationReport()
  console.log(`[migration:watcher] report generated`)
})

process.on('SIGINT', () => {
  console.log('Caught interrupt signal, closing watchers...')
  compilationWatcher.close()
  personaWatcher.close()
  migrationWatcher.close()
  process.exit(0)
})

///-------------------- Dev server for testing personas ----------------

// TODO:
// - [ ] add a way to cancel execution?
app.get('/testPersonas/:version/:persona', (req, res) => {
  const persona = req.params.persona
  const version = req.params.version

  console.log(`get /${version}/${persona}`)
  const start = Date.now()

  const proc = Bun.spawn(
    [
      'bun',
      './tests/testPersonas.mjs',
      '-p',
      persona,
      '-v',
      version,
      '--markdown'
    ],
    {
      onExit: async ({ exitCode }) => {
        // TODO: find a way to send the error message to the client
        if (exitCode !== 0) {
          res.send({ error: `Erreur lors de l'exécution du test` })
        }
      }
    }
  )

  new Response(proc.stdout).text().then((report) => {
    const timeElapsed = Date.now() - start
    res.send({ timeElapsed: timeElapsed, report })
    console.log(`Sent response for /${version}/${persona}`)
  })
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

function compileRules() {
  io.emit('compilation-status', {
    type: 'compiling',
    message: 'Règles en cours de compilation'
  })
  const proc = Bun.spawn(
    ['bun', './scripts/rulesToJSON.mjs', '-o', 'FR', '-t', 'fr', '-n'],
    {
      onExit: async ({ exitCode }) => {
        // TODO: find a way to send the error message to the client
        if (exitCode !== 0) {
          io.emit('compilation-status', {
            type: 'error',
            message: 'Impossible de compiler les règles'
          })
        }
      }
    }
  )
  new Response(proc.stdout).text().then((stdout) => {
    console.log(`[rules:watcher] done:\n${stdout}`)
    io.emit('compilation-status', {
      type: 'ok',
      message: 'Règles mises à jour'
    })
  })
}

function compilePersonas() {
  io.emit('compilation-status', {
    type: 'compiling',
    message: 'Personas en cours de compilation'
  })
  const proc = Bun.spawn(['bun', './scripts/personasToJSON.js'], {
    onExit: async ({ exitCode }) => {
      // TODO: find a way to send the error message to the client
      if (exitCode !== 0) {
        io.emit('compilation-status', {
          type: 'error',
          message: 'Impossible de compiler les personas'
        })
      }
    }
  })
  new Response(proc.stdout).text().then((stdout) => {
    console.log(`[personas:watcher] done:\n${stdout}`)
    io.emit('compilation-status', {
      type: 'ok',
      message: 'Personas mis à jour'
    })
  })
}

function generateSituationCoverage() {
  Bun.spawn(['bun', './tests/testSituationCoverage.mjs', '-m'], {
    stdout: Bun.file('./quick-doc/situation-coverage.md')
  })
}

function generateMigrationReport() {
  Bun.spawn(['bun', './scripts/migrationToJSON.mjs', '-m'], {
    stdout: Bun.file('./quick-doc/migration-report.md')
  })
}

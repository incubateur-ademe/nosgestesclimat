import express from 'express'
import fs from 'fs'

///------------------ Compiles rules on change ---------------------
// TODO:
// - [ ] Add a headless flag: only watch and compile but don't start the server

// TODO:
// - [ ] could be faster if we track the rules in memory and only compile the ones that changed
const compilationWatcher = fs.watch(
  './data/',
  { recursive: true },
  (evt, name) => {
    if (name?.includes('.publicodes')) {
      console.log(`[rules:watcher] ${evt} ${name}`)
      console.log(`[rules:watcher] compiling rules...`)
      bunRun(['./scripts/rulesToJSON.mjs', '-o', 'FR', '-t', 'fr', '-n'])
        .then((stdout) => {
          console.log(`[rules:watcher] done:\n${stdout}`)
        })
        .catch((err) => {
          console.error(`[rules:watcher] received error:\n${err}`)
        })
    }
  }
)

const personaWatcher = fs.watch('./personas/', (evt, name) => {
  if (name?.includes('.yaml')) {
    console.log(`[personas:watcher] ${evt} ${name}`)
    console.log(`[personas:watcher] compiling personas...`)
    bunRun(['./scripts/personasToJSON.js'])
      .then((stdout) => {
        console.log(`[personas:watcher] done:\n${stdout}`)
      })
      .catch((err) => {
        console.error(`[personas:watcher] received error:\n${err}`)
      })
  }
})

process.on('SIGINT', () => {
  console.log('Caught interrupt signal, closing watchers...')
  compilationWatcher.close()
  personaWatcher.close()
  process.exit(0)
})

///-------------------- Dev server for testing personas ----------------

const app = express()
const port = 4000

// TODO:
// - [ ] improve error handling
// - [ ] add a way to cancel execution?
app.get('/testPersonas/:version/:persona', (req, res) => {
  const persona = req.params.persona
  const version = req.params.version

  console.log(`get /${version}/${persona}`)
  const start = Date.now()
  bunRun([
    './tests/testPersonas.mjs',
    '-p',
    persona,
    '-v',
    version,
    '--markdown'
  ]).then((report) => {
    const timeElapsed = Date.now() - start
    res.send({ timeElapsed: timeElapsed, report })
    console.log(`Sent response for /${version}/${persona}`)
  })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

function bunRun(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(['bun', ...cmd])
  return new Response(proc.stdout).text()
}

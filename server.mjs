import express from 'express'
import { exec } from 'child_process'
import { $ } from 'bun'

const app = express()
const port = 4000

// TODO:
// - [ ] improve error handling
// - [ ] add a way to cancel execution?
// - [ ] test with bun to see if it's improve speed
app.get('/testPersonas/:version/:persona', (req, res) => {
  const persona = req.params.persona
  const version = req.params.version

  console.log(`get /${version}/${persona}`)
  // compilePersonas((_stdout) => {
  //   console.log('Compiled personas')
  const start = Date.now()
  exec(
    `bun ./tests/testPersonas.mjs -p \'${persona}\' -v \'${version}\' --markdown`,
    (err, stdout, _stderr) => {
      const timeElapsed = Date.now() - start
      if (err) {
        console.error(err)
        res.send({ error: err })
        console.log(`Sent error response for /${version}/${persona}`)
      } else {
        res.send({ timeElapsed: timeElapsed, report: stdout })
        console.log(`Sent response for /${version}/${persona}`)
      }
    }
  )
  // })
})

app.get('/compile-personas', (_req, res) => {
  console.log('get /compile-personas')
  compilePersonas((stdout) => {
    res.send(stdout)
    console.log('Sent response for /compile-personas')
  })
})

function compilePersonas(onCompileComplete) {
  exec(`bun ./scripts/personasToJSON.js`, (err, stdout, _stderr) => {
    if (err) {
      console.error(err)
    } else {
      onCompileComplete(stdout)
    }
  })
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

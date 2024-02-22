import express from 'express'
import { exec } from 'child_process'

const app = express()
const port = 4000

app.get('/:version/:persona', (req, res) => {
  const persona = req.params.persona
  const version = req.params.version

  console.log(`get /${version}/${persona}`)
  exec(
    `node ./tests/testPersonas.mjs -p \'${persona}\' -v \'${version}\' --markdown`,
    (err, stdout, _stderr) => {
      if (err) {
        console.error(err)
      } else {
        res.send(stdout)
        console.log(`Sent response for /${version}/${persona}`)
      }
    }
  )
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

import express from 'express'
import { exec } from 'child_process'

const app = express()
const port = 4000

app.get('/:persona', (req, res) => {
  const persona = req.params.persona
  console.log(` get /${persona}`)
  exec(
    `node ./tests/testPersonas.mjs -p \'${persona}\' --markdown`,
    (err, stdout, _stderr) => {
      if (err) {
        console.error(err)
      } else {
        res.send(stdout)
        console.log('OK')
      }
    }
  )
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

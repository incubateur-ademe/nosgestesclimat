const path = require('path')
const fs = require('fs')

const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')
const cli = require('@incubateur-ademe/nosgestesclimat-scripts/cli')

const outputJSONPath = './public'

const { markdown } = cli.getArgs(
  `Combines migrations instructions into a JSON file.`,
  {
    source: true,
    markdown: true,
    target: true,
  }
)

const writeMigration = (migration, path) => {
  fs.writeFile(path, JSON.stringify(migration), function (err) {
    if (err) {
      if (markdown) {
        console.log(
          `| Migration instructions compilation to JSON | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
        )
      } else {
        console.error(
          ` ❌ An error occured while compililing migration instructions to JSON`
        )
        console.error(err)
      }

      return -1
    }
    console.log(
      markdown
        ? `| Migration instructions compilation to JSON | :heavy_check_mark: | Ø |`
        : `✅ Migration instructions compilation to JSON`
    )
  })
}

const baseMigration = utils.readYAML(
  path.resolve(`migration/migration.yaml`)
)

writeMigration(
  baseMigration,
  path.join(outputJSONPath, `migration.json`)
)

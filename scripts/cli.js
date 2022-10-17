/*
	Utils functions for parsing command line arguments via yargs.
*/

const yargs = require('yargs')

const getArgs = (description) => {
	const argv = yargs
		.usage(`${description}\n\nUsage: node $0 [options]`)
		.option('srcFolder', {
			alias: 's',
			type: 'string',
			description: `Source folder of rules we want to convert`,
		})
		.option('destFile', {
			alias: 'd',
			type: 'string',
			description: `Destination filename`,
		})
		.option('rules', {
			alias: 'r',
			type: 'string',
			description: `Rule names we want to be evaluated to check if the engine works properly for rules set. It is possible to evaluate multiple rules separating it with ','`,
		})
		.help()
		.alias('help', 'h').argv

	const srcFolder = argv.srcFolder ?? '**'
	const destFile = argv.destFile ?? 'co2'
	const rulesToEvaluate = argv.rules ?? 'bilan'

	return { srcFolder, destFile, rulesToEvaluate }
}

module.exports = {
	getArgs,
}

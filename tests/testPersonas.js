const fs = require('fs/promises')
const path = require('path')
const yargs = require('yargs')
const i18nUtils = require('./../scripts/i18n/utils')

const { testPersonas, printResults } = require('./commons')

const { country, language, markdown } = yargs(process.argv.slice(2))
	.usage('Compare local and prod personas results\n\nUsage: $0 [options]')
	.option('country', {
		alias: 'c',
		describe: 'Target country code',
		type: 'string',
		default: 'FR',
	})
	.option('language', {
		alias: 'l',
		describe: 'Target language code',
		type: 'string',
		default: i18nUtils.defaultLang,
		choices: i18nUtils.availableLanguages,
	})
	.option('markdown', {
		alias: 'm',
		type: 'boolean',
		description: 'Prints the result in a Markdown table format.',
	})

	.help('h')
	.alias('h', 'help').argv

const modelFile = `co2-model.${country}-lang.${language}.json`
const localRules = fs
	.readFile(path.join('./public', modelFile), {
		encoding: 'utf8',
	})
	.then((res) => JSON.parse(res))
	.catch((e) => {
		console.log(
			`No local rules found for ${country} and ${language}, using prod rules:`
		)
		console.log(e.message)
		process.exit(-1)
	})

const localPersonas = fs
	.readFile(`./public/personas-${language}.json`, {
		encoding: 'utf8',
	})
	.then((res) => JSON.parse(res))
	.catch((e) => {
		console.log(
			`No local personas found for ${country} and ${language}, using prod personas:`
		)
		console.log(e.message)
		process.exit(-1)
	})

const prodRules = fetch('https://data.nosgestesclimat.fr/' + modelFile)
	.then((res) => res.json())
	.catch((e) => {
		console.log(
			`No prod rules found for ${country} and ${language}, using local rules:`
		)
		console.log(e.message)
		process.exit(-1)
	})
const prodPersonas = fetch(
	`https://data.nosgestesclimat.fr/personas-${language}.json`
)
	.then((res) => res.json())
	.catch((e) => {
		console.log(
			`No prod personas found for ${country} and ${language}, using local personas:`
		)
		console.log(e.message)
		process.exit(-1)
	})

const allData = Promise.all([
	localRules,
	localPersonas,
	prodRules,
	prodPersonas,
])

allData.then((res) => {
	const localResults = testPersonas(res[0], res[1])
	const prodResults = testPersonas(res[2], res[3])
	printResults(localResults, prodResults, markdown)
})

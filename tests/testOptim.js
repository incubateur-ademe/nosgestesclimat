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

const baseRules = fs
	.readFile(`./public/co2-model.${country}-lang.${language}.json`, {
		encoding: 'utf8',
	})
	.then((res) => JSON.parse(res))
	.catch((e) => {
		console.log(
			`No local rules found for ${country} and ${language}, using base rules:`
		)
		console.log(e.message)
		process.exit(-1)
	})

const optimRules = fs
	.readFile(`./public/co2-model.${country}-lang.${language}-opti.json`, {
		encoding: 'utf8',
	})
	.then((res) => JSON.parse(res))
	.catch((e) => {
		console.log(
			`No local rules found for ${country} and ${language}, using base rules:`
		)
		console.log(e.message)
		process.exit(-1)
	})

const personas = fs
	.readFile(`./public/personas-${language}.json`, {
		encoding: 'utf8',
	})
	.then((res) => JSON.parse(res))
	.catch((e) => {
		console.log(
			`No local personas found for ${country} and ${language}, using personas:`
		)
		console.log(e.message)
		process.exit(-1)
	})

const allData = Promise.all([optimRules, personas, baseRules])

allData.then((res) => {
	const optimResults = testPersonas(res[0], res[1])
	const baseResults = testPersonas(res[2], res[1])
	printResults(optimResults, baseResults, markdown, true)
})

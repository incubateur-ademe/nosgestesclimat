const fs = require('fs/promises')
const path = require('path')
const yargs = require('yargs')
const i18nUtils = require('./../scripts/i18n/utils')
const { disabledLogger } = require('publiopti')

// type RawRules = Record<string, any>
//
// export type RuleName = string
// export type Persona = {
// 	nom: string
// 	description: string
// 	icônes: string
// 	data: RawRules | { situation: RawRules }
// }
//
function col(str, color) {
	return color + str + '\x1b[0m'
}

const c = {
	orange: (str) => col(str, '\x1b[33m'),
	red: (str) => col(str, '\x1b[31m'),
	green: (str) => col(str, '\x1b[32m'),
	white: (str) => col(str, '\x1b[37m'),
	gray: (str) => col(str, '\x1b[90m'),
	yellow: (str) => col(str, '\x1b[93m'),
	dim: (str) => col(str, '\x1b[2m'),
}

const Engine = require('publicodes').default

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

const kgCO2Str = c.dim('(kg CO2e)')

function formatValueInKgCO2e(value) {
	return c.yellow(Math.round(value).toLocaleString('en-us')) + ' ' + kgCO2Str
}

function fmtCLIErr(localResult, prodResult, diff, diffPercent, name, color) {
	const sign = diff > 0 ? '+' : ''
	const hd = color(diffPercent < 1 ? '[WARN]' : '[FAIL]')
	return `${hd} ${name} [${color(sign + diff)} ${kgCO2Str}, ${color(
		sign + diffPercent
	)}%]: ${formatValueInKgCO2e(localResult)} != ${formatValueInKgCO2e(
		prodResult
	)}`
}

function fmtGHActionErr(localResult, prodResult, diff, diffPercent, name) {
	const color =
		diffPercent <= 1 ? 'sucess' : diffPercent > 5 ? 'critical' : 'important'
	const sign = diff > 0 ? '%2B' : '-'
	return `|![](https://img.shields.io/badge/${name.replaceAll(
		' ',
		'%20'
	)}-${sign}${Math.round(diff).toLocaleString(
		'en-us'
	)}%20kgCO2e-${color}?style=flat-square) | **${localResult.toLocaleString(
		'en-us'
	)}** | ${prodResult.toLocaleString('en-us')} | ${
		diff > 0 ? '+' : '-'
	}${diffPercent}% |`
}

function printResults(localResults, prodResults, withOptim = false) {
	if (markdown) {
		console.log(`#### ${withOptim ? 'With optimisation' : 'Base model'}`)
		console.log(
			`| Persona | Total PR ${
				withOptim ? 'with optim' : ''
			} (kg CO2e) | Total Prod (kg CO2e) | Δ (%) |`
		)
		console.log('|:-----|:------:|:------:|:----:|')
	} else {
		console.log(
			`${
				withOptim
					? c.white('====== With optimisation ======')
					: c.white('====== Base model ======')
			}`
		)
	}
	for (let name in localResults) {
		if (localResults[name] !== prodResults[name]) {
			const localResult = Math.round(localResults[name])
			const prodResult = Math.round(prodResults[name])
			const diff = localResult - prodResult
			const diffPercent = Math.round((diff / prodResult) * 100)
			const color = diffPercent <= 1 ? 'orange' : 'red'

			console.log(
				markdown
					? fmtGHActionErr(
							localResult,
							prodResult,
							diff,
							diffPercent,
							name,
							color
					  )
					: fmtCLIErr(
							localResult,
							prodResult,
							diff,
							diffPercent,
							name,
							c[color]
					  )
			)
		} else if (!markdown) {
			console.log(
				`${c.green('[PASS]')} ${name}: ${formatValueInKgCO2e(
					localResults[name]
				)}`
			)
		}
	}
}

function testPersonas(rules, personas) {
	const engine = new Engine(rules, { logger: disabledLogger })
	const missingVariables = Object.keys(
		engine.evaluate('bilan').missingVariables
	)

	const personasRules = Object.values(personas)

	const results = {}

	for (let persona of personasRules) {
		const personaData = persona.data.situation ?? persona.data
		const validPersonaRules = Object.keys(personaData).filter((rule) =>
			missingVariables.includes(rule)
		)

		const validPersonaRulesObject = validPersonaRules.reduce(
			(acc, cur) => ({ ...acc, [cur]: personaData[cur] }),
			{}
		)
		engine.setSituation(validPersonaRulesObject)
		results[persona.nom] = engine.evaluate('bilan').nodeValue
	}

	return results
}

function comparePersonas(localRules, localPersonas, prodRules, prodPersonas) {
	const allData = Promise.all([
		localRules,
		localPersonas,
		prodRules,
		prodPersonas,
	])

	allData.then((res) => {
		const localResults = testPersonas(res[0], res[1])
		const prodResults = testPersonas(res[2], res[3])
		printResults(localResults, prodResults)
	})
}

module.exports = {
	comparePersonas,
}

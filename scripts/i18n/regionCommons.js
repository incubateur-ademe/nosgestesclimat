/// ---------------------- Retrieving the regions models ----------------------

const path = require('path')
const fs = require('fs')
const { exit } = require('process')

const { publicDir, readYAML } = require('./utils')
const regionModelsPath = path.resolve('data/i18n/models')

const defaultModelCode = 'FR'
const defaultRegionModelParam = {
	[defaultModelCode]: {
		nom: 'France métropolitaine',
		gentilé: 'française',
		code: defaultModelCode,
	},
}
const supportedRegionPath = path.join(publicDir, `supportedRegions.json`)

//
// Reads all regions models and create a json file containing params of each region.
//
// Only XX-fr.yaml files are read in 'data/i18n/models' directory, their are the base models.
// (XX-YY.yaml files are not read, they are the translation of the base models.)
//
// The default region and hardcoded one is FR.
//
const supportedRegions = fs
	.readdirSync(regionModelsPath)
	.reduce((acc, filename) => {
		if (!filename.match(/([A-Z]{2})-fr.yaml/)) {
			return acc
		}
		try {
			const regionPath = path.join(regionModelsPath, filename)
			const rules = readYAML(regionPath)
			const params = rules['params']
			if (params === undefined) {
				console.log(
					` ❌ The file ${filename} doesn't contain a 'params' key, aborting...`
				)
				exit(-1)
			}
			return { ...acc, [rules.params.code]: params }
		} catch (err) {
			console.log(
				' ❌ An error occured while reading the file:',
				filename,
				':\n\n',
				err.message
			)
			exit(-1)
		}
	}, defaultRegionModelParam)

const supportedRegionCodes = Object.keys(supportedRegions)

module.exports = {
	supportedRegionPath,
	supportedRegionCodes,
	supportedRegions,
	defaultModelCode,
	regionModelsPath,
}

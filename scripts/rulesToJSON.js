/*
	Aggregates the model to an unique JSON file for each targeted language.

	Command: yarn compile:rules -- [options]
*/

const yaml = require('yaml')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const { exit } = require('process')
const Engine = require('publicodes').default

const utils = require('./i18n/utils')
const cli = require('./i18n/cli')
const outputJSONPath = './public'

const {
	addTranslationToBaseRules,
} = require('./i18n/addTranslationToBaseRules')

const { srcLang, srcFile, destLangs, markdown, compress } = cli.getArgs(
	`Aggregates the model to an unique JSON file.`,

	{
		source: true,
		target: true,
		file: true,
		defaultSrcFile: 'data/**/*.yaml',
		markdown: true,
		compress: true,
	}
)

const writeRules = (rules, path, destLang) => {
	fs.writeFile(path, JSON.stringify(rules), function (err) {
		if (err) {
			if (markdown) {
				console.log(
					`| Rules compilation to JSON for _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
				)
			} else {
				console.log(' ❌ An error occured while writting rules in:', path)
				console.log(err.message)
			}
			exit(-1)
		}
		console.log(
			markdown
				? `| Rules compilation to JSON for _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in JSON in: ${path}`
		)
	})
}

// Retrieve the reference used for the [nodeName], if the rule is referenced in the
// same parent namespace.
//
// For example, the [nodeName] 'a . b . c' is referenced by 'c' in the following rule
// definition:
//
// a . b:
//   formula: c * 2
//
// FIXME: needs to support 'b . c' and 'a . b .c'.
const getRefNameOf = (nodeName, parsedRulesParents, directDependant) => {
	const foundParent = parsedRulesParents.find(({ nodeKind, dottedName }) => {
		if (nodeKind === 'reference') {
			return dottedName === directDependant
		}
		return false
	})

	if (foundParent) {
		const splittedParentDottedName = foundParent.dottedName.split(' . ')
		const splittedNodeName = nodeName.split(' . ')

		return splittedNodeName
			.slice(splittedParentDottedName.length, splittedNodeName.length)
			.join(' . ')
	}
	return nodeName
}

const getCompressedRules = (baseRules) => {
	const engine = new Engine(baseRules)
	const parsedRules = engine.getParsedRules()
	const graph = getDependencyGraph(
		baseRules,
		engine.baseContext.referencesMaps.referencesIn
	)

	const { compressibleNodes } = getCompressibleNodes(
		graph,
		engine.getParsedRules()
	)

	return compressibleNodes.reduce((rules, nodeToCompress) => {
		console.log('parsedRules:', parsedRules[nodeToCompress])
		const parsedRule = parsedRules[nodeToCompress]
		const formule = parsedRule.rawNode.formule

		if (formule) {
			switch (typeof formule) {
				case 'string': {
					// Replace all parent refs by the formula.
					const directDependents = graph.directDependantsOf(nodeToCompress)

					directDependents.forEach((directDep) => {
						const directDepFormula = rules[directDep].formule
						console.log('rules[parent].formula:', directDepFormula)

						const refName = getRefNameOf(
							nodeToCompress,
							parsedRule.explanation.parents,
							directDep
						)
						if (directDepFormula) {
							switch (typeof directDepFormula) {
								case 'string': {
									rules[directDep].formule = directDepFormula.replaceAll(
										refName,
										'(' + formule + ')'
									)
									// console.log('Compressed', nodeToCompress, 'in', directDep)
									// console.log('Formule:', rules[directDep].formule)
									break
								}
								case 'object': {
									rules[directDep].formule = Object.keys(
										directDepFormula
									).reduce((directDepFormula, attr) => {
										switch (attr) {
											case 'somme': {
												const somme = directDepFormula.somme.map((term) => {
													return term.replaceAll(refName, '(' + formule + ')')
												})
												console.log('Replaced:', somme)
												return { ...directDepFormula, somme }
											}
											default:
												console.log('Not found:', Object.keys(directDepFormula))
										}
									}, directDepFormula)
								}
								default:
									console.log('Uncompressible formula:', formule)
							}
						} else {
							console.error(
								'Error for parent:',
								directDep,
								'of the node:',
								nodeToCompress
							)
						}
					})

					console.log(
						'directDependantsOf:',
						graph.directDependantsOf(nodeToCompress)
					)
					break
				}
				default:
					console.log('Uncompressible formula:', formule)
			}
		}
		rules[nodeToCompress] = undefined
		return rules
	}, baseRules)
}

// glob(srcFile, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
// 	const defaultDestPath = path.join(outputJSONPath, `co2-${srcLang}.json`)
// 	var baseRules = files.reduce((acc, filename) => {
// 		try {
// 			const rules = utils.readYAML(path.resolve(filename))
// 			return { ...acc, ...rules }
// 		} catch (err) {
// 			console.log(
// 				' ❌ Une erreur est survenue lors de la lecture du fichier',
// 				filename,
// 				':\n\n',
// 				err.message
// 			)
// 			exit(-1)
// 		}
// 	}, {})
//
// 	if (compress) {
// 		baseRules = getCompressedRules(baseRules)
// 	}
//
// 	try {
// 		// new Engine(baseRules).evaluate('bilan')
//
// 		if (markdown) {
// 			console.log('| Task | Status | Message |')
// 			console.log('|:-----|:------:|:-------:|')
// 		}
// 		console.log(
// 			markdown
// 				? `| Rules evaluation | :heavy_check_mark: | Ø |`
// 				: ' ✅ Les règles ont été évaluées sans erreur !'
// 		)
//
// 		writeRules(baseRules, defaultDestPath, srcLang)
//
// 		destLangs.forEach((destLang) => {
// 			const destPath = path.join(outputJSONPath, `co2-${destLang}.json`)
// 			const translatedRuleAttrs =
// 				utils.readYAML(
// 					path.resolve(`data/translated-rules-${destLang}.yaml`)
// 				) ?? {}
// 			const translatedRules = addTranslationToBaseRules(
// 				baseRules,
// 				translatedRuleAttrs
// 			)
// 			writeRules(translatedRules, destPath, destLang)
// 		})
// 	} catch (err) {
// 		if (markdown) {
// 			console.log(
// 				`| Rules evaluation | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
// 			)
// 			console.log(err)
// 		} else {
// 			console.log(
// 				' ❌ Une erreur est survenue lors de la compilation des règles:\n'
// 			)
// 			let lines = err.message.split('\n')
// 			for (let i = 0; i < 9; ++i) {
// 				if (lines[i]) {
// 					console.log('  ', lines[i])
// 				}
// 			}
// 			console.log()
// 		}
// 	}
// })
//
// fs.copyFileSync('../data/co2-opti.yaml', outputJSONPath + '/co2-opti.json')

glob(
	'data/co2-opti.json',
	{ ignore: ['data/translated-*.yaml'] },
	(_, files) => {
		const defaultDestPath = path.join(outputJSONPath, `co2-${srcLang}.json`)

		console.log('rules:', files)
		var baseRules = files.reduce((acc, filename) => {
			try {
				const rules = utils.readYAML(path.resolve(filename))
				return { ...acc, ...rules }
			} catch (err) {
				console.log(
					' ❌ Une erreur est survenue lors de la lecture du fichier',
					filename,
					':\n\n',
					err.message
				)
				exit(-1)
			}
		}, {})

		console.log('baseRules:', baseRules)
		// if (compress) {
		// 	baseRules = getCompressedRules(baseRules)
		// }
		//
		try {
			// new Engine(baseRules).evaluate('bilan')

			if (markdown) {
				console.log('| Task | Status | Message |')
				console.log('|:-----|:------:|:-------:|')
			}
			console.log(
				markdown
					? `| Rules evaluation | :heavy_check_mark: | Ø |`
					: ' ✅ Les règles ont été évaluées sans erreur !'
			)

			writeRules(baseRules, defaultDestPath, srcLang)

			// destLangs.forEach((destLang) => {
			// 	const destPath = path.join(outputJSONPath, `co2-${destLang}.json`)
			// 	const translatedRuleAttrs =
			// 		utils.readYAML(
			// 			path.resolve(`data/translated-rules-${destLang}.yaml`)
			// 		) ?? {}
			// 	const translatedRules = addTranslationToBaseRules(
			// 		baseRules,
			// 		translatedRuleAttrs
			// 	)
			// 	writeRules(translatedRules, destPath, destLang)
			// })
		} catch (err) {
			if (markdown) {
				console.log(
					`| Rules evaluation | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
				)
				console.log(err)
			} else {
				console.log(
					' ❌ Une erreur est survenue lors de la compilation des règles:\n'
				)
				let lines = err.message.split('\n')
				for (let i = 0; i < 9; ++i) {
					if (lines[i]) {
						console.log('  ', lines[i])
					}
				}
				console.log()
			}
		}
	}
)

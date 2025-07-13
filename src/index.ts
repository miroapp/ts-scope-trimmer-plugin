import type * as ts from 'typescript/lib/tsserverlibrary'
import { loadConfig } from './config'
import { patchGetScriptFileNames, patchGetProgram } from './patches'
import type { PatchedLanguageServiceHost, FilesInScope } from './types'

// should be global because init can be called multiple times
const FILES_IN_SCOPE: FilesInScope = new Set()

const init: ts.server.PluginModuleFactory = ({ typescript }) => {
	const create: ts.server.PluginModule['create'] = (info) => {
		const config = loadConfig(info)

		if (!config.enabled) {
			info.project.projectService.logger.info(`ts-scope-trimmer-plugin is disabled`)

			return info.languageService
		}

		info.project.projectService.logger.info(
			`ts-scope-trimmer-plugin is enabled to boost the tsserver performance, config: ${JSON.stringify(config)}`,
		)

		const languageServiceHost = {} as PatchedLanguageServiceHost

		const languageServiceHostProxy = new Proxy(info.languageServiceHost, {
			get(target, key: keyof ts.LanguageServiceHost) {
				return languageServiceHost[key] ? languageServiceHost[key] : target[key]
			},
		})

		const languageService = typescript.createLanguageService(languageServiceHostProxy)

		patchGetScriptFileNames({
			info,
			patchedLanguageServiceHost: languageServiceHost,
			config,
			filesInScope: FILES_IN_SCOPE,
		})

		patchGetProgram({ info, languageService, config, filesInScope: FILES_IN_SCOPE })

		return languageService
	}

	return { create }
}

export = init

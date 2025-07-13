import type * as ts from 'typescript/lib/tsserverlibrary'
import { isMatch } from 'micromatch'
import { relative } from 'path'
import type { FilesInScope, PatchedLanguageServiceHost, Config } from './types'
import { debug } from './debug'

// core part to limit the TS server scope based on the open files
export const patchGetScriptFileNames = ({
	info,
	patchedLanguageServiceHost,
	filesInScope,
	config,
}: {
	info: ts.server.PluginCreateInfo
	patchedLanguageServiceHost: PatchedLanguageServiceHost
	filesInScope: FilesInScope
	config: Config
}): void => {
	const originalGetScriptFileNames = info.languageServiceHost.getScriptFileNames

	patchedLanguageServiceHost.getScriptFileNames = () => {
		// keys are lowercased here by default, so we have to lowercase paths in all other places
		const openFiles = Array.from(info.project.projectService.openFiles.keys())

		const allFileNames = originalGetScriptFileNames.call(info.languageServiceHost).map((file) => file.toLowerCase())

		for (const openFile of openFiles) {
			filesInScope.add(openFile)
		}

		debug({
			config,
			info,
			source: 'patchGetScriptFileNames',
			message: `${openFiles.length} open files added to the scope: ${openFiles.join(', ')}. Scope size: ${filesInScope.size}`,
		})

		if (config.alwaysInclude.length > 0) {
			const alwaysIncludedFiles = allFileNames.filter((file) => {
				const relativeFilePath = config.projectRootPath ? relative(config.projectRootPath, file) : file

				return isMatch(relativeFilePath, config.alwaysInclude)
			})

			alwaysIncludedFiles.forEach((file) => {
				filesInScope.add(file)
			})

			debug({
				config,
				info,
				source: 'patchGetScriptFileNames',
				message: `${alwaysIncludedFiles.length} files matching "always include" pattern added to the scope. ${alwaysIncludedFiles.join(', ')} Scope size: ${filesInScope.size}`,
			})
		}

		const filtered = allFileNames.filter((file) => {
			return filesInScope.has(file)
		})

		debug({
			config,
			info,
			source: 'patchGetScriptFileNames',
			message: `${filtered.length} out of ${allFileNames.length} files returned`,
		})

		return filtered
	}
}

// to extend the TS server scope with dependencies of the open files,
// which fixes navigation bugs in case of using barrel files
export const patchGetProgram = ({
	info,
	languageService,
	filesInScope,
	config,
}: {
	info: ts.server.PluginCreateInfo
	languageService: ts.LanguageService
	filesInScope: FilesInScope
	config: Config
}): void => {
	const originalGetProgram = languageService.getProgram

	languageService.getProgram = () => {
		const program = originalGetProgram.call(languageService)
		const sourceFiles = program?.getSourceFiles() ?? []
		const sourceFilesNames = sourceFiles.map(({ fileName }) => fileName.toLowerCase())

		sourceFilesNames.forEach((fileName) => {
			filesInScope.add(fileName)
		})

		debug({
			config,
			info,
			source: 'patchGetProgram',
			message: `${sourceFilesNames.length} source files added to the scope: ${sourceFilesNames.join(', ')}. Scope size: ${filesInScope.size}`,
		})

		return program
	}
}

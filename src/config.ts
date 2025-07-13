import type * as ts from 'typescript/lib/tsserverlibrary'
import { join, dirname } from 'path'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import type { Config, ProjectRootPath, UserConfig } from './types'
import { debug } from './debug'

const DEFAULT_CONFIG: UserConfig = {
	enabled: false,
	debug: false,
	alwaysInclude: [],
}

const CONFIG_FILE_NAME = 'ts-scope-trimmer.json'

const loadConfigFile = (
	info: ts.server.PluginCreateInfo,
	projectRootPath: ProjectRootPath,
): Partial<UserConfig> | null => {
	if (!projectRootPath) {
		return null
	}

	const configPath = join(projectRootPath, CONFIG_FILE_NAME)

	if (!existsSync(configPath)) {
		debug({
			config: info.config,
			info,
			source: 'loadConfigFile',
			message: `config file not found at ${configPath}`,
		})

		return null
	}

	try {
		const configContent = readFileSync(configPath, 'utf-8')
		const parsedConfig = JSON.parse(configContent) as Partial<UserConfig>

		return parsedConfig
	} catch (error) {
		debug({
			config: info.config,
			info,
			source: 'loadConfigFile',
			message: `error parsing config file at ${configPath}: ${error}`,
			type: 'Err',
		})

		return null
	}
}

// to get root path based on any open file, the same as ProjectRootPath in tsserver
const getProjectRootPath = (info: ts.server.PluginCreateInfo): ProjectRootPath => {
	const anyOpenFile = Array.from(info.project.projectService.openFiles.entries())[0]

	if (!anyOpenFile) {
		debug({
			config: info.config,
			info,
			source: 'getProjectRootPath',
			message: 'no open files found',
			type: 'Err',
		})

		return null
	}

	const [anyOpenFilePath, projectRootPath] = anyOpenFile

	if (projectRootPath) {
		return projectRootPath.toLowerCase()
	}

	// projectRootPath can be undefined in JetBrains products, e.g. WebStorm.
	// in this case, we fallback to find the git repository root
	debug({
		config: info.config,
		info,
		source: 'getProjectRootPath',
		message: 'using fallback to find projectRootPath by the git repository root',
	})

	try {
		const gitRoot = execSync('git rev-parse --show-toplevel', { cwd: dirname(anyOpenFilePath) })
			.toString()
			.trim()

		return gitRoot.toLowerCase()
	} catch (error) {
		debug({
			config: info.config,
			info,
			source: 'getProjectRootPath',
			message: `error finding the git repository root: ${error}`,
			type: 'Err',
		})

		return null
	}
}

export const loadConfig = (info: ts.server.PluginCreateInfo): Config => {
	const { name, ...pluginConfig } = info.config as Partial<UserConfig> & { name: string }

	const projectRootPath = getProjectRootPath(info)

	if (!projectRootPath) {
		debug({
			config: info.config,
			info,
			source: 'loadConfig',
			message: `no project root path found, which means: user config from ${CONFIG_FILE_NAME} won't be loaded; "alwaysInclude" might work incorrectly if there are relative paths`,
		})
	}

	const fileConfig = loadConfigFile(info, projectRootPath)

	// merge configurations with priority: file config > plugin config (from tsconfig.json) > defaults
	const mergedConfig: Config = {
		...DEFAULT_CONFIG,
		...pluginConfig,
		...fileConfig,
		projectRootPath,
	}

	debug({
		config: mergedConfig,
		info,
		source: 'loadConfig',
		message: `plugin config: ${JSON.stringify(pluginConfig)} | file config: ${JSON.stringify(fileConfig)} | projectRootPath: ${projectRootPath}`,
	})

	return mergedConfig
}

import type * as ts from 'typescript/lib/tsserverlibrary'
import type { UserConfig } from './types'

// to avoid importing ts enum in runtime
type DebugType = `${ts.server.Msg}`

export const debug = ({
	info,
	source,
	message,
	config,
	type = 'Info',
}: {
	info: ts.server.PluginCreateInfo
	source: string
	message: string
	config: UserConfig
	type?: DebugType
}): void => {
	if (config.debug) {
		info.project.projectService.logger.msg(
			`[ts-scope-trimmer-plugin debug: ${source}] ${message}`,
			type as ts.server.Msg,
		)
	}
}

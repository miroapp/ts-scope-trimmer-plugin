import type * as ts from 'typescript/lib/tsserverlibrary'

export type FilesInScope = Set<string>

export type PatchedLanguageServiceHost = Partial<ts.LanguageServiceHost>

export type ProjectRootPath = string | null

export type UserConfig = {
	enabled: boolean
	debug: boolean
	alwaysInclude: string[]
}

export type Config = UserConfig & {
	projectRootPath: ProjectRootPath
}

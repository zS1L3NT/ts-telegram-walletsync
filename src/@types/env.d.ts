declare namespace NodeJS {
	interface ProcessEnv {
		readonly WALLET__API_URL: string
		readonly WALLET__USERNAME: string
		readonly WALLET__PASSWORD: string
	}
}

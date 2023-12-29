declare namespace NodeJS {
	interface ProcessEnv {
		readonly DBS__USERNAME: string
		readonly DBS__PASSWORD: string
		readonly TELEGRAM_API_KEY: string
		readonly WALLET__API_URL: string
		readonly WALLET__USERNAME: string
		readonly WALLET__PASSWORD: string
	}
}

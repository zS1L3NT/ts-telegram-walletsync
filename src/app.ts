import TelegramBot from "node-telegram-bot-api"

const bot = new TelegramBot(Bun.env.TELEGRAM_API_KEY, { polling: true })

const isAuthenticated = async (username?: string) => {
	return username === "zS1L3NT"
}

bot.onText(/\/start/, message => {
	if (!isAuthenticated(message.from?.username)) {
		bot.sendMessage(message.chat.id, "You aren't authorized to use this bot.")
		return
	}
})

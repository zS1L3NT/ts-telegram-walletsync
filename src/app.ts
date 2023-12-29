import { exists, mkdir } from "fs/promises"
import TelegramBot from "node-telegram-bot-api"
import { resolve } from "path"

import dbs from "./dbs"
import process from "./process"
import wallet from "./wallet"

const bot = new TelegramBot(Bun.env.TELEGRAM_API_KEY, { polling: true })

if (!(await exists(resolve("data")))) {
	await mkdir(resolve("data"))
}

const isAuthenticated = async (username?: string) => {
	return username === "zS1L3NT"
}

bot.onText(/\/start/, async message => {
	if (!isAuthenticated(message.from?.username)) {
		bot.sendMessage(message.from!.id, "You aren't authorized to use this bot.")
		return
	}

	const { differences } = process(await dbs(), await wallet())
	await bot.sendMessage(message.from!.id, differences, {
		parse_mode: "HTML",
		reply_markup: {
			inline_keyboard: [
				[
					{ text: "Refresh DBS", callback_data: "dbs" },
					{ text: "Refresh Wallet", callback_data: "wallet" },
				],
				[{ text: "Refresh Both", callback_data: "both" }],
			],
		},
	})
})

bot.on("callback_query", async message => {
	if (!isAuthenticated(message.from?.username)) {
		bot.sendMessage(message.from.id, "You aren't authorized to use this bot.")
		return
	}

	const mode = message.data!
	const dbsfile = Bun.file("data/dbs.json")
	const walletfile = Bun.file("data/wallet.json")

	const dbsdata =
		["dbs", "both"].includes(mode) || !(await dbsfile.exists())
			? await dbs()
			: await dbsfile.json()
	const waldata =
		["wallet", "both"].includes(mode) || !(await walletfile.exists())
			? await wallet()
			: await walletfile.json()

	const { differences } = process(dbsdata, waldata)

	if (message.message?.text !== differences) {
		await bot.editMessageText(differences, {
			chat_id: message.from.id,
			message_id: message.message?.message_id,
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[
						{ text: "Refresh DBS", callback_data: "dbs" },
						{ text: "Refresh Wallet", callback_data: "wallet" },
					],
					[{ text: "Refresh Both", callback_data: "both" }],
				],
			},
		})
	}
})

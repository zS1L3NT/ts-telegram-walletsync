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

const hidefile = Bun.file("data/hidden.json")
if (!(await hidefile.exists())) {
	await Bun.write(hidefile, JSON.stringify([]))
}

const isAuthenticated = async (username?: string) => {
	return username === "zS1L3NT"
}

bot.onText(/\/start/, async message => {
	if (!isAuthenticated(message.from?.username)) {
		bot.sendMessage(message.from!.id, "You aren't authorized to use this bot.")
		return
	}

	const messageId = await bot.sendMessage(message.from!.id, "Starting...").then(m => m.message_id)

	try {
		await bot.editMessageText("Scraping DBS...", {
			chat_id: message.from!.id,
			message_id: messageId,
		})
		const dbsdata = await dbs()

		await bot.editMessageText("Scraping Wallet...", {
			chat_id: message.from!.id,
			message_id: messageId,
		})
		const waldata = await wallet()

		await bot.editMessageText("Processing Data...", {
			chat_id: message.from!.id,
			message_id: messageId,
		})
		const { differences } = await process(dbsdata, waldata)
		await bot.sendMessage(message.from!.id, differences, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[
						{ text: "Refresh DBS", callback_data: "dbs" },
						{ text: "Refresh Wallet", callback_data: "wallet" },
					],
					[
						{ text: "Refresh Both", callback_data: "both" },
						{ text: "Refresh Cache", callback_data: "cache" },
					],
					[{ text: "Show hidden", callback_data: "show" }],
				],
			},
		})
	} catch (e) {
		const error = e as Error
		bot.sendMessage(message.from!.id, `<b><u>${error.name}</u></b>\n${error.message}`, {
			parse_mode: "HTML",
		})
	} finally {
		bot.deleteMessage(message.from!.id, messageId)
	}
})

bot.onText(/\/hide/, async message => {
	if (!isAuthenticated(message.from?.username)) {
		bot.sendMessage(message.from!.id, "You aren't authorized to use this bot.")
		return
	}

	const ids = message.text?.split(" ").slice(1)
	if (!ids?.length) {
		bot.sendMessage(message.from!.id, "Please specify which ids to hide!")
		return
	}

	const hidden = (await hidefile.json()) as string[]
	await Bun.write(hidefile, JSON.stringify([...hidden, ...ids]))

	const [messageId] = await Promise.all([
		bot.sendMessage(message.from!.id, `Hiding ${ids.length} messages`).then(m => m.message_id),
		bot.deleteMessage(message.from!.id, message.message_id),
	])
	setTimeout(() => bot.deleteMessage(message.from!.id, messageId), 1000)
})

bot.onText(/\/show/, async message => {
	if (!isAuthenticated(message.from?.username)) {
		bot.sendMessage(message.from!.id, "You aren't authorized to use this bot.")
		return
	}

	const ids = message.text?.split(" ").slice(1)
	if (!ids?.length) {
		bot.sendMessage(message.from!.id, "Please specify which ids to show!")
		return
	}

	const hidden = (await hidefile.json()) as string[]
	await Bun.write(hidefile, JSON.stringify(hidden.filter(h => !ids.includes(h))))

	const [messageId] = await Promise.all([
		bot.sendMessage(message.from!.id, `Showing ${ids.length} messages`).then(m => m.message_id),
		bot.deleteMessage(message.from!.id, message.message_id),
	])
	setTimeout(() => bot.deleteMessage(message.from!.id, messageId), 1000)
})

bot.on("callback_query", async message => {
	if (!isAuthenticated(message.from?.username)) {
		bot.sendMessage(message.from.id, "You aren't authorized to use this bot.")
		return
	}

	const messageId = await bot.sendMessage(message.from.id, "Updating...").then(m => m.message_id)

	const mode = message.data!
	const dbsfile = Bun.file("data/dbs.json")
	const walletfile = Bun.file("data/wallet.json")

	await bot.editMessageText("Scraping DBS...", {
		chat_id: message.from!.id,
		message_id: messageId,
	})
	const dbsdata =
		["dbs", "both"].includes(mode) || !(await dbsfile.exists())
			? await dbs()
			: await dbsfile.json()

	await bot.editMessageText("Scraping Wallet...", {
		chat_id: message.from!.id,
		message_id: messageId,
	})
	const waldata =
		["wallet", "both"].includes(mode) || !(await walletfile.exists())
			? await wallet()
			: await walletfile.json()

	await bot.editMessageText("Processing Data...", {
		chat_id: message.from!.id,
		message_id: messageId,
	})
	const { differences } = await process(dbsdata, waldata, mode !== "show")

	try {
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
					[
						{ text: "Refresh Both", callback_data: "both" },
						{ text: "Refresh Cache", callback_data: "cache" },
					],
					[
						mode === "show"
							? { text: "Hide hidden", callback_data: "hide" }
							: { text: "Show hidden", callback_data: "show" },
					],
				],
			},
		})
	} catch (e) {
		const error = e as Error
		if (!error.message.includes("message is not modified")) {
			bot.sendMessage(message.from.id, `<b><u>${error.name}</u></b>\n${error.message}`, {
				parse_mode: "HTML",
			})
		}
	} finally {
		bot.deleteMessage(message.from.id, messageId)
	}
})

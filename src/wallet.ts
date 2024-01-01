import axios from "axios"
import { createHash } from "crypto"
import { writeFile } from "fs/promises"
import { resolve } from "path"

import { Transaction } from "./@types/types"

export default async () => {
	console.log("Scraping Wallet")
	const time = Date.now()

	let sequence = 0
	const wallet: Record<
		"account" | "category" | "budget" | "debt" | "record",
		Record<string, any>
	> = {
		account: {},
		category: {},
		budget: {},
		debt: {},
		record: {},
	}

	axios.defaults.baseURL = process.env.WALLET__API_URL
	axios.defaults.auth = {
		username: process.env.WALLET__USERNAME,
		password: process.env.WALLET__PASSWORD,
	}

	// Sync wallet.json with online wallet
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { data: _changes } = await axios.get(
			`/_changes?style=all_docs&since=${sequence}&limit=1000`,
		)
		sequence = _changes.last_seq

		const { data: _all_docs } = await axios.post(
			`/_all_docs?conflicts=true&include_docs=true`,
			{
				keys: _changes.results.map((r: any) => r.id),
			},
		)

		for (const { doc } of _all_docs.rows) {
			if (!doc || !doc.reservedModelType) continue

			const model = doc.reservedModelType.toLowerCase() as string
			if (model !== "sequence" && model in wallet) {
				wallet[model as Exclude<keyof typeof wallet, "sequence">][doc._id] = doc
			}
		}

		if (_changes.results.length !== 1000) {
			break
		}
	}

	const accountId = Object.values(wallet.account).find(a => a.name === "PayNow")._id

	const sma = new Date()
	sma.setMonth(sma.getMonth() - 6)

	const transactions = Object.values(wallet.record)
		.filter(r => r.accountId === accountId)
		.map(r => ({ ...r, date: new Date(r.recordDate) }))
		.filter(r => r.date > sma)
		.sort((a, b) => b.date.getTime() - a.date.getTime())
		.map<Transaction>(r => {
			const category = r.categoryId ? wallet.category[r.categoryId] : null
			const transaction: Transaction = {
				date: r.date.getTime(),
				amount: (r.amount / 100) * (r.type === 0 ? 1 : -1),
				description: [category ? category.name : "", r.note?.replace("\n", " ")]
					.filter(Boolean)
					.join(" | "),
			}

			return {
				id: createHash("md5").update(JSON.stringify(transaction)).digest("base64"),
				...transaction,
			}
		})

	await writeFile(resolve("data/wallet.json"), JSON.stringify(transactions))

	console.log(`Scraped Wallet in ${Date.now() - time}ms`)
	return transactions
}

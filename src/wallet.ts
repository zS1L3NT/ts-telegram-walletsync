import axios from "axios"
import { writeFileSync } from "fs"
import { resolve } from "path"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const wallet = require("../raw/wallet.json") as {
	sequence: number
	account: Record<string, any>
	category: Record<string, any>
	budget: Record<string, any>
	debt: Record<string, any>
	record: Record<string, any>
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
		`/_changes?style=all_docs&since=${wallet.sequence}&limit=1000`,
	)
	wallet.sequence = _changes.last_seq

	const { data: _all_docs } = await axios.post(`/_all_docs?conflicts=true&include_docs=true`, {
		keys: _changes.results.map((r: any) => r.id),
	})

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

writeFileSync(resolve("raw/wallet.json"), JSON.stringify(wallet, null, 4))

const accountId = Object.values(wallet.account).find(a => a.name === "PayNow")._id

const sma = new Date()
sma.setMonth(sma.getMonth() - 6)
const records = Object.values(wallet.record)
	.filter(r => r.accountId === accountId)
	.map(r => ({ ...r, date: new Date(r.recordDate) }))
	.filter(r => r.date > sma)
	.sort((a, b) => b.date.getTime() - a.date.getTime())

const csv = ["Date,Amount,Description"]
for (const record of records) {
	const category = record.categoryId ? wallet.category[record.categoryId] : null
	csv.push(
		[
			record.date.toLocaleDateString("en-SG", {
				day: "2-digit",
				month: "long",
				year: "numeric",
			}),
			record.amount / 100 * (record.type === 0 ? 1 : -1),
			'"' + [category ? category.name : "", record.note].filter(Boolean).join(" | ") + '"',
		].join(","),
	)
}

writeFileSync(resolve("raw/wallet.csv"), csv.join("\n"))

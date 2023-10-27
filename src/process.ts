import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

type Transaction = {
	date: string
	amount: number
	description: string
}

const dbs = readFileSync(resolve("raw/dbs.csv"), "utf8")
	.split("\n")
	.slice(1)
	.map(r => r.match(/([\d\w ]+),(-?\d+(?:\.\d+)?),(.*)/))
	.map(
		m =>
			({
				date: m![1]!,
				amount: +m![2]!,
				description: m![3]!,
			}) as Transaction,
	)
const wallet = readFileSync(resolve("raw/wallet.csv"), "utf8")
	.split("\n")
	.slice(1)
	.map(r => r.match(/([\d\w ]+),(-?\d+(?:\.\d+)?),"(.*)"/))
	.map(
		m =>
			({
				date: m![1]!,
				amount: +m![2]!,
				description: m![3]!,
			}) as Transaction,
	)

const logs: Record<string, Record<string, Transaction[][]>> = {}

const outputs = new Map<string, [Transaction[], Transaction[]]>()

const today = new Date()
for (let i = 0; i < 35; i++) {
	today.setDate(today.getDate() - 1)
	const date = today.toLocaleDateString("en-SG", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	})

	const dbsts = dbs.filter(r => r.date === date)
	const walts = wallet.filter(r => r.date === date)
	const dbsrm: number[] = []
	const walrm: number[] = []

	// Remove siimilar dbs records that have the same amount
	for (const walt of walts) {
		const dbst = dbsts.find(t => t.amount === walt.amount)
		if (dbst) {
			const type = "DBS == Wallet"
			if (!logs[date]) logs[date] = {}
			if (!logs[date]![type]) logs[date]![type] = []
			logs[date]![type]!.push([dbst, walt])

			dbsrm.push(dbsts.indexOf(dbst))
			walrm.push(walts.indexOf(walt))
		}
	}

	// Remove wallet debt records that cancel out
	for (const walt of walts) {
		const revwalt = walts.slice(walts.indexOf(walt) + 1).find(t => t.amount === -walt.amount)
		if (revwalt) {
			const type = "Wallet - Wallet = 0"
			if (!logs[date]) logs[date] = {}
			if (!logs[date]![type]) logs[date]![type] = []
			logs[date]![type]!.push([walt, revwalt])

			walrm.push(walts.indexOf(walt))
			walrm.push(walts.indexOf(revwalt))
		}
	}

	// Remove dbs records that amount to two consecutive wallet records
	for (const dbst of dbsts) {
		for (let i = 0; i < walts.length - 1; i++) {
			const walt1 = walts[i]!
			const walt2 = walts[i + 1]!
			if (walt1.amount + walt2.amount === dbst.amount) {
				const type = "Wallet + Wallet == DBS"
				if (!logs[date]) logs[date] = {}
				if (!logs[date]![type]) logs[date]![type] = []
				logs[date]![type]!.push([walt1, walt2, dbst])

				walrm.push(i)
				walrm.push(i + 1)
				dbsrm.push(dbsts.indexOf(dbst))
			}
		}
	}

	outputs.set(date, [
		dbsts.filter((_, i) => !dbsrm.includes(i)),
		walts.filter((_, i) => !walrm.includes(i)),
	])
}

const entries = [...outputs.entries()]

writeFileSync(resolve("raw/process.json"), JSON.stringify(logs, null, 4))

writeFileSync(
	resolve("raw/difference.csv"),
	[
		"Provider,Date,Amount,Description",
		...entries.flatMap(([date, [dbsts, walts]]) => [
			...dbsts.map(t => `DBS,${date},${t.amount},${t.description}`),
			...walts.map(t => `Wallet,${date},${t.amount},"${t.description}"`),
			"-,-,-,-",
		]),
	].join("\n"),
)

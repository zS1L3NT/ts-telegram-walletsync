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

for (let i = 0; i < 35; i++) {
	const today = new Date()
	today.setDate(today.getDate() - i)

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
	for (let walti = 0; walti < walts.length; walti++) {
		const walt = walts[walti]!
		const dbst = dbsts.find((t, i) => t.amount === walt.amount && !dbsrm.includes(i))

		if (dbst) {
			const type = "DBS == Wallet"
			if (!logs[date]) logs[date] = {}
			if (!logs[date]![type]) logs[date]![type] = []
			logs[date]![type]!.push([dbst, walt])

			walrm.push(walti)
			dbsrm.push(dbsts.indexOf(dbst))
		}
	}

	// Remove wallet debt records that cancel out
	for (let walti = 0; walti < walts.length; walti++) {
		const walt = walts[walti]!
		const revwalt = walts.find((t, i) => t.amount === -walt.amount && !walrm.includes(i))

		if (revwalt) {
			const type = "Wallet - Wallet = 0"
			if (!logs[date]) logs[date] = {}
			if (!logs[date]![type]) logs[date]![type] = []
			logs[date]![type]!.push([walt, revwalt])

			walrm.push(walti)
			walrm.push(walts.indexOf(revwalt))
		}
	}

	// Remove dbs records that amount to two consecutive wallet records
	for (const dbst of dbsts) {
		for (let i = 0; i < walts.length - 1; i++) {
			const walt1 = walts[i]!
			const walt2 = walts[i + 1]!
			const dbsti = dbsts.indexOf(dbst)
			if (
				walt1.amount + walt2.amount === dbst.amount &&
				!walrm.includes(i) &&
				!walrm.includes(i + 1) &&
				!dbsrm.includes(dbsti)
			) {
				const type = "Wallet + Wallet == DBS"
				if (!logs[date]) logs[date] = {}
				if (!logs[date]![type]) logs[date]![type] = []
				logs[date]![type]!.push([walt1, walt2, dbst])

				walrm.push(i)
				walrm.push(i + 1)
				dbsrm.push(dbsti)
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

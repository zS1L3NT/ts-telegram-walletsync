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

	// console.log(">>>", date)

	// Remove siimilar dbs records that have the same amount
	for (const walt of walts) {
		const dbst = dbsts.find(t => t.amount === walt.amount)
		if (dbst) {
			// console.log("DBS === Wallet", dbst, walt)
			dbsrm.push(dbsts.indexOf(dbst))
			walrm.push(walts.indexOf(walt))
		}
	}

	// Remove wallet debt records that cancel out
	for (const walt of walts) {
		const revwalt = walts.slice(walts.indexOf(walt) + 1).find(t => t.amount === -walt.amount)
		if (revwalt) {
			// console.log("Wallet - Wallet = 0", walt, revwalt)
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
				// console.log("Wallet + Wallet == DBS", walt1, walt2, dbst)
				walrm.push(i)
				walrm.push(i + 1)
				dbsrm.push(dbsts.indexOf(dbst))
			}
		}
	}

	// console.log("<<<", date, "\n")

	outputs.set(date, [
		dbsts.filter((_, i) => !dbsrm.includes(i)),
		walts.filter((_, i) => !walrm.includes(i)),
	])
}

const entries = [...outputs.entries()]

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

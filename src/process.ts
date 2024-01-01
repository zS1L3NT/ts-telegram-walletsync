import { Transaction } from "./@types/types"

export default async (dbs: Transaction[], wallet: Transaction[], hide = false) => {
	const transactionToText = (provider: string, t: Transaction) =>
		[
			hidden.includes(t.id!) ? "<s>" : "",
			`${provider}: `,
			`<b>${t.amount < 0 ? "-" : ""}$${Math.abs(t.amount)}</b> `,
			`(<i>${t.description.replaceAll(/\d{4}-\d{4}-\d{4}-\d{4}/g, "****")}</i>, `,
			`<code>${t.id}</code>)`,
			hidden.includes(t.id!) ? "</s>" : "",
		].join("")

	console.log("Processing Data")
	const time = Date.now()

	const hidden = (await Bun.file("data/hidden.json").json()) as string[]
	const logs: Record<string, Record<string, Transaction[][]>> = {}
	let differences = ""

	let i = 0
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const today = new Date()
		today.setDate(today.getDate() - i++)

		const date = today.toLocaleDateString("en-SG", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		})

		const isToday = (t: Transaction) =>
			new Date(t.date).toLocaleDateString("en-SG", {
				day: "2-digit",
				month: "long",
				year: "numeric",
			}) === date
		const dbsts = dbs.filter(isToday).filter(t => (hide ? !hidden.includes(t.id!) : true))
		const walts = wallet.filter(isToday).filter(t => (hide ? !hidden.includes(t.id!) : true))

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

		// Remove dbs debt records that cancel out
		for (let dbsti = 0; dbsti < dbsts.length; dbsti++) {
			const dbst = dbsts[dbsti]!
			const revdbst = dbsts.find((t, i) => t.amount === -dbst.amount && !dbsrm.includes(i))

			if (revdbst) {
				const type = "DBS - DBS = 0"
				if (!logs[date]) logs[date] = {}
				if (!logs[date]![type]) logs[date]![type] = []
				logs[date]![type]!.push([dbst, revdbst])

				dbsrm.push(dbsti)
				dbsrm.push(dbsts.indexOf(revdbst))
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

		// Remove wallet records that amount to two consecutive dbs records
		for (const walt of walts) {
			for (let i = 0; i < dbsts.length - 1; i++) {
				const dbst1 = dbsts[i]!
				const dbst2 = dbsts[i + 1]!
				const walti = walts.indexOf(walt)
				if (
					dbst1.amount + dbst2.amount === walt.amount &&
					!dbsrm.includes(i) &&
					!dbsrm.includes(i + 1) &&
					!walrm.includes(walti)
				) {
					const type = "DBS + DBS == Wallet"
					if (!logs[date]) logs[date] = {}
					if (!logs[date]![type]) logs[date]![type] = []
					logs[date]![type]!.push([dbst1, dbst2, walt])

					dbsrm.push(i)
					dbsrm.push(i + 1)
					walrm.push(walti)
				}
			}
		}

		const dbsd = dbsts.filter((_, i) => !dbsrm.includes(i))
		const wald = walts.filter((_, i) => !walrm.includes(i))
		if (dbsd.length || wald.length) {
			const difference = [
				"\n",
				`<b><u>${date}</u></b>`,
				...dbsd.map(d => transactionToText("DBS", d)),
				...wald.map(d => transactionToText("Wallet", d)),
			].join("\n")

			if (differences.length + difference.length > 4096) {
				break
			} else {
				differences += difference
			}
		}
	}

	console.log(`Processed Data in ${Date.now() - time}ms`)
	return { differences }
}

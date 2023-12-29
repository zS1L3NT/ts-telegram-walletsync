type Transaction = {
	date: string
	amount: number
	description: string
}

export default async (_dbs: string, _wallet: string) => {
	const dbs = _dbs
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
	const wallet = _wallet
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

		outputs.set(date, [
			dbsts.filter((_, i) => !dbsrm.includes(i)),
			walts.filter((_, i) => !walrm.includes(i)),
		])
	}

	const entries = [...outputs.entries()]

	return {
		logs,
		difference: [
			"Provider,Date,Amount,Description",
			...entries.flatMap(([date, [dbsts, walts]]) => [
				...dbsts.map(t => `DBS,${date},${t.amount},${t.description}`),
				...walts.map(t => `Wallet,${date},${t.amount},"${t.description}"`),
				"-,-,-,-",
			]),
		].join("\n"),
	}
}

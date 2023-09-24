import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const dbs = readFileSync(resolve("raw/dbs-raw.csv"), "utf-8")

const transactions = dbs
	.split("\n")
	.slice(21, -5)
	.map(line => {
		const [stated_date, , , , debit, credit, client_reference, additional_reference] =
			line.split(",")
		const real_date = client_reference?.match(/([0-9]{2}[A-Z]{3})/)?.[1]

		const date = real_date
			? new Date(`${real_date.slice(0, 2)} ${real_date.slice(2)} ${stated_date!.slice(-4)}`)
			: new Date(stated_date!)

		return [
			date.toLocaleDateString("en-SG", {
				day: "2-digit",
				month: "long",
				year: "numeric",
			}),
			debit!.trim() ? -parseFloat(debit!) : parseFloat(credit!),
			[client_reference, additional_reference].filter(Boolean).join(" | "),
		]
	})

writeFileSync(
	resolve("raw/dbs.csv"),
	"Date,Amount,Description\n" +
		transactions
			.sort((a, b) => new Date(b[0]!).getTime() - new Date(a[0]!).getTime())
			.join("\n"),
)

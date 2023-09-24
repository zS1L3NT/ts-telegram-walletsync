import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const dbs = readFileSync(resolve("raw/dbs.csv"), "utf-8")

const transactions = dbs
	.split("\n")
	.slice(21, -5)
	.map(line => {
		const [date, , , , debit, credit, client_reference, additional_reference] = line.split(",")
		return [
			new Date(date!).toLocaleDateString("en-SG", {
				day: "2-digit",
				month: "long",
				year: "numeric",
			}),
			debit!.trim() ? -parseFloat(debit!) : parseFloat(credit!),
			[client_reference, additional_reference].filter(Boolean).join(" | "),
		].join(",")
	})

writeFileSync(resolve("raw/dbs.csv"), "Date,Amount,Description\n" + transactions.join("\n"))

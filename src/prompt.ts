import { spawn } from "child_process"
import { statSync } from "fs"
import { resolve } from "path"
import { terminal } from "terminal-kit"
import { format } from "timeago.js"

let dbs = null
try {
	dbs = format(statSync(resolve("raw/dbs.csv")).ctime)
} catch {
	/* no-empty */
}

if (dbs) {
	terminal(`Regenerate raw/dbs.csv? [${format(dbs)}] (Y/n) `)
	if (await terminal.yesOrNo({ yes: ["y", "ENTER"], no: ["n"] }).promise) {
		terminal("\nRegenerating raw/dbs.csv\n")
		await import("./dbs")
	} else {
		terminal.dim("\nNot regenerating raw/dbs.csv\n")
	}
} else {
	terminal("\nGenerating raw/dbs.csv\n")
	await import("./dbs")
}

let wallet = null
try {
	wallet = format(statSync(resolve("raw/wallet.csv")).ctime)
} catch {
	/* no-empty */
}

if (wallet) {
	terminal(`Regenerate raw/wallet.csv? [${format(wallet)}] (Y/n) `)
	if (await terminal.yesOrNo({ yes: ["y", "ENTER"], no: ["n"] }).promise) {
		terminal("\nRegenerating raw/wallet.csv\n")
		await import("./wallet")
	} else {
		terminal.dim("\nNot regenerating raw/wallet.csv\n")
	}
} else {
	terminal("\nGenerating raw/wallet.csv\n")
	await import("./wallet")
}

terminal("\nProcessing files\n")
await import("./process")

spawn("open", ["raw/difference.csv"])

terminal.grabInput({})
terminal.on("key", (name: string) => {
	if (name === "CTRL_C") {
		process.exit()
	}
})

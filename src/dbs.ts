import { readdirSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import { resolve } from "path"
import { Builder, By, until } from "selenium-webdriver"
import { Options } from "selenium-webdriver/chrome"
import tesseract from "tesseract.js"

const driver = await new Builder()
	.forBrowser("chrome")
	.setChromeOptions(
		new Options().setUserPreferences({ "download.default_directory": resolve("raw") }),
	)
	.build()

try {
	await driver.get("https://internet-banking.dbs.com.sg/IB/Welcome")

	// eslint-disable-next-line no-constant-condition
	while (true) {
		await driver.sleep(3000)
		if ((await driver.getTitle()) === "DBS iBanking") {
			break
		}

		await driver.wait(until.elementLocated(By.css(".captcha-code")))
		const base64 = await driver.findElement(By.css(".captcha-code")).takeScreenshot()
		const ocr = await tesseract.recognize(Buffer.from(base64, "base64"), "eng")

		await driver.sleep(500)
		await driver.findElement(By.css(".botdetect-input")).sendKeys(ocr.data.text)
		await driver.findElement(By.css(".botdetect-button")).click()
	}

	// Login page
	await driver.wait(until.elementLocated(By.name("UID")))
	await driver.findElement(By.name("UID")).sendKeys(process.env.DBS__USERNAME)
	await driver.findElement(By.name("PIN")).sendKeys(process.env.DBS__PASSWORD)
	await driver.findElement(By.css("[title=Login]")).click()

	// 2FA
	await driver.wait(until.elementLocated(By.name("user_area")))
	await driver.switchTo().frame(driver.findElement(By.name("user_area")))
	await driver.switchTo().frame(driver.findElement(By.id("iframe1")))
	await driver.wait(until.elementLocated(By.id("AuthenticatBtnId")))
	await driver.findElement(By.id("AuthenticatBtnId")).click()

	// Go to transaction history page
	await driver.wait(until.elementLocated(By.id("userBar")))
	await driver.findElement(By.css("#userBar>:first-child>:first-child")).click()

	// Select account
	await driver.sleep(1000)
	await driver.executeScript(
		[
			'document.querySelector("#account_number_select>:last-child").selected = true',
			"onAccountNumberChange()",
			"selectMCACurrency()",
		].join("\n"),
	)

	// Select period
	await driver.sleep(1000)
	await driver.executeScript(
		[
			'document.querySelector("#selectRange").click()',
			'document.querySelector("#transactionPeriod>:nth-child(4)").click()',
		].join("\n"),
	)

	// Go to page
	await driver.sleep(1000)
	await driver.executeScript("submitTransactionHistory()")

	// Download
	await driver.sleep(1000)
	await driver.executeScript("downLoadCASATransaction()")
	await driver.sleep(3000)
} finally {
	await driver.quit()
}

const filename = readdirSync(resolve("raw")).find(
	n => n.endsWith(".csv") && !["dbs.csv", "wallet.csv"].includes(n),
)!
const dbs = readFileSync(resolve("raw", filename), "utf-8")

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

unlinkSync(resolve("raw", filename))

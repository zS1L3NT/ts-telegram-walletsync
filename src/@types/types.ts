export type Transaction = {
	date: number
	amount: number
	description: string
}

export type TransactionDifference = {
	provider: "DBS" | "Wallet"
} & Transaction

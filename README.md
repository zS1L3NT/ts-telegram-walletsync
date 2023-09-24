# Wallet Sync

![License](https://img.shields.io/github/license/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Languages](https://img.shields.io/github/languages/count/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Top Language](https://img.shields.io/github/languages/top/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Commit Activity](https://img.shields.io/github/commit-activity/y/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Last commit](https://img.shields.io/github/last-commit/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge)

This is script to help me sync my Wallet App transactions with my DBS bank account's transactions. Wallet App is by BudgetBakers and DBS is by DBS Bank Ltd. This script is not affiliated with either of them.

What this does is that it takes in a CSV file filled with my exported DBS transactions, then cleans it and stores it as another CSV file. It also will use the Wallet App internal API to fetch all records and store it as a CSV file in a similar format as the DBS CSV file. This way I can more easily compare the transactions between both accounts, and make the necessary adjustments to my Wallet App transactions.

## Motivation

I wanted to be able to compare my Wallet App transactions with my DBS transactions, but the Wallet App does not have a way to export transactions. I also wanted to be able to compare the transactions in a spreadsheet, so I decided to write this script to help me do that.

## Features

-   Wallet App
    -   Fetches transactions from internal API
    -   Syncs new transactions to a JSON file
    -   Cleans transactions
-   DBS
    -   Uses the date in the `client_reference` field instead because it's more reliable
    -   Cleans transactions

## Built with

-   BunJS
    -   TypeScript
        -   [![@types/node](https://img.shields.io/badge/%40types%2Fnode-latest-red?style=flat-square)](https://npmjs.com/package/@types/node/v/latest)
        -   [![@typescript-eslint/eslint-plugin](https://img.shields.io/badge/%40typescript--eslint%2Feslint--plugin-latest-red?style=flat-square)](https://npmjs.com/package/@typescript-eslint/eslint-plugin/v/latest)
        -   [![@typescript-eslint/parser](https://img.shields.io/badge/%40typescript--eslint%2Fparser-latest-red?style=flat-square)](https://npmjs.com/package/@typescript-eslint/parser/v/latest)
        -   [![typescript](https://img.shields.io/badge/typescript-latest-red?style=flat-square)](https://npmjs.com/package/typescript/v/latest)
    -   ESLint
        -   [![eslint](https://img.shields.io/badge/eslint-latest-red?style=flat-square)](https://npmjs.com/package/eslint/v/latest)
        -   [![eslint-config-next](https://img.shields.io/badge/eslint--config--next-latest-red?style=flat-square)](https://npmjs.com/package/eslint-config-next/v/latest)
        -   [![eslint-config-prettier](https://img.shields.io/badge/eslint--config--prettier-latest-red?style=flat-square)](https://npmjs.com/package/eslint-config-prettier/v/latest)
        -   [![eslint-plugin-react](https://img.shields.io/badge/eslint--plugin--react-latest-red?style=flat-square)](https://npmjs.com/package/eslint-plugin-react/v/latest)
        -   [![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint--plugin--simple--import--sort-latest-red?style=flat-square)](https://npmjs.com/package/eslint-plugin-simple-import-sort/v/latest)
        -   [![prettier](https://img.shields.io/badge/prettier-latest-red?style=flat-square)](https://npmjs.com/package/prettier/v/latest)
    -   Miscellaneous
        -   [![axios](https://img.shields.io/badge/axios-%5E1.5.0-red?style=flat-square)](https://npmjs.com/package/axios/v/1.5.0)

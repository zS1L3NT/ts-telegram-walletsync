# Wallet Sync

![License](https://img.shields.io/github/license/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Languages](https://img.shields.io/github/languages/count/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Top Language](https://img.shields.io/github/languages/top/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Commit Activity](https://img.shields.io/github/commit-activity/y/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge) ![Last commit](https://img.shields.io/github/last-commit/zS1L3NT/ts-wallet-dbs-sync?style=for-the-badge)

This is a telegram bot to help me sync my Wallet App transactions with my DBS bank account's transactions. Wallet App is by BudgetBakers and DBS is by DBS Bank Ltd. This script is not affiliated with either of them.

What this does is that it reads my DBS transactions using Selenium and Wallet transactions using Axios, then sends the differences to me on Telegram. It will also cache the current records so they only re-fetch the data when required since that is quite an expensive operation. This way I can more easily compare the transactions between both accounts, and make the necessary adjustments to my Wallet App transactions.

Initially this was a script but I realized that it would be more convenient to be able to do this on Telegram from my phone.

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
        -   [![@types/node-telegram-bot-api](https://img.shields.io/badge/%40types%2Fnode--telegram--bot--api-%5E0.64.1-red?style=flat-square)](https://npmjs.com/package/@types/node-telegram-bot-api/v/0.64.1)
        -   [![@types/selenium-webdriver](https://img.shields.io/badge/%40types%2Fselenium--webdriver-%5E4.1.19-red?style=flat-square)](https://npmjs.com/package/@types/selenium-webdriver/v/4.1.19)
        -   [![@typescript-eslint/eslint-plugin](https://img.shields.io/badge/%40typescript--eslint%2Feslint--plugin-latest-red?style=flat-square)](https://npmjs.com/package/@typescript-eslint/eslint-plugin/v/latest)
        -   [![@typescript-eslint/parser](https://img.shields.io/badge/%40typescript--eslint%2Fparser-latest-red?style=flat-square)](https://npmjs.com/package/@typescript-eslint/parser/v/latest)
        -   [![typescript](https://img.shields.io/badge/typescript-latest-red?style=flat-square)](https://npmjs.com/package/typescript/v/latest)
    -   ESLint
        -   [![eslint](https://img.shields.io/badge/eslint-latest-red?style=flat-square)](https://npmjs.com/package/eslint/v/latest)
        -   [![eslint-config-next](https://img.shields.io/badge/eslint--config--next-latest-red?style=flat-square)](https://npmjs.com/package/eslint-config-next/v/latest)
        -   [![eslint-config-prettier](https://img.shields.io/badge/eslint--config--prettier-latest-red?style=flat-square)](https://npmjs.com/package/eslint-config-prettier/v/latest)
        -   [![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint--plugin--simple--import--sort-latest-red?style=flat-square)](https://npmjs.com/package/eslint-plugin-simple-import-sort/v/latest)
        -   [![prettier](https://img.shields.io/badge/prettier-latest-red?style=flat-square)](https://npmjs.com/package/prettier/v/latest)
    -   Miscellaneous
        -   [![axios](https://img.shields.io/badge/axios-%5E1.5.0-red?style=flat-square)](https://npmjs.com/package/axios/v/1.5.0)
        -   [![bun-types](https://img.shields.io/badge/bun--types-%5E1.0.20-red?style=flat-square)](https://npmjs.com/package/bun-types/v/1.0.20)
        -   [![node-telegram-bot-api](https://img.shields.io/badge/node--telegram--bot--api-%5E0.64.0-red?style=flat-square)](https://npmjs.com/package/node-telegram-bot-api/v/0.64.0)
        -   [![selenium-webdriver](https://img.shields.io/badge/selenium--webdriver-%5E4.14.0-red?style=flat-square)](https://npmjs.com/package/selenium-webdriver/v/4.14.0)
        -   [![tesseract.js](https://img.shields.io/badge/tesseract.js-%5E5.0.2-red?style=flat-square)](https://npmjs.com/package/tesseract.js/v/5.0.2)

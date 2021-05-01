import {existsSync, readFileSync} from 'fs'

import {Telegraf} from 'telegraf'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'

import * as parts from './parts/index.js'
import {startupPartOfGroupCheck} from './startup-part-of-group-check.js'

process.title = 'tg-lock-bot'

const token = (existsSync('/run/secrets/bot-token.txt') && readFileSync('/run/secrets/bot-token.txt', 'utf8').trim()) ||
	(existsSync('bot-token.txt') && readFileSync('bot-token.txt', 'utf8').trim()) ||
	// eslint-disable-next-line @typescript-eslint/dot-notation
	process.env['BOT_TOKEN']
if (!token) {
	throw new Error('You have to provide the bot-token from @BotFather via file (bot-token.txt) or environment variable (BOT_TOKEN)')
}

const bot = new Telegraf(token)

// eslint-disable-next-line @typescript-eslint/dot-notation
if (process.env['NODE_ENV'] !== 'production') {
	bot.use(generateUpdateMiddleware())
}

bot.use(parts.bot.middleware())

async function startup(): Promise<void> {
	await bot.telegram.setMyCommands([
		{command: 'lock', description: 'lock something'},
		{command: 'unlock', description: 'unlock something you locked'},
		{command: 'forceunlock', description: 'force to unlock something that someone else locked'},
		{command: 'listlocks', description: 'list all current locks'}
	])

	await startupPartOfGroupCheck(bot.telegram)
	await bot.launch()
	console.log(new Date(), 'Bot started as', bot.botInfo?.username)
}

void startup()

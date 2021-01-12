import {existsSync, readFileSync} from 'fs'

import {Telegraf} from 'telegraf'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'

import * as parts from './parts'
import {startupPartOfGroupCheck} from './startup-part-of-group-check'

process.title = 'tg-lock-bot'

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf(token)

if (process.env.NODE_ENV !== 'production') {
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

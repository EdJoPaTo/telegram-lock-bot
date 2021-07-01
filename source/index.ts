import {Bot} from 'grammy'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'

import * as parts from './parts/index.js'
import {startupPartOfGroupCheck} from './startup-part-of-group-check.js'

process.title = 'tg-lock-bot'

const token = process.env['BOT_TOKEN']
if (!token) {
	throw new Error('You have to provide the bot-token from @BotFather via file (bot-token.txt) or environment variable (BOT_TOKEN)')
}

const bot = new Bot(token)

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(generateUpdateMiddleware())
}

bot.use(parts.bot.middleware())

async function startup(): Promise<void> {
	await bot.api.setMyCommands([
		{command: 'lock', description: 'lock something'},
		{command: 'unlock', description: 'unlock something you locked'},
		{command: 'forceunlock', description: 'force to unlock something that someone else locked'},
		{command: 'listlocks', description: 'list all current locks'}
	])

	await startupPartOfGroupCheck(bot.api)

	const {username} = await bot.api.getMe()
	console.log(new Date(), 'Bot starts as', username)
	await bot.start()
}

void startup()

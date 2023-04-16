import {Bot} from 'grammy'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import * as parts from './parts/index.js'
import {startupPartOfGroupCheck} from './startup-part-of-group-check.js'

process.title = 'tg-lock-bot'

const token = process.env['BOT_TOKEN']
if (!token) {
	throw new Error(
		'You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)',
	)
}

const bot = new Bot(token)

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(generateUpdateMiddleware())
}

bot.use(parts.bot.middleware())

await bot.api.setMyCommands([
	{command: 'lock', description: 'lock something'},
	{command: 'unlock', description: 'unlock something you locked'},
	{
		command: 'forceunlock',
		description: 'force to unlock something that someone else locked',
	},
	{command: 'listlocks', description: 'list all current locks'},
])

await startupPartOfGroupCheck(bot.api)

await bot.start({
	onStart(botInfo) {
		console.log(new Date(), 'Bot starts as', botInfo.username)
	},
})

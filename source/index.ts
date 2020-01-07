import {existsSync, readFileSync} from 'fs'

import Telegraf from 'telegraf'

import * as parts from './parts'

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf(token)

if (process.env.NODE_ENV !== 'production') {
	bot.use(async (ctx, next) => {
		const identifier = [
			new Date().toISOString(),
			Number(ctx.update.update_id).toString(16),
			ctx.chat?.type,
			ctx.chat?.title,
			ctx.from?.first_name,
			ctx.updateType
		].join(' ')
		const callbackData = ctx.callbackQuery?.data
		const inlineQuery = ctx.inlineQuery?.query
		const messageText = ctx.message?.text
		const data = callbackData ?? inlineQuery ?? messageText
		console.time(identifier)
		if (next) {
			await next()
		}

		if (data) {
			console.timeLog(identifier, data.length, data.replace(/\n/g, '\\n').slice(0, 50))
		} else {
			console.timeLog(identifier)
		}
	})
}

bot.use(parts.bot.middleware())

async function startup(): Promise<void> {
	await bot.launch()
	console.log(new Date(), 'Bot started as', bot.options.username)
}

startup()

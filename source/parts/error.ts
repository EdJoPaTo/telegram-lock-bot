/* eslint @typescript-eslint/no-empty-function: warn */

import {Composer} from 'telegraf'

import * as locks from '../locks'

export const bot = new Composer()

bot.use(async (ctx, next) => {
	try {
		await next?.()
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message.includes('have no rights to send a message')) {
				console.log('leave weird chat', error.message, ctx.chat)

				await ctx.leaveChat().catch(() => {})
				locks.remove(ctx.chat!.id)
				return
			}

			if (error.message.includes('bot was blocked by the user') ||
				error.message.includes('bot is not a member of') ||
				error.message.includes('bot was kicked from')
			) {
				console.log('delete locks as not part of chat', error.message, ctx.chat)
				locks.remove(ctx.chat!.id)
				return
			}
		}

		console.error('ERROR', ctx.update, error)
	}
})

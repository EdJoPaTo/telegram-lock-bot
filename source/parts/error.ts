import {Composer} from 'telegraf'

import * as locks from '../locks'

export const bot = new Composer()

bot.use(async (ctx, next) => {
	try {
		await next?.()
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes('have no rights to send a message')) {
				console.log('leave weird chat', error.message, ctx.chat)

				await ctx.leaveChat().catch(() => {})
				locks.remove(ctx.chat!.id)
				return
			}
		}

		console.error('ERROR', ctx.update, error)
	}
})

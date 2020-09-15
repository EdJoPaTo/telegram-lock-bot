import {Chat} from 'typegram'
import {Composer, Context as TelegrafContext} from 'telegraf'
import {html as format} from 'telegram-format'

import * as locks from '../locks'

const MAX_LOCK_LENGTH = 100

export const bot = new Composer()

function getCommandParameter(ctx: TelegrafContext): string | undefined {
	if (!ctx.message || !ctx.message.entities || !ctx.message.text) {
		return undefined
	}

	const command = ctx.message.entities
		.find(o => o.offset === 0 && o.type === 'bot_command')
	if (!command) {
		return undefined
	}

	const args = ctx.message.text.slice(command.length + 1, ctx.message.text.length)
	return args
}

function lockKeeperLink(lock: locks.Lock): string {
	return format.userMention(format.escape(lock.user.first_name), lock.user.id)
}

bot.command('start', async ctx => {
	return ctx.reply('You can use /lock and /unlock to soft lock what you like')
})

bot.command('lock', async ctx => {
	const lockName = getCommandParameter(ctx)
	if (!lockName) {
		return ctx.reply('Use /lock <something>', {reply_markup: {remove_keyboard: true}})
	}

	if (lockName.length > MAX_LOCK_LENGTH) {
		return ctx.reply(`Use /lock <something shorter than ${MAX_LOCK_LENGTH} characters>`, {reply_markup: {remove_keyboard: true}})
	}

	const existingLock = locks.isLocked(ctx.chat!.id, lockName)
	if (existingLock) {
		return ctx.replyWithHTML(
			`${format.monospace(lockName)} is already locked by ${lockKeeperLink(existingLock)}`,
			{reply_markup: {remove_keyboard: true}}
		)
	}

	const lock = await locks.lock(ctx.chat as Chat, lockName, ctx.from!, Date.now() / 1000)
	return ctx.replyWithHTML(
		`${format.monospace(lockName)} is now locked by ${lockKeeperLink(lock)}`,
		{reply_markup: {remove_keyboard: true}}
	)
})

bot.command('unlock', async ctx => unlock(ctx, false))
bot.command('forceunlock', async ctx => unlock(ctx, true))

async function unlock(ctx: TelegrafContext, force: boolean): Promise<unknown> {
	const lockName = getCommandParameter(ctx)
	if (!lockName) {
		return ctx.reply('Use /unlock <something>', {reply_markup: {remove_keyboard: true}})
	}

	const existingLock = locks.isLocked(ctx.chat!.id, lockName)
	if (!existingLock) {
		return ctx.replyWithHTML(
			`${format.monospace(lockName)} is not locked`,
			{reply_markup: {remove_keyboard: true}}
		)
	}

	if (!force && ctx.from?.id !== existingLock.user.id) {
		return ctx.replyWithHTML(
			`${format.monospace(lockName)} is locked by ${lockKeeperLink(existingLock)}. You can only unlock your own locks.\nAlternativly use /forceunlock`,
			{reply_markup: {remove_keyboard: true}}
		)
	}

	await locks.unlock(ctx.chat as Chat, lockName)
	return ctx.replyWithHTML(
		`${format.monospace(lockName)} is now free`,
		{reply_markup: {remove_keyboard: true}}
	)
}

bot.command(['list', 'listlocks'], async ctx => {
	let list = locks.list(ctx.chat!.id)
	let keys = Object.keys(list)

	// Migration: remove too long lock names
	await Promise.all(
		keys
			.filter(o => o.length > MAX_LOCK_LENGTH)
			.map(async o => locks.unlock(ctx.chat as Chat, o))
	)

	list = locks.list(ctx.chat!.id)
	keys = Object.keys(list)

	if (keys.length === 0) {
		return ctx.reply('Nothing locked.', {reply_markup: {remove_keyboard: true}})
	}

	let text = ''
	text += 'Currently locked:\n'

	text += keys
		.sort((a, b) => a.localeCompare(b))
		.map(o => `${format.monospace(o)} by ${lockKeeperLink(list[o])}`)
		.join('\n')

	return ctx.replyWithHTML(text, {reply_markup: {remove_keyboard: true}})
})

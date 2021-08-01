import {Composer, Context} from 'grammy'
import {html as format} from 'telegram-format'

import * as locks from '../locks.js'

const MAX_LOCK_LENGTH = 100

export const bot = new Composer()

function lockKeeperLink(lock: locks.Lock): string {
	return format.userMention(format.escape(lock.user.first_name), lock.user.id)
}

bot.command('start', async ctx => ctx.reply('You can use /lock and /unlock to soft lock what you like'))

bot.command('lock', async ctx => {
	const lockName = typeof ctx.match === 'string' && ctx.match.trim()
	if (!lockName) {
		return ctx.reply('Use /lock <something>', {reply_markup: {remove_keyboard: true}})
	}

	if (lockName.length > MAX_LOCK_LENGTH) {
		return ctx.reply(`Use /lock <something shorter than ${MAX_LOCK_LENGTH} characters>`, {reply_markup: {remove_keyboard: true}})
	}

	const existingLock = locks.isLocked(ctx.chat.id, lockName)
	if (existingLock) {
		return ctx.reply(
			`${format.monospace(lockName)} is already locked by ${lockKeeperLink(existingLock)}`,
			{
				parse_mode: format.parse_mode,
				reply_markup: {remove_keyboard: true},
			},
		)
	}

	const lock = await locks.lock(ctx.chat, lockName, ctx.from!, Date.now() / 1000)
	return ctx.reply(
		`${format.monospace(lockName)} is now locked by ${lockKeeperLink(lock)}`,
		{
			parse_mode: format.parse_mode,
			reply_markup: {remove_keyboard: true},
		},
	)
})

bot.command('unlock', async ctx => unlock(ctx, false))
bot.command('forceunlock', async ctx => unlock(ctx, true))

async function unlock(ctx: Context, force: boolean): Promise<unknown> {
	const lockName = typeof ctx.match === 'string' && ctx.match.trim()
	if (!lockName) {
		return ctx.reply('Use /unlock <something>', {reply_markup: {remove_keyboard: true}})
	}

	const existingLock = locks.isLocked(ctx.chat!.id, lockName)
	if (!existingLock) {
		return ctx.reply(`${format.monospace(lockName)} is not locked`, {
			parse_mode: format.parse_mode,
			reply_markup: {remove_keyboard: true},
		})
	}

	if (!force && ctx.from?.id !== existingLock.user.id) {
		return ctx.reply(
			`${format.monospace(lockName)} is locked by ${lockKeeperLink(existingLock)}. You can only unlock your own locks.\nAlternativly use /forceunlock`,
			{
				parse_mode: format.parse_mode,
				reply_markup: {remove_keyboard: true},
			},
		)
	}

	await locks.unlock(ctx.chat!, lockName)
	return ctx.reply(`${format.monospace(lockName)} is now free`, {
		parse_mode: format.parse_mode,
		reply_markup: {remove_keyboard: true},
	})
}

bot.command(['list', 'listlocks'], async ctx => {
	let list = locks.list(ctx.chat.id)

	// Migration: remove too long lock names
	await Promise.all(
		Object.keys(list)
			.filter(o => o.length > MAX_LOCK_LENGTH)
			.map(async o => locks.unlock(ctx.chat, o)),
	)

	list = locks.list(ctx.chat.id)

	if (Object.keys(list).length === 0) {
		return ctx.reply('Nothing locked.', {reply_markup: {remove_keyboard: true}})
	}

	let text = ''
	text += 'Currently locked:\n'

	text += Object.entries(list)
		.sort(([aname], [bname]) => aname.localeCompare(bname))
		.map(([name, lock]) => `${format.monospace(name)} by ${lockKeeperLink(lock)}`)
		.join('\n')

	return ctx.reply(text, {
		parse_mode: format.parse_mode,
		reply_markup: {remove_keyboard: true},
	})
})

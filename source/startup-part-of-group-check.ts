/* eslint no-await-in-loop: off */
/* eslint unicorn/string-content: off */

import {Telegraf} from 'telegraf'

import * as locks from './locks'

const removeMeFromBeingAdminMessageText = `Telegram bots which are administrators are a privacy risk to your group as they see every message or might do things every other group admin could do.

As admin bots see every message they require more resources to run which is a useless waste of energy.
Please change me to be a normal user. 😘`

export async function startupPartOfGroupCheck(tg: Telegraf['telegram']): Promise<void> {
	const allChats = locks.allChats()

	const me = await tg.getMe()

	for (const chat of allChats) {
		await sleep(5) // Check up to 200 chats per second
		await checkChat(tg, me.id, chat.id)
	}
}

async function checkChat(tg: Telegraf['telegram'], me: number, chatId: number): Promise<void> {
	try {
		if (Object.keys(locks.list(chatId)).length === 0) {
			console.log('chat without locks', chatId)
			// Dont leave as they might still use it. It will just recreate the file then.
			locks.remove(chatId)
			return
		}

		const info = await tg.getChat(chatId)!
		if ('permissions' in info && info.permissions && !info.permissions.can_send_messages) {
			console.log('can not send messages in group -> leave', chatId, info)
			locks.remove(chatId)
			await tg.leaveChat(chatId)
			return
		}

		// Groups can have 'all admins' which would also be the bot.
		// Users cant really change something about that so dont annoy them any more with that.
		// Also they dont know that they might need to upgrade their group to a supergroup and so on…
		if (info.type === 'supergroup') {
			const meInfo = await tg.getChatMember(chatId, me)!
			if (meInfo.status === 'administrator') {
				console.log('hint chat of having admin access to chat', chatId, info, meInfo)
				await tg.sendMessage(chatId, removeMeFromBeingAdminMessageText)
			}
		}
	} catch (error: unknown) {
		if (error instanceof Error && (
			error.message.includes('bot was kicked from') ||
			error.message.includes('bot can\'t initiate conversation with a user') ||
			error.message.includes('bot is not a member of') ||
			error.message.includes('chat is deactivated') ||
			error.message.includes('chat not found')
		)) {
			console.log('not part of group anymore', chatId, error.message)
			locks.remove(chatId)
			return
		}

		console.log('checkChat error', chatId, error)
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

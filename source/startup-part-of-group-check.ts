import {Api} from 'grammy'

import * as locks from './locks.js'

const removeMeFromBeingAdminMessageText = `Telegram bots which are administrators are a privacy risk to your group as they see every message or might do things every other group admin could do.

This bot works without admin access. It only reacts to commands and does nothing else than sending messages in response.
As admin bots see every message, not only commands, they require more resources to run which is a useless waste of energy.

If you are still interested, invite me again as a normal non-admin user.`

export async function startupPartOfGroupCheck(tg: Api): Promise<void> {
	const allChats = locks.allChats()

	const me = await tg.getMe()

	for (const chat of allChats) {
		// eslint-disable-next-line no-await-in-loop
		await sleep(10) // Check up to 100 chats per second
		// eslint-disable-next-line no-await-in-loop
		await checkChat(tg, me.id, chat.id)
	}
}

async function checkChat(tg: Api, me: number, chatId: number): Promise<void> {
	try {
		if (Object.keys(locks.list(chatId)).length === 0) {
			console.log('chat without locks', chatId)
			// Dont leave as they might still use it. It will just recreate the file then.
			locks.remove(chatId)
			return
		}

		const info = await getBasicChatInfo(tg, chatId)

		if (info.permissions && !info.permissions.can_send_messages) {
			console.log('can not send messages in group -> leave', chatId, info)
			locks.remove(chatId)
			await tg.leaveChat(chatId)
			return
		}

		// Groups can have 'all admins' which would also be the bot.
		// Users cant really change something about that so dont annoy them any more with that.
		// Also they dont know that they might need to upgrade their group to a supergroup and so on…
		if (info.type === 'supergroup') {
			const meInfo = await tg.getChatMember(chatId, me)
			if (meInfo.status === 'administrator') {
				console.log('leave supergroup because of admin access', chatId, info, meInfo)
				try {
					await tg.sendMessage(chatId, removeMeFromBeingAdminMessageText)
				} catch (error: unknown) {
					console.log('checkChat send admin access message ERROR', error instanceof Error ? error.message : error)
				}

				locks.remove(chatId)
				await tg.leaveChat(chatId)
			}
		}
	} catch (error: unknown) {
		if (error instanceof Error && (
			error.message.includes('bot was kicked from')
			|| error.message.includes('bot can\'t initiate conversation with a user')
			|| error.message.includes('bot is not a member of')
			|| error.message.includes('chat is deactivated')
			|| error.message.includes('chat not found')
		)) {
			console.log('not part of chat anymore', chatId, error.message)
			locks.remove(chatId)
			return
		}

		if (error instanceof Error && error.message.includes('Too Many Requests')) {
			const match = /retry after (\d+)/.exec(error.message)?.[1]
			const seconds = Number(match ?? 10) + 1

			console.log('Too Many Requests  sleep now...', seconds, match, error.message)
			await sleep(seconds * 1000)
		}

		console.log('checkChat error', chatId, error)
	}
}

async function getBasicChatInfo(tg: Api, chatId: number) {
	const info = await tg.getChat(chatId)
	return {
		id: info.id,
		type: info.type,
		username: 'username' in info ? info.username : undefined,
		title: 'title' in info ? info.title : undefined,
		permissions: 'permissions' in info ? info.permissions : undefined,
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

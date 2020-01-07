/* eslint @typescript-eslint/no-dynamic-delete: off */

import {Chat, User} from 'telegram-typings'
import {KeyValueInMemoryFiles} from '@edjopato/datastore'

type UnixTimestamp = number

export interface Lock {
	user: User;
	date: UnixTimestamp;
}

export interface LockFile {
	chat: Chat;
	config: {
		locks: Record<string, Lock>;
	};
}

const data = new KeyValueInMemoryFiles<LockFile>('locks')

function chatKeyOfChat(chat: Chat): string {
	return chat.id > 0 ? String(chat.id) : String(chat.id).replace('-', 'g')
}

export function isLocked(chat: Chat, lockName: string): Lock | undefined {
	const chatData = data.get(chatKeyOfChat(chat))
	if (!chatData) {
		return undefined
	}

	return chatData.config.locks[lockName]
}

export async function lock(chat: Chat, lockName: string, user: User, date: UnixTimestamp): Promise<Lock> {
	const chatData = data.get(chatKeyOfChat(chat)) ?? {
		chat,
		config: {
			locks: {}
		}
	}

	const lock: Lock = {
		user,
		date
	}

	chatData.chat = chat
	chatData.config.locks[lockName] = lock

	await data.set(chatKeyOfChat(chat), chatData)
	return lock
}

export async function unlock(chat: Chat, lockName: string): Promise<void> {
	const chatData = data.get(chatKeyOfChat(chat))
	if (!chatData) {
		return
	}

	chatData.chat = chat
	delete chatData.config.locks[lockName]

	await data.set(chatKeyOfChat(chat), chatData)
}

export function list(chat: Chat): Record<string, Lock> {
	const chatData = data.get(chatKeyOfChat(chat))
	if (!chatData) {
		return {}
	}

	return chatData.config.locks
}

export function remove(chat: Chat): void {
	data.delete(chatKeyOfChat(chat))
}

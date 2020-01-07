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

export function isLocked(chat: Chat, lockName: string): Lock | undefined {
	const chatData = data.get(String(chat.id))
	if (!chatData) {
		return undefined
	}

	return chatData.config.locks[lockName]
}

export async function lock(chat: Chat, lockName: string, user: User, date: UnixTimestamp): Promise<Lock> {
	const chatKey = String(chat.id)
	const chatData = data.get(chatKey) ?? {
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

	await data.set(chatKey, chatData)
	return lock
}

export async function unlock(chat: Chat, lockName: string): Promise<void> {
	const chatKey = String(chat.id)
	const chatData = data.get(chatKey)
	if (!chatData) {
		return
	}

	chatData.chat = chat
	delete chatData.config.locks[lockName]

	await data.set(chatKey, chatData)
}

export function list(chat: Chat): Record<string, Lock> {
	const chatKey = String(chat.id)
	const chatData = data.get(chatKey)
	if (!chatData) {
		return {}
	}

	return chatData.config.locks
}

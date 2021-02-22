import {Chat, User} from 'typegram'
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

function chatKeyOfChat(chatId: number): string {
	return chatId > 0 ? String(chatId) : String(chatId).replace('-', 'g')
}

export function isLocked(chatId: number, lockName: string): Lock | undefined {
	const chatData = data.get(chatKeyOfChat(chatId))
	if (!chatData) {
		return undefined
	}

	return chatData.config.locks[lockName]
}

export async function lock(chat: Chat, lockName: string, user: User, date: UnixTimestamp): Promise<Lock> {
	const chatData = data.get(chatKeyOfChat(chat.id)) ?? {
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

	await data.set(chatKeyOfChat(chat.id), chatData)
	return lock
}

export async function unlock(chat: Chat, lockName: string): Promise<void> {
	const chatData = data.get(chatKeyOfChat(chat.id))
	if (!chatData) {
		return
	}

	chatData.chat = chat
	// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
	delete chatData.config.locks[lockName]

	await data.set(chatKeyOfChat(chat.id), chatData)
}

export function list(chatId: number): Record<string, Lock> {
	const chatData = data.get(chatKeyOfChat(chatId))
	if (!chatData) {
		return {}
	}

	return chatData.config.locks
}

export function remove(chatId: number): void {
	data.delete(chatKeyOfChat(chatId))
}

export function allChats(): readonly Chat[] {
	return data.keys()
		.map(o => data.get(o))
		.filter((o): o is LockFile => Boolean(o))
		.map(o => o.chat)
}

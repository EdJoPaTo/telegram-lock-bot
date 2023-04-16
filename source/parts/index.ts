import {Composer} from 'grammy'
import * as commands from './commands.js'
import * as error from './error.js'
import * as leaveChannel from './leave-channel.js'

export const bot = new Composer()

bot.use(error.bot.middleware())

bot.use(leaveChannel.bot.middleware())

bot.use(commands.bot.middleware())

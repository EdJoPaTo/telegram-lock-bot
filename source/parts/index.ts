import {Composer} from 'telegraf'

import * as commands from './commands.js'
import * as error from './error.js'

export const bot = new Composer()

bot.use(error.bot.middleware())

bot.use(commands.bot.middleware())

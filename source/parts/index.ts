import {Composer} from 'telegraf'

import * as commands from './commands'
import * as error from './error'

export const bot = new Composer()

bot.use(error.bot.middleware())

bot.use(commands.bot.middleware())

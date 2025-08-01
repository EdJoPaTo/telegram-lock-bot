import {Composer} from 'grammy';
import * as commands from './commands.ts';
import * as error from './error.ts';
import * as leaveChannel from './leave-channel.ts';

export const bot = new Composer();

bot.use(error.bot.middleware());

bot.use(leaveChannel.bot.middleware());

bot.use(commands.bot.middleware());

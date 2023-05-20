import {Composer} from 'grammy';

export const bot = new Composer();

bot.on('channel_post', async ctx => {
	try {
		await ctx.reply(
			'Adding a random bot as an admin to your channel is maybe not the best idea…\n\nSincerely, a random bot, added as an admin to this channel.',
		);
	} catch (error: unknown) {
		console.log('ERROR channel_post reply', error);
	}

	console.log('leave the channel…', ctx.chat);
	await ctx.leaveChat();
});

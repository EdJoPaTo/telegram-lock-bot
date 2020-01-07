# Telegram Lock Bot

[![Build Status](https://travis-ci.com/EdJoPaTo/telegramLockBot.svg?branch=master)](https://travis-ci.com/EdJoPaTo/telegramLockBot)
[![Dependency Status](https://david-dm.org/EdJoPaTo/telegramLockBot/status.svg)](https://david-dm.org/EdJoPaTo/telegramLockBot)
[![Dev Dependency Status](https://david-dm.org/EdJoPaTo/telegramLockBot/dev-status.svg)](https://david-dm.org/EdJoPaTo/telegramLockBot?type=dev)

Telegram Bot to handle a soft 'lock' / 'mutex' on something.
This was useful for knowing which person handled a file in a shared folder so noone else attempted to do the same.

Bot token has to be saved as a docker secret with the name `bot-token.txt`.

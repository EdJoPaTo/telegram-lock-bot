const {existsSync} = require('fs');
const ChatConfigHandler = require('telegrambotchatconfighandler');
const BotHandler = require('telegrambotbothandler');

const lockConfigHandler = new ChatConfigHandler('locks', {
  locks: {}
});
const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const bot = new BotHandler(tokenFilePath);

const cancelString = "⛔️ cancel ⛔️";

function cancelOption(msg) {
  bot.sendText(msg.chat, "😔");
}

bot.setMainMenuText(function(chat) {
  return "What do you want to do?";
});

bot.setMainMenuOptions(function(chat) {
  const locks = lockConfigHandler.loadConfig(chat).locks;
  const lockedKeys = Object.keys(locks);

  const options = {};
  options.lock = lockOption;
  if (lockedKeys.length > 0) {
    options.unlock = unlockOption;
    if (chat.id < 0)
      options.forceunlock = forceUnlockOption;
    options.listlock = listlockOption;
  }
  if (chat.id < 0)
    options[cancelString] = cancelOption;

  return options;
});

bot.onCommand("start", false, function(msg) {
  bot.sendMainMenu(msg.chat);
});
bot.onCommand("menu", false, function(msg) {
  bot.sendMainMenu(msg.chat);
});
bot.onCommand("lock", false, lockOption);
bot.onCommand("unlock", false, unlockOption);
bot.onCommand("forceunlock", false, forceUnlockOption);
bot.onCommand("listlocks", false, listlockOption);

bot.onCommand("lock", true, function(msg, match) {
  lock(msg.chat, msg.from, msg.date, match[1]);
});

bot.onCommand("unlock", true, function(msg, match) {
  unlock(msg.chat, msg.from, match[1], false);
});

bot.onCommand("forceunlock", true, function(msg, match) {
  unlock(msg.chat, msg.from, match[1], true);
});

function lockOption(msg) {
  bot.sendText(msg.chat, "What do you want to lock?", function(msg) {
    lock(msg.chat, msg.from, msg.date, msg.text);
  });
}

function unlockOption(msg) {
  const locks = lockConfigHandler.loadConfig(msg.chat).locks;
  const lockedKeys = Object.keys(locks);
  const myLockedKeys = [];
  for (let i = 0; i < lockedKeys.length; i++) {
    if (locks[lockedKeys[i]].user.id == msg.from.id)
      myLockedKeys.push(lockedKeys[i]);
  }

  const keyboard = bot.arrayToKeyboard(myLockedKeys, 3);
  keyboard.push([cancelString]);
  bot.sendText(msg.chat, "What do you want to unlock?", function(msg) {
    if (msg.text == cancelString) {
      cancelOption(msg);
    } else {
      unlock(msg.chat, msg.from, msg.text, false);
    }
  }, keyboard);
}

function forceUnlockOption(msg) {
  const lockedKeys = Object.keys(lockConfigHandler.loadConfig(msg.chat).locks);
  const keyboard = bot.arrayToKeyboard(lockedKeys, 3);
  keyboard.push([cancelString]);
  bot.sendText(msg.chat, "What do you want to unlock?", function(msg) {
    if (msg.text == cancelString) {
      cancelOption(msg);
    } else {
      unlock(msg.chat, msg.from, msg.text, true);
    }
  }, keyboard);
}

function listlockOption(msg) {
  const locks = lockConfigHandler.loadConfig(msg.chat).locks;
  const lockedKeys = Object.keys(locks);

  if (lockedKeys.length == 0) {
    bot.sendText(msg.chat, "Nothing locked.");
    return;
  }

  const lockedStrings = lockedKeys.map(v => v + " by " + locks[v].user.first_name);
  let message = "Currently locked:\n";
  message += lockedStrings.join('\n');

  bot.sendText(msg.chat, message);
}

function lock(chat, user, date, value) {
  const config = lockConfigHandler.loadConfig(chat);

  if (value == cancelString || value.substr(0, '/') === '/') {
    bot.sendText(chat, value + " can not be locked. Never ever. Sorry 😱.");
  } else if (config.locks[value]) {
    bot.sendText(chat, value + " is already locked by " + config.locks[value].user.first_name);
  } else {
    config.locks[value] = {
      user: user,
      date: date
    };
    lockConfigHandler.saveConfig(chat, config);
    bot.sendText(chat, value + " is now locked by " + user.first_name);
  }
}

function unlock(chat, user, value, force) {
  const config = lockConfigHandler.loadConfig(chat);
  const lockEntry = config.locks[value];

  if (!lockEntry) {
    bot.sendText(chat, value + " is not locked?");
  } else if (lockEntry.user.id != user.id && !force) {
    bot.sendText(chat, "You did not locked that. If you really have to unlock " + value + " from " + lockEntry.user.first_name + " use `forceunlock`.");
  } else {
    delete config.locks[value];
    lockConfigHandler.saveConfig(chat, config);
    bot.sendText(chat, value + " is now unlocked.");
  }
}

var ChatConfigHandler = require('telegramBotChatConfigHandler');
var BotHandler = require('telegramBotBotHandler');

var lockConfigHandler = new ChatConfigHandler('locks', { locks: {}});
var bot = new BotHandler("token.txt");

var cancelString = "⛔️ cancel ⛔️";
function cancelOption (msg) {
  bot.sendText(msg.chat, "😔");
}

bot.setMainMenu(function(chat) {
  var locks = lockConfigHandler.loadConfig(chat).locks
  var lockedKeys = Object.keys(locks);

  var options = {};
  options.lock = lockOption;
  if (lockedKeys.length > 0) {
    options.unlock = unlockOption;
    if (chat.id < 0)
      options.forceunlock = forceUnlockOption;
    options.listlock = listlockOption;
  }
  options[cancelString] = cancelOption;

  bot.sendText(chat, "What do you want to do?", options);
});

function lockOption (msg) {
  bot.sendText(msg.chat, "What do you want to lock?", function(msg) {
    lock(msg.chat, msg.from, msg.date, msg.text);
  });
};

function unlockOption (msg) {
  var locks = lockConfigHandler.loadConfig(msg.chat).locks
  var lockedKeys = Object.keys(locks);
  var myLockedKeys = [];
  for (var i = 0; i < lockedKeys.length; i++) {
    if (locks[lockedKeys[i]].user.id == msg.from.id)
      myLockedKeys.push(lockedKeys[i]);
  }

  var keyboard = bot.arrayToKeyboard(myLockedKeys, 3);
  keyboard.push([ cancelString ]);
  bot.sendText(msg.chat, "What do you want to unlock?", function(msg) {
    if (msg.text == cancelString) {
      cancelOption(msg);
    } else {
      unlock(msg.chat, msg.from, msg.text, false);
    }
  }, keyboard);
}

function forceUnlockOption (msg) {
  var lockedKeys = Object.keys(lockConfigHandler.loadConfig(msg.chat).locks);
  var keyboard = bot.arrayToKeyboard(lockedKeys, 3);
  keyboard.push([ cancelString ]);
  bot.sendText(msg.chat, "What do you want to unlock?", function(msg) {
    if (msg.text == cancelString) {
      cancelOption(msg);
    } else {
      unlock(msg.chat, msg.from, msg.text, true);
    }
  }, keyboard);
}

function listlockOption (msg) {
  var locks = lockConfigHandler.loadConfig(msg.chat).locks;
  var lockedKeys = Object.keys(locks);

  var lockedStrings = lockedKeys.map(v => v + " by " + locks[v].user.first_name);
  var message = "Currently locked:\n";
  message += lockedStrings.join('\n');

  bot.sendText(msg.chat, message);
};

var lock = (chat, user, date, value) => {
  var config = lockConfigHandler.loadConfig(chat);

  if (value == cancelString || value.substr(0, '/') === '/') {
    bot.sendText(chat, value + " can not be locked. Never ever. Sorry 😱.");
  } else if (config.locks[value]) {
    bot.sendText(chat, value + " is already locked by " + config.locks[value].user.first_name);
  } else {
    config.locks[value] = { user: user, date: date };
    lockConfigHandler.saveConfig(chat, config);
    bot.sendText(chat, value + " is now locked by " + user.first_name);
  }
};

var unlock = (chat, user, value, force) => {
  var config = lockConfigHandler.loadConfig(chat);
  var lockEntry = config.locks[value];

  if (!lockEntry) {
    bot.sendText(chat, value + " is not locked?");
  } else if (lockEntry.user.id != user.id && !force) {
    bot.sendText(chat, "You did not locked that. If you really have to unlock " + value + " from " + lockEntry.user.first_name + " use `forceunlock`.")
  } else {
    delete config.locks[value];
    lockConfigHandler.saveConfig(chat, config);
    bot.sendText(chat, value + " is now unlocked.");
  }
}

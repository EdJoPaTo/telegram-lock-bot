var ChatConfigHandler = require('./ChatConfigHandler.js');
var TelegramBot = require('node-telegram-bot-api');

var lockConfigHandler = new ChatConfigHandler('locks', { locks: {}});

var token = fs.readFileSync("token.txt", "utf8").trim();
console.log(token);

var lock = (chat, user, date, value) => {
  var config = lockConfigHandler.loadConfig(chat);

  if (config.locks[value]) {
    bot.sendMessage(chat.id, value + " is already locked by " + config.locks[value].user.first_name);
  } else {
    config.locks[value] = { user: user, date: date };
    lockConfigHandler.saveConfig(chat, config);
    bot.sendMessage(chat.id, value + " is now locked by " + user.first_name);
  }
};

var unlock = (chat, user, value, force) => {
  var config = lockConfigHandler.loadConfig(chat);
  var lockEntry = config.locks[value];

  if (!lockEntry) {
    bot.sendMessage(chat.id, value + " is not locked?");
  } else if (lockEntry.user.id != user.id && !force) {
    bot.sendMessage(chat.id, "You did not locked that. If you really have to unlock " + value + " from " + lockEntry.user.first_name + " use `/forceunlock " + value + "`.")
  } else {
    delete config.locks[value];
    lockConfigHandler.saveConfig(chat, config);
    bot.sendMessage(chat.id, value + " is now unlocked.");
  }
}

var force_reply = { reply_markup: JSON.stringify({force_reply: true}) };

var sendWithReply = function(targetid, sendMessage, callback) {
  bot.sendMessage(targetid, sendMessage, force_reply)
  .then(function (sended) {
    bot.onReplyToMessage(sended.chat.id, sended.message_id, callback);
  });
}

// Setup polling way
var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/i, function (msg, match) {
  var fromId = msg.chat.id;
  var name = msg.chat.title ? msg.chat.title : msg.chat.first_name;
  bot.sendMessage(fromId, "Hi " + name + "!");
});

bot.onText(/\/lock(?: (.+))?/i, (msg, match) => {
  if (match[1]) {
    lock(msg.chat, msg.from, msg.date, match[1]);
  } else {
    sendWithReply(msg.chat.id, "what do you want to lock?", function (reply) {
      lock(reply.chat, reply.from, reply.date, reply.text);
    });
  }
});

bot.onText(/\/isLocked (.+)/i, (msg, match) => {
  var value = match[1];
  var lockEntry = lockConfigHandler.loadConfig(msg.chat).locks[value];

  if (!lockEntry) {
    bot.sendMessage(msg.chat.id, value + " is currently not locked.");
  } else {
    bot.sendMessage(msg.chat.id, value + " is currently locked by " + lockEntry.user.first_name);
  }
});

bot.onText(/\/unlock(?: (.+))?/i, (msg, match) => {
  if (match[1]) {
    unlock(msg.chat, msg.from, match[1]);
  } else {
    sendWithReply(msg.chat.id, "what do you want to unlock?", function (reply) {
      unlock(reply.chat, reply.from, reply.text);
    });
  }
});

bot.onText(/\/forceunlock(?: (.+))/i, (msg, match) => {
  if (match[1]) {
    unlock(msg.chat, msg.from, match[1], true);
  } else {
    sendWithReply(msg.chat.id, "what do you want to unlock?", function (reply) {
      unlock(reply.chat, reply.from, reply.text, true);
    });
  }
});

bot.onText(/\/listlock/i, (msg, match) => {
  var locks = lockConfigHandler.loadConfig(msg.chat).locks;
  var lockedKeys = Object.keys(locks);

  if (lockedKeys.length == 0) {
    bot.sendMessage(msg.chat.id, "Nothing locked.");
    return;
  }

  var lockedStrings = lockedKeys.map(v => v + " by " + locks[v].user.first_name);
  var message = "Currently locked:\n";
  message += lockedStrings.join('\n');

  bot.sendMessage(msg.chat.id, message);
});

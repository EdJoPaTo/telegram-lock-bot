const fs = require('fs');
var TelegramBot = require('node-telegram-bot-api');

var token = fs.readFileSync("token.txt", "utf8").trim();
console.log(token);

try { fs.mkdirSync('locks', '0755'); } catch (e) { }

var saveLockFile = (chat, lockFile) => {
  fs.writeFileSync('locks/' + chat.id + '.json', JSON.stringify(lockFile), 'utf8');
};

var initLockFile = (chat) => {
  try {
    var fileContentString = fs.readFileSync('locks/' + chat.id + '.json', 'utf8')
    var fileContent = JSON.parse(fileContentString);
  } catch (e) {
    var fileContent = { "chat": chat, locks: {} };
    saveLockFile(chat, fileContent);
  }
  return fileContent;
};

// Setup polling way
var bot = new TelegramBot(token, {polling: true});

// Matches /echo [whatever]
bot.onText(/\/echo (.+)/i, function (msg, match) {
  var fromId = msg.from.id;
  var resp = match[1];
  bot.sendMessage(fromId, resp);
});

bot.onText(/\/lock (.+)/i, (msg, match) => {
  var lockFile = initLockFile(msg.chat);
  var fromId = msg.from.id;
  var value = match[1];

  if (lockFile.locks[value]) {
    bot.sendMessage(msg.chat.id, value + " is already locked by " + lockFile.locks[value].user.first_name);
  } else {
    lockFile.locks[value] = { user: msg.from, date: msg.date };
    saveLockFile(msg.chat, lockFile);
    bot.sendMessage(msg.chat.id, value + " is now locked by " + msg.from.first_name);
  }
});

bot.onText(/\/isLocked (.+)/i, (msg, match) => {
  var lockFile = initLockFile(msg.chat);
  var value = match[1];
  var lockEntry = lockFile.locks[value];

  if (!lockEntry) {
    bot.sendMessage(msg.chat.id, value + " is currently not locked.");
  } else {
    bot.sendMessage(msg.chat.id, value + " is currently locked by " + lockEntry.user.first_name);
  }
});

bot.onText(/\/unlock (.+)/i, (msg, match) => {
  var lockFile = initLockFile(msg.chat);
  var value = match[1];
  var lockEntry = lockFile.locks[value];

  if (!lockEntry) {
    bot.sendMessage(msg.chat.id, value + " is not locked?");
  } else if (lockEntry.user.id != msg.from.id) {
    bot.sendMessage(msg.chat.id, "You did not locked that. If you really have to unlock " + value + " from " + lockEntry.user.first_name + " use `/forceunlock " + value + "`.")
  } else {
    delete lockFile.locks[value];
    saveLockFile(msg.chat, lockFile);
    bot.sendMessage(msg.chat.id, value + " is now unlocked.");
  }
});

bot.onText(/\/forceunlock (.+)/i, (msg, match) => {
  var lockFile = initLockFile(msg.chat);
  var value = match[1];
  var lockEntry = lockFile.locks[value];

  if (!lockEntry) {
    bot.sendMessage(msg.chat.id, value + " is not locked?");
  } else {
    delete lockFile.locks[value];
    saveLockFile(msg.chat, lockFile);
    bot.sendMessage(msg.chat.id, value + " is now unlocked.");
  }
});

bot.onText(/\/listlock/i, (msg, match) => {
  var lockFile = initLockFile(msg.chat);
  var lockedKeys = Object.keys(lockFile.locks);

  if (lockedKeys.length == 0) {
    bot.sendMessage(msg.chat.id, "Nothing locked.");
    return;
  }

  var lockedStrings = lockedKeys.map(v => v + " by " + lockFile.locks[v].user.first_name);
  var message = "Currently locked:\n";
  message += lockedStrings.join('\n');

  bot.sendMessage(msg.chat.id, message);
});

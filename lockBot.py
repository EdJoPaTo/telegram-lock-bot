import telebot
import time
import re
import string


namelist = {}
locklist = {}
functionRegEx = re.compile( '/(\w+)(?: (.*))?', re.IGNORECASE )

def nameofid( userid ):
    return namelist[ userid ]

def lock( chatid, userid, obj ):
    if not( chatid in locklist ):
        locklist[ chatid ] = { }
    if obj in locklist[ chatid ]:
        tb.send_message( chatid, 'Cant lock ' + obj + '\nIt\'s already locked by ' + nameofid( locklist[ chatid ][ obj ] ) + '!' )
    else:
        locklist[ chatid ][ obj ] = userid
        tb.send_message( chatid, obj + ' is now locked by ' + nameofid( userid ) )

def unlock( chatid, userid, obj ):
    if not( chatid in locklist ):
        locklist[ chatid ] = { }
    if not obj in locklist[ chatid ]:
        tb.send_message( chatid, obj + ' is not locked?' )
    elif not locklist[ chatid ][ obj ] == userid:
        tb.send_message( chatid, obj + ' wasn\'t locked by you!\nIf you want to force unlock it use /forceunlock ' + obj )
    else:
        del locklist[ chatid ][ obj ]
        tb.send_message( chatid, obj + ' is now free for all!' )

def forceunlock( chatid, userid, obj ):
    if not( chatid in locklist ):
        locklist[ chatid ] = { }
    if not obj in locklist[ chatid ]:
        tb.send_message( chatid, obj + ' is not locked?' )
    else:
        del locklist[ chatid ][ obj ]
        tb.send_message( chatid, obj + ' is now free for all!' )

def listlock( chatid ):
    if not( chatid in locklist) or not locklist[ chatid ]:
        tb.send_message( chatid, 'Nothing locked.' )
        return

    message = 'Currently locked:'
    for entry in locklist[ chatid ]:
        message += '\n- ' + entry + ' locked by ' + nameofid( locklist[ chatid ][ entry ] )

    tb.send_message( chatid, message )


def listener( *messages ):
    """
    When new message get will call this function.
    :param messages:
    :return:
    """
    for m in messages:
        chatid = m.chat.id
        userid = m.fromUser.id

        namelist[ userid ] = m.fromUser.first_name
        if not m.fromUser.last_name is None:
            namelist[ userid ] += ' ' + m.fromUser.last_name

        if m.content_type is None:
            continue
        if not m.content_type == 'text':
            tb.send_message(chatid, 'i only understand text... sry')
            continue

        text = m.text
        text = text.lower()
        text = string.replace( text, '@lockbot', '' )

        if text.__len__() == 0:
            print 'empty text'
            continue

        match = functionRegEx.match( text )

        if match is None:
            print 'no match'
            continue

        function = match.group( 1 )
        param = match.group( 2 )

        print ''
        print 'Chat: ' + `chatid`
        print 'User: ' + `userid` + ' ' + nameofid( userid )
        print 'Function: ' + function
        if not param is None:
            print 'Parameter: ' + param

        if function == 'lock':
            if param is None:
                tb.send_message( chatid, 'Say what you want to lock:\n/lock something' )
            else:
                lock( chatid, userid, param )
        elif function == 'unlock':
            if param is None:
                tb.send_message( chatid, 'Say what you want to unlock:\n/unlock something' )
            else:
                unlock( chatid, userid, param )
        elif function == 'forceunlock':
            if param is None:
                tb.send_message( chatid, 'Say what you want to force unlock:\n/forceunlock something' )
            else:
                forceunlock( chatid, userid, param )
        elif function == 'listlock':
            listlock( chatid )
        elif function == 'start' or function == 'help':
            tb.send_message( chatid, 'Use "/lock something" and "/unlock something"\nif you want to view your locks use "/listlock"\n\nIf you found a bug or a feature request ask @EdJoPaTo or see the https://github.com/EdJoPaTo/telegramLockBot page' )


f = open('token.txt', 'r')
TOKEN = f.read()
f.close()
TOKEN = TOKEN.strip('\n\r')

print TOKEN

tb = telebot.TeleBot(TOKEN)
tb.get_update()  # cache exist message
tb.set_update_listener(listener) #register listener
tb.polling( 5 )
while True:
    time.sleep( 20 )

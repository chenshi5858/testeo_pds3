import os
from telegram import Bot

def main():
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        print('NO_TOKEN')
        return
    try:
        b = Bot(token=token)
        me = b.get_me()
        print('OK', me.username, me.id)
    except Exception as e:
        print('ERROR', repr(e))

if __name__ == '__main__':
    main()

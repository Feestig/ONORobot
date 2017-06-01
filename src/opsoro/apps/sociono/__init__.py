from __future__ import with_statement

from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory

from opsoro.console_msg import *
from opsoro.hardware import Hardware
from opsoro.robot import Robot
from opsoro.expression import Expression
# from opsoro.stoppable_thread import StoppableThread
from opsoro.sound import Sound
from opsoro.stoppable_thread import StoppableThread

from functools import partial
import os

import tweepy

import urllib2
from functools import partial
from random import randint



def constrain(n, minn, maxn): return max(min(maxn, n), minn)



config = {
    'full_name':            'sociono',
    'author':               ['Arno Vande Cappelle','Thibaud Vander Syppe', 'Auguste Van Nieuwenhuyzen'],
    'icon':                 'fa-slack',
    'color':                'blue',
    'difficulty':           1,
    'tags':                 ['Twitter', 'developer'],
    'allowed_background':   True,
    'connection':           Robot.Connection.ONLINE,
    'activation':           Robot.Activation.AUTO
}
config['formatted_name'] =  config['full_name'].lower().replace(' ', '_')

def setup_pages(server):
    app_bp = Blueprint(config['formatted_name'], __name__, template_folder='templates', static_folder='static')


    @app_bp.route('/')
    @server.app_view
    def index():
        data = {
            'actions': {},
            'data': [],
        }
        action = request.args.get('action', None)
        if action != None:
            data['actions'][action] = request.args.get('param', None)


        return server.render_template(config['formatted_name'] + '.html', **data)

    server.register_app_blueprint(app_bp)

access_token = '141268248-yAGsPydKTDgkCcV0RZTPc5Ff7FGE41yk5AWF1dtN'
access_token_secret = 'UalduP04BS4X3ycgBJKn2QJymMhJUbNfQZlEiCZZezW6V'
consumer_key = 'tNYqa3yLHTGhBvGNblUHHerlJ'
consumer_secret = 'NxBbCA8VJZvxk1SNKWw3CWd5oSnJyNAcH9Kns5Lv1DV0cqrQiz'

twitterWords = ['#opsoro']

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

#getting new tweet
class MyStreamListener(tweepy.StreamListener):
    def on_status(self, status):
        print_info(status.text)
        Sound.say_tts(status.text)

api = tweepy.API(auth)
myStreamListener = MyStreamListener()
myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)


# Default functions for setting up, starting and stopping an app
def setup(server):
    pass

def start(server):
     global myStream
     myStream.filter(track=twitterWords, async=True)


def stop(server):
    global myStream
    myStream.disconnect()

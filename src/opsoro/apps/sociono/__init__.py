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



#QUESTION
def constrain(n, minn, maxn): return max(min(maxn, n), minn)



config = {
    'full_name':            'sociono',
    'author':               ['Arno Vande Cappelle','Thibaud Vander Syppe', 'Auguste Van Nieuwenhuyzen'],
    'icon':                 'fa-info',
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
            'data': ["hello"],
        }
        action = request.args.get('action', None)
        if action != None:
            data['actions'][action] = request.args.get('param', None)


        return server.render_template(config['formatted_name'] + '.html', **data)

    server.register_app_blueprint(app_bp)

access_token = '735437381696905216-BboISY7Qcqd1noMDY61zN75CdGT0OSc'
access_token_secret = 'd3A8D1ttrCxYV76pBOB389YqoLB32LiE0RVyoFwuMKUMb'
consumer_key = 'AcdgqgujzF06JF6zWrfwFeUfF'
consumer_secret = 'ss0wVcBTFAT6nR6hXrqyyOcFOhpa2sNW4cIap9JOoepcch93ky'



twitterWords = ['#tennis']

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

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

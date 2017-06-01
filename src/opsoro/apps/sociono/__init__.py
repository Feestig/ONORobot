from __future__ import with_statement

from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory
from werkzeug import secure_filename
from opsoro.sound import Sound

import math
import cmath

from opsoro.robot import Robot
from opsoro.console_msg import *
from opsoro.hardware import Hardware
from opsoro.stoppable_thread import StoppableThread

from functools import partial
from exceptions import RuntimeError
import os
import glob
import shutil
import time
import yaml
try:
    from yaml import CLoader as Loader
except ImportError:
    from yaml import Loader


import tweepy

constrain = lambda n, minn, maxn: max(min(maxn, n), minn)

# from opsoro.expression import Expression

config = {
    'full_name':            'Sociono',
    'icon':                 'fa-info',
    'color':                'green',
    'difficulty':           4,
    'tags':                 [''],
    'allowed_background':   False,
    'connection':           Robot.Connection.OFFLINE,
    'activation':           Robot.Activation.AUTO
}
config['formatted_name'] =  config['full_name'].lower().replace(' ', '_')


get_path = partial(os.path.join, os.path.abspath(os.path.dirname(__file__)))

dof_positions = {}

clientconn = None


def send_stopped():
    global clientconn
    if clientconn:
        clientconn.send_data('soundStopped', {})


def SocionoRun():
    Sound.wait_for_sound()
    send_stopped()


sociono_t = None


def setup_pages(opsoroapp):
    sociono_bp = Blueprint(
        config['formatted_name'],
        __name__,
        template_folder='templates',
        static_folder='static')

    @sociono_bp.route('/', methods=['GET', 'POST'])
    @opsoroapp.app_view
    def index():
        data = {'actions': {}, 'emotions': [], 'sounds': []}

        action = request.args.get('action', None)
        if action != None:
            data['actions'][action] = request.args.get('param', None)

        with open(get_path('emotions.yaml')) as f:
            data['emotions'] = yaml.load(f, Loader=Loader)

        filenames = glob.glob(get_path('../../data/sounds/*.wav'))

        for filename in filenames:
            data['sounds'].append(os.path.split(filename)[1])
        data['sounds'].sort()

        # Auguste code
        if request.method == "POST":
            stopTwitter()
            social_id = []
            social_id.append(request.form['social_id'])
            startTwitter(social_id)

        return opsoroapp.render_template(config['formatted_name'] + '.html', **data)

    @opsoroapp.app_socket_connected
    def s_connected(conn):
        global clientconn
        clientconn = conn

    @opsoroapp.app_socket_disconnected
    def s_disconnected(conn):
        global clientconn
        clientconn = None


    opsoroapp.register_app_blueprint(sociono_bp)


access_token = '141268248-yAGsPydKTDgkCcV0RZTPc5Ff7FGE41yk5AWF1dtN'
access_token_secret = 'UalduP04BS4X3ycgBJKn2QJymMhJUbNfQZlEiCZZezW6V'
consumer_key = 'tNYqa3yLHTGhBvGNblUHHerlJ'
consumer_secret = 'NxBbCA8VJZvxk1SNKWw3CWd5oSnJyNAcH9Kns5Lv1DV0cqrQiz'

#twitterWords = ['#opsoro']

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
def setup(opsoroapp):
    pass

def start(opsoroapp):
    pass

def stop(opsoroapp):
    pass

def startTwitter(twitterWords):
    global myStream
    myStream.filter(track=twitterWords, async=True)
    
    print_info(twitterWords)

def stopTwitter():
    global myStream
    myStream.disconnect()

    print_info("stop twitter stream")
# -*- coding: utf-8 -*-
from __future__ import with_statement

import glob
import math
import os
import shutil
import time
from exceptions import RuntimeError
from functools import partial

import yaml
from flask import (Blueprint, flash, redirect, render_template, request,
                   send_from_directory, url_for)
from werkzeug import secure_filename
from opsoro.sound import Sound
from opsoro.sound import TTS
import cmath

from opsoro.expression import Expression
from opsoro.robot import Robot
from opsoro.console_msg import *
from opsoro.expression import Expression
from opsoro.hardware import Hardware
from opsoro.robot import Robot
from opsoro.stoppable_thread import StoppableThread

from opsoro.users import Users

try:
    from yaml import CLoader as Loader
except ImportError:
    from yaml import Loader


import tweepy
import re
import urllib2
import unicodedata
import sys


# from opsoro.expression import Expression

config = {
    'full_name':            'Sociono',
    'icon':                 'fa-info',
    'color':                'green',
    'difficulty':           4,
    'tags':                 [''],
    'allowed_background':   False,
    'multi_user':           True,
    'connection':           Robot.Connection.OFFLINE,
    'activation':           Robot.Activation.AUTO
}
config['formatted_name'] = config['full_name'].lower().replace(' ', '_')


get_path = partial(os.path.join, os.path.abspath(os.path.dirname(__file__)))

dof_positions = {}


def send_stopped():
    Users.send_app_data(config['formatted_name'], 'soundStopped', {})

def send_data(action, data):
    #def send_app_data(self, appname, action, data={}): from Opsoro.Users
    Users.send_app_data(config['formatted_name'], action, data)

def wait_for_sound():
    Sound.wait_for_sound()
    send_stopped()


sociono_t = None


def setup_pages(opsoroapp):
    sociono_bp = Blueprint(config['formatted_name'], __name__, template_folder='templates', static_folder='static')

    @sociono_bp.route('/', methods=['GET'])
    @opsoroapp.app_view
    def index():
        data = {'actions': {}, 'emotions': [], 'sounds': []}

        action = request.args.get('action', None)
        if action != None:
            data['actions'][action] = request.args.get('param', None)

        data['emotions'] = Expression.expressions

        filenames = glob.glob(get_path('../../data/sounds/*.wav'))

        for filename in filenames:
            data['sounds'].append(os.path.split(filename)[1])
        data['sounds'].sort()


        return opsoroapp.render_template(config['formatted_name'] + '.html', **data)

    @sociono_bp.route('/', methods=['POST'])
    @opsoroapp.app_view
    def post():

        # Auguste code --- Te verbeteren a.d.h.v. post actions

        data = {'actions': {}, 'emotions': [], 'sounds': []}

        if request.form['action'] == 'startTweepy':
            stopTwitter()
            if request.form['data']:
                social_id = []
                social_id.append(request.form['data'])
                startTwitter(social_id)

        if request.form['action'] == 'stopTweepy':
            stopTwitter()

        if request.form['action'] == 'autoLoopTweepy':
            wait_for_sound()
            #if request.form['data']:


        return opsoroapp.render_template(config['formatted_name'] + '.html', **data)


    opsoroapp.register_app_blueprint(sociono_bp)


access_token = '735437381696905216-BboISY7Qcqd1noMDY61zN75CdGT0OSc'
access_token_secret = 'd3A8D1ttrCxYV76pBOB389YqoLB32LiE0RVyoFwuMKUMb'
consumer_key = 'AcdgqgujzF06JF6zWrfwFeUfF'
consumer_secret = 'ss0wVcBTFAT6nR6hXrqyyOcFOhpa2sNW4cIap9JOoepcch93ky'

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

#getting new tweet
class MyStreamListener(tweepy.StreamListener):

    def on_status(self, status):
        dataToSend = processJson(status)
        print_info(dataToSend)
        if dataToSend['text']['filtered'] != None:
            send_data('tweepy', dataToSend)
            process_tweepy_json(status)


api = tweepy.API(auth)
myStreamListener = MyStreamListener()
myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)
#process tweepy json
def process_tweepy_json(status):
    data = {}
    data[0] = status._json["user"]["screen_name"]
    data[1] = status._json["user"]["profile_image_url_https"]
    data[2] = status.text
    data[3] = status._json["lang"]
    data[4] = rtToRetweet(status)
    checkForEmoji(data)
def checkForEmoji(data):
    #emoticonStr = unicode("😠", 'utf-8')
    emoticonStr = data[2]
    #'this is a test  \U0001F620 \U0001F620 \U0001F620'
    #decode makes emoji from code while encode makes code from emoji
    #emoticonStr = emoticonStr.decode('unicode-escape')
    print_info(emoticonStr)
    winking = len(re.findall(u"[\U0001F609]", emoticonStr))
    angry = len(re.findall(u"[\U0001F620]", emoticonStr))
    happy_a = len(re.findall(u"[\U0000263A]", emoticonStr))
    happy_b = len(re.findall(u"[\U0000263b]", emoticonStr))
    happy_c = len(re.findall(u"[\U0001f642]", emoticonStr))
    thinking = len(re.findall(u"[\U0001F914]", emoticonStr))
    frowning = len(re.findall(u"[\U00002639]", emoticonStr))
    nauseated = len(re.findall(u"[\U0001F922]", emoticonStr))
    astonished = len(re.findall(u"[\U0001F632]", emoticonStr))
    neutral = len(re.findall(u"[\U0001F610]", emoticonStr))
    fearful = len(re.findall(u"[\U0001F628]", emoticonStr))
    laughing = len(re.findall(u"[\U0001F603]", emoticonStr))
    tired = len(re.findall(u"[\U0001F62B]", emoticonStr))
    sad = len(re.findall(u"[\U0001f641]", emoticonStr))

    if winking > 0:
        print_info(winking)
        Expression.set_emotion_name("Tong", 1)
        pass
    elif angry > 0:
        print_info("angry Expression")
        Expression.set_emotion_name("angry", 1)
        pass
    elif happy_a > 0 or happy_b > 0 or happy_c > 0:
        Expression.set_emotion_name("happy", 1)
        pass
    elif frowning > 0:
        Expression.set_emotion_name("tired", 1)
        pass
    elif nauseated > 0:
        Expression.set_emotion_name("disgusted", 1)
        pass
    elif astonished > 0:
        Expression.set_emotion_name("surprised", 1)
        pass
    elif neutral > 0:
        print_info(neutral)
        Expression.set_emotion_name("neutral", 1)
        pass
    elif fearful > 0:
        Expression.set_emotion_name("afraid", 1)
        pass
    elif laughing > 0:
        Expression.set_emotion_name("laughing", 1)
        pass
    elif tired > 0:
        Expression.set_emotion_name("sleep", 1)
        pass
    elif sad > 0:
        Expression.set_emotion_name("sad", 1)
        pass

def rtToRetweet(status):
    #alles in nieuw object aanmaken en steken
    encodedstattext = status.text.encode('utf-8')
    strTweet = str(encodedstattext)
    strTweet = strTweet.replace("RT","ReTweet", 1)
    strTweet = strTweet.decode('unicode-escape').encode('ascii','ignore')
    strTweet = re.sub(r'\w+:\/{2}[\d\w-]+(\.[\d\w-]+)*(?:(?:\/[^\s/]*))*', '', strTweet, flags=re.MULTILINE)
    strTweet = languageCheck(strTweet, status)
    return strTweet
def languageCheck(strTweet,status):
    if status.lang == "en":
        return strTweet.replace("@","from ", 1)
    elif status.lang == "nl":
        return strTweet.replace("@","van ", 1)
    elif status.lang == "de":
        return strTweet.replace("@","von ", 1)
    elif status.lang == "fr":
        return strTweet.replace("@","de ", 1)
def say_tweet(status):
    file_path = str(os.path.expanduser('~/sociono'))
    TTS.create_espeak(status.text, file_path, status.lang, "m", 10, 100)


# Default functions for setting up, starting and stopping an app
def setup(opsoroapp):
    pass

def start(opsoroapp):
    pass

def stop(opsoroapp):
    stopTwitter()
    pass

def startTwitter(twitterWords):
    print_info("start twitter")
    global myStream
    myStream.filter(track=twitterWords, async=True)



def stopTwitter():
    global myStream
    myStream.disconnect()
    print_info("stop twitter stream")


# Thibaud code

#process tweepy json
def processJson(status):
    data = {
        "user": {
            "username": status._json["user"]["screen_name"],
            "profile_picture": status._json["user"]["profile_image_url_https"]
        },
        "text": {
            "original": status.text,
            "filtered": filterTweet(status)
        }
    }

    return data

def filterTweet(status):
    #alles in nieuw object aanmaken en steken
    encodedstattext = status.text.encode('utf-8')
    strTweet = str(encodedstattext)
    strTweet = strTweet.replace("RT","Retweet", 1)
    strTweet = strTweet.decode('unicode_escape').encode('ascii','ignore')
    strTweet = re.sub(r'\w+:\/{2}[\d\w-]+(\.[\d\w-]+)*(?:(?:\/[^\s/]*))*', '', strTweet, flags=re.MULTILINE) # re -> import re (regular expression)
    strTweet = languageCheck(strTweet, status)
    return strTweet

def languageCheck(strTweet,status):
    if status.lang == "en":
        return strTweet.replace("@","from ", 1)
    elif status.lang == "nl":
        return strTweet.replace("@","van ", 1)
    elif status.lang == "de":
        return strTweet.replace("@","von ", 1)
    elif status.lang == "fr":
        return strTweet.replace("@","de ", 1)

def sayTweetInLanguage(status):
    file_path = str(os.path.expanduser('~/sociono'))
    TTS.create_espeak(status.text, file_path, status.lang, "m", 10, 100)

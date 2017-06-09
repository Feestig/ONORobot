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

import cmath
from opsoro.console_msg import *
from opsoro.expression import Expression
from opsoro.hardware import Hardware
from opsoro.robot import Robot
from opsoro.sound import Sound
from opsoro.sound.tts import TTS

from opsoro.stoppable_thread import StoppableThread

from opsoro.users import Users

try:
    from yaml import CLoader as Loader
except ImportError:
    from yaml import Loader


import tweepy
import re
import json

def constrain(n, minn, maxn): return max(min(maxn, n), minn)


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


def send_action(action):
    Users.send_app_data(config['formatted_name'], action, {})

def send_data(action, data):
    #def send_app_data(self, appname, action, data={}): from Opsoro.Users
    Users.send_app_data(config['formatted_name'], action, data)

def wait_for_sound():
    global loop_T
    loop_T = StoppableThread(target=loop)
    
    Sound.wait_for_sound()


sociono_t = None
autoRead = None # globals -> can be decalerd in called methodes
loop_T = None # loop var for Stoppable Thread

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

        data = {'actions': {}, 'emotions': [], 'sounds': []} # Overbodig ...

        # Auguste code --- Te verbeteren a.d.h.v. post actions
        
        if request.form['action'] == 'startTweepy':
            stopTwitter()
            if request.form['data']:
                # HashTag input
                json_data = json.loads(request.form['data']) # Decoding strigified JSON
                social_id = []
                social_id.append(json_data['socialID'])
                print_info(social_id)

                # Auto Read
                global autoRead
                autoRead = json_data['autoRead']
                print_info(autoRead)

                # Start Tweepy stream
                startTwitter(social_id)

        if request.form['action'] == 'stopTweepy':
            stopTwitter()    

        if request.form['action'] == 'autoLoopTweepyNext':
            stopTwitter()
            wait_for_sound()
            send_action(request.form['action'])
            
        if request.form['action'] == 'autoLoopTweepyStop':
            send_action(request.form['action'])

        if request.form['action'] == 'playTweet':
            if request.form['data']:
                tweepyObj = json.loads(request.form['data'])
                playTweetInLanguage(tweepyObj)


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
        #print_info(dataToSend)
        if dataToSend['text']['filtered'] != None:
            send_data('dataFromTweepy', dataToSend)

            #print_info(autoRead)
            if autoRead == True:
                playTweetInLanguage(dataToSend) # if auto read = true -> read tweets when they come in



api = tweepy.API(auth)
myStreamListener = MyStreamListener()
myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)


# Default functions for setting up, starting and stopping an app
def setup(opsoroapp):
    pass

def start(opsoroapp):
    pass

def stop(opsoroapp):
    stopTwitter()


def startTwitter(twitterWords):
    global myStream
    myStream.filter(track=twitterWords, async=True)


    print_info(twitterWords)

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
            "filtered": filterTweet(status),
            "lang": status.lang,
            "emoticon": checkForEmoji(status)
        }
    }

    return data

def filterTweet(status):
    #alles in nieuw object aanmaken en steken
    encodedstattext = status.text.encode('utf-8')
    strTweet = str(encodedstattext)
    strTweet = strTweet.replace("RT", "Retweet", 1)
    strTweet = strTweet.replace("#", "")
    #voor emoticons te verwijderen
    strTweet = strTweet.decode('unicode_escape').encode('ascii', 'ignore')
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


def playTweetInLanguage(tweepyObj):

    print_info(tweepyObj)

    if not os.path.exists("/tmp/OpsoroTTS/"):
        os.makedirs("/tmp/OpsoroTTS/")

    full_path = os.path.join(
        get_path("/tmp/OpsoroTTS/"), "Tweet.wav")

    if os.path.isfile(full_path):
        os.remove(full_path)

    TTS.create_espeak(tweepyObj['text']['filtered'], full_path, tweepyObj['text']['lang'], "f", "5", "150")

    Sound.play_file(full_path)


# Emoticon functions
#check if the post has an standard emoticon
def checkForEmoji(status):
    emotions = []
    emoticonStr = status.text

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
        emotions.append("tong")
    if angry > 0:
        emotions.append("angry")
    if happy_a > 0 or happy_b > 0 or happy_c > 0:
        emotions.append("happy")
    if frowning > 0:
        emotions.append("tired")
    if nauseated > 0:
        emotions.append("disgusted")
    if astonished > 0:
        emotions.append("surprised")
    if neutral > 0:
        emotions.append("neutral")
    if fearful > 0:
        emotions.append("afraid")
    if laughing > 0:
        emotions.append("laughing")
    if tired > 0:
        emotions.append("sleep")
    if sad > 0:
        emotions.append("sad")
    #if no emotions are selected returns none
    if not emotions:
        emotions.append("none")
    return emotions


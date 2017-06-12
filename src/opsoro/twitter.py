# -*- coding: utf-8 -*-
from __future__ import with_statement

import glob
import math
import os
import shutil
import time
from exceptions import RuntimeError
from functools import partial

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
import time

def constrain(n, minn, maxn): return max(min(maxn, n), minn)

get_path = partial(os.path.join, os.path.abspath(os.path.dirname(__file__)))
#Global variables for the class to handle authorization
access_token = '735437381696905216-BboISY7Qcqd1noMDY61zN75CdGT0OSc'
access_token_secret = 'd3A8D1ttrCxYV76pBOB389YqoLB32LiE0RVyoFwuMKUMb'
consumer_key = 'AcdgqgujzF06JF6zWrfwFeUfF'
consumer_secret = 'ss0wVcBTFAT6nR6hXrqyyOcFOhpa2sNW4cIap9JOoepcch93ky'

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

loop_T = None # loop for Stoppable Thread

autoRead = False
hasRecievedTweet = False

class MyStreamListener(tweepy.StreamListener):

    def on_status(self, status):
        dataToSend = Twitter.processJson(status)
        print_info(dataToSend)
        if dataToSend['text']['filtered'] != None:
            #send_data('dataFromTweepy', dataToSend)
            global hasRecievedTweet
            hasRecievedTweet = True

            #print_info(autoRead)
            #if autoRead == True:
            #    playTweetInLanguage(dataToSend) # if auto read = true -> read tweets when they come in

api = tweepy.API(auth)
myStreamListener = MyStreamListener()
myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)

class _twitter(object):
    """docstring for _twitter."""
    def __init__(self):
        super(_twitter, self).__init__()
        #self.arg = arg

    def init_twitter(self):
        print_info("test for blockly")
    def start_streamreader(self, twitterwords):
        global myStream
        myStream.filter(track=twitterwords, async=True);
        print_info(twitterwords)
    def get_tweet(self, hashtag):
        global loop_T
        global hasRecievedTweet
        hasRecievedTweet = False
        self.start_streamreader(hashtag)
        loop_T = StoppableThread(target=self.wait_for_tweet)
    #streamreader stops after recieving a single tweet
    def wait_for_tweet(self):
        time.sleep(0.05)  # delay

        global loop_T
        while not loop_T.stopped():
            #stops the streamreader when it has recieved a single tweet
            global hasRecievedTweet
            if hasRecievedTweet == True:
                global myStream
                myStream.disconnect()
                print_info("stop twitter stream")
                loop_T.stop()
                pass
            print_info(hasRecievedTweet)
            #hasRecievedTweet = True
    def processJson(self, status):
        data = {
            "user": {
                "username": status._json["user"]["screen_name"],
                "profile_picture": status._json["user"]["profile_image_url_https"]
            },
            "text": {
                "original": status.text,
                "filtered": self.filterTweet(status),
                "lang": status.lang,
                "emoticon": self.checkForEmoji(status)
            }
        }
        return data
    def filterTweet(self, status):
        encodedstattext = status.text.encode('utf-8')
        strTweet = str(encodedstattext)
        strTweet = strTweet.replace("RT", "Retweet", 1)
        strTweet = strTweet.replace("#", "")
        strTweet = strTweet.decode('unicode_escape').encode('ascii', 'ignore')
        strTweet = strTweet.replace("https","")
        strTweet = strTweet.replace("http","")
        strTweet = re.sub(r'\w+:\/{2}[\d\w-]+(\.[\d\w-]+)*(?:(?:\/[^\s/]*))*', '', strTweet, flags=re.MULTILINE) # re -> import re (regular expression)
        strTweet = languageCheck(strTweet, status)
        return strTweet
    def languageCheck(self, strTweet,status):
        if status.lang == "en":
            return strTweet.replace("@","from ", 1)
        elif status.lang == "nl":
            return strTweet.replace("@","van ", 1)
        elif status.lang == "de":
            return strTweet.replace("@","von ", 1)
        elif status.lang == "fr":
            return strTweet.replace("@","de ", 1)
#    def get_tweet(self, hashtag, filter):
        #result_type: popular/ mixed/ recent
#        for tweet in tweepy.Cursor(api.search, q='#yoursearch',result_type='popular').items(5):
#            print(tweet)
#        print_info("tweet by hashtag and filter")
def autoRead(self, autoReadStatus):
    autoRead = autoReadStatus
def playTweetInLanguage(self, tweet):
    print_info(tweepyObj)

    if not os.path.exists("/tmp/OpsoroTTS/"):
        os.makedirs("/tmp/OpsoroTTS/")

    full_path = os.path.join(
        get_path("/tmp/OpsoroTTS/"), "Tweet.wav")

    if os.path.isfile(full_path):
        os.remove(full_path)

    TTS.create_espeak(tweepyObj['text']['filtered'], full_path, tweepyObj['text']['lang'], "f", "5", "150")

    Sound.play_file(full_path)
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































# Global instance that can be accessed by apps and scripts
Twitter = _twitter()

from __future__ import with_statement

from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory

from opsoro.console_msg import *
from opsoro.hardware import Hardware
from opsoro.robot import Robot
from opsoro.expression import Expression
from opsoro.sound import Sound
from opsoro.stoppable_thread import StoppableThread
from opsoro.users import Users

import time

from functools import partial
import os

import json
import urllib2
from functools import partial
from random import randint

constrain = lambda n, minn, maxn: max(min(maxn, n), minn)
get_path = partial(os.path.join, os.path.abspath(os.path.dirname(__file__)))

config = {
    'full_name':            'Facebook Live',
    'icon':                 'fa-video-camera',
    'color':                'red',
    'difficulty':           3,
    'tags':                 ['template', 'developer'],
    'allowed_background':   False,
    'connection':           Robot.Connection.OFFLINE,
    'activation':           Robot.Activation.AUTO
}
config['formatted_name'] =  config['full_name'].lower().replace(' ', '_')

thread_fb_t = None
secOphalenData = 3

def thread_fb():
    time.sleep(0.05)  # delay

    global thread_fb_t
    send_data("threadRunning")
    while not thread_fb_t.stopped():
        time.sleep(secOphalenData)
        pass

def send_data(action):
    Users.send_app_data(config['formatted_name'], action, {})


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


    @app_bp.route('/', methods=['POST'])
    @server.app_view
    def post():
        data = {'actions': {}, 'emotions': [], 'sounds': []}

        if request.form['action'] == 'postToThread':
            global thread_fb_t
            thread_fb_t = StoppableThread(target=thread_fb)
        if request.form['action'] == 'stopThread':
            #global thread_fb_t
            thread_fb_t.stop()

        return server.render_template(config['formatted_name'] + '.html', **data)

    server.register_app_blueprint(app_bp)

# Default functions for setting up, starting and stopping an app
def setup(server):
    pass

def start(server):
    pass

def stop(server):
    thread_fb_t.stop()
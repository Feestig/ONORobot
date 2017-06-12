# twitter.py
this class holds the code that needs to be executed in the blockly module.
in order for this to work you need to edit scripthost.py in the folder lua_scripting
the main class ```_twitter``` holds all the code needed for authorizing requests. It also holds a second class for the streamreader
```
from opsoro.twitter import Twitter
```
and declare it in the function setup_runtime like this:
```
g["Twitter"] = Twitter
```
# Code
there are a few global variables
```
loop_T = None #loop for Stoppable Thread
autoRead = True #bool that sets if the tweet needs to be readed automaticly
hasRecievedTweet = False #bool that keeps track if the streamreader has recieved a tweet, used to exit the stoppableThread
```
the function ```get_tweet(self, hashtag)``` recieves the hashtag needed to listen in on and initializes a stoppableThread
```
def get_tweet(self, hashtag):
    global loop_T
    self.start_streamreader(hashtag)
    loop_T = StoppableThread(target=self.wait_for_tweet)
```
in ```start_streamreader(self, twitterwords)``` a stream is started that listens for new tweets ```twitterwords``` is the hashtag that is being listened on.
```
def start_streamreader(self, twitterwords):
    global hasRecievedTweet
    global myStream
    myStream.filter(track=twitterwords, async=True);
    hasRecievedTweet = True #if adding ui elements to blockly this can be used to get out of a loop
    print_info(twitterwords)
```
A StoppableThread is used for checking if the listener has recieved a tweet or not
```
def wait_for_tweet(self):
    time.sleep(1) #the delay
    global loop_T
    while not loop_T.stopped():
        global hasRecievedTweet #if true stops the loop and streamreader
        if hasRecievedTweet == True:
            global myStream
            myStream.disconnect()
            loop_T.stop()
            pass
```
```stop_streamreader()``` is used to stop the streamreader.

```
def stop_streamreader(self):
    global myStream
    myStream.disconnect()
```
# Todo list:
- [x] start streamListener
- [x] stop streamListener
- [x] filter the tweet
- [x] robot read tweet in language
- [ ] play emoticons
- [ ] create seperate blocks
- [ ] make some presets that can be loaded into blockly

# Issues

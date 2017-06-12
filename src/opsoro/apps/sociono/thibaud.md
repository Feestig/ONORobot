# Thibauds's Documentation

# init.py

The server side code for an app goes inside `__init__.py`

# removing data from text
make sure to import re (regular expressions) since we are using this for removing the link

1. `strTweet.replace("RT","Re Tweet", 1)` to replace rt by re tweet so the robot lets the audience know it's a retweet. the 1 stands for the amount of times we will replace this
2. we convert the string to a ascii format to git rid of possible artefact
3. a regular expression is used to remove the link in the tweet

# Blockly

in the folder of the app sociono there is a subfolder called blockly, this is used to declare new blocks to integrate with the blockly app
1. in sociono.xml new blocks are declared ie. `<block type="type_name"></block>`
2. in sociono.js the blocks are initialized and gets code binded to it.
  2.1`Blockly.Blocks['type_name'] = {}` is where the layout is declared
  2.2.`Blockly.Lua['type_name'] = function(block) {}` is where we will put the code that is to be generated in

# unicode
unicode is a way to encode signs as a stream of bytes.
```
strTweet = strTweet.decode('unicode_escape').encode('ascii','ignore')
```
unicode escape Produce[s] a string that is suitable as Unicode literal in Python source code
decode makes emoji from code while encode makes code from emoji

# filtering emoticons
We wil use regular expressions to check if a post has an emoticon and we wil keep count of the amount of times given emoticon is present
then an if structure is used to keep track of the emoticons in the post. Here it is checked if an emoticon is present and add the emoticon's name to the array.

if no emoticons are present a simple none is returned

link used as reference: ftp://ftp.unicode.org/Public/UNIDATA/UnicodeData.txt
```
1F620: angry face
1F628: fearful face
1F602: laughing with tears
1F603: laughing with open mouth
1F62A: sleepy face
1F62B: tired face
1F629: weary face
2639: frowning face
263A: smiling face (white)
263b: smiling face (black)
1F609: winking face
1F914: thinking face
1F922: nauseated face
1F632: astonished face
1F610: neutral face'
```
# App.js
in App.js hebben we addTweetLine aangepast zodat de emoticon wordt meegegeven.
in addTweetLine heb Je voiceLines hierin geven we de paramater van de emoticon meegegeven
als er een match gevonden wordt roepen we de funtie op robotSendReceiveAllDOF met de dof array van de matchende positie


Door gebruik te maken van stoppable_thread voeren we een loop uit waarin we de emoji array aflopen en elke emoji in die array afspelen
```
if request.form['action'] == 'playTweet':
        if request.form['data']:
            tweepyObj = json.loads(request.form['data'])

            global loop_T
            global Emoticons
            post_emoticons = json.loads(request.form['data'])
            Emoticons = post_emoticons['text']['emoticon']
            print_info(Emoticons)
            loop_T = StoppableThread(target=asyncEmotion)

            playTweetInLanguage(tweepyObj)
```

asyncEmotion iterates all items in the emoticon array and plays it. we use ```time.sleep()``` to halt the program for a few second so the animation can complete without getting interupted by the next onethis is done on a different thread since ```time.sleep()``` halts all code from executing for a set duration. without this call the animations will play but they will be unnoticed since they will start playing directly when the call is made. The previous animation will be started but can not finish since there is a new one coming in
```
def asyncEmotion():
    time.sleep(0.05)

    global loop_T
    global Emoticons
    currentAnimationArrayLength = len(Emoticons)
    playedAnimations = 0
    while not loop_T.stopped():
        # if running:
        print_info(Emoticons)
        if currentAnimationArrayLength > playedAnimations:
            Expression.set_emotion_name(Emoticons[playedAnimations], -1)
            playedAnimations = playedAnimations+1
            time.sleep(2)
        if currentAnimationArrayLength == playedAnimations:
            loop_T.stop()
            pass
```
the stoppable_thread function shown above.

  - ```playedAnimations``` are the animations that have been played. if this is equal to the length of emoticons the loop will stop itself
  - we increase the amount of played animations by 1 after we have played an emotion.
  - ```time.sleep(2) ``` halts the code for 2 seconds so that the animation can complete
# Issues
Emoticons
  for some reason when you play an emoticon robot will be unable to exit. and the user will see a keyboard interupt but will be unable to shutdown the robot

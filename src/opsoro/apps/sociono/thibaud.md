# Thibauds's Documentation

# init.py

The server side code for an app goes inside __init__.py

# removing data from text
make sure to import re (regular expressions) since we are using this for removing the link

1. strTweet.replace("RT","Re Tweet", 1) to replace rt by re tweet so the robot lets the audience know it's a retweet. the 1 stands for the amount of times we will replace this
2. we convert the string to a ascii format to git rid of possible artefact
3. a regular expression is used to remove the link in the tweet

#Blockly

in the folder of the app sociono there is a subfolder called blockly, this is used to declare new blocks to integrate with the blockly app
1. in sociono.xml new blocks are declared ie. <block type="type_name"></block>
2. in sociono.js the blocks are initialized and gets code binded to it.
2.1. Blockly.Blocks['type_name'] = {} is where the layout is declared
2.2. Blockly.Lua['type_name'] = function(block) {} is where we will put the code that is to be generated in


# Issues

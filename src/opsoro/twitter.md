#twitter.py
this class holds the code that needs to be executed in the blockly module.
in order for this to work you need to edit scripthost.py in the folder lua_scripting
```
from opsoro.twitter import Twitter
```
and declare it in the function setup_runtime like this:
```
g["Twitter"] = Twitter
```

#Todo list:
- [x] start streamListener
- [x] stop streamListener
- [x] filter the tweet
- [ ] robot read tweet in language
#errors

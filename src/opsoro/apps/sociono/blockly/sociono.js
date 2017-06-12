Blockly.Lua.addReservedWords("Twitter");

Blockly.Blocks['twitter_initialization'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("initialize twitter");
    this.appendStatementInput("twitter init")
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};
Blockly.Lua['twitter_initialization'] = function(block) {
  var statements_twitter_init = Blockly.Lua.statementToCode(block, 'twitter init');
  var code = 'Twitter:init_twitter()';
  return code;
};
Blockly.Blocks['sociono_get_tweet'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("hashtag")
        .appendField(new Blockly.FieldTextInput("#opsoro"), "filter");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};
Blockly.Lua['sociono_get_tweet'] = function(block) {
  var text_filter = block.getFieldValue('filter');
  var code = 'Twitter:get_tweet("'+text_filter+'")\n';
  return code;
};

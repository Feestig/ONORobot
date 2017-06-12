$(document).ready(function() {
    var FacebookLiveModel = function() {
        var self = this;
        self.streamingKey = ko.observable("");

        self.startFunction = function(){
          console.log(self.streamingKey());
          if(!self.streamingKey()){
            showMainWarning("Enter stream key")
          }
        }

  };
    // This makes Knockout get to work
    var model = new FacebookLiveModel();
    ko.applyBindings(model);

});

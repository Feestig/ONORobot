$(document).ready(function() {

  var CommentModel = function(commentData){
    var self = this;

    self.username = ko.observable(commentData["username"] || "");
    self.comment = ko.observable(commentData["comment"] || "");
  }

  var FacebookLiveModel = function() {
      var self = this;
      self.streamingKey = ko.observable("");
      self.comments = ko.observableArray();

      self.startFunction = function(){
        if(!self.streamingKey()){
          showMainWarning("Enter stream key")
          return;
        }
        $.post('/apps/facebook_live/', { action: 'startLive', data: self.streamingKey() }, function(resp) {

        });
      }



  };

  app_socket_handler = function(data) {
        switch (data.action) {
      case "facebookComment":
      console.log("got comment");
    }
  };

    // This makes Knockout get to work
  var model = new FacebookLiveModel();
  ko.applyBindings(model);

});

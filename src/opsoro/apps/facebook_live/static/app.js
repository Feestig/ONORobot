$(document).ready(function() {

  /* Facebook SDK Init */

  $(function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

  if ($('#facebook-jssdk').length > 0) {
    window.fbAsyncInit = function() {
      FB.init({
        appId            : '1710409469251997', // ARNO APP ID, domain error!!
        autoLogAppEvents : true,
        xfbml            : true,
        version          : 'v2.9'
      });
      FB.AppEvents.logPageView();
    }
  }


  var sendPost = function(action, data){
    $.ajax({
			dataType: 'json',
			type: 'POST',
			url: '/apps/facebook_live/',
			data: {action: action, data: data },
			success: function(data){
				if (!data.success) {
					showMainError(data.message);
				} else {
					return data.config;
				}
			}
		});
  }

  var StopStream = function(){
    sendPost('stopSThread', {});
  }

  /* Models */

  var CommentModel = function(commentData){
    var self = this;
    self.username = ko.observable(commentData["from"]["name"] || "");
    self.comment = ko.observable(commentData["message"] || "");
  }
  var EmotionModel = function(name, index){
    var self = this;
    self.name = name;
    self.index = index;
  }

  /* Facebook Login */

  var FacebookLiveModel = function() {
      var self = this;

      // Observables
      self.iFrameSrc = ko.observable("")
      self.views = ko.observable(0)
      self.comments = ko.observableArray();
      self.isStreaming = ko.observable(false);
      self.autoRead = ko.observable(false);
      self.availableEmotions = ko.observableArray([new EmotionModel('None', 0)]);
      self.selectedEmotion = ko.observable();
      for (var i = 0; i < emotions_data.length; i++) {
        self.availableEmotions.push(new EmotionModel(emotions_data[i]['name'], i+1));
      }

      self.loggedIn = ko.observable(false)
      self.accessToken = ko.observable("");
      self.userID = ko.observable("");
      self.newLiveVideo = ko.observable("");
      self.isVideo = ko.observable(false);

      self.getLoginStatus = function() {
        FB.getLoginStatus(function(response){
          if (response.status === 'connected') {
            console.log(response)
            self.setData(response);
          } else {
            self.fbLogin()
          }
        });
      }

      self.fbLogin = function() {
        FB.login(function(response) {
          console.log(response)
          if (response.status === 'connected') {
            console.log(response)
            self.setData(response);
          } else {
            // error ?
            console.log(response)
          }
        });
      }

      self.fbLogout = function() {
        FB.logout(function(response) {
          console.log(response)
          this.unsetData();
        });
      }

      self.setData = function(response) {
        self.loggedIn(true)
        self.accessToken(response.authResponse.accessToken)
        self.userID(response.authResponse.userID)
      }

      self.unsetData = function() {
        self.loggedIn(false)
        self.accessToken("")
        self.userID("")
      }

      self.fbGET = function(obj) {
        FB.api('/' + obj.fb_id + '?fields=' + obj.fields + '&access_token=' + self.accessToken(), function(response) {
          if(response && !response.error) {
            console.log(response);
            self.handleLayout(response)
            // todo: check if status is live
          } else {
            // error
            console.log(response)
          }
        })
      }

      /* Videos */

      self.startNewLiveStream = function() {
        FB.ui({
            display: 'popup',
            method: 'live_broadcast',
            phase: 'create',
            fields: 'embed_html'
        }, function(response) {
          response.id = '10209726011169630';
            if (!response.id) {
              alert('dialog canceled');
              return;
            }
            FB.ui({
              display: 'popup',
              method: 'live_broadcast',
              phase: 'publish',
              broadcast_data: response,
            }, function(response) {
              console.log(response)
              //  alert("video status: \n" + response.status);

            });
            self.isVideo(true);
            self.handleData(response)
          }
        );
      }

      self.toggleStreaming = function(){
        if(self.isStreaming()){
          StopStream();
        }
        self.isStreaming(!self.isStreaming());
      }

      self.handleData = function(data) {
        var obj = { fb_id: data.id, fields: "" } //arno stream id

        if(self.isVideo()) {
          self.newLiveVideo(data);
          obj.fields = "status,live_views,comments{from,message,permalink_url},embed_html,title,reactions{name,link,type},likes{name}";
          self.setIFrame(data)
        } else {
          obj.fields = "";
        }

        console.log(obj)
        self.postToThread(obj)

      }

      self.postToThread = function(obj) {
        $.post('/apps/facebook_live/', { action: 'postToThread', data: JSON.stringify(obj) }, function() {
          console.log("Posted to thread to wait few seconds")
        });
      }

      self.setIFrame = function(liveVideo) {
        // embed_html could be used here aswell, but this data is only available
        self.iFrameSrc("https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/" + self.userID + "/videos/" + liveVideo.id) // all iFrame links are the same except for the username/ID and video ID
      }

      self.handleLayout = function(data) { // handling static lay-out the things that don't have to change every 5 seconds
        // handle comments ect
      }

      self.handleLayout = function(data) { // the stuff that changes every 5 seconds

        self.views(data.live_views);

        if(data.comments && data.comments.data.length > 0) {
          var arr_comments = data.comments.data;

          if(self.comments().length != arr_comments.length){
            if(self.autoRead() && self.comments().length < arr_comments.length && self.comments().length != 0){
              //send laatste comment om voor te lezen
              robotSendTTS(arr_comments[arr_comments.length -1]["message"]);
            }
            //hervul de lijst om laatste comments te krijgen
            self.comments.removeAll();
            for (var i = 0; i < arr_comments.length; i++) {
              self.comments.unshift(new CommentModel(arr_comments[i])); // self.comments(arr_comments.sort(-1)) ???
            }
          }
        }
      }
  };

  // This makes Knockout get to work
  var model = new FacebookLiveModel();
  ko.applyBindings(model);


  app_socket_handler = function(data) {
    switch (data.action) {
      case "threadRunning":
        if(data.fb_id && data.fields) {
          model.fbGET(data)
        }
        break;
    }
  };
});

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
        appId            : '288611811599525',
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

  var StartStream = function(){
    sendPost('getLiveVideos', {});
  }
  var StopStream = function(){
    sendPost('stopStream', {});
  }

  /* Models */

  var CommentModel = function(commentData){
    var self = this;
    self.username = ko.observable(commentData["from"]["name"] || "");
    self.comment = ko.observable(commentData["message"] || "");
  }

  /* Facebook Login */

  var FacebookLiveModel = function() {
      var self = this;

      // Observables
      self.embedIFrame = ko.observable("")
      self.views = ko.observable(0)
      self.comments = ko.observableArray();
      self.isStreaming = ko.observable(false);
      self.autoRead = ko.observable(false);

      self.loggedIn = ko.observable(false)
      self.accessToken = ko.observable("");
      self.userID = ko.observable("");
      self.newLiveVideoID = ko.observable("");
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

      /* Videos */

      self.startNewLiveStream = function() {
        FB.ui({
            display: 'popup',
            method: 'live_broadcast',
            phase: 'create',
        }, function(response) {
            if (!response.id) {
              alert('dialog canceled');
              return;
            }
            self.newLiveVideoID(response.id);
            self.isVideo(true);
            FB.ui({
              display: 'popup',
              method: 'live_broadcast',
              phase: 'publish',
              broadcast_data: response,
            }, function(response) {
              console.log(response)
              
            });
          }
        );
      }

      /* old */

      self.getLiveVideos = function(){
        $.post('/apps/facebook_live/', { action: 'getLiveVideos' }, function(resp) {
          console.log("Requesting the live videos")
        });
      }

      self.toggleStreaming = function(){
        if(self.isStreaming()){
          StopStream();
        }
        else{
          StartStream();
        }
        self.isStreaming(! self.isStreaming());
      }

      self.filterLiveVideoData = function(videoID) {
        console.log(videoID)
        var arr_live_videos_only = [];
        var arr_live_video_ids = [];
        $.each(arr_of_video_objs, function(key, value) {
          if (value.status && value.status == "LIVE") { // This video is Live!
            arr_of_video_objs.push(value)
            arr_live_video_ids.push(value.id)
          }
        });
        console.log(arr_of_video_objs)
        console.log(arr_live_video_ids)

        if (arr_live_video_ids && arr_live_video_ids.length > 0) {

          self.postLiveVideoIDs(arr_live_video_ids);
        }


        if (arr_of_video_objs[0]) {
          self.handleLayout(arr_of_video_objs[0])
        }
      }

      self.postLiveVideoIDs = function(liveVideoIDs) {
        console.log(JSON.stringify(liveVideoIDs));
        $.post('/apps/facebook_live/', { action: 'liveVideoIDs', data: JSON.stringify(liveVideoIDs) }, function() {
          console.log("Live video IDs posted")
        });
      }

      self.handleLayout = function(liveVideo) { // handling static lay-out the things that don't have to change every 5 seconds
        console.log(liveVideo.embed_html);
        if (liveVideo.embed_html) {

          self.embedIFrame(liveVideo.embed_html);
        }
      }

      self.handleLiveVideoComments = function(view_count, arr_comments) { // the stuff that changes every 5 seconds
        self.views(view_count);
        if(self.comments().length != arr_comments.length){
          if(self.autoRead() && self.comments().length < arr_comments.length && self.comments().length != 0){
            //send laatste comment om voor te lezen
            robotSendTTS(arr_comments[arr_comments.length -1]["message"]);
          }
          //hervul de lijst om laatste comments te krijgen
          self.comments.removeAll();
          for (var i = 0; i < arr_comments.length; i++) {
            self.comments.unshift(new CommentModel(arr_comments[i]));
          }
        }
      }
  };

  // This makes Knockout get to work
  var model = new FacebookLiveModel();
  ko.applyBindings(model);


  app_socket_handler = function(data) {
    switch (data.action) {
      case "getLiveVideos":
        console.log(data)
        if (data.live_videos && data.live_videos.data && data.live_videos.data.length > 0) {
          model.filterLiveVideoData(data.live_videos.data);
        } else {
          console.error(data)
        }
        break;
      case "liveVideoStats":
        console.log(data)
        if (data.live_views && data.comments) {
          model.handleLiveVideoComments(data.live_views, data.comments.data)
        }
        break;
    }
  };
});

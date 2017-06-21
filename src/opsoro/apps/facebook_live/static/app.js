$(document).ready(function() {

  /* Facebook SDK Init */


  window.fbAsyncInit = function() {
    FB.init({
      appId            : '1710409469251997',
      autoLogAppEvents : true,
      xfbml            : true,
      status           : true,
      version          : 'v2.9'
    });
    FB.AppEvents.logPageView();
    // Start using the FB SDK
    model.fbInitialized(true);
    model.checkFBLogin();
  }

  $(function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

  /* Models */

  var EmotionModel = function(name, index){
    var self = this;
    self.name = name;
    self.index = index;
  }
  var TypesModel = function(text, type){
    var self = this;
    self.text = text;
    self.type = type;
  }

  /* Facebook Login */

  var FacebookLiveModel = function() {
      var self = this;

      self.globalObjToPass = { fb_id: "", fields: "" }; // use this for setting the id's & fields to pass to the Facebook GET request

      /* Observables for facebook init */
      self.fbInitialized = ko.observable(false);

      /* Observables for facebook Auth */
      self.loggedIn = ko.observable(false);
      self.accessToken = ko.observable(""); // retrieved from log in, needed for every Facebook call
      self.userID = ko.observable(""); // when logged into facebook, could be used if you'd like to get your own wall posts ect.

      /* Observables for handling the new live video stream */
      self.newLiveVideoData = ko.observable(""); // holds the new live video's data
      self.isNewVideo = ko.observable(false); // check for starting a new live video -> toggle lay-out & functionality
      self.fbDataResponse = ko.observable(); // catches the facebook response every interval ... needed to set embed_html once
      self.embedIframe = ko.observable("");
      self.views = ko.observable(0)
      self.comments = ko.observableArray();

      /* Observables for handling the custom facebook requests */
      self.customRequest = ko.observable(false); // for an extra request to get the custom id's info (type, ...)
      self.isStreaming = ko.observable(false);
      self.facebookID = ko.observable(""); // when user enters his own input id
      self.ofTypes = ko.observableArray([new TypesModel("Someone else's Page", "isPage"), new TypesModel('My Page', 'isPage'), new TypesModel('(Live) Video', 'isVideo'), new TypesModel('A Post', 'isPost')]);
      self.selectedType = ko.observable(); // catch the selected type for the given facebook ID
      self.pagePosts = ko.observableArray();


      /* General observables */
      self.autoRead = ko.observable(false);
      self.reactToLikes = ko.observable(false);
      self.likes = ko.observable(0);
      self.availableEmotions = ko.observableArray([new EmotionModel('None', 0)]);
      self.selectedEmotion = ko.observable();
      for (var i = 0; i < emotions_data.length; i++) {
        self.availableEmotions.push(new EmotionModel(emotions_data[i]['name'], i+1));
      }

      self.checkFBLogin = function(){
        if(self.getLoginStatus()){
          self.loggedIn(true);
        }
        else{
          self.fbLogin();
          if(self.getLoginStatus()){
            //self.loggedIn(true);
          }
        }
      }

      self.getLoginStatus = function() {
        FB.getLoginStatus(function(response){
          if (response.status === 'connected') {
            return true;
          } else {
            // self.fbLogin()
            return false;
          }
        });
      }

      self.fbLogin = function() {
        FB.login(function(response) {
          console.log(response)
          if (response.status === 'connected') {
            self.setData(response);
          } else {
            // error ?
            console.log(response)
          }
        },{scope: 'user_videos, user_posts, user_photos, user_actions.video'});
      }

      self.fbLogout = function() {
        FB.logout(function(response) {
          console.log(response);
          self.unsetData();
        });
      }

      self.setData = function(response) {
        self.loggedIn(true);
        self.accessToken(response.authResponse.accessToken);
        self.userID(response.authResponse.userID);
      }

      self.unsetData = function() {
        self.loggedIn(false);
        self.accessToken("");
        self.userID("");

        // Stop stream & reset layout !!
        self.stopStream();
      }

      self.fbGET = function() {
        FB.api('/' + self.globalObjToPass.fb_id + '?fields=' + self.globalObjToPass.fields + '&access_token=' + self.accessToken(), function(response) {
          if(response && !response.error){
            //console.log(response);
            self.fbDataResponse(response) // could use this instead of passing through params

            switch(self.selectedType().type) {
              case 'isPage': // Page
                self.handleLayout(response.feed);
                break;
              case 'isPost': // Post
                self.handleLayout(response);
                break;
              case 'isVideo': // Video
                self.setIFrame();
                self.handleLayout(response)
                break;
            }

          } else {
            // error, check if key expired -> re-login ?
            console.log(response)
          }
        })
      }

      /* Videos */

      self.startNewLiveStream = function() {
        FB.ui({
            display: 'popup',
            method: 'live_broadcast',
            phase: 'create'
        }, function(response) {
            if (!response.id) {
              alert('dialog canceled');
              return;
            }
            self.newLiveVideoData(response);
            self.facebookID(response.id);
            self.isNewVideo(true);

            self.setSelectedType('type', 'isVideo');
          }
        );
      }

      self.newVideoRequest = function() {
        FB.ui({
          display: 'popup',
          method: 'live_broadcast',
          phase: 'publish',
          broadcast_data: self.globalObjToPass,
        }, function(response) {
          //console.log(response)
          //  alert("video status: \n" + response.status);

          if (response && response.status === "live") {
            self.isNewVideo(false); // the video has already streamed so it's not new anymore ...
            self.postToThread();
          } else {
            // error dialog is canceld before video went on air !!!
          }
        });
      }

      /* Custom page input */

      self.toggleStreaming = function(){ // can only be clicked when a Facebook id is filled in
        if(self.isStreaming()){
          self.stopStream();
        } else {

          if (self.newLiveVideoData() != "") {
            self.globalObjToPass = self.newLiveVideoData();
            self.globalObjToPass.fb_id = self.facebookID();
          } else {
            self.isNewVideo(false); // firing custom request so disable the ability to start a new live video
            self.globalObjToPass = { fb_id: self.facebookID() } // sending the id in an object because handleData expects an object
            console.log(self.facebookID()); // make sure facebookID is bound to HTML without () for two-way binding
          }

          self.handleData(); // this uses the global obj
        }

        self.isStreaming(!self.isStreaming()); // will this be instantly executed or only after the functions above ??
      }

      /* General */

      self.handleData = function() { // function will be used for a new live video but also for custom id input so don't set isNewVideo(true) likewise in here
        self.facebookID(self.globalObjToPass.fb_id);

        if(self.isNewVideo()) {
          self.globalObjToPass.fields = "status,live_views,comments{from,message,permalink_url},embed_html,title,reactions{name,link,type},likes{name}";
          self.newVideoRequest();
        } else {
          self.postToThread();
        }
      }


      self.stopStream = function(){

        self.sendPost('stopThread', {});

        // reset lay-out
        self.resetLayout();
      }

      self.resetLayout = function() {
        self.globalObjToPass = { fb_id: "", fields: "" }; // reset the global
        self.isNewVideo(false);
        self.newLiveVideoData("");
        self.embedIframe("");
        self.fbDataResponse("");
        self.comments.removeAll();
        self.pagePosts.removeAll();
        self.views(0);
      }

      self.hardResetLayout = function() { // reset everything on log out or something, not used anywhere atm!
        self.facebookID("");
        self.selectedType(self.ofTypes()[0]); // reset to element 0
        self.autoRead(false);
        self.reactToLikes(false);
        self.selectedEmotion(self.availableEmotions()[0]);
      }

      self.postToThread = function() {
        $.post('/apps/facebook_live/', { action: 'postToThread', data: JSON.stringify(self.globalObjToPass) }, function() {
          console.log("Posted to thread to wait few seconds")
        });
      }

      self.setSelectedType = function(typeOrText, valueToMatch) {
        // do foreach types and set it where type is Video
        $.each(self.ofTypes(), function(k, v) {
          if (v[typeOrText] == valueToMatch) {
            self.selectedType(v); // setting the selected option to "Video"
          }
        })
      }

      self.setIFrame = function() {
        if ((self.isNewVideo() || self.selectedType().type == "isVideo") && self.fbDataResponse().embed_html) {
          self.embedIframe(self.fbDataResponse().embed_html);
        }
      }

      self.handleLayout = function(data) { // the stuff that changes every 5 seconds

        if (self.isPage()) { // handle data differently if page
          var paging = data.paging;

          if (data.data && data.data.length > 0) {

            // to avoid errors of undefined objects while binding
            var arr = [];
            $.each(data.data, function(key, val) {
              if (!val.story) {
                val.story = "";
              }
              if (!val.message) {
                val.message = "";
              }
              arr.push(val);
            });

            // can't check the count diffrence because it's limit is 25 so it will always be 25
            if(self.pagePosts().length > 0 && self.pagePosts()[0]['id'] != arr[0]['id']) { // 0 instead of last because order is diffrent (newest first)
              if(self.autoRead()){
                //send last comment to read out loud
                var textToRead;
                if (arr[0]["message"]) {
                  textToRead = arr[0]["message"];
                }
                if (arr[0]["story"]) {
                  textToRead = arr[0]["story"];
                }
                console.log(textToRead);
                robotSendTTS(textToRead);
              }

              var emotion = self.selectedEmotion();
              if(! emotion['index'] == 0){
                robotSendEmotionRPhi(1.0, emotions_data[emotion['index'] -1].poly * 18, -1);
              }
            }
            self.pagePosts(arr);
          }
        } else { // is Post or Video

          if (self.isNewVideo() || self.isLiveVideo()) {
            self.views(data.live_views);
          }

          if(data.comments && data.comments.data.length > 0) {
            var arr_comments = data.comments.data;

            if(self.comments().length != arr_comments.length){
              if(self.comments().length < arr_comments.length && self.comments().length != 0){
                if(self.autoRead()){
                  //send last comment to read out loud
                  robotSendTTS(arr_comments[arr_comments.length -1]["message"]);
                }

                var emotion = self.selectedEmotion();
                if(! emotion['index'] == 0){
                  robotSendEmotionRPhi(1.0, emotions_data[emotion['index'] -1].poly * 18, -1);
                }
              }
            }
            // refill list to get last comments
            self.comments(arr_comments.reverse());
          }

          if(data.reactions && data.reactions.data.length != 0) {
            self.likes(data.reactions.data.length);
          }

          if(self.reactToLikes() && data.reactions != null && data.reactions.data.length != self.likes()){

            //nieuwe reactie
            var index = 0;


            switch (data.reactions.data[0]['type']) {
              case 'HAHA':
                index = 2;
                break;
              case 'LOVE':
                index = 1;
                break;
              case 'LIKE':
                index = 10;
                break;
              case 'WOW':
                index = 3;
                break;
              case 'SAD':
                index = 7;
                break;
              case 'ANGRY':
                index = 5;
                break;
            }
            robotSendEmotionRPhi(1.0, emotions_data[index].poly * 18, -1);
          }
        }
      }


      self.sendPost = function(action, data){
        console.log("Posted to stop stream! Please stahp!");
        $.ajax({
          dataType: 'json',
          type: 'POST',
          url: '/apps/facebook_live/',
          data: {action: action, data: data },
          success: function(data){
            if (!data.success) {
              showMainError(data.message);
            } else {
              console.log("Stream stopped?");
              return data.config;
            }
          }
        });
      }
  };

  // This makes Knockout get to work
  var model = new FacebookLiveModel();
  ko.applyBindings(model);

  // receiving data from python
  app_socket_handler = function(data) {
    switch (data.action) {
      case "threadRunning":
        if(data.fb_id && data.fields) {
          console.log(data);
          model.fbGET(data);
        }
        break;
    }
  };

  // listener for when input is changed / facebookID, change the selectbox accordingly
  model.facebookID.subscribe(function() {
    console.log(model.facebookID());
    if (model.facebookID().indexOf("_") > 0) { // post ids have an underscore in them
      model.setSelectedType('type', 'isPost'); // change the selectbox accordingly
    }
    if (model.facebookID() == model.userID()) {
      model.setSelectedType('text', 'My Page'); // if facebook id equals the logged in user's id -> set selectbox to "My Page"
    }
  })

  // listener for when input  select is changed set facebookID accordingly
  model.selectedType.subscribe(function() {
    switch(model.selectedType().type) {
      case 'isPage': // Page
        if (model.selectedType().text == "My Page") { // if type isPage && text is "My Page", order is important here !!
          model.facebookID(model.userID()); // fill the input box with the user's id
        }
        model.globalObjToPass.fields = "feed{id,message,reactions{name,link,type},story,likes{name}}";
        break;
      case 'isPost': // Post
        model.globalObjToPass.fields = "comments{from,message,permalink_url},reactions{name,link,type},likes{name}";
        break;
      case 'isVideo': // Video
        model.globalObjToPass.fields = "status,live_views,comments{from,message,permalink_url},embed_html,title,reactions{name,link,type},likes{name}";
        break;
    }

    console.log(model.globalObjToPass);

  })

});


// avoiding keyboard interrupts
$( window ).unload(function() {
  $.ajax({
    dataType: 'json',
    type: 'POST',
    url: '/apps/facebook_live/',
    data: {action: 'stopThread', data: {} },
    success: function(data){
      if (!data.success) {
        showMainError(data.message);
      } else {
        return "";
      }
    }
  });
  return "";
});

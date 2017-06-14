$(document).ready(function() {

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

  var CommentModel = function(commentData){
    var self = this;

    self.username = ko.observable(commentData["username"] || "");
    self.comment = ko.observable(commentData["comment"] || "");
  }

  var FacebookLiveModel = function() {
      var self = this;

      // Observables
      self.embedIFrame = ko.observable("")
      self.views = ko.observable(0)
      self.comments = ko.observableArray();
      self.isStreaming = ko.observable(false);


      self.commentPreview = ko.pureComputed(function(){
        return "<span class='fa fa-comment'></span> " + self.comments();
      });

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

      self.filterLiveVideoData = function(arr_of_video_objs) {
        console.log(arr_of_video_objs)
        var arr_live_videos_only = [];
        var arr_live_video_ids = [];
        $.each(arr_of_video_objs, function(key, value) {
          if (value.status && value.status == "LIVE" && value.id == "1549951018369545") { // This video is Live!
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
        $.post('/apps/facebook_live/', { action: 'liveVideoIDs', data: JSON.stringify(liveVideoIDs) }, function() {
          console.log("Live video IDs posted")
        });
      }

      self.handleLayout = function(liveVideo) { // handling static lay-out the things that don't have to change every 5 seconds
        if (liveVideo.embed_html) {

          self.embedIFrame(liveVideo.embed_html);

        }
      }

      self.handleLiveVideoComments = function(view_count, arr_comments) { // the stuff that changes every 5 seconds

        self.views(view_count);

        if (arr_comments.length > 0) {

          var arr = [];
          for (var i = 0; i < arr_comments.length; i++) {
            arr.push(arr_comments[i].message);
          }

          self.comments(arr);
        } else {
          // No comments yet
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

        if (data.live_views && data.comments) {
          model.handleLiveVideoComments(data.live_views, data.comments.data)
        }
        break;
    }
  };

});

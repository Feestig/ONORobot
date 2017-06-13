$(document).ready(function() {


  var FacebookLiveModel = function() {
      var self = this;

      self.getLiveVideos = function(){
        $.post('/apps/facebook_live/', { action: 'getLiveVideos' }, function(resp) {
          console.log("Requesting the live videos")
        });
      }

      self.filterLiveVideoData = function(arr_of_video_objs) {
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
      }

      self.postLiveVideoIDs = function(liveVideoIDs) {
        $.post('/apps/facebook_live/', { action: 'liveVideoIDs', data: JSON.stringify(liveVideoIDs) }, function() {
          console.log("Live video IDs posted")
        });
      }

      self.handleLiveVideoComments = function(view_count, arr_comments) {

        if (arr_comments.length > 0) {
          
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

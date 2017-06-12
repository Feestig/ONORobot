$(document).ready(function(){
	ko.bindingHandlers.avatar = {
		update: function(element, valueAccessor, allBindings) {
			var value = valueAccessor();
			var valueUnwrapped = ko.unwrap(value);
			$(element).css("background-image", "url('static/avatars/" + valueUnwrapped + "')")
		}
	};


	var searchField = "";


	// Here's my data model
	var VoiceLine = function(tweepyData){
		var self = this;

		self.isPlaying = ko.observable(false);
		self.hasPlayed = ko.observable(false);

		self.tweepyData = ko.observable(tweepyData || "")

		// If Data received from tweepy through addTweetLine(data)
		if (tweepyData) {
			self.picture = ko.observable(tweepyData["user"]["profile_picture"] || "");
			self.tts = ko.observable(tweepyData["text"]["original"] || "");
			self.url = ko.observable("https://twitter.com/" + tweepyData["user"]["username"] || "")
			self.lang = ko.observable(tweepyData["text"]["lang"] || "");
			self.emoticons = ko.observable(tweepyData["text"]["emoticon"] || "")
		}

		self.contentPreview = ko.pureComputed(function(){
				return "<span class='fa fa-comment'></span> " + self.tts();
		});

		self.modified = function(){
			model.fileIsModified(true);
		}

		self.pressPlay = function(){
			if(self.isPlaying()){
				robotSendStop();
			 	self.isPlaying(false);
			 	self.hasPlayed(true);
			}else{
				if (model.selectedVoiceLine() != undefined) {
					model.selectedVoiceLine().isPlaying(false);
				}
				model.selectedVoiceLine(self);
				model.robotSendTTSLang(self.tweepyData());
				self.isPlaying(true);
			}
		};
	};


	var SocialScriptModel = function(){
		var self = this;

		self.selectedVoiceLine = ko.observable();
		self.voiceLines = ko.observableArray();

		// Auguste Code

		// Observables
		self.socialID = ko.observable("");
		self.isStreaming = ko.observable(false);// made observable to toggle button layout
		self.index_voiceLine = ko.observable(0);
		self.autoRead = ko.observable(false);

		self.addTweetLine = function(data){
			self.voiceLines.unshift(new VoiceLine(data)); // unshift to push to first index of arr
		};

		self.toggleTweepy = function() {
			if(!socialID.value){
				showMainWarning("Please enter a value");
				return;
			}
			if(self.isStreaming()) { // stop tweety if button is clicked again
				self.stopTweepy();
			} else {
				if(socialID.value != searchField){
					searchField = socialID.value;
					self.voiceLines.removeAll();
				}

				$.post('/apps/sociono/', { action: 'startTweepy', data: JSON.stringify({ socialID: socialID.value, autoRead: self.autoRead() }) }, function(resp) {
				});
			}
			self.isStreaming(!self.isStreaming()); //change streaming status
		}

		self.stopTweepy = function() {
			$.post('/apps/sociono/', { action: 'stopTweepy' }, function(resp) { // message ... success functions?
			});
		}
		self.toggleAutoLoopTweepy = function() {
			if (self.index_voiceLine() > 0) {
				self.autoLoopTweepyStop();
			} else {
				self.autoLoopTweepyStart();
			}
		}

		self.autoLoopTweepyStart = function() {
			self.isStreaming(false); // set the streaming button back on "Start"
			self.index_voiceLine(1); // set on null on initialize (reset)
			self.autoLoopTweepyNext();
		}

		self.autoLoopTweepyNext = function() {
			self.selectedVoiceLine(self.voiceLines()[self.index_voiceLine() - 1]); // starting at 1 so -1
			self.selectedVoiceLine().pressPlay();
			$.post('/apps/sociono/', { action: 'autoLoopTweepyNext' }, function(resp) {
			});
		}

		self.autoLoopTweepyRun = function() {
			self.index_voiceLine(self.index_voiceLine() + 1); // increment observable
			if (self.index_voiceLine() <= self.voiceLines().length) {
				self.autoLoopTweepyNext();
			}
		}

		self.autoLoopTweepyStop = function() {
			// post to stop sound
			$.post('/apps/sociono/', { action: 'autoLoopTweepyStop' }, function(resp) {
				self.index_voiceLine(0) // set to null to reset
			});
		}

		// Setup websocket connection.
		app_socket_handler = function(data) {
      		switch (data.action) {
				case "autoLoopTweepyStop":
					if (self.selectedVoiceLine() != undefined) {
						self.selectedVoiceLine().isPlaying(false);
					 	self.selectedVoiceLine().hasPlayed(true);
					}
					robotSendStop();
					break;
				case "autoLoopTweepyNext":
					if (self.selectedVoiceLine() != undefined) {
						self.selectedVoiceLine().isPlaying(false);
					 	self.selectedVoiceLine().hasPlayed(true);

					 	self.autoLoopTweepyRun()
					}
					break;
				case "dataFromTweepy":
					self.addTweetLine(data);
					break;
			}
		};

		// Custom TTS Speak function
		self.robotSendTTSLang = function(tweepyData) {
			$.post('/apps/sociono/', { action: 'playTweet', data: JSON.stringify(tweepyData) }, function(resp) {
			});
		};

		// Enter functionaliteit
		$(document).keyup(function (e) {
		    if ($(".socialID:focus") && (e.keyCode === 13)) {
				self.toggleTweepy();
		    }
		});
	};

	// This makes Knockout get to work
	var model = new SocialScriptModel();
	ko.applyBindings(model);
	//model.fileIsModified(false);

});

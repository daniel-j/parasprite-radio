// Created by djazz

(function () {
	'use strict';

	// shim layer with setTimeout fallback
	var requestAnimFrame = (function () {
	  return  window.requestAnimationFrame       || 
	          window.webkitRequestAnimationFrame || 
	          window.mozRequestAnimationFrame    || 
	          window.oRequestAnimationFrame      || 
	          window.msRequestAnimationFrame     || 
	          function( callback ){
	            window.setTimeout(callback, 1000 / 60);
	          };
	})();
	var AudioContext = window.AudioContext || window.webkitAudioContext;


	function RadioPlayer(opts) {
		var self = this;
		this.isPlaying = false;
		this.playing = false;
		this.useVisualizer = (AudioContext && !!document.getElementById('visualizer'));
		this.url = opts.url;

		this.volume = opts.volume || 0.8;
		var volume;
		try {
			volume = window.localStorage['pr:volume'];
		} catch (e) {}
		if (typeof volume !== 'undefined') {
			this.volume = volume;
		}

		this.audioTag = null;
		this.source = null;
		this.updatetick = 0;
		this.segmentcount = 16;

		if (this.useVisualizer) {
			if (!AudioContext) {
				this.useVisualizer = false;
			} else {
				this.initializeVisualizer(opts);
			}
		}

		this.handleStreamEnded = function () {
			setTimeout(function () {
				if (self.isPlaying) {
					self.startRadio();
				}
			}, 1000);
		}

		this.handleStreamCanPlay = function () {
			if (self.isPlaying) {
				self.playing = true;
				// playstopbtn.textContent = "Stop";
				// playstopbtn.className = "stop";
				if (self.useVisualizer) {
					self.visualizerDiv.style.display = "block";
				}
			}
		}

		if (opts.autoplay) {
			this.startRadio();
		}

		// playstopbtn.disabled = false;
	}

	RadioPlayer.prototype.initializeVisualizer = function (visualizerDiv) {
		this.acx = new AudioContext();

		this.visualizerDiv = opts.visualizerDiv;

		this.canvas = document.createElement('canvas');
		canvas.width = this.visualizerDiv.offsetWidth;
		canvas.height = this.visualizerDiv.offsetHeight;
		this.ctx = canvas.getContext('2d');
		this.visualizerDiv.appendChild(canvas);

		this.gainNode = acx.createGain();
		gainNode.connect(acx.destination);

		this.analyzer = acx.createAnalyser();
		analyzer.fftSize = 32;
		analyzer.connect(gainNode);
		analyzer.smoothingTimeConstant = 0.45;

		this.liveFreqData = new Float32Array(analyzer.frequencyBinCount);
	};

	RadioPlayer.prototype.startRadio = function () {
		this.stopRadio();
		this.isPlaying = true;

		// if (nowplayingdata) {
		//	document.title = nowplayingdata + " - Parasprite Radio";
		// }

		// playstopbtn.textContent = "Buffering";
		// playstopbtn.className = "loading";

		this.audioTag = new Audio();
		this.audioTag.addEventListener('error', this.handleStreamEnded, false);
		this.audioTag.addEventListener('ended', this.handleStreamEnded, false);
		this.audioTag.addEventListener('canplay', this.handleStreamCanPlay, false);

		var volume = radioVolume? +radioVolume.value : 1.0;
		if (this.useVisualizer) {
			this.gainNode.gain.value = volume;
		} else {
			this.audioTag.volume = volume;
		}
		

		this.audioTag.src = this.url;
		this.audioTag.play();
		checkNotify();
		
		if (this.useVisualizer) {
			var self = this;
			setTimeout(function () {
				self.source = self.acx.createMediaElementSource(self.audioTag);
				self.source.connect(self.analyzer);
				self.update();
			}, 500);
		}
	};

	RadioPlayer.prototype.stopRadio = function () {
		this.isPlaying = false;
		this.playing = false;
		
		if (this.source) {
			this.source.disconnect(0);
			this.source = null;
		}
		if (this.audioTag && this.audioTag !== true) {
			this.audioTag.removeEventListener('error', this.handleStreamEnded);
			this.audioTag.removeEventListener('ended', this.handleStreamEnded);
			this.audioTag.removeEventListener('canplay', this.handleStreamCanPlay);
			this.audioTag.pause();

			this.audioTag.src = '';
			this.audioTag.load();
			this.audioTag = null;
		}
		// playstopbtn.textContent = "Play";
		// playstopbtn.className = "";
		if (this.useVisualizer) {
			this.visualizerDiv.style.display = "none";
		}
	};

	RadioPlayer.prototype.togglePlay = function () {
		if (this.isPlaying) {
			this.stopRadio();
		} else {
			this.startRadio();
		}
	};

	RadioPlayer.prototype.update = function () {

		this.updatetick++;

		if (this.updatetick % 2 === 1) {
			//requestAnimFrame(update);
			//return;
		}

		this.ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		if (!this.audioTag || !this.source) {
			//setTimeout(update, 1000);
			//requestAnimFrame(update);
			return;
		}


		this.analyzer.getFloatFrequencyData(this.liveFreqData);
		var freqData = this.liveFreqData;

		var segments = [];
		for (var i = 0; i < this.segmentcount; i++) {
			segments[i] = 0;
		}

		var samplesPerSegment = freqData.length/segments.length;
		
		for (var i = 0; i < freqData.length; i++) {
			//var freq = i*acx.sampleRate/analyzer.fftSize;

			var magnitude = Math.min(Math.max((freqData[i]-this.analyzer.minDecibels)/90, 0), 1);

			segments[i / samplesPerSegment|0] += magnitude;
		}

		for (var i = 0; i < segments.length; i++) {
			segments[i] = (segments[i] / samplesPerSegment);
			//var style = visualizerDiv.childNodes[i].style;
			//style.height = segments[i]+"%";
			this.ctx.fillStyle = "hsl(38, 100%, "+(segments[i]*50+59/2)+"%)";
			this.ctx.fillRect((this.canvas.width/segments.length)*i|0, this.canvas.height, Math.ceil(this.canvas.width/segments.length), -segments[i]*this.canvas.height|0);
		}

		requestAnimFrame(this.update, this.canvas);
	};




	var playstopbtn = document.getElementById('playstopbtn');
	var radioVolume = document.getElementById('radioVolume');
	var visualizerDiv = document.getElementById('visualizer');

	playstopbtn.addEventListener('click', togglePlay, false);

	if (radioVolume) {
		radioVolume.addEventListener('input', function () {
			if (AudioContext) {
				gainNode.gain.value = +radioVolume.value;
			} else {
				audioTag.volume = radioVolume.value;
			}
			try {
				window.localStorage['pr:volume'] = radioVolume.value;
			} catch (e) {}
		}, false);

		var volume;
		try {
			volume = window.localStorage['pr:volume'];
		} catch (e) {}
		if (typeof volume !== 'undefined') {
			radioVolume.value = volume;
		}
	}

}());

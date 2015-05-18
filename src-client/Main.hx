package ;

import haxe.Timer;
import js.html.InputElement;
import js.Lib;
import js.Browser;
import haxe.Http;
import haxe.Json;

using StringTools;

class Main 
{
	#if !debug
	var basePath: String = 'https://aqueous-basin-8995.herokuapp.com/';
	#else 
	var basePath: String = 'https://localhost:9998/api/';
	#end
	var lastIndex: Int = -1;
	
	var http: Http;
	
	var chatbox: InputElement;
	
	function new() {
		http = new Http(basePath + lastIndex);
		http.async = true;
		http.onData = _parseMessages;
		http.onError = function(error) { trace(error); }

		Browser.window.onload = _windowLoaded;
		
		_loop();
	}
	
	function _windowLoaded() {
		chatbox = cast Browser.document.getElementById('chatbox');
		chatbox.onkeypress = _checkKeyPress;
	}
	
	function _checkKeyPress(e) {
		trace(e);
		var code = (e.keyCode != null ? e.keyCode : e.which);
		if (code == 13) { //ENTER
			http.url = basePath + 'chat/' + chatbox.value.urlEncode();
			http.request();
			chatbox.value = '';
		}
	}
	
	function _loop() {
		Timer.delay(function() {
			http.url = basePath + 'api/' + lastIndex;
			http.request(true);
			_loop();
		}, 1000);
	}
	
	function _parseMessages(data) {
		var parsed: MessageData = Json.parse(data);
		for (p in parsed.messages) {
			var bbParsed = _parseMessage(p);
			var message = Browser.document.createDivElement();
			message.innerHTML = bbParsed;
			Browser.document.getElementById('messages').appendChild(message);
		}
		lastIndex = parsed.lastID;
	}
	
	var imgBB: EReg = ~/\[img\](.*?)\[\/img\]/i;
	var boldBB: EReg = ~/\[b\](.*?)\[\/b\]/i;
	var italicBB: EReg = ~/\[i\](.*?)\[\/i\]/i;
	
	function _parseMessage(raw: String): String {
		var parsed: String = raw.replace('\n', ' ');
		parsed = parsed.htmlEscape();
		while (imgBB.match(parsed)) {
			var imgPath = imgBB.matched(1);
			var imgTag = '<img src=$imgPath></img>';
			parsed = imgBB.replace(parsed, imgTag);
		}
		while (boldBB.match(parsed)) {
			var text = boldBB.matched(1);
			var strongTag = '<strong>$text</strong>';
			parsed = boldBB.replace(parsed, strongTag);
		}
		while (italicBB.match(parsed)) {
			var text = italicBB.matched(1);
			var emTag = '<em>$text</em>';
			parsed = italicBB.replace(parsed, emTag);
		}
		return parsed;
		//
	}
	
	static function main() {
		new Main();
	}	
}
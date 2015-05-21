package ;

import haxe.Timer;
import js.html.DivElement;
import js.html.Element;
import js.html.InputElement;
import js.Lib;
import js.Browser;
import haxe.Http;
import haxe.Json;

using StringTools;

class Main 
{
	#if !debug
	var basePath: String = 'https://aqueous-basin.herokuapp.com/';
	#else 
	var basePath: String = 'https://localhost:9998/api/';
	#end
	var lastIndex: Int = -1;
	var lastUserID: Int = -2;
	
	var http: Http;
	
	var chatbox: InputElement;
	var messages: DivElement;
	
	var id: Int;
	
	var requestInProgress: Bool = false;
	
	var focussed: Bool = true;
	
	function new() {
		http = new Http(basePath + lastIndex);
		http.async = true;
		http.onData = _parseMessages;
		http.onError = function(error) { trace(error); requestInProgress = false; }
		
		var userHttp = new Http(basePath + 'api/getuser/');
		userHttp.onData = function(data) {
			id = Std.parseInt(data);
			trace(id);
		};
		userHttp.onError = function(error) {
			id = -1;
			trace(id);
			trace(error);
		}
		userHttp.request(true);

		Browser.window.onload = _windowLoaded;
		
		Browser.window.onfocus = function() {
			focussed = true;
			Browser.document.title = 'aqueous-basin.';
		};
		
		Browser.window.onblur = function() {
			focussed = false;
		};
		
		_loop();
	}
	
	function _windowLoaded() {
		chatbox = cast Browser.document.getElementById('chatbox');
		messages = cast Browser.document.getElementById('messages');
		
		chatbox.onkeypress = _checkKeyPress;
		chatbox.focus();
	}
	
	function _checkKeyPress(e) {
		var code = (e.keyCode != null ? e.keyCode : e.which);
		if (code == 13) { //ENTER
			http.url = basePath + 'chat/' + chatbox.value.urlEncode() +'/' + id;
			http.request(true);
			_update();
			chatbox.value = '';
		}
	}
	
	function _loop() {
		Timer.delay(function() {
			_update();
			_loop();
		}, 1000);
	}
	
	function _update() {
		if (requestInProgress) return;
		http.url = basePath + 'api/' + lastIndex;
		requestInProgress = true;
		http.request(true);
	}
	
	function _parseMessages(data) {
		requestInProgress = false;
		
		var parsed: MessageData = Json.parse(data);
		for (p in parsed.messages.messages) {
			var bbParsed = _parseMessage(p.text);
			var message = Browser.document.createDivElement();
			message.innerHTML = bbParsed;
			message.className = 'messageitem';
			
			var differentUser = false;
			if (p.id == -1 || p.id != lastUserID) {
				differentUser = true;
			}
			messages.appendChild(_makeSpan(differentUser));
			messages.appendChild(message);
			
			Browser.window.scrollTo(0, Browser.document.body.scrollHeight);
			
			if (!focussed) {
				Browser.document.title = '# aqueous-basin.';
			}
			
			lastUserID = p.id;
		}
		lastIndex = parsed.lastID;
	}
	
	function _makeSpan(?pointer: Bool = false): Element {
		var span = Browser.document.createSpanElement();
		if (pointer) {
			span.innerHTML = '>';
		}
		span.innerHTML += '\t';
		
		return span;
	}
	
	var imgBB: EReg = ~/(?:\[img\]|#)(.*?)(?:\[\/img\]|#)/i;
	var italicBB: EReg = ~/(?:\[i\]|\*\*)(.*?)(?:\[\/i\]|\*\*)/i;
	var boldBB: EReg = ~/(?:\[b\]|\*)(.*?)(?:\[\/b\]|\*)/i;
	
	function _parseMessage(raw: String): String {
		var parsed: String = raw.replace('\n', ' ');
		parsed = parsed.htmlEscape();
		while (imgBB.match(parsed)) {
			var imgPath = imgBB.matched(1);
			var imgTag = '<img src=$imgPath></img>';
			parsed = imgBB.replace(parsed, imgTag);
		}
		while (italicBB.match(parsed)) {
			var text = italicBB.matched(1);
			var emTag = '<em>$text</em>';
			parsed = italicBB.replace(parsed, emTag);
		}
		while (boldBB.match(parsed)) {
			var text = boldBB.matched(1);
			var strongTag = '<strong>$text</strong>';
			parsed = boldBB.replace(parsed, strongTag);
		}
		return parsed;
	}
	
	static function main() {
		new Main();
	}	
}
package ;

import haxe.Timer;
import js.html.AudioElement;
import js.html.DivElement;
import js.html.Element;
import js.html.InputElement;
import js.Lib;
import js.Browser;
import haxe.Http;
import haxe.Json;
import js.html.Notification;
import js.html.NotificationPermission;

import thx.color.Rgb;
import thx.math.random.PseudoRandom;

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
	
	var messageSound: AudioElement;
	
	var id: Int;
	
	var requestInProgress: Bool = false;
	
	var focussed: Bool = true;
	
	var lastMessage: String = '';
	
	var first: Bool = true;
	
	var notifications: Array<Notification> = new Array<Notification>();
	
	function new() {
		http = new Http(basePath + lastIndex);
		http.async = true;
		http.onData = _parseMessages;
		http.onError = function(error) { 
			trace(error); 
			requestInProgress = false; 
			chatbox.value = lastMessage; 
		}
		
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
			_clearNotifications();
		};
		
		Browser.window.onblur = function() {
			focussed = false;
		};
		
		_loop();
	}
	
	function _clearNotifications() {
		for (n in notifications) {
			n.close();
		}
		notifications = new Array<Notification>();
	}
	
	function _windowLoaded() {
		chatbox = cast Browser.document.getElementById('chatbox');
		messages = cast Browser.document.getElementById('messages');
		messageSound = cast Browser.document.getElementById('messagesound');
		
		chatbox.onclick = _testNotification;
		
		chatbox.onkeypress = _checkKeyPress;
		chatbox.focus();
	}
	
	function _testNotification() {
		trace('attempting notification');
		if (Notification.permission == NotificationPermission.DEFAULT_) {
			Notification.requestPermission(function(permission) {
				/*if (permission == NotificationPermission.GRANTED) {
					var notification = new Notification('test');
				}*/
			});
		}
	}
	
	function _sendNotification(text: String) {
		if (Notification.permission == NotificationPermission.GRANTED) {
			notifications.push(new Notification(text));
		}
	}
	
	function _checkKeyPress(e) {
		var code = (e.keyCode != null ? e.keyCode : e.which);
		if (code == 13) { //ENTER
			http.url = basePath + 'chat/' + chatbox.value.urlEncode() +'/' + id;
			lastMessage = chatbox.value;
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
			messages.appendChild(_makeSpan(differentUser, p.id));
			messages.appendChild(message);
			
			Browser.window.scrollTo(0, Browser.document.body.scrollHeight);
			
			if (!focussed && !first) {
				Browser.document.title = '# aqueous-basin.';
				messageSound.play();
				_sendNotification(message.innerText);
			}
			
			lastUserID = p.id;
		}
		lastIndex = parsed.lastID;
		first = false;
	}
	
	function _makeSpan(?pointer: Bool = false, ?id: Int): Element {
		var span = Browser.document.createSpanElement();
		if (pointer) {
			span.innerHTML = '>';
			var value = new Random(id * 12189234).int(100, 255);
			trace(value);
			var rgb: Rgb = Rgb.create(value, value, value);
			span.style.color = '#' + rgb.hex(6);
			trace(rgb.hex(6));
		}
		span.innerHTML += '\t';
		
		return span;
	}
	
	var imgBB: EReg = ~/(?:\[img\]|#)(.*?)(?:\[\/img\]|#)/i;
	var italicBB: EReg = ~/(?:\[i\]|\*)(.*?)(?:\[\/i\]|\*)/i;
	var boldBB: EReg = ~/(?:\[b\]|\*\*)(.*?)(?:\[\/b\]|\*\*)/i;
	var codeBB: EReg = ~/(?:\[code\]|`)(.*?)(?:\[\/code\]|`)/i;
	
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
		while (codeBB.match(parsed)) {
			var text = codeBB.matched(1);
			var preTag = '<pre>$text</pre>';
			parsed = codeBB.replace(parsed, preTag);
		}
		return parsed;
	}
	
	static function main() {
		new Main();
	}	
}
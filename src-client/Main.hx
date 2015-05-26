package ;

import haxe.Timer;
import js.Cookie;
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
import thx.color.Hsl;
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
	
	var numNotifications: Int = 0;
	
	function new() {
		http = new Http(basePath + lastIndex);
		http.async = true;
		http.onData = _parseMessages;
		http.onError = function(error) { 
			trace(error); 
			requestInProgress = false; 
			chatbox.value = lastMessage; 
		}
		
		if(!Cookie.exists('id')) {
			_generateID();
		}
		else {
			id = Std.parseInt(Cookie.get('id'));
		}

		Browser.window.onload = _windowLoaded;
		
		Browser.window.onfocus = function() {
			focussed = true;
			Browser.document.title = 'aqueous-basin.';
			_clearNotifications();
			numNotifications = 0;
		};
		
		Browser.window.onblur = function() {
			focussed = false;
		};
		
		_loop();
	}
	
	function _generateID() {
		id = new Random(Math.random() * 0xFFFFFF).int(0, 0xFFFFFF);
		Cookie.set('id', Std.string(id), 60 * 60 * 24 * 365 * 10);
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
			Notification.requestPermission(function(permission) {});
		}
	}
	
	function _sendNotification(text: String) {
		if (Notification.permission == NotificationPermission.GRANTED) {
			if(numNotifications <= 1) {
				notifications.push(new Notification(text));
			}
			else {
				_clearNotifications();
				notifications.push(new Notification('$numNotifications new messages.'));
			}
		}
	}
	
	function _checkKeyPress(e) {
		var code = (e.keyCode != null ? e.keyCode : e.which);
		if (code == 13) { //ENTER
			if(chatbox.value != '/new') {
				http.url = basePath + 'chat/' + chatbox.value.urlEncode() +'/' + id;
				lastMessage = chatbox.value;
				http.request(true);
				_update();
			}
			else {
				_generateID();
			}
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
				numNotifications++;
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
			var hue = new Random(id * 12189234).float(0, 360);
			var sat = new Random(id * 12189234).float(0.3, 0.5);
			var light = new Random(id * 12189234).float(0.3, 0.5);
			var hsl: Hsl = Hsl.create(hue, sat, light);
			span.style.color = '#' + hsl.hex(6);
			trace(hsl.hex(6));
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
package ;

import haxe.Timer;
import js.Cookie;
import js.html.AudioElement;
import js.html.DivElement;
import js.html.Element;
import js.html.ImageElement;
import js.html.InputElement;
import js.html.ParagraphElement;
import js.Lib;
import js.Browser;
import haxe.Http;
import haxe.Json;
import js.html.Notification;
import js.html.NotificationPermission;
import js.html.NotificationOptions;

import thx.color.Rgb;
import thx.color.Hsl;
import thx.math.random.PseudoRandom;

using StringTools;

class Main 
{
	var basePath: String = 'https://aqueous-basin.herokuapp.com/';
	var id: Int;

	var lastIndex: Int = -1;
	var lastUserID: Int = -2;
	
	var getHttp: Http;
	var postHttp: Http;
	
	var chatbox: InputElement;
	var messages: DivElement;
	var messageSound: AudioElement;
	var lastParagraph: DivElement;
	
	var requestInProgress: Bool = false;
	var first: Bool = true;
	var focussed: Bool = true;
	
	var notifications: Array<Notification> = new Array<Notification>();
	var numNotifications: Int = 0;
	
	var commands: Map<String, Array<String> -> Void> = new Map();
	
	var lastMessage: String = '';
	
	function new() {
		_buildCommands();
		
		getHttp = new Http(basePath + lastIndex);
		getHttp.async = true;
		getHttp.onData = _parseMessages;
		getHttp.onError = function(error) { 
			trace(error); 
			requestInProgress = false; 
		}
		
		postHttp = new Http(basePath);
		postHttp.async = true;
		postHttp.onError = function(error) { 
			trace(error); 
			requestInProgress = false; 
			//chatbox.value = lastMessage; 
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
		
	//{ startup and message loop
	function _windowLoaded() {
		chatbox = cast Browser.document.getElementById('chatbox');
		messages = cast Browser.document.getElementById('messages');
		messageSound = cast Browser.document.getElementById('messagesound');
		
		chatbox.onclick = _getNotificationPermission;
		
		chatbox.onkeypress = _checkKeyPress;
		chatbox.focus();
		
		if(!Cookie.exists('id')) {
			_generateID();
		}
		else {
			_setID(Std.parseInt(Cookie.get('id')));
		}
	}
	
		
	function _loop() {
		Timer.delay(function() {
			_update();
			_loop();
		}, 1000);
	}

	function _update() {
		if (requestInProgress) {
			return;
		}
		getHttp.url = basePath + 'api/' + lastIndex;
		requestInProgress = true;
		getHttp.request(true);
	}
	//}
	
	//{ notifications
	function _getNotificationPermission() {
		if (Notification.permission == NotificationPermission.DEFAULT_) {
			Notification.requestPermission(function(permission) {});
		}
	}
	
	function _sendNotification(text: String) {
		if (Notification.permission == NotificationPermission.GRANTED) {
			var options: NotificationOptions = { };
			options.body = 'aqueous-basin.';
			if (numNotifications <= 1) {
				notifications.push(new Notification(text, options));
			}
			else {
				_clearNotifications();
				notifications.push(new Notification('$numNotifications new messages.', options));
			}
			notifications[notifications.length - 1].onclick = function(){ 
				Browser.window.focus();
			};
		}
	}
	
	function _clearNotifications() {
		for (n in notifications) {
			n.close();
		}
		notifications = new Array<Notification>();
	}
	//}
		
	//{ commands
	function _buildCommands() {
		commands.set('revivify', _generateID);
		commands.set('impersonate', _setIDCommand);
		commands.set('oneself', _printID);
		commands.set('', _help);
	}
	
	function _parseCommand(commandString: String) {
		var firstSpace = commandString.indexOf(' ');
		var command: String;
		if (firstSpace != -1) {
			command = commandString.substring(0, firstSpace).trim();
			var args: Array<String> = commandString.substring(firstSpace).trim().split(' ');
			for (i in 0...args.length) {
				args[i] = args[i].trim();
			}
			_callCommand(command, args);
		}
		else {
			_callCommand(commandString.trim());
		}
	}
	
	function _callCommand(command: String, ?args: Array<String>) {
		if(commands.exists(command)) {
			commands.get(command)(args);
		}
		else {
			_addMessage('Unrecognized command, did you mean one of these?');
			_help();
		}
	}
	//}
	
	//{ command functions
	function _generateID(?arguments: Array<String>) {
		_setID(new Random(Math.random() * 0xFFFFFF).int(0, 0xFFFFFF));
	}
	
	function _setIDCommand(arguments: Array<String>) {
		if (arguments != null && arguments[0] != null && arguments[0] != '') {
			var newID = Std.parseInt(arguments[0]);
			if (newID != null) {
				_setID(newID);
			}
			else {
				_addMessage('Could not parse argument: *ID*');
			}
		}
		else {
			_addMessage('**/impersonate** requires argument: *ID*');
		}
	}
	
	function _printID(?arguments: Array<String>) {
		_addMessage('*Currently impersonating*: $id');
	}
	
	function _help(?arguments: Array<String>) {
		_addMessage('**/revivify**');
		_addMessage('regenerate your ID, giving you a new color.');
		_addMessage('**/oneself**');
		_addMessage('print your current ID.');
		_addMessage('**/impersonate** *ID*');
		_addMessage('set your ID explicitly, allows you to have all your devices share ID, or steal someone else\'s;).');
	}
	//}
	
	//{ messages
	function _parseMessages(data) {		
		var parsed: MessageData = Json.parse(data);
		for (p in parsed.messages.messages) {		
			var message = _addMessage(p.text, p.id);
			
			if (!focussed && !first) {
				Browser.document.title = '# aqueous-basin.';
				messageSound.play();
				numNotifications++;
				_sendNotification(message.innerText != null? message.innerText : message.textContent);
			}
			
			lastUserID = p.id;
		}
		lastIndex = parsed.lastID;
		first = false;
		
		for (i in Browser.document.getElementsByClassName('imgmessage')) {
			var image: ImageElement = cast i;
			i.onclick = _openImageInNewTab.bind(image.src);
		}
		
		requestInProgress = false;
	}
	
	function _addMessage(msg: String, ?id: Int): DivElement {
		msg = _parseMessage(msg);
		
		var message: DivElement;
		
		var differentUser = false;
		if (id == null || id == -1 || id != lastUserID ) {
			differentUser = true;
		}
		
		if (differentUser) {
			message = Browser.document.createDivElement();
			message.className = 'messageblock';
			lastParagraph = message;
					
			messages.appendChild(_makeSpan(differentUser, id));
			messages.appendChild(message);
		}
		else {
			message = lastParagraph;
		}
		
		var messageItem: DivElement = Browser.document.createDivElement();
		messageItem.className = 'messageitem';
		
		messageItem.innerHTML = msg;
		
		message.appendChild(messageItem);
		
		Browser.window.scrollTo(0, Browser.document.body.scrollHeight);
		
		return messageItem;
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
			var imgTag = '<img src="$imgPath" class="imgmessage"></img>';
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
	//}

	//{ message posting
	function _checkKeyPress(e) {
		var code = (e.keyCode != null ? e.keyCode : e.which);
		if (code == 13) { //ENTER
			if(chatbox.value.charAt(0) == '/') {
				_parseCommand(chatbox.value.substr(1));
			}
			else {
				postHttp.url = basePath + 'chat/' + chatbox.value.urlEncode() +'/' + id;
				lastMessage = chatbox.value;
				postHttp.request(true);
				_update();
			}
			chatbox.value = '';
		}
	}
	//}
	
	//{ util
	function _openImageInNewTab(src: String) {
		var win = Browser.window.open(src, '_blank');
		win.focus();
	}
	
	function _makeSpan(?pointer: Bool = false, ?id: Int): Element {
		var span = Browser.document.createSpanElement();
		if (pointer) {
			span.innerHTML = '>';
			
			span.style.color = _generateColorFromID(id);
		}
		span.innerHTML += '\t';
		
		return span;
	}
	
	function _generateColorFromID(?id: Int, ?dark: Bool = false): String {
		var hsl: Hsl;
		if(id != null && id != -1) {
			var hue = new Random(id * 12189234).float(0, 360);
			var sat = new Random(id * 12189234).float(0.3, 0.5);
			var light = new Random(id * 12189234).float(0.3, 0.5);
			hsl = Hsl.create(hue, sat, light);
			
			if (dark) {
				hsl = hsl.darker(0.5);
			}
		}
		else {
			hsl = Hsl.create(0, 1, 1);
		}
		
		return '#' + hsl.hex(6);
	}
	
	function _setID(id_: Int) {
		id = id_;
		Cookie.set('id', Std.string(id), 60 * 60 * 24 * 365 * 10);
		chatbox.style.borderColor = _generateColorFromID(id, true);
	}
	//}
	
	static function main() {
		new Main();
	}	
}
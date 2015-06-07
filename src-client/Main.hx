package ;

import haxe.Timer;
import js.Cookie;
import js.html.AudioElement;
import js.html.DivElement;
import js.html.Element;
import js.html.ImageElement;
import js.html.InputElement;
import js.html.LIElement;
import js.html.LinkElement;
import js.html.ParagraphElement;
import js.html.SpanElement;
import js.html.UListElement;
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

typedef MessageDiv = {
	id: String,
	message: DivElement,
	chevron: Element
};

class Main 
{
	var room: String;
	var basePath: String = 'https://aqueous-dev.herokuapp.com/';
	var id: String = null;
	var privateID: String;
	var token: String = null;
	var password: String = null;

	var lastIndex: Int = -1;
	var lastUserID: String = '-2';
	
	var getHttp: Http; 
	var postHttp: Http;
	var authHttp: Http;
	
	var chatbox: InputElement;
	var helpbox: UListElement;
	var messages: DivElement;
	var chevron: SpanElement;
	var messageSound: AudioElement;
	var lastParagraph: DivElement;
	var favicons: Array<LinkElement>;
	var typings: Array<MessageDiv> = new Array<MessageDiv>();
	
	var requestInProgress: Bool = false;
	var first: Bool = true;
	var focussed: Bool = true;
	var locked: Bool = false;
	var hasTriedAuth: Bool = false;
	var wasLocked: Bool = false;
	var canSendTypingNotification: Bool = true;
	
	var notifications: Array<Notification> = new Array<Notification>();
	var numNotifications: Int = 0;
	
	var commands: Map<String, Array<String> -> Void> = new Map();
	
	var lastMessage: String = '';
	var sendLast: Bool = false;
	
	var commandIndex: Int = -1;
	
	function new() {
		room = untyped window.room;
		_buildCommands();
		
		authHttp = new Http(basePath);
		authHttp.onData = _getAuth;
		authHttp.onError = function(error) { 
			trace(error); 
			_addMessage('Could not connect to authentication api, please refresh the page.');
		}
		
		getHttp = new Http(basePath + lastIndex);
		getHttp.onData = _parseMessages;
		getHttp.onError = function(error) { 
			trace(error); 
			requestInProgress = false; 
		}
		
		postHttp = new Http(basePath);
		postHttp.async = true;
		postHttp.onData = function(data) {
			if (data == 'failed') {
				token = null;
				hasTriedAuth = false;
				sendLast = true;
				_tryAuth();
			}
		}
		postHttp.onError = function(error) { 
			trace(error); 
			requestInProgress = false; 
			//chatbox.value = lastMessage; 
		}

		Browser.window.onload = _windowLoaded;
		
		Browser.window.onfocus = function() {
			focussed = true;
			Browser.document.title = 'aqueous-basin.';
			for (f in favicons) {
				f.href = 'bin/faviconempty.ico';
			}
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
		helpbox = cast Browser.document.getElementById('helpbox');
		chevron = cast Browser.document.getElementById('chevron');
		favicons = new Array<LinkElement>();
		for (f in Browser.document.getElementsByClassName('favicon')) {
			favicons.push(cast f);
		}
		messageSound = cast Browser.document.getElementById('messagesound');
		
		_setupHelpbox();
		
		chatbox.onclick = function() {
			_getNotificationPermission();
			if (token == null && !hasTriedAuth) {
				_tryAuth();
			}
		}
		chatbox.oninput = function() {
			_getNotificationPermission();
			if (token == null && !hasTriedAuth) {
				_tryAuth();
			}
		}
		chatbox.onkeyup = _checkKeyPress;
		chatbox.focus();
		
		if(!Cookie.exists('id')) {
			_getID();
		}
		else {
			_setID(Cookie.get('id'));
		}
		
		if (Cookie.exists('$room-password')) {
			_setPassword(Cookie.get('$room-password'));
		}
		
		_setupPrivateID();
	}
	
	var alphanumeric = '0123456789abcdefghijklmnopqrstuvwxyz';
	
	function _setupPrivateID() {
		if (!Cookie.exists('private')) {
			var rand = new Random(Date.now().getTime());
			var newPrivate: String = '';
			while (newPrivate.length <= 40) {
				newPrivate += alphanumeric.charAt(rand.int(alphanumeric.length));
			}
			privateID = newPrivate;
			Cookie.set('private', newPrivate, 60 * 60 * 24 * 365 * 10);
		}
		else {
			privateID = Cookie.get('private');
			token = Cookie.get('token');
			if(token != null) {
				_checkValid();
			}
		}
	}
	
	function _setToken(_token: String) {
		token = _token;
		_checkValid(true);
		//lastIndex = 0;
		if(token != null) {
			Cookie.set('token', token, 60 * 60 * 24 * 365 * 10);
		}
	}
	
	function _checkValid(printValid: Bool = false) {
		var checkValid = new Http(basePath + 'api/checkvalid/$privateID/$token');
		checkValid.onData = function(data: String) {
			if (data == 'invalid') {
				token = null;
				_tryAuth();
				return;
			}
			else {
				if(printValid) {
					_addMessage('authentication successful, chat away.');
					hasTriedAuth = false;
					
					if (sendLast) {
						_postMessage(lastMessage);
						_update();
					}
				}
			}
		}
		checkValid.onError = function(e) {
			_addMessage('an error occured getting authentication, please refresh the page.');
		}
		checkValid.request(true);
	}
	
	function _tryAuth() {
		authHttp.url = basePath + 'api/gettoken/$privateID';
		authHttp.request(true);
		hasTriedAuth = true;
	}
	
	function _getAuth(data: String) {
		_addMessage('please enter the following to authenticate.');
		_addMessage('empty', null, '<img src="http://dummyimage.com/400x128/2b2b2b/ecf0f1/&amp;text=$data" class="imgmessage" width="200">');
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
		if(password == null) {
			getHttp.url = basePath + 'api/' + room + '/' + lastIndex;
		}
		else {
			getHttp.url = basePath + 'api/' + room + '/' + password + '/' + lastIndex;
		}
		requestInProgress = true;
		getHttp.request(true);
	}
	//}
	
	function _setupHelpbox() {
		for (command in helpbox.children) {
			command.onclick = function() {
				chatbox.value = '/' + command.getAttribute('data-command');
				chatbox.onkeyup();
				chatbox.focus();
			}
		}
	}
	
	//{ notifications
	function _getNotificationPermission() {
		if (Notification.permission == NotificationPermission.DEFAULT_) {
			Notification.requestPermission(function(permission) {});
		}
	}
	
	function _sendNotification(text: String) {
		if (Notification.permission == NotificationPermission.GRANTED) {
			var options: NotificationOptions = { };
			options.body = 'aqueous-basin/$room';
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
		commands.set('revivify', _getID);
		commands.set('impersonate', _setIDCommand);
		commands.set('oneself', _printID);
		commands.set('existent', _printRoom);
		commands.set('survey', _changeRoom);
		commands.set('fasten', _lockRoom);
		commands.set('unfasten', _unlockRoom);
		commands.set('claim', _claimRoom);
		
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
	function _getID(?arguments: Array<String>) {
		var idHttp: Http = new Http(basePath + 'api/getID');
		idHttp.onData = function(d) {
			_setID(d);
			trace(id);
		}
		idHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t get ID.');
		}
		
		idHttp.request(true);
	}
	
	function _setIDCommand(arguments: Array<String>) {
		if (arguments != null && arguments[0] != null && arguments[0] != '') {
			var newID = arguments[0];
			if (newID != null) {
				_setID(newID);
			}
			else {
				_addMessage('Could not parse argument: *ID*.');
			}
		}
		else {
			_addMessage('**/impersonate** requires argument: *ID*.');
		}
	}
	
	function _changeRoom(arguments: Array<String>) {
		if (arguments != null && arguments[0] != null && arguments[0] != '') {
			Browser.window.location.href = arguments[0];
		}
		else {
			_addMessage('**/survey** requires argument: *ROOM*.');
		}
	}
	
	function _claimRoom(?arguments: Array<String>) {
		var lockHttp: Http = new Http(basePath + 'api/claim/$room/$privateID');
		lockHttp.onData = function(d) {
			if(d == 'claimed') {
				_addMessage('$room claimed.');
			}
			else {
				_addMessage('you are not authorized to claim $room.');
			}
		}
		lockHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t claim room.');
		}
		
		lockHttp.request(true);
	}
	
	function _printID(?arguments: Array<String>) {
		_addMessage('*Currently impersonating*: $id');
	}
	
	function _printRoom(?arguments: Array<String>) {
		_addMessage('*Currently in*: $room');
	}
	
	function _lockRoom(arguments: Array<String>) {
		if (arguments.length == 0 || arguments[0].trim() == '') {
			_addMessage('**/fasten** requires argument: *PASSWORD*.');
			return;
		}
		var newPassword = arguments[0];
		_setPassword(newPassword);
		var lockHttp: Http = new Http(basePath + 'api/lock/$room/$privateID/$newPassword');
		lockHttp.onData = function(d) {
			if(d == 'locked') {
				_addMessage('$room locked with password: $newPassword.');
			}
			else {
				_addMessage('you are not authorized to lock $room.');
			}
		}
		lockHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t lock room.');
		}
		
		lockHttp.request(true);
	}
	
	function _unlockRoom(?arguments: Array<String>) {
		var lockHttp: Http = new Http(basePath + 'api/unlock/$room/$privateID');
		lockHttp.onData = function(d) {
			if(d == 'unlocked') {
				_addMessage('$room unlocked.');
			}
			else {
				_addMessage('you are not authorized to unlock $room.');
			}
		}
		lockHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t unlock room.');
		}
		
		lockHttp.request(true);
	}
	
	function _help(?arguments: Array<String>) {
		_addMessage('**/revivify**');
		_addMessage('regenerate your ID, giving you a new color.');
		_addMessage('**/oneself**');
		_addMessage('print your current ID.');
		_addMessage('**/impersonate** *ID*');
		_addMessage('set your ID explicitly, allows you to have all your devices share ID, or steal someone else\'s;).');
		_addMessage('**/existent**');
		_addMessage('print the chat room you are currently in.');
		_addMessage('**/survey** *ROOM*');
		_addMessage('move to a different chat room.');
		_addMessage('**/claim** *PASSWORD*');
		_addMessage('attempt to take ownership of the current room.');
		_addMessage('**/fasten** *PASSWORD*');
		_addMessage('attempt to lock the current room.');
		_addMessage('**/unfasten**');
		_addMessage('attempt to unlock the current room.');
	}
	//}
	
	//{ messages
	function _parseMessages(data) {	
		if (data == 'locked') {
			if(!locked) {
				_addMessage('room is locked, please enter password.');
			}
			locked = true;
			requestInProgress = false;
			wasLocked = true;
			return;
		}
		if (data == 'password') {
			if(!locked) {
				_addMessage('incorrect password, please resend password.');
			}
			locked = true;
			requestInProgress = false;
			wasLocked = true;
			return;
		}
		if (wasLocked) {
			_addMessage('successfully unlocked.');
			wasLocked = false;
		}
		var parsed: MessageData = Json.parse(data);
		for (p in parsed.messages.messages) {		
			var message = _addMessage(p.text, p.id);
			
			if (!focussed && !first) {
				Browser.document.title = '# aqueous-basin.';
				for (f in favicons) {
					f.href = 'bin/favicon.ico';
				}
				messageSound.play();
				numNotifications++;
				_sendNotification(message.innerText != null? message.innerText : message.textContent);
			}
		}
		
		for (t in typings) {
			messages.removeChild(t.chevron);
			messages.removeChild(t.message);
		}
		typings = [];
		
		for (t in parsed.messages.typing) {
			if(t != id) {
				var typeMessage = Browser.document.createDivElement();
				typeMessage.className = 'messageitem';
				typeMessage.innerHTML = 'typing...';
				var message: MessageDiv = {
					id: t,
					chevron: _makeSpan(true, t),
					message: typeMessage
				}
				typings.push(message);
				messages.appendChild(message.chevron);
				messages.appendChild(message.message);
				_tryScroll();
			}
		}
		
		lastIndex = parsed.lastID;
		first = false;
		
		for (i in Browser.document.getElementsByClassName('imgmessage')) {
			var image: ImageElement = cast i;
			i.onclick = _openImageInNewTab.bind(image.src);
		}
		
		requestInProgress = false;
	}
	
	function _tryScroll() {
		//if ((Browser.window.innerHeight + Browser.window.scrollY) >= Browser.document.body.offsetHeight) {
			Browser.window.scrollTo(0, Browser.document.body.scrollHeight);
		//}
	}
	
	function _addMessage(msg: String, ?id: String, ?customHTML: String): DivElement {
		msg = _parseMessage(msg);
		
		var message: DivElement;
		
		var differentUser = false;
		if (id == null || id == '-1' || id != lastUserID ) {
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
		
		messageItem.innerHTML = customHTML==null? msg : customHTML;
		
		message.appendChild(messageItem);
		
		_tryScroll();
		
		lastUserID = id;
		
		return messageItem;
	}
	
	var imgBB: EReg = ~/(?:\[img\]|#)(.*?)(?:\[\/img\]|#)/i;
	var italicBB: EReg = ~/(?:\[i\]|\*)(.*?)(?:\[\/i\]|\*)/i;
	var boldBB: EReg = ~/(?:\[b\]|\*\*)(.*?)(?:\[\/b\]|\*\*)/i;
	var codeBB: EReg = ~/(?:\[code\]|`)(.*?)(?:\[\/code\]|`)/i;
	
	function _parseMessage(raw: String): String {
		var parsed: String = raw.replace('\n', ' ');
		parsed = parsed.htmlEscape();
		parsed = parsed.replace("\"", "&quot;");
		parsed = parsed.replace(":", "&colon;");
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
		var code = null;
		if(e != null) {
			 code = (e.keyCode != null ? e.keyCode : e.which);
		}
		
		var selected: Bool = false;
		if (chatbox.value.charAt(0) == '/') {
			if(helpbox.style.display != 'block') {
				helpbox.style.display = 'block';
				commandIndex = -1;
			}
			
			for (c in helpbox.children) {
				var li: LIElement = cast c;
								
				var command = li.getAttribute('data-command');
				if (li.classList.contains('selected')) {
					var replacement = '/' + command + ' ';
					if (chatbox.value.substr(0,replacement.length) != replacement && chatbox.value.charAt(chatbox.value.length - 1) == ' ' || code != null && code == 13 && chatbox.value.length < replacement.length) {
						chatbox.value = replacement;
					}
				}
				
				var sub = chatbox.value.substr(1);
				var trimmed: Bool = false;
				if (sub.indexOf(' ') != -1) {
					trimmed = true;
					sub = sub.substring(0, sub.indexOf(' '));
				}

				var end: Int = (!trimmed? sub.length : command.length);
				
				if (command.substr(0, end) != sub) {
					li.style.display = 'none';
				}
				else {
					li.style.display = 'list-item';
					if (!selected && sub.length > 0) { //nothing selected, and must be filtered not a big list
						li.classList.add('selected');
						selected = true;
					}
					else {
						li.classList.remove('selected');
					}
				}
			}
			if (code == 40 || code == 38) {
				for (c in helpbox.children) {
					c.classList.remove('selected');
				}
				if (code == 40) { //DOWN
					commandIndex++;
					if (commandIndex >= helpbox.children.length) {
						commandIndex = 0;
					}
				}
				else if (code == 38) { //UP
					commandIndex--;
					if (commandIndex <= -1) {
						commandIndex = helpbox.children.length - 1;
					}
				}
				helpbox.children[commandIndex].classList.add('selected');
				helpbox.scrollTop = helpbox.children[commandIndex].offsetTop;
			}
		}
		else {
			helpbox.style.display = 'none';
					
			if (!locked && token != null) {
				if (canSendTypingNotification) {
					var typingHttp: Http = new Http(basePath + 'api/typing/$room/$id');
					typingHttp.request(true);
					canSendTypingNotification = false;
					var timer = new Timer(2500);
					timer.run = function() {
						canSendTypingNotification = true;
					}
				}
			}
		}

		if (code != null && code == 13) { //ENTER
			if (token == null) {
				var t = chatbox.value;
				_setToken(t != null? t : '-1');
				chatbox.value = '';
				helpbox.style.display = 'none';
				return;
			}
			if(chatbox.value.charAt(0) == '/') {
				_parseCommand(chatbox.value.substr(1));
			}
			else {
				if (locked) {
					_setPassword(chatbox.value);
					_addMessage('attempting to unlock room with: $password.');
					chatbox.value = '';
					helpbox.style.display = 'none';
					locked = false;
					return;
				}
			
				_postMessage(chatbox.value);
				
				lastMessage = chatbox.value;
				
				_update();
			}
			chatbox.value = '';
			helpbox.style.display = 'none';
		}
	}
	
	function _postMessage(msg: String) {
		if (msg.trim() != '') {
			if(password == null) {
				postHttp.url = basePath + 'chat/' + msg.urlEncode() +'/' + room + '/' + id + '/' + privateID + '/' + token;
			}
			else {
				postHttp.url = basePath + 'chat/' + msg.urlEncode() +'/' + room + '/' + password +'/' + id + '/' + privateID + '/' + token;
			}
			postHttp.request(true);
		}
	}
	//}
	
	//{ util
	function _openImageInNewTab(src: String) {
		var win = Browser.window.open(src, '_blank');
		win.focus();
	}
	
	function _makeSpan(?pointer: Bool = false, ?id: String): Element {
		var span = Browser.document.createSpanElement();
		if (pointer) {
			span.innerHTML = '>';
			
			span.style.color = _generateColorFromID(id);
		}
		span.innerHTML += '\t';
		
		return span;
	}
	
	function _generateColorFromID(?id: String, ?dark: Bool = false): String {
		var hsl: Hsl;
		if (id != null && id != '-1') {
			var intID = 0;
			for (i in 0...id.length) {
				var s = id.charCodeAt(i);
				intID += s;
			}
			var hue = new Random(intID * 12189234).float(0, 360);
			var sat = new Random(intID * 12189234).float(0.3, 0.5);
			var light = new Random(intID * 12189234).float(0.3, 0.5);
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
	
	function _setID(id_: String) {
		id = id_;
		Cookie.set('id', id, 60 * 60 * 24 * 365 * 10);
		chatbox.style.borderTopColor = _generateColorFromID(id, true);
		//chatbox.style.boxShadow.replace = _generateColorFromID(id, true);
		//chevron.style.color = _generateColorFromID(id);
	}
	
	function _setPassword(password_: String) {
		password = password_;
		Cookie.set('$room-password', password, 60 * 60 * 24 * 365 * 10);
	}
	//}
	
	static function main() {
		new Main();
	}	
}
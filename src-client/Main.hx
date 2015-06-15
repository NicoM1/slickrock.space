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

import jQuery.*;

import thx.color.Rgb;
import thx.color.Hsl;
import thx.math.random.PseudoRandom;

using StringTools;

typedef MessageDiv = {
	id: String,
	message: DivElement,
	chevron: Element
};

typedef Command = {
	identifiers: String,
	description: String,
	method: Array<String> -> Void,
	?requiresArgs: Bool
}

class Main 
{
	var room: String;
	var basePath: String = 'https://aqueous-api.herokuapp.com/';
	var id: String = null;
	var privateID: String;
	var token: String = null;
	var password: String = null;
	var adminPassword: String = '-1';

	var lastIndex: Int = -1;
	var firstIndex: Int = -1;
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
	var histRequestInProgress: Bool = false;
	var first: Bool = true;
	var initialScroll: Bool = true;
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
	
	var lastY: Int = null;
	
	function new() {
		room = untyped window.room;
		_buildCommands();
		
		Browser.window.onload = _windowLoaded;
	}
		
	//{ startup and message loop
	function _windowLoaded() {	
		authHttp = new Http(basePath);
		authHttp.onData = _getAuth;
		authHttp.onError = function(error) { 
			trace(error); 
			_addMessage('Could not connect to authentication api, please refresh the page.');
		}
		
		getHttp = new Http(basePath + lastIndex);
		getHttp.onData = _parseMessages.bind(_, false);
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

		chatbox = cast Browser.document.getElementById('chatbox');
		messages = cast Browser.document.getElementById('messages');
		helpbox = cast Browser.document.getElementById('helpbox');
		chevron = cast Browser.document.getElementById('chevron');
		favicons = new Array<LinkElement>();
		for (f in Browser.document.getElementsByClassName('favicon')) {
			favicons.push(cast f);
		}
		messageSound = cast Browser.document.getElementById('messagesound');
				
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
		
		messages.addEventListener('mousewheel', _tryGetOldMessages);
		messages.addEventListener('DOMMouseScroll', _tryGetOldMessages);
		messages.ontouchmove = _tryGetOldMessages;
		Browser.document.onkeydown = _testScrolling;
		
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
		chatbox.onmousedown = function() {
			if (chatbox.classList.contains('helptip')) {
				chatbox.classList.remove('helptip');
				chatbox.value = '';
			}
		}
		chatbox.ontouchstart = function() {
			if (chatbox.classList.contains('helptip')) {
				chatbox.classList.remove('helptip');
				chatbox.value = '';
			}
		}
		chatbox.onkeydown = function(e) {
			if (chatbox.classList.contains('helptip')) {
				chatbox.classList.remove('helptip');
				chatbox.value = '';
			}
		}
		
		if(!Cookie.exists('id')) {
			_getID();
		}
		else {
			_setID(Cookie.get('id'));
		}
		
		if (Cookie.exists('$room-password')) {
			_setPassword(Cookie.get('$room-password'));
		}
		
		if (Cookie.exists('${room}admin-password')) {
			_setAdminPassword(Cookie.get('${room}admin-password'));
		}
		
		_setupPrivateID();
		
		_loop();
	}
	
	function _testScrolling(e) {
		var code = null;
		if(e != null) {
			 code = (e.keyCode != null ? e.keyCode : e.which);
		}
		if (code == 38) {
			_tryGetOldMessages();
		}
	}
	
	function _tryGetOldMessages(?args) {
		if (histRequestInProgress || initialScroll) return;
		var scrollY = (lastY != null? lastY : Browser.window.pageYOffset) - Browser.window.pageYOffset;
		lastY = Browser.window.pageYOffset;
		
		if (lastY < 500) {
			if(firstIndex > 0) {
				var histHttp: Http = new Http(basePath);
				histHttp.onError = function(e) {
					histRequestInProgress = false;
					trace(e);
				}
				histHttp.onData = _parseMessages.bind(_, true);
				if(password == null) {
					histHttp.url = basePath + 'api/hist/' + room + '/' + lastIndex + '/' + firstIndex;
				}
				else {
					histHttp.url = basePath + 'api/hist/' + room + '/' + password + '/' + lastIndex + '/' + firstIndex;
				}
				histRequestInProgress = true;
				histHttp.request(true);
			}
		}
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
		for (k in commandInfos.keys()) {
			var c = commandInfos[k];
			var command: LIElement = Browser.document.createLIElement();
			var identDiv: DivElement = Browser.document.createDivElement();
			var descDiv: DivElement = Browser.document.createDivElement();
			
			identDiv.classList.add('command');
			identDiv.innerHTML = c.identifiers;
			
			descDiv.classList.add('description');
			descDiv.innerHTML = c.description;
			
			command.appendChild(identDiv);
			command.appendChild(descDiv);
			
			command.setAttribute('data-command', k);
			
			command.onclick = function() {
				chatbox.value = '/' + k;
				chatbox.onkeyup();
				chatbox.focus();
			}
			
			helpbox.appendChild(command);
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
	var commandInfos: Map<String, Command>;		
	
	function _buildCommands() {
		commandInfos = [
		'revivify' => {
			identifiers: '<strong>/revivify</strong>',
			description: 'regenerate your ID, giving you a new color.',
			method: _getID
		},
		'oneself' => {
			identifiers: '<strong>/oneself</strong>',
			description: 'print your current ID.',
			method: _printID
		},
		'impersonate' => {
			identifiers: '<strong>/impersonate</strong> <em>ID</em>',
			description: 'set your ID explicitly, allows you to have all your devices share ID, or steal someone else\'s;).',
			method: _setIDCommand,
			requiresArgs: true
		},
		'existent' => {
			identifiers: '<strong>/existent</strong>',
			description: 'print the chat room you are currently in.',
			method: _printRoom
		},
		'survey' => {
			identifiers: '<strong>/survey</strong> <em>ROOM</em>',
			description: 'move to a different chat room.',
			method: _changeRoom,
			requiresArgs: true
		},
		'claim' => {
			identifiers: '<strong>/claim</strong> <em>ADMIN_PASSWORD</em>',
			description: 'attempt to take ownership of the current room.',
			method: _claimRoom,
			requiresArgs: true
		},
		'entitle' => {
			identifiers: '<strong>/entitle</strong> <em>ADMIN_PASSWORD</em>',
			description: 'attempt to take authorize youself as admin of the current room.',
			method: _authorizeRoom,
			requiresArgs: true
		},
		'fasten' => {
			identifiers: '<strong>/fasten</strong> <em>PUBLIC_PASSWORD</em>',
			description: 'attempt to lock the current room.',
			method: _lockRoom,
			requiresArgs: true
		},
		'unfasten' => {
			identifiers: '<strong>/unfasten</strong>',
			description: 'attempt to unlock the current room.',
			method: _unlockRoom
		},
		'typesetting' => {
			identifiers: '<strong>/typesetting</strong>',
			description: 'display formatting help.',
			method: _formatHelp
		}];
		for (c in commandInfos.keys()) {
			commands.set(c, commandInfos[c].method);
		}
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
			_addMessage('unrecognized command, please try again.');
		}
	}
	//}
	
	//{ command functions
	function _getID(?arguments: Array<String>) {
		var idHttp: Http = new Http(basePath + 'api/getID');
		idHttp.onData = function(d) {
			_setID(d);
			_printID();
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
			Browser.window.location.href = arguments[0].urlEncode();
		}
		else {
			_addMessage('**/survey** requires argument: *ROOM*.');
		}
	}
	
	function _claimRoom(arguments: Array<String>) {
		if (arguments.length == 0 || arguments[0].trim() == '') {
			_addMessage('**/claim** requires argument: *ADMIN_PASSWORD*.');
			return;
		}
		var newPassword = arguments[0];
		_setAdminPassword(newPassword);
		var lockHttp: Http = new Http(basePath + 'api/claim/$room/$privateID/$newPassword');
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
	
	function _authorizeRoom(arguments: Array<String>) {
		if (arguments.length == 0 || arguments[0].trim() == '') {
			_addMessage('**/entitle** requires argument: *ADMIN_PASSWORD*.');
			return;
		}
		var newPassword = arguments[0];
		_setAdminPassword(newPassword);
		_addMessage('set admin password to: $adminPassword');
		var lockHttp: Http = new Http(basePath + 'api/claim/$room/$privateID/$newPassword');
		lockHttp.onData = function(d) {
			if(d == 'claimed') {
				_addMessage('authorized as admin for $room.');
			}
			else {
				_addMessage('incorrect admin password.');
			}
		}
		lockHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t authorize admin.');
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
		var lockHttp: Http = new Http(basePath + 'api/lock/$room/$privateID/$newPassword/$adminPassword');
		lockHttp.onData = function(d) {
			if(d == 'locked') {
				_addMessage('$room locked with password: $newPassword.');
			}
			else if (d == 'unclaimed') {
				_addMessage('$room must be claimed before locking.');
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
		var lockHttp: Http = new Http(basePath + 'api/unlock/$room/$privateID/$adminPassword');
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
	
	function _formatHelp(?args) {
		_addMessage('', null, '*italic.*');
		_addMessage('', null, '**bold.**');
		_addMessage('', null, '***bold-italic.***');
		_addMessage('', null, '#link/to.image#');
	}
	//}
	
	//{ messages
	function _parseMessages(data, hist: Bool = false ) {	
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
		if (data == 'nomongo') {
			requestInProgress = false;
			return;
		}
		if (wasLocked) {
			_addMessage('successfully unlocked.');
			wasLocked = false;
		}
		
		var parsed: MessageData = Json.parse(data);
		for (i in 0...parsed.messages.messages.length) {
			var ii = i;
			if (hist) {
				ii = parsed.messages.messages.length - 1 - i;
			}
			var p = parsed.messages.messages[ii];
			var message = _addMessage(p.text, p.id, hist);
			
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
		firstIndex = parsed.firstID != null? parsed.firstID : firstIndex;
		
		for (i in Browser.document.getElementsByClassName('imgmessage')) {
			var image: ImageElement = cast i;
			i.onclick = _openImageInNewTab.bind(image.src);
			if(!first) {
				i.onload = _tryScroll.bind(false, cast i);
			}
			else {
				i.onload = _tryScroll.bind(true);
			}
		}
		
		if (first) {
			_tryScroll(true);
		}
		
		first = false;
		
		requestInProgress = false;
		if(hist) {
			histRequestInProgress = false;
		}
	}
	
	function _tryScroll(force: Bool = false, img: ImageElement = null) {
		if (force || _atBottom(img)) {
			Browser.window.scrollTo(0, messages.scrollHeight);
			initialScroll = false;
		}
	}
	
	function _atBottom(img: ImageElement = null): Bool {
		var offset: Float = 0;
		if (img != null) {
			offset = img.height;
		}
		if ((Browser.window.innerHeight + Browser.window.scrollY + offset) >= messages.offsetHeight) { 
			return true;
		}
		return false;
	}
	
	function _addMessage(msg: String, ?id: String, ?customHTML: String, ?hist: Bool = false): DivElement {
		msg = _parseMessage(msg);
		
		var message: DivElement;
		
		var differentUser = false;
		if (!hist && (id == null || id == '-1' || id != lastUserID)) {
			differentUser = true;
		}
		
		if (differentUser) {
			message = Browser.document.createDivElement();
			message.className = 'messageblock';
			message.setAttribute('data-id', id);
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
		
		var offset: Float = 0;
		if(!hist) {
			message.appendChild(messageItem);
		}
		else {
			message = cast messages.children[1];
			var last = message.getAttribute('data-id');
			if(last == id) {
				message.insertBefore(messageItem, message.children[0]);
				offset = new JQuery(messageItem).outerHeight(true);
			}
			else {
				message = Browser.document.createDivElement();
				message.className = 'messageblock';
				message.setAttribute('data-id', id);
				
				messages.insertBefore(message, messages.children[0]);
				messages.insertBefore(_makeSpan(true, id), messages.children[0]);
				message.insertBefore(messageItem, message.children[0]);
				offset = new JQuery(message).outerHeight(true);
			}
		}
		
		if(!hist) {
			_tryScroll();
					
			lastUserID = id;
		}
		else {
			Browser.document.body.scrollTop += Std.int(offset);
		}
		
		return messageItem;
	}
	
	var imgBB: EReg = ~/(?:\[img\]|#)(.*?)(?:\[\/img\]|#)/i;
	var italicBB: EReg = ~/(?:\[i\]|\*)(.*?)(?:\[\/i\]|\*)/i;
	var boldBB: EReg = ~/(?:\[b\]|\*\*)(.*?)(?:\[\/b\]|\*\*)/i;
	var codeBB: EReg = ~/(?:\[code\]|`)(.*?)(?:\[\/code\]|`)/i;
	
	var starReplace: EReg = ~/\\*/ig;
	var hashReplace: EReg = ~/\\#/ig;
	
	function _parseMessage(raw: String): String {
		var parsed: String = raw.replace('\n', ' ');
		parsed = parsed.htmlEscape();
		parsed = parsed.replace('\"', '&quot;');
		parsed = parsed.replace(':', '&colon;');
		parsed = starReplace.replace(parsed, '&#42;');
		parsed = hashReplace.replace(parsed, '&#35;');
		trace(parsed);
		
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
						if (code == 13 && commandInfos[command].requiresArgs == true) {
							return;
						}
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
				var activeChilren = [];
				for (c in helpbox.children) {
					if (c.style.display == 'list-item') {
						activeChilren.push(c);
					}
					if (c.classList.contains('selected') && commandIndex < 0) {
						commandIndex = 0;
					}
					c.classList.remove('selected');
				}
				if (code == 40) { //DOWN
					commandIndex++;
					if (commandIndex >= activeChilren.length) {
						commandIndex = 0;
					}
				}
				else if (code == 38) { //UP
					commandIndex--;
					if (commandIndex <= -1) {
						commandIndex = activeChilren.length - 1;
					}
				}
				activeChilren[commandIndex].classList.add('selected');
				helpbox.scrollTop = activeChilren[commandIndex].offsetTop;
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
		if (Std.parseInt(id_) != null) {
			_getID();
			return;
		}
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
	
	function _setAdminPassword(password_: String) {
		adminPassword = password_;
		Cookie.set('${room}admin-password', adminPassword, 60 * 60 * 24 * 365 * 10);
	}
	//}
	
	static function main() {
		new Main();
	}	
}
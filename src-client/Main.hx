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
	var basePath: String = 'https://aqueous-basin.herokuapp.com/';
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
	
	var notification: Notification;
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
			Browser.document.title = 'slickrock.io';
			for (f in favicons) {
				f.href = 'bin/img/faviconempty.ico';
			}
			_clearNotifications();
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
		
		if (_inIframe()) {
			var maximize = Browser.document.createButtonElement();
			//maximize.textContent = '[X]';
			maximize.onclick = function() {
				Browser.window.top.location.href = 'http://slickrock.io/$room';
				maximize.classList.add('faa-passing', 'animated', 'faa-fast');
			}
			maximize.classList.add('fa', 'fa-angle-double-right', 'floatingbutton');
			Browser.document.body.appendChild(maximize);
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
				}
			}
		}
		checkValid.onError = function(e) {
			Cookie.remove('private');
			Cookie.remove('token');
			trace(e);
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
		_addMessage('#http://dummyimage.com/400x128/2b2b2b/ecf0f1/&amp;text=$data 200#', false, false);
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
			
			command.classList.add('commandTip');
			
			command.onclick = function() {
				chatbox.value = '/' + k;
				chatbox.onkeyup();
				chatbox.focus();
			}
			
			helpbox.appendChild(command);
		}
	}
	
	//{ notifications
	function _getNotificationPermission(force: Bool = false ) {
		if (force || Notification.permission == NotificationPermission.DEFAULT_) {
			var ua = Browser.window.navigator.userAgent;
			if (!~/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.match(ua)) {
				Notification.requestPermission(function(permission) { } );
			}
		}
	}
	
	function _sendNotification(text: String) {
		if (Notification.permission == NotificationPermission.GRANTED) {
			var options: NotificationOptions = { };
			options.body = 'slickrock.io/$room';
			options.icon = 'http://slickrock.io/bin/img/notification.png';
			if (notification == null) {
				numNotifications = 1;
				notification = new Notification(text, options);
			}
			else {
				_clearNotifications();
				numNotifications++;
				notification = new Notification('$numNotifications new messages.', options);
			}
			notification.onclick = function(){ 
				Browser.window.top.focus();
			};
		}
	}
	
	function _clearNotifications() {
		if(notification != null) {
			notification.close();
			notification = null;
		}
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
		'reclaim' => {
			identifiers: '<strong>/reclaim</strong> <em>NEW_ADMIN_PASSWORD</em>',
			description: 'attempt to change the admin password.',
			method: _reclaimRoom,
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
		},
		'encase' => {
			identifiers: '<strong>/encase</strong> <em>WIDTH</em> <em>HEIGHT</em>',
			description: 'generates an embedable iframe with a simple default styling.',
			method: _generateEmbed,
			requiresArgs: true
		},
		'inform' => {
			identifiers: '<strong>/inform</strong>',
			description: 'attempt to get notification permission if you denied it before.',
			method: _notificationCommand
		},
		'legal' => {
			identifiers: '<strong>/legal</strong>',
			description: 'display legal notes.',
			method: _legal
		},
		'commendation' => {
			identifiers: '<strong>/commendation</strong>',
			description: 'list some people that really deserve being listed.',
			method: _credits
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
	function _getID(?_) {
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
			if (arguments[0].charAt(0) == '/') {
				arguments[0] = arguments[0].substr(1);
			}
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
		var lockHttp: Http = new Http(basePath + 'api/claim/$room/$privateID/$newPassword');
		lockHttp.onData = function(d) {
			if(d == 'claimed') {
				_addMessage('$room claimed.');
				_setAdminPassword(newPassword);
				_addMessage('you may consider ***/fasten***-ing it at any time.');
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
	
	function _reclaimRoom(arguments: Array<String>) {
		if (arguments.length == 0 || arguments[0].trim() == '') {
			_addMessage('**/reclaim** requires argument: *NEW_ADMIN_PASSWORD*.');
			return;
		}
		var newPassword = arguments[0];
		var lockHttp: Http = new Http(basePath + 'api/claim/$room/$privateID/$adminPassword/$newPassword');
		lockHttp.onData = function(d) {
			if(d == 'claimed') {
				_addMessage('$room reclaimed.');
				_setAdminPassword(newPassword);
			}
			else {
				_addMessage('you are not authorized to reclaim $room.');
			}
		}
		lockHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t reclaim room.');
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
	
	var embedTemplate = '<iframe src="[SRC]" width="[WIDTH]" height="[HEIGHT]" style="border-color: #333333; border-style: solid;"></iframe>';
	function _generateEmbed(arguments: Array<String>) {
		if (arguments.length != 2) {
			_addMessage('**/encase** requires arguments: *WIDTH*, *HEIGHT*.');
			return;
		}
		var width = Std.parseInt(arguments[0]);
		var height = Std.parseInt(arguments[1]);
		if (width == null || height == null) {
			_addMessage('*WIDTH* and *HEIGHT* must be integer values.');
			return;
		}
		var embed = embedTemplate;
		embed = embed.replace('[SRC]', 'http://slickrock.io/$room');
		embed = embed.replace('[WIDTH]', Std.string(width));
		embed = embed.replace('[HEIGHT]', Std.string(height));
		
		_addMessage('`$embed`');
	}
	
	function _printID(?_) {
		_addMessage('*Currently impersonating*: $id');
	}
	
	function _printRoom(?_) {
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
	
	function _unlockRoom(_) {
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
		_addMessage('\\*italic.\\*');
		_addMessage('\\*\\*bold.\\*\\*');
		_addMessage('\\*\\*\\*bold-italic.\\*\\*\\*');
		_addMessage('\\`pre-formatted.\\`');
		_addMessage('\\^header\\^');
		_addMessage('\\#link/to.image (optional)[width] (optional)[height]\\#');
		_addMessage('escape markdown with \\\\*escaped\\\\*');
	}
	
	function _notificationCommand(_) {
		_getNotificationPermission(true);
	}
	
	function _legal(_) {
		_addMessage('slickrock.io is (c) 2015 Nico May.');
		_addMessage('wordlists used with permission from gfycat.com');
		_addMessage('homepage background image taken by Nicholas A. Tonelli, licensed as https://creativecommons.org/licenses/by/2.0/. Image was edited (blurred).');
	}
	
	function _credits(_) {
		_addMessage('Homepage design and general awesomeness: Lorenzo Maieru (@LorenzoMaieru).');
		_addMessage('Assorted help and testing: @dimensive, @gamesbybeta, @Zanzlanz.');
		_addMessage('Additional images: @nathanwentworth.');
		_addMessage('slickrock.io is crafted in Haxe, and the backend uses the Abe library.');
	}
	//}
	
	//{ messages
	function _parseMessages(data, hist: Bool = false ) {	
		if (data == 'locked') {
			if (token == null) {
				if(!hasTriedAuth) {
					_tryAuth();
				}
				requestInProgress = false;
				return;
			}
			if(!locked) {
				_addMessage('room is locked, please enter password.');
			}
			locked = true;
			requestInProgress = false;
			wasLocked = true;
			return;
		}
		if (data == 'password') {
			if (token == null) {
				if(!hasTriedAuth) {
					_tryAuth();
				}
				requestInProgress = false;
				return;
			}
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
			locked = false;
		}
		
		var parsed: MessageData = Json.parse(data);
		for (i in 0...parsed.messages.messages.length) {
			var ii = i;
			if (hist) {
				ii = parsed.messages.messages.length - 1 - i;
			}
			var p = parsed.messages.messages[ii];
			var message = _addMessage(p.text, p.id, hist, true, first);
			
			if (!hist && !focussed && !first) {
				Browser.document.title = '# slickrock.io';
				for (f in favicons) {
					f.href = 'bin/img/favicon.ico';
				}
				messageSound.play();
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
				typeMessage.innerHTML = '<br/>';
				
				var message: DivElement;
				message = Browser.document.createDivElement();
				message.classList.add('messageblock');
				message.setAttribute('data-id', t);
				
				var chevron = _makeSpan(true, t);
				messages.appendChild(chevron);
				messages.appendChild(message);
				
				var messageD: MessageDiv = {
					id: t,
					chevron: chevron,
					message: message
				}
				message.appendChild(typeMessage);
				Timer.delay(function() { typeMessage.classList.add('loaded'); }, 10);
				typings.push(messageD);

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
			
			if (parsed.messages.pw == null && parsed.messages.messages.length == 0) {
				_addMessage('*$room* is unclaimed, consider ***/claim***-ing it?');
			}
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
	
	function _addMessage(msg: String, ?id: String, ?customHTML: String, ?hist: Bool = false, ?safe: Bool = true, ?first: Bool = false): DivElement {
		msg = _parseMessage(msg, safe);
		
		var message: DivElement;
		
		var differentUser = false;
		if (!hist && (id == null || id == '-1' || id != lastUserID)) {
			differentUser = true;
		}
		
		if (differentUser) {
			message = Browser.document.createDivElement();
			message.classList.add('messageblock');
			message.setAttribute('data-id', id);
			lastParagraph = message;
					
			messages.appendChild(_makeSpan(differentUser, id));
			messages.appendChild(message);
		}
		else {
			message = lastParagraph;
		}
		
		var messageItem: DivElement = Browser.document.createDivElement();
		messageItem.classList.add('messageitem');
		
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
				message.classList.add('messageblock');
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
			if(!first) {
				Timer.delay(function() { messageItem.classList.add('loaded'); }, 10);
			}
			else {
				messageItem.classList.add('non-anim');
			}
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
	var headerMD: EReg = ~/\^(.*?)\^/i;
	
	function _parseMessage(raw: String, safe: Bool = true): String {
		var parsed: String = raw.replace('\n', ' ');
		if(safe) {
			parsed = parsed.htmlEscape();
			parsed = parsed.replace('\"', '&quot;');
			parsed = parsed.replace(':', '&colon;');
			parsed = parsed.replace('\\*', '&ast;');
			parsed = parsed.replace('\\#', '&num;');
			parsed = parsed.replace('\\^', '&Hat;');
			parsed = parsed.replace('\\`', '&grave;');
			parsed = parsed.replace('\\\\n', '&bsol;n');
			parsed = parsed.replace('\\\\t', '&bsol;t');
			
			parsed = parsed.replace('\\n', '<br/>');
			parsed = parsed.replace('\\t', '&nbsp;&nbsp;&nbsp;');
		}
		
		while (imgBB.match(parsed)) {
			var imgPath = imgBB.matched(1);
			var chunks = imgPath.split(' ');
			
			var imgTag: String;
			switch(chunks.length) {
				case 1:
					imgTag = '<img src="${chunks[0]}" class="imgmessage"></img>';
				case 2:
					imgTag = '<img src="${chunks[0]}" width="${chunks[1]}" class="imgmessage"></img>';
				case 3:
					imgTag = '<img src="${chunks[0]}" width="${chunks[1]}" height="${chunks[2]}" class="imgmessage"></img>';
				default:
					return '';
			}
			
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
		while (headerMD.match(parsed)) {
			var text = headerMD.matched(1);
			var preTag = '<h1>$text</h1>';
			parsed = headerMD.replace(parsed, preTag);
		}
		return parsed;
	}
	//}

	//{ message posting
	var selectedElem: LIElement = null;
	
	function _checkKeyPress(e) {
		var code = null;
		if(e != null) {
			 code = (e.keyCode != null ? e.keyCode : e.which);
		}
		
		if (chatbox.value.charAt(0) == '/') {
			if(helpbox.style.display != 'block') {
				helpbox.style.display = 'block';
				commandIndex = -1;
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
				selectedElem = cast activeChilren[commandIndex];
				helpbox.scrollTop = activeChilren[commandIndex].offsetTop;
			}
			else if(code != 13 && code != 32) {
				_filterHelp();
			}
			
			if (selectedElem != null) {	
				var command = selectedElem.getAttribute('data-command');
				trace(command);
				var replacement = '/' + command + ' ';
				if(chatbox.value.indexOf(command) == -1) {
					if (chatbox.value.charAt(chatbox.value.length - 1) == ' ' || (code != null && code == 13)) {
						trace(chatbox.value, replacement);
						
						chatbox.value = replacement;
						_filterHelp();
						if (code == 13 && commandInfos[command].requiresArgs == true) {
							return;
						}
					}
				}
			}
		}
		else {
			helpbox.style.display = 'none';
					
			if (code != 27 && !locked && token != null) {
				if (canSendTypingNotification) {
					var typingHttp: Http = new Http(basePath + 'api/typing/$room/$id');
					typingHttp.request(true);
					canSendTypingNotification = false;
					Timer.delay(function() {
						canSendTypingNotification = true;
					}, 2500);
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
					_addMessage('attempting to unlock room with: ${chatbox.value}.');
					_setPassword(chatbox.value);
					chatbox.value = '';
					helpbox.style.display = 'none';
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
	
	function _filterHelp() {
		var selected: Bool = false;
		
		for (c in helpbox.children) {
			var li: LIElement = cast c;
			
			var command = li.getAttribute('data-command');
			
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
					selectedElem = li;
					selected = true;
				}
				else {
					li.classList.remove('selected');
				}
			}
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
		if(!first) {
			Timer.delay(function() { span.classList.add('loaded'); }, 10);
		}
		else {
			span.classList.add('non-anim');
		}
		
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
	
	function _inIframe (): Bool {
		try {
			return Browser.window.self != Browser.window.top;
		} 
		catch (e: Dynamic) {
			return true;
		}
	}
	//}
	
	static function main() {
		new Main();
	}	
}
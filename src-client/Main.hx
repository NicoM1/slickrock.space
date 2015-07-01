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
import js.html.MouseEvent;
import haxe.Http;
import haxe.Json;
import js.html.Notification;
import js.html.NotificationPermission;
import js.html.NotificationOptions;

import jQuery.*;

import js.node.mongodb.ObjectID;

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
	var typings: Array<DivElement> = new Array<DivElement>();

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
	var lastChatboxValue: String = '';

	var lightTheme: Bool = false;

	function new() {
		room = untyped window.room;
		var theme = 'dark';

		if(_inIframe()) {
			theme = untyped window.roomTheme;
		}

		if(Cookie.exists('${room}_theme')) {
			theme = Cookie.get('${room}_theme');
		}

		_setTheme(theme);

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
			if (data == 'failed-image') {
				_addMessage('to prevent spam, images are disabled on this chatroom, you may ***/survey*** another chat where this restriction is not active.');
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

		Browser.document.title = '/$room.';
		Browser.window.onfocus = function() {
			focussed = true;
			Browser.document.title = '/$room.';
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
		chatbox.oninput = function(e) {
			_getNotificationPermission();
			if (token == null && !hasTriedAuth) {
				_tryAuth();
			}
		}
		chatbox.onkeyup = _checkKeyPress;

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

			var code = null;
			if(e != null) {
				 code = (e.keyCode != null ? e.keyCode : e.which);
			}

			if (code == 9 || code == 38 || code == 40) {
				e.preventDefault();
			}

			if (code == 27) {
				if (chatbox.value == '/') {
					chatbox.value = '';
					_filterHelp();
				}
			}
		}

		messages.onclick = function() {
			if (chatbox.value == '/') {
				chatbox.value = '';
				_checkKeyPress({which: 9, keyCode: 9});//hack but should work
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
		var scrollY = (lastY != null? lastY : messages.scrollTop) - messages.scrollTop;
		lastY = messages.scrollTop;

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
		_addMessage('#http://dummyimage.com/400x128/202020/ecf0f1/&amp;text=$data 200#', false, false);
	}

	function _loop() {
		Timer.delay(function() {
			_update();
			_loop();
		}, 1000);
	}

	var counter = 0;
	function _update() {
		if (requestInProgress) {
			counter++;
			if(counter > 4) {
				getHttp.cancel();
				requestInProgress = false;
			}
			else {
				return;
			}
		}
		counter = 0;
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
		'decontaminate' => {
			identifiers: '<strong>/decontaminate</strong> <em>ADMIN_PASSWORD</em>',
			description: 'nuke all messages in the current room, use only in the case of extreme spam. <strong>THERE IS NO WAY TO UNDO THIS. ALL MESSAGES ARE GONE FOREVER.</strong>',
			method: _emptyRoom
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
		'etiquette' => {
			identifiers: '<strong>/etiquette</strong>',
			description: 'display guidelines for site usage, I recommend reading these before destroying this website, thank you.',
			method: _rules
		},
		'commendation' => {
			identifiers: '<strong>/commendation</strong>',
			description: 'list some people that really deserve being listed.',
			method: _credits
		},
		'bestow' => {
			identifiers: '<strong>/bestow</strong>',
			description: 'open a page where you may donate to keep the site afloat, if you are able.',
			method: _donate
		},
		'illume' => {
			identifiers: '<strong>/illume</strong>',
			description: 'switch to light theme.',
			method: _lightTheme
		},
		'becloud' => {
			identifiers: '<strong>/becloud</strong>',
			description: 'switch to dark theme.',
			method: _darkTheme
		},
		'set_theme' => {
			identifiers: '<strong>/set_theme</strong> <em>THEME</em>',
			description: 'set the default theme, must have admin access to room.',
			method: _setDefaultTheme
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

	function _emptyRoom(args: Array<String>) {
		if(args.length == 0) {
			_addMessage('**/decontaminate** requires argument: *ADMIN_PASSWORD*, this is to ensure you understand what you are doing.');
			return;
		}
		var lockHttp: Http = new Http(basePath + 'api/empty/$room/${args[0]}');
		lockHttp.onData = function(d) {
			if(d == 'emptied') {
				_addMessage('$room emptied.');
			}
			else {
				_addMessage('you are not authorized to empty $room.');
			}
		}
		lockHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t empty room.');
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

	function _lightTheme(_) {
		Cookie.set('${room}_theme', 'light',  60 * 60 * 24 * 365 * 10);
		Browser.window.location.reload();
	}

	function _darkTheme(_) {
		Cookie.set('${room}_theme', 'dark',  60 * 60 * 24 * 365 * 10);
		Browser.window.location.reload();
	}

	function _setDefaultTheme(args: Array<String>) {
		if(args.length == 0) {
			_addMessage('**/set_theme** requires argument: *THEME*.');
			return;
		}

		var lockHttp: Http = new Http(basePath + 'api/setTheme/$room/${args[0]}/$adminPassword');
		lockHttp.onData = function(d) {
			if(d == 'themed') {
				_addMessage('default theme set to: ${args[0]}.');
				Browser.window.location.reload();
			}
			else {
				_addMessage('you are not authorized to theme $room.');
			}
		}
		lockHttp.onError = function(e) {
			trace(e);
			_addMessage('failed to connect to api, couldn\'t theme room.');
		}

		lockHttp.request(true);
	}

	function _legal(_) {
		_addMessage('slickrock.io is (c) 2015 Nico May.');
		_addMessage('wordlists used with permission from gfycat.com');
	}

	function _credits(_) {
		_addMessage('Homepage design and general awesomeness: **Lorenzo Maieru** *(@LorenzoMaieru)*.');
		_addMessage('Assorted help and testing: **Mark Kowalsky** *(@dimensive)*, **Isaac Bickel** *(@gamesbybeta)*, **Alex Lanzetta** *(@Zanzlanz)*.');
		_addMessage('Additional images: **Nathan Wentworth** *(@nathanwentworth)*.');
		_addMessage('slickrock.io is crafted in **Haxe**, the backend is helped by the **Abe** library *(github.com/abedev/abe)*.');
	}

	function _rules(_) {
		_addMessage('slickrock.io is not meant to allow people to say or show horrible things.');
		_addMessage('should your intention in coming to this site be to say or show inappropriate things, please go somewhere else, there are plenty of well established dirty corners of the internet, this doesn\'t need to become one.');
		_addMessage('rooms, especially public ones, displaying content deemed unacceptable, under my own personal judgment, will be removed.');
		_addMessage('should the content of these rooms warrant it, your IP address will be reported to the proper authorities, you have been warned.');
		_addMessage('apologies for that, to all the genuine users of this site, I hope you enjoy it, and don\'t worry about subtle things like swear words or the like, but if it seems like you should make something private, preferably make it private.');
		_addMessage('thank you, and enjoy the site.');
	}

	function _donate(_) {
		_openInNewTab('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=nico%2emay99%40gmail%2ecom&lc=CA&item_name=slickrock%2eio&currency_code=CAD&bn=PP%2dDonationsBF%3a%26text%3ddonate%2e%3aNonHosted');
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
			var message = _addMessage(p.text, p.id, hist, true, first,p._id);

			if (!hist && !focussed && !first) {
				Browser.document.title = '# /$room.';
				for (f in favicons) {
					f.href = 'bin/img/favicon.ico';
				}
				messageSound.play();
				_sendNotification(message.innerText != null? message.innerText : message.textContent);
			}
		}

		for (t in typings) {
			messages.removeChild(t);
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
				message.appendChild(chevron);
				messages.appendChild(message);

				message.appendChild(typeMessage);
				Timer.delay(function() { typeMessage.classList.add('loaded'); }, 10);
				typings.push(message);

				_tryScroll();
			}
		}

		lastIndex = parsed.lastID;
		firstIndex = parsed.firstID != null? parsed.firstID : firstIndex;

		for (i in Browser.document.getElementsByClassName('imgmessage')) {
			var image: ImageElement = cast i;
			i.onclick = _openInNewTab.bind(image.src);
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
			messages.scrollTop = messages.scrollHeight;
			initialScroll = false;
		}
	}

	function _atBottom(img: ImageElement = null): Bool {
		var offset: Float = 0;
		if (img != null) {
			offset = img.height;
		}
		if (messages.scrollTop + offset >= (messages.scrollHeight-messages.offsetHeight)) {
			return true;
		}
		return false;
	}

	function _addMessage(msg: String, ?id: String, ?customHTML: String, ?hist: Bool = false, ?safe: Bool = true, ?first: Bool = false, ?_id: String): DivElement {
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

			message.appendChild(_makeSpan(differentUser, id));
			messages.appendChild(message);
		}
		else {
			message = lastParagraph;
		}

		var messageItem: DivElement = Browser.document.createDivElement();
		messageItem.classList.add('messageitem');

		messageItem.setAttribute('data-objectid', _id);

		if(_id != null) {
			messageItem.onclick = _tryDeleteMessage.bind(_, _id);
		}

		messageItem.innerHTML = customHTML==null? msg : customHTML;

		var offset: Float = 0;
		if(!hist) {
			message.appendChild(messageItem);
		}
		else {
			message = cast messages.children[1];
			var last = message.getAttribute('data-id');
			if(last == id) {
				message.insertBefore(messageItem, message.children[1]);
				offset = new JQuery(messageItem).outerHeight(true);
			}
			else {
				message = Browser.document.createDivElement();
				message.classList.add('messageblock');
				message.setAttribute('data-id', id);

				messages.insertBefore(message, messages.children[0]);
				message.appendChild(_makeSpan(true, id));
				message.insertBefore(messageItem, message.children[1]);
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
			messages.scrollTop += Std.int(offset);
			messageItem.classList.add('non-anim');
		}

		return messageItem;
	}

	function _setTheme(theme: String) {
		switch(theme) {
			case 'light':
				var lightCss: LinkElement = Browser.document.createLinkElement();
				lightCss.rel = 'stylesheet';
				lightCss.type = 'text/css';
				lightCss.href = 'bin/css/clientstyle_light.css';
				Browser.document.head.appendChild(lightCss);
				lightTheme = true;
			default:
			for (css in Browser.document.head.getElementsByTagName('link')) {
				var link: LinkElement = cast css;
				if(link.href.indexOf('_light') != -1) {
					Browser.document.head.removeChild(link);
					break;
				}
			}
		}
	}

	function _tryDeleteMessage(e: MouseEvent, id: String) {
		if(e.ctrlKey && e.shiftKey && e.altKey) {
			var lockHttp: Http = new Http(basePath + 'api/deleteMessage/$room/$adminPassword/$id');
			lockHttp.onData = function(d) {
				if(d == 'deleted') {
					_addMessage('message deleted.');
				}
				else {
					_addMessage('you are not authorized to moderate $room.');
				}
			}
			lockHttp.onError = function(e) {
				trace(e);
				_addMessage('failed to connect to api, couldn\'t delete message.');
			}

			lockHttp.request(true);
		}
	}

	var imgBB: EReg = ~/(?:\[img\]|#)(.*?)(?:\[\/img\]|#)/i;
	var italicBB: EReg = ~/(?:\[i\]|\*)(.*?)(?:\[\/i\]|\*)/i;
	var boldBB: EReg = ~/(?:\[b\]|\*\*)(.*?)(?:\[\/b\]|\*\*)/i;
	var codeBB: EReg = ~/(?:\[code\]|`)(.*?)(?:\[\/code\]|`)/i;
	var headerMD: EReg = ~/\^(.*?)\^/i;
	var sitelink: EReg = ~/ \/[^\s]+?( |$)/i;

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

		/*while (sitelink.match(parsed)) {
			var link = sitelink.matched(0).substr(1);
			link = '&sol;' + link;
			parsed = sitelink.replace(parsed, ' <a href="slickrock.io$link>$link</a>');
		}*/

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
				var replacement = '/' + command + ' ';
				if(chatbox.value.indexOf(command) == -1) {
					if (chatbox.value.charAt(chatbox.value.length - 1) == ' ' || (code != null && (code == 13 || code == 9))) {
						trace(chatbox.value, replacement);

						chatbox.value = replacement;
						_filterHelp();
						if ((code == 13 || code == 9) && commandInfos[command].requiresArgs == true) {
							chatbox.focus();
							return;
						}
					}
				}
			}
		}
		else {
			helpbox.style.display = 'none';

			if (!locked && token != null) {
				if (canSendTypingNotification) {
					if(chatbox.value != lastChatboxValue) {
						var typingHttp: Http = new Http(basePath + 'api/typing/$room/$id');
						typingHttp.request(true);
						canSendTypingNotification = false;
						Timer.delay(function() {
							canSendTypingNotification = true;
						}, 2500);
					}
					lastChatboxValue = chatbox.value;
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
	function _openInNewTab(src: String) {
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
		var max: Float = 0.5;
		var min: Float = 0.3;
		if(lightTheme) {
			max = 0.4;
			min = 0.2;
		}
		var hsl: Hsl;
		if (id != null && id != '-1') {
			var intID = 0;
			for (i in 0...id.length) {
				var s = id.charCodeAt(i);
				intID += s;
			}
			var hue = new Random(intID * 12189234).float(0, 360);
			var sat = new Random(intID * 12189234).float(0.7, 1.0);
			var light = new Random(intID * 12189234).float(min, max);
			hsl = Hsl.create(hue, sat, light);

			if (!lightTheme && dark) {
				hsl = hsl.darker(1-max);
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

	function _inIframe(): Bool {
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

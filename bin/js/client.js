(function (console) { "use strict";
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var DateTools = function() { };
DateTools.__name__ = true;
DateTools.delta = function(d,t) {
	var t1 = d.getTime() + t;
	var d1 = new Date();
	d1.setTime(t1);
	return d1;
};
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
EReg.__name__ = true;
EReg.prototype = {
	match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw new js__$Boot_HaxeError("EReg::matched");
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
};
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = function() { };
Lambda.__name__ = true;
Lambda.exists = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(f(x)) return true;
	}
	return false;
};
var List = function() {
	this.length = 0;
};
List.__name__ = true;
List.prototype = {
	iterator: function() {
		return new _$List_ListIterator(this.h);
	}
};
var _$List_ListIterator = function(head) {
	this.head = head;
	this.val = null;
};
_$List_ListIterator.__name__ = true;
_$List_ListIterator.prototype = {
	hasNext: function() {
		return this.head != null;
	}
	,next: function() {
		this.val = this.head[0];
		this.head = this.head[1];
		return this.val;
	}
};
var Main = function() {
	this.selectedElem = null;
	this.headerMD = new EReg("\\^(.*?)\\^","i");
	this.quoteMD = new EReg("(?:~)(.*?)(?:~)(.*?)(?: ?)","i");
	this.codeBB = new EReg("(?:\\[code\\]|`)(.*?)(?:\\[/code\\]|`)","i");
	this.boldBB = new EReg("(?:\\[b\\]|\\*\\*)(.*?)(?:\\[/b\\]|\\*\\*)","i");
	this.italicBB = new EReg("(?:\\[i\\]|\\*)(.*?)(?:\\[/i\\]|\\*)","i");
	this.imgBB = new EReg("(?:\\[img\\]|#)(.*?)(?:\\[/img\\]|#)","i");
	this.embedTemplate = "<iframe src=\"[SRC]\" width=\"[WIDTH]\" height=\"[HEIGHT]\" style=\"border-color: #333333; border-style: solid;\"></iframe>";
	this.counter = 0;
	this.alphanumeric = "0123456789abcdefghijklmnopqrstuvwxyz";
	this.mouseDown = false;
	this.v = 0;
	this.systemMessage = "";
	this.ios = false;
	this.lightTheme = false;
	this.lastChatboxValue = "";
	this.lastY = null;
	this.commandIndex = -1;
	this.sendLast = false;
	this.lastMessage = "";
	this.commands = new haxe_ds_StringMap();
	this.numNotifications = 0;
	this.canSendTypingNotification = true;
	this.wasLocked = false;
	this.hasTriedAuth = false;
	this.locked = false;
	this.focussed = true;
	this.initialScroll = true;
	this.first = true;
	this.parsingSystemMessage = false;
	this.histRequestInProgress = false;
	this.requestInProgress = false;
	this.typings = [];
	this.lastUserID = "-2";
	this.firstIndex = -1;
	this.lastIndex = -1;
	this.adminPassword = "-1";
	this.password = null;
	this.token = null;
	this.id = null;
	this.basePath = "https://aqueous-basin.herokuapp.com/";
	this.room = window.room;
	var theme = "dark";
	if(new EReg("iPad|iPhone|iPod","ig").match(window.navigator.userAgent)) this.ios = true;
	if(this._inIframe()) theme = window.roomTheme;
	if(js_Cookie.exists("" + this.room + "_theme")) theme = js_Cookie.get("" + this.room + "_theme");
	this._setTheme(theme);
	this._buildCommands();
	window.onload = $bind(this,this._windowLoaded);
};
Main.__name__ = true;
Main.main = function() {
	new Main();
};
Main.prototype = {
	_windowLoaded: function() {
		var _g = this;
		this.chatbox = window.document.getElementById("chatbox");
		this.messages = window.document.getElementById("messages");
		this.helpbox = window.document.getElementById("helpbox");
		this.chevron = window.document.getElementById("chevron");
		this.favicons = [];
		var _g1 = 0;
		var _g11 = window.document.getElementsByClassName("favicon");
		while(_g1 < _g11.length) {
			var f = _g11[_g1];
			++_g1;
			this.favicons.push(f);
		}
		this.messageSound = window.document.getElementById("messagesound");
		if(!(this.ios && this._inIframe())) {
			this.authHttp = new haxe_Http(this.basePath);
			this.authHttp.onData = $bind(this,this._getAuth);
			this.authHttp.onError = function(error) {
				haxe_Log.trace(error,{ fileName : "Main.hx", lineNumber : 149, className : "Main", methodName : "_windowLoaded"});
				_g._addMessage("Could not connect to authentication api, please refresh the page.");
			};
			this.getHttp = new haxe_Http(this.basePath + this.lastIndex);
			this.getHttp.onData = (function(f1,a2) {
				return function(a1) {
					f1(a1,a2);
				};
			})($bind(this,this._parseMessages),false);
			this.getHttp.onError = function(error1) {
				haxe_Log.trace(error1,{ fileName : "Main.hx", lineNumber : 156, className : "Main", methodName : "_windowLoaded"});
				_g.requestInProgress = false;
			};
			this.postHttp = new haxe_Http(this.basePath);
			this.postHttp.async = true;
			this.postHttp.onData = function(data) {
				if(data == "failed") {
					_g.token = null;
					_g.hasTriedAuth = false;
					_g.sendLast = true;
					_g._tryAuth();
				}
				if(data == "failed-image") _g._addMessage("to prevent spam, images are disabled on this chatroom, you may ***/survey*** another chat where this restriction is not active.");
			};
			this.postHttp.onError = function(error2) {
				haxe_Log.trace(error2,{ fileName : "Main.hx", lineNumber : 174, className : "Main", methodName : "_windowLoaded"});
				_g.requestInProgress = false;
			};
			window.document.title = "/" + this.room + ".";
			window.onfocus = function() {
				_g.focussed = true;
				window.document.title = "/" + _g.room + ".";
				var _g12 = 0;
				var _g2 = _g.favicons;
				while(_g12 < _g2.length) {
					var f2 = _g2[_g12];
					++_g12;
					f2.href = "bin/img/faviconempty.ico";
				}
				_g._clearNotifications();
			};
			window.onblur = function() {
				_g.focussed = false;
			};
			window.document.body.onscroll = $bind(this,this._tryGetOldMessages);
			window.document.body.onmousedown = function() {
				_g.mouseDown = true;
			};
			window.document.body.onmouseup = function() {
				_g.mouseDown = false;
			};
			this._setupHelpbox();
			this.chatbox.onclick = function() {
				_g._getNotificationPermission();
				if(_g.token == null && !_g.hasTriedAuth) _g._tryAuth();
			};
			this.chatbox.oninput = function(e) {
				_g._getNotificationPermission();
				if(_g.token == null && !_g.hasTriedAuth) _g._tryAuth();
			};
			this.chatbox.onkeyup = $bind(this,this._checkKeyPress);
			this.chatbox.onmousedown = function() {
				if(_g.chatbox.classList.contains("helptip")) {
					_g.chatbox.classList.remove("helptip");
					_g.chatbox.value = "";
				}
			};
			this.chatbox.ontouchstart = function() {
				if(_g.chatbox.classList.contains("helptip")) {
					_g.chatbox.classList.remove("helptip");
					_g.chatbox.value = "";
				}
			};
			this.chatbox.onkeydown = function(e1) {
				if(_g.chatbox.classList.contains("helptip")) {
					_g.chatbox.classList.remove("helptip");
					_g.chatbox.value = "";
				}
				var code = null;
				if(e1 != null) if(e1.keyCode != null) code = e1.keyCode; else code = e1.which;
				if(code == 9 || code == 38 || code == 40) e1.preventDefault();
				if(code == 27) {
					if(_g.chatbox.value == "/") {
						_g.chatbox.value = "";
						_g._filterHelp();
					}
				}
			};
			this.messages.onclick = function() {
				if(_g.chatbox.value == "/") {
					_g.chatbox.value = "";
					_g._checkKeyPress({ which : 9, keyCode : 9});
				}
			};
			if(this._inIframe()) {
				var maximize;
				var _this = window.document;
				maximize = _this.createElement("button");
				maximize.onclick = function() {
					window.top.location.href = "http://slickrock.io/" + _g.room;
					maximize.classList.add("faa-passing","animated","faa-fast");
				};
				maximize.classList.add("fa","fa-angle-double-right","floatingbutton");
				window.document.body.appendChild(maximize);
			}
			if(!js_Cookie.exists("id")) this._getID(); else this._setID(js_Cookie.get("id"));
			if(js_Cookie.exists("" + this.room + "-password")) this._setPassword(js_Cookie.get("" + this.room + "-password"));
			if(js_Cookie.exists("" + this.room + "admin-password")) this._setAdminPassword(js_Cookie.get("" + this.room + "admin-password"));
			this._setupPrivateID();
			this._loop();
		} else this._addMessage("",null,"embedded chatrooms are unreliable in iOS, please view this chat directly on <a target=\"_blank\" href=\"http://slickrock.io/" + this.room + "\">slickrock.io/" + this.room + "</a>.");
	}
	,_tryExpandImages: function(e,img) {
		if(e.altKey) {
			var orig = Std.parseInt(img.style.width);
			img.style.width = Std.string((orig != null?orig:500) + e.movementX) + "px";
		}
	}
	,_tryGetOldMessages: function(args) {
		var _g = this;
		if(this.histRequestInProgress || this.initialScroll) return;
		var scrollY;
		scrollY = (this.lastY != null?this.lastY:window.pageYOffset) - window.pageYOffset;
		this.lastY = window.pageYOffset;
		if(this.lastY < 500) {
			if(this.firstIndex > 0) {
				var histHttp = new haxe_Http(this.basePath);
				histHttp.onError = function(e) {
					_g.histRequestInProgress = false;
					haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 318, className : "Main", methodName : "_tryGetOldMessages"});
				};
				histHttp.onData = (function(f,a2) {
					return function(a1) {
						f(a1,a2);
					};
				})($bind(this,this._parseMessages),true);
				if(this.password == null) histHttp.url = this.basePath + "api/hist/" + this.room + "/" + this.lastIndex + "/" + this.firstIndex; else histHttp.url = this.basePath + "api/hist/" + this.room + "/" + this.password + "/" + this.lastIndex + "/" + this.firstIndex;
				this.histRequestInProgress = true;
				histHttp.request(true);
			}
		}
	}
	,_setupPrivateID: function() {
		if(!js_Cookie.exists("private")) {
			var rand = new Random(new Date().getTime());
			var newPrivate = "";
			while(newPrivate.length <= 40) newPrivate += this.alphanumeric.charAt(rand["int"](this.alphanumeric.length,null));
			this.privateID = newPrivate;
			js_Cookie.set("private",newPrivate,315360000);
		} else {
			this.privateID = js_Cookie.get("private");
			this.token = js_Cookie.get("token");
			if(this.token != null) this._checkValid();
		}
	}
	,_setToken: function(_token) {
		this.token = _token;
		this._checkValid(true);
		if(this.token != null) js_Cookie.set("token",this.token,315360000);
	}
	,_checkValid: function(printValid) {
		if(printValid == null) printValid = false;
		var _g = this;
		this._request(this.basePath + ("api/checkvalid/" + this.privateID + "/" + this.token),function(d) {
			if(d == "invalid") {
				_g.token = null;
				_g._tryAuth();
				return;
			} else if(printValid) {
				_g._addMessage("authentication successful, chat away.");
				_g.hasTriedAuth = false;
			}
		},function(e) {
			js_Cookie.remove("private");
			js_Cookie.remove("token");
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 380, className : "Main", methodName : "_checkValid"});
			_g._addMessage("an error occured getting authentication, please refresh the page.");
		});
	}
	,_tryAuth: function() {
		this.authHttp.url = this.basePath + ("api/gettoken/" + this.privateID);
		this.authHttp.request(true);
		this.hasTriedAuth = true;
	}
	,_getAuth: function(data) {
		this._addMessage("please enter the following to authenticate.");
		this._addMessage("#http://dummyimage.com/400x128/202020/ecf0f1/&amp;text=" + data + " 200#",null,null,false,false);
	}
	,_loop: function() {
		var _g = this;
		haxe_Timer.delay(function() {
			_g._update();
			_g._loop();
		},1000);
	}
	,_update: function() {
		if(this.requestInProgress) {
			this.counter++;
			if(this.counter > 4) {
				this.getHttp.cancel();
				this.requestInProgress = false;
			} else return;
		}
		this.counter = 0;
		if(this.password == null) this.getHttp.url = this.basePath + "api/" + this.room + "/" + this.lastIndex; else this.getHttp.url = this.basePath + "api/" + this.room + "/" + this.password + "/" + this.lastIndex;
		this.requestInProgress = true;
		this.getHttp.request(true);
	}
	,_setupHelpbox: function() {
		var _g = this;
		var $it0 = this.commandInfos.keys();
		while( $it0.hasNext() ) {
			var k = $it0.next();
			var k1 = [k];
			var c = this.commandInfos.get(k1[0]);
			var command;
			var _this = window.document;
			command = _this.createElement("li");
			var identDiv;
			var _this1 = window.document;
			identDiv = _this1.createElement("div");
			var descDiv;
			var _this2 = window.document;
			descDiv = _this2.createElement("div");
			identDiv.classList.add("command");
			identDiv.innerHTML = c.identifiers;
			descDiv.classList.add("description");
			descDiv.innerHTML = c.description;
			command.appendChild(identDiv);
			command.appendChild(descDiv);
			command.setAttribute("data-command",k1[0]);
			command.classList.add("commandTip");
			command.onclick = (function(k1) {
				return function() {
					_g.chatbox.value = "/" + k1[0];
					_g.chatbox.onkeyup();
					_g.chatbox.focus();
				};
			})(k1);
			this.helpbox.appendChild(command);
		}
	}
	,_getNotificationPermission: function(force) {
		if(force == null) force = false;
		if(typeof(Notification) == "undefined") return;
		if(force || Notification.permission == "default") {
			var ua = window.navigator.userAgent;
			if(!new EReg("Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile","i").match(ua)) Notification.requestPermission(function(permission) {
			});
		}
	}
	,_sendNotification: function(text) {
		if(typeof(Notification) == "undefined") return;
		if(Notification.permission == "granted") {
			var options = { };
			options.body = "slickrock.io/" + this.room;
			options.icon = "http://slickrock.io/bin/img/notification.png";
			if(this.notification == null) {
				this.numNotifications = 1;
				this.notification = new Notification(text,options);
			} else {
				this._clearNotifications();
				this.numNotifications++;
				this.notification = new Notification("" + this.numNotifications + " new messages.",options);
			}
			this.notification.onclick = function() {
				window.top.focus();
			};
		}
	}
	,_clearNotifications: function() {
		if(this.notification != null) {
			this.notification.close();
			this.notification = null;
		}
	}
	,_buildCommands: function() {
		var _g = new haxe_ds_StringMap();
		_g.set("revivify",{ identifiers : "<strong>/revivify</strong>", description : "regenerate your ID, giving you a new color.", method : $bind(this,this._getID)});
		_g.set("oneself",{ identifiers : "<strong>/oneself</strong>", description : "print your current ID.", method : $bind(this,this._printID)});
		_g.set("impersonate",{ identifiers : "<strong>/impersonate</strong> <em>ID</em>", description : "set your ID explicitly, allows you to have all your devices share ID, or steal someone else's;).", method : $bind(this,this._setIDCommand), requiresArgs : true});
		_g.set("existent",{ identifiers : "<strong>/existent</strong>", description : "print the chat room you are currently in.", method : $bind(this,this._printRoom)});
		_g.set("survey",{ identifiers : "<strong>/survey</strong> <em>ROOM</em>", description : "move to a different chat room.", method : $bind(this,this._changeRoom), requiresArgs : true});
		_g.set("claim",{ identifiers : "<strong>/claim</strong> <em>ADMIN_PASSWORD</em>", description : "attempt to take ownership of the current room.", method : $bind(this,this._claimRoom), requiresArgs : true});
		_g.set("reclaim",{ identifiers : "<strong>/reclaim</strong> <em>NEW_ADMIN_PASSWORD</em>", description : "attempt to change the admin password.", method : $bind(this,this._reclaimRoom), requiresArgs : true});
		_g.set("entitle",{ identifiers : "<strong>/entitle</strong> <em>ADMIN_PASSWORD</em>", description : "attempt to take authorize youself as admin of the current room.", method : $bind(this,this._authorizeRoom), requiresArgs : true});
		_g.set("fasten",{ identifiers : "<strong>/fasten</strong> <em>PUBLIC_PASSWORD</em>", description : "attempt to lock the current room.", method : $bind(this,this._lockRoom), requiresArgs : true});
		_g.set("unfasten",{ identifiers : "<strong>/unfasten</strong>", description : "attempt to unlock the current room.", method : $bind(this,this._unlockRoom)});
		_g.set("decontaminate",{ identifiers : "<strong>/decontaminate</strong> <em>ADMIN_PASSWORD</em>", description : "nuke all messages in the current room, use only in the case of extreme spam. <strong>THERE IS NO WAY TO UNDO THIS. ALL MESSAGES ARE GONE FOREVER.</strong>", method : $bind(this,this._emptyRoom)});
		_g.set("typesetting",{ identifiers : "<strong>/typesetting</strong>", description : "display formatting help.", method : $bind(this,this._formatHelp)});
		_g.set("encase",{ identifiers : "<strong>/encase</strong> <em>WIDTH</em> <em>HEIGHT</em>", description : "generates an embedable iframe with a simple default styling.", method : $bind(this,this._generateEmbed), requiresArgs : true});
		_g.set("inform",{ identifiers : "<strong>/inform</strong>", description : "attempt to get notification permission if you denied it before.", method : $bind(this,this._notificationCommand)});
		_g.set("legal",{ identifiers : "<strong>/legal</strong>", description : "display legal notes.", method : $bind(this,this._legal)});
		_g.set("etiquette",{ identifiers : "<strong>/etiquette</strong>", description : "display guidelines for site usage, I recommend reading these before destroying this website, thank you.", method : $bind(this,this._rules)});
		_g.set("commendation",{ identifiers : "<strong>/commendation</strong>", description : "list some people that really deserve being listed.", method : $bind(this,this._credits)});
		_g.set("bestow",{ identifiers : "<strong>/bestow</strong>", description : "open a page where you may donate to keep the site afloat, if you are able.", method : $bind(this,this._donate)});
		_g.set("illume",{ identifiers : "<strong>/illume</strong>", description : "switch to light theme.", method : $bind(this,this._lightTheme)});
		_g.set("becloud",{ identifiers : "<strong>/becloud</strong>", description : "switch to dark theme.", method : $bind(this,this._darkTheme)});
		_g.set("set_theme",{ identifiers : "<strong>/set_theme</strong> <em>THEME</em>", description : "set the default theme, must have admin access to room.", method : $bind(this,this._setDefaultTheme)});
		_g.set("system_message",{ identifiers : "<strong>/system_message</strong>", description : "begins or ends setting a series of messages to be displayed on first entry to room.", method : $bind(this,this._systemMessage)});
		_g.set("submit_system_message",{ identifiers : "<strong>/submit_system_message</strong>", description : "sends your recently set system message to the server, redo and resend to change.", method : $bind(this,this._submitSystemMessage)});
		this.commandInfos = _g;
		var $it0 = this.commandInfos.keys();
		while( $it0.hasNext() ) {
			var c = $it0.next();
			var value = this.commandInfos.get(c).method;
			this.commands.set(c,value);
		}
	}
	,_parseCommand: function(commandString) {
		var firstSpace = commandString.indexOf(" ");
		var command;
		if(firstSpace != -1) {
			command = StringTools.trim(commandString.substring(0,firstSpace));
			var args = StringTools.trim(commandString.substring(firstSpace)).split(" ");
			var _g1 = 0;
			var _g = args.length;
			while(_g1 < _g) {
				var i = _g1++;
				args[i] = StringTools.trim(args[i]);
			}
			this._callCommand(command,args);
		} else this._callCommand(StringTools.trim(commandString));
	}
	,_callCommand: function(command,args) {
		if(this.commands.exists(command)) this.commands.get(command)(args); else this._addMessage("unrecognized command, please try again.");
	}
	,_getID: function(_) {
		var _g = this;
		this._request(this.basePath + "api/getID",function(d) {
			_g._setID(d);
			_g._printID();
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 663, className : "Main", methodName : "_getID"});
			_g._addMessage("failed to connect to api, couldn't get ID.");
		});
	}
	,_setIDCommand: function($arguments) {
		if($arguments != null && $arguments[0] != null && $arguments[0] != "") {
			var newID = $arguments[0];
			if(newID != null) this._setID(newID); else this._addMessage("Could not parse argument: *ID*.");
		} else this._addMessage("**/impersonate** requires argument: *ID*.");
	}
	,_changeRoom: function($arguments) {
		if($arguments != null && $arguments[0] != null && $arguments[0] != "") {
			if($arguments[0].charAt(0) == "/") $arguments[0] = HxOverrides.substr($arguments[0],1,null);
			window.location.href = encodeURIComponent($arguments[0]);
		} else this._addMessage("**/survey** requires argument: *ROOM*.");
	}
	,_claimRoom: function($arguments) {
		var _g = this;
		if($arguments.length == 0 || StringTools.trim($arguments[0]) == "") {
			this._addMessage("**/claim** requires argument: *ADMIN_PASSWORD*.");
			return;
		}
		var newPassword = $arguments[0];
		this._request(this.basePath + ("api/claim/" + this.room + "/" + this.privateID + "/" + newPassword),function(d) {
			if(d == "claimed") {
				_g._addMessage("" + _g.room + " claimed.");
				_g._setAdminPassword(newPassword);
				_g._addMessage("you may consider ***/fasten***-ing it at any time.");
			} else _g._addMessage("you are not authorized to claim " + _g.room + ".");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 715, className : "Main", methodName : "_claimRoom"});
			_g._addMessage("failed to connect to api, couldn't claim room.");
		});
	}
	,_reclaimRoom: function($arguments) {
		var _g = this;
		if($arguments.length == 0 || StringTools.trim($arguments[0]) == "") {
			this._addMessage("**/reclaim** requires argument: *NEW_ADMIN_PASSWORD*.");
			return;
		}
		var newPassword = $arguments[0];
		this._request(this.basePath + ("api/claim/" + this.room + "/" + this.privateID + "/" + this.adminPassword + "/" + newPassword),function(d) {
			if(d == "claimed") {
				_g._addMessage("" + _g.room + " reclaimed.");
				_g._setAdminPassword(newPassword);
			} else _g._addMessage("you are not authorized to reclaim " + _g.room + ".");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 739, className : "Main", methodName : "_reclaimRoom"});
			_g._addMessage("failed to connect to api, couldn't reclaim room.");
		});
	}
	,_authorizeRoom: function($arguments) {
		var _g = this;
		if($arguments.length == 0 || StringTools.trim($arguments[0]) == "") {
			this._addMessage("**/entitle** requires argument: *ADMIN_PASSWORD*.");
			return;
		}
		var newPassword = $arguments[0];
		this._setAdminPassword(newPassword);
		this._addMessage("set admin password to: " + this.adminPassword);
		this._request(this.basePath + ("api/claim/" + this.room + "/" + this.privateID + "/" + newPassword),function(d) {
			if(d == "claimed") _g._addMessage("authorized as admin for " + _g.room + "."); else _g._addMessage("incorrect admin password.");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 764, className : "Main", methodName : "_authorizeRoom"});
			_g._addMessage("failed to connect to api, couldn't authorize admin.");
		});
	}
	,_generateEmbed: function($arguments) {
		if($arguments.length != 2) {
			this._addMessage("**/encase** requires arguments: *WIDTH*, *HEIGHT*.");
			return;
		}
		var width = Std.parseInt($arguments[0]);
		var height = Std.parseInt($arguments[1]);
		if(width == null || height == null) {
			this._addMessage("*WIDTH* and *HEIGHT* must be integer values.");
			return;
		}
		var embed = this.embedTemplate;
		embed = StringTools.replace(embed,"[SRC]","//aqueous-basin.herokuapp.com/" + this.room);
		embed = StringTools.replace(embed,"[WIDTH]",width == null?"null":"" + width);
		embed = StringTools.replace(embed,"[HEIGHT]",height == null?"null":"" + height);
		this._addMessage("embed code:");
		this._addMessage("`" + embed + "`");
		this._addMessage("note: due to issues with Apple Webkit, embedded chats will not work properly on iOS. instead, your users will be greeted with a similar expanation, and a direct link to your chatroom.");
	}
	,_printID: function(_) {
		this._addMessage("*Currently impersonating*: " + this.id);
	}
	,_printRoom: function(_) {
		this._addMessage("*Currently in*: " + this.room);
	}
	,_lockRoom: function($arguments) {
		var _g = this;
		if($arguments.length == 0 || StringTools.trim($arguments[0]) == "") {
			this._addMessage("**/fasten** requires argument: *PASSWORD*.");
			return;
		}
		var newPassword = $arguments[0];
		this._setPassword(newPassword);
		this._request(this.basePath + ("api/lock/" + this.room + "/" + this.privateID + "/" + newPassword + "/" + this.adminPassword),function(d) {
			if(d == "locked") _g._addMessage("" + _g.room + " locked with password: " + newPassword + "."); else if(d == "unclaimed") _g._addMessage("" + _g.room + " must be claimed before locking."); else _g._addMessage("you are not authorized to lock " + _g.room + ".");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 821, className : "Main", methodName : "_lockRoom"});
			_g._addMessage("failed to connect to api, couldn't lock room.");
		});
	}
	,_unlockRoom: function(_) {
		var _g = this;
		this._request(this.basePath + ("api/unlock/" + this.room + "/" + this.privateID + "/" + this.adminPassword),function(d) {
			if(d == "unlocked") _g._addMessage("" + _g.room + " unlocked."); else _g._addMessage("you are not authorized to unlock " + _g.room + ".");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 838, className : "Main", methodName : "_unlockRoom"});
			_g._addMessage("failed to connect to api, couldn't unlock room.");
		});
	}
	,_emptyRoom: function(args) {
		var _g = this;
		if(args.length == 0) {
			this._addMessage("**/decontaminate** requires argument: *ADMIN_PASSWORD*, this is to ensure you understand what you are doing.");
			return;
		}
		this._request(this.basePath + ("api/empty/" + this.room + "/" + args[0]),function(d) {
			if(d == "emptied") _g._addMessage("" + _g.room + " emptied."); else _g._addMessage("you are not authorized to empty " + _g.room + ".");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 860, className : "Main", methodName : "_emptyRoom"});
			_g._addMessage("failed to connect to api, couldn't empty room.");
		});
	}
	,_formatHelp: function(args) {
		this._addMessage("\\*italic.\\*");
		this._addMessage("\\*\\*bold.\\*\\*");
		this._addMessage("\\*\\*\\*bold-italic.\\*\\*\\*");
		this._addMessage("\\`pre-formatted.\\`");
		this._addMessage("\\^header\\^");
		this._addMessage("\\#link/to.image (optional)[width] (optional)[height]\\#");
		this._addMessage("escape markdown with \\\\*escaped\\\\*");
	}
	,_notificationCommand: function(_) {
		this._getNotificationPermission(true);
	}
	,_lightTheme: function(_) {
		js_Cookie.set("" + this.room + "_theme","light",315360000);
		window.location.reload();
	}
	,_darkTheme: function(_) {
		js_Cookie.set("" + this.room + "_theme","dark",315360000);
		window.location.reload();
	}
	,_setDefaultTheme: function(args) {
		var _g = this;
		if(args.length == 0) {
			this._addMessage("**/set_theme** requires argument: *THEME*.");
			return;
		}
		this._request(this.basePath + ("api/setTheme/" + this.room + "/" + args[0] + "/" + this.adminPassword),function(d) {
			if(d == "themed") {
				_g._addMessage("default theme set to: " + args[0] + ".");
				window.location.reload();
			} else _g._addMessage("you are not authorized to theme " + _g.room + ".");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 907, className : "Main", methodName : "_setDefaultTheme"});
			_g._addMessage("failed to connect to api, couldn't theme room.");
		});
	}
	,_systemMessage: function(_) {
		if(!this.parsingSystemMessage) {
			this.parsingSystemMessage = true;
			this.systemMessage = "";
			this._addMessage("began parsing system message, all messages untill another call to /system_message will be added to a buffer shown at first visit.");
		} else {
			this.parsingSystemMessage = false;
			this._addMessage("ended parsing system message, message will be displayed as follows:");
			var _g = 0;
			var _g1 = this.systemMessage.substring(0,this.systemMessage.length - 1).split("\n");
			while(_g < _g1.length) {
				var m = _g1[_g];
				++_g;
				this._addMessage(m);
			}
			this._addMessage("**use /submit_system_message to use this, or restart with /system_message**");
		}
	}
	,_submitSystemMessage: function(_) {
		var _g = this;
		if(this.parsingSystemMessage) {
			this._addMessage("**please /system_message again to end the buffer before submitting.**");
			return;
		}
		var $final = StringTools.urlEncode(this.systemMessage.substring(0,this.systemMessage.length - 1));
		this._request(this.basePath + ("api/system/" + this.room + "/" + this.adminPassword + "/" + $final),function(d) {
			if(d == "set") _g._addMessage("system message set."); else _g._addMessage("you are not authorized to set " + _g.room + "'s system message.");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 946, className : "Main", methodName : "_submitSystemMessage"});
			_g._addMessage("failed to connect to api, couldn't submit system message.");
		});
	}
	,_legal: function(_) {
		this._addMessage("slickrock.io is (c) 2015 Nico May.");
		this._addMessage("wordlists used with permission from gfycat.com");
	}
	,_credits: function(_) {
		this._addMessage("Homepage design and general awesomeness: **Lorenzo Maieru** *(@LorenzoMaieru)*.");
		this._addMessage("Assorted help and testing: **Mark Kowalsky** *(@dimensive)*, **Isaac Bickel** *(@gamesbybeta)*, **Alex Lanzetta** *(@Zanzlanz)*.");
		this._addMessage("Additional images: **Nathan Wentworth** *(@nathanwentworth)*.");
		this._addMessage("slickrock.io is crafted in **Haxe**, the backend is helped by the **Abe** library *(github.com/abedev/abe)*.");
	}
	,_rules: function(_) {
		this._addMessage("slickrock.io is not meant to allow people to say or show horrible things.");
		this._addMessage("should your intention in coming to this site be to say or show inappropriate things, please go somewhere else, there are plenty of well established dirty corners of the internet, this doesn't need to become one.");
		this._addMessage("rooms, especially public ones, displaying content deemed unacceptable, under my own personal judgment, will be removed.");
		this._addMessage("should the content of these rooms warrant it, your IP address will be reported to the proper authorities, you have been warned.");
		this._addMessage("apologies for that, to all the genuine users of this site, I hope you enjoy it, and don't worry about subtle things like swear words or the like, but if it seems like you should make something private, preferably make it private.");
		this._addMessage("thank you, and enjoy the site.");
	}
	,_donate: function(_) {
		this._openInNewTab("https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=nico%2emay99%40gmail%2ecom&lc=CA&item_name=slickrock%2eio&currency_code=CAD&bn=PP%2dDonationsBF%3a%26text%3ddonate%2e%3aNonHosted");
	}
	,_parseMessages: function(data,hist) {
		if(hist == null) hist = false;
		if(data == "locked") {
			if(this.token == null) {
				if(!this.hasTriedAuth) this._tryAuth();
				this.requestInProgress = false;
				return;
			}
			if(!this.locked) this._addMessage("room is locked, please enter password.");
			this.locked = true;
			this.requestInProgress = false;
			this.wasLocked = true;
			return;
		}
		if(data == "password") {
			if(this.token == null) {
				if(!this.hasTriedAuth) this._tryAuth();
				this.requestInProgress = false;
				return;
			}
			if(!this.locked) this._addMessage("incorrect password, please resend password.");
			this.locked = true;
			this.requestInProgress = false;
			this.wasLocked = true;
			return;
		}
		if(data == "nomongo") {
			this.requestInProgress = false;
			return;
		}
		if(this.wasLocked) {
			this._addMessage("successfully unlocked.");
			this.wasLocked = false;
			this.locked = false;
		}
		var parsed = JSON.parse(data);
		if(!this.first) {
			if(this.v != parsed.messages.v) window.location.reload(true);
		} else this.v = parsed.messages.v;
		var _g1 = 0;
		var _g = parsed.messages.messages.length;
		while(_g1 < _g) {
			var i = _g1++;
			var ii = i;
			if(hist) ii = parsed.messages.messages.length - 1 - i;
			var p = parsed.messages.messages[ii];
			var message = this._addMessage(p.text,p.id,null,hist,true,this.first,p._id,parsed.messages.names);
			if(!hist && !this.focussed && !this.first) {
				window.document.title = "# /" + this.room + ".";
				var _g2 = 0;
				var _g3 = this.favicons;
				while(_g2 < _g3.length) {
					var f = _g3[_g2];
					++_g2;
					f.href = "bin/img/favicon.ico";
				}
				this.messageSound.play();
				this._sendNotification(message.innerText != null?message.innerText:message.textContent);
			}
		}
		var _g4 = 0;
		var _g11 = this.typings;
		while(_g4 < _g11.length) {
			var t = _g11[_g4];
			++_g4;
			this.messages.removeChild(t);
		}
		this.typings = [];
		var _g5 = 0;
		var _g12 = parsed.messages.typing;
		while(_g5 < _g12.length) {
			var t1 = _g12[_g5];
			++_g5;
			if(t1 != this.id) {
				var typeMessage = [(function($this) {
					var $r;
					var _this = window.document;
					$r = _this.createElement("div");
					return $r;
				}(this))];
				typeMessage[0].className = "messageitem";
				typeMessage[0].innerHTML = "<br/>";
				var message1;
				var _this1 = window.document;
				message1 = _this1.createElement("div");
				message1.classList.add("messageblock");
				message1.setAttribute("data-id",t1);
				var chevron = this._makeSpan(true,t1);
				message1.appendChild(chevron);
				this.messages.appendChild(message1);
				message1.appendChild(typeMessage[0]);
				haxe_Timer.delay((function(typeMessage) {
					return function() {
						typeMessage[0].classList.add("loaded");
					};
				})(typeMessage),10);
				this.typings.push(message1);
				this._tryScroll();
			}
		}
		this.lastIndex = parsed.lastID;
		if(parsed.firstID != null) this.firstIndex = parsed.firstID; else this.firstIndex = this.firstIndex;
		if(this.first) {
			if(!this._checkVisited() && parsed.messages.system != null) {
				var _g6 = 0;
				var _g13 = parsed.messages.system.split("\n");
				while(_g6 < _g13.length) {
					var m = _g13[_g6];
					++_g6;
					this._addMessage(m);
				}
			}
			this._tryScroll(true);
			if(parsed.messages.pw == null && parsed.messages.messages.length == 0) this._addMessage("*" + this.room + "* is unclaimed, consider ***/claim***-ing it?");
		}
		this.first = false;
		this.requestInProgress = false;
		if(hist) this.histRequestInProgress = false;
	}
	,_tryScroll: function(force,img) {
		if(force == null) force = false;
		if(force || this._atBottom(img)) {
			$(window.document).scrollTop(Std["int"]($(window.document).height()));
			this.initialScroll = false;
		}
	}
	,_atBottom: function(img) {
		var offset = 0;
		if(img != null) offset = $(img).outerHeight();
		if($(window.document).scrollTop() + window.innerHeight + offset > window.document.body.scrollHeight - 100) return true;
		return false;
	}
	,_addMessage: function(msg,id,customHTML,hist,safe,first,_id,names) {
		if(names == null) names = false;
		if(first == null) first = false;
		if(safe == null) safe = true;
		if(hist == null) hist = false;
		var orig = msg;
		msg = this._parseMessage(msg,safe,id);
		var showName = false;
		if(names && id != null) showName = true;
		var message;
		var name = null;
		var differentUser = false;
		if(!hist && (id == null || id == "-1" || id != this.lastUserID)) differentUser = true;
		if(differentUser) {
			var _this = window.document;
			message = _this.createElement("div");
			message.classList.add("messageblock");
			message.setAttribute("data-id",id);
			this.lastParagraph = message;
			message.appendChild(this._makeSpan(differentUser,id));
			if(showName) {
				name = this._makeName(id);
				message.appendChild(name);
			}
			this.messages.appendChild(message);
		} else message = this.lastParagraph;
		var messageItem;
		var _this1 = window.document;
		messageItem = _this1.createElement("div");
		messageItem.classList.add("messageitem");
		messageItem.setAttribute("data-objectid",_id);
		if(_id != null) messageItem.onclick = (function(f,id1,a1) {
			return function(e) {
				f(e,id1,a1);
			};
		})($bind(this,this._tryDeleteMessage),_id,orig);
		if(customHTML == null) messageItem.innerHTML = msg; else messageItem.innerHTML = customHTML;
		var offset = 0;
		if(!hist) message.appendChild(messageItem); else {
			message = this.messages.children[0];
			var last = message.getAttribute("data-id");
			if(last == id) {
				if(showName) message.insertBefore(messageItem,message.children[2]); else message.insertBefore(messageItem,message.children[1]);
				offset = $(messageItem).outerHeight(true);
			} else {
				var _this2 = window.document;
				message = _this2.createElement("div");
				message.classList.add("messageblock");
				message.setAttribute("data-id",id);
				this.messages.insertBefore(message,this.messages.children[0]);
				message.appendChild(this._makeSpan(true,id));
				if(showName) {
					haxe_Log.trace(id,{ fileName : "Main.hx", lineNumber : 1193, className : "Main", methodName : "_addMessage"});
					name = this._makeName(id);
					message.appendChild(name);
					message.insertBefore(messageItem,message.children[2]);
				} else message.insertBefore(messageItem,message.children[1]);
				offset = $(message).outerHeight(true);
			}
		}
		if(!hist) {
			this._tryScroll();
			this.lastUserID = id;
			if(!first) {
				haxe_Timer.delay(function() {
					messageItem.classList.add("loaded");
				},10);
				if(name != null) haxe_Timer.delay(function() {
					name.classList.add("loaded");
				},10);
			} else {
				messageItem.classList.add("non-anim");
				if(name != null) name.classList.add("non-anim");
			}
		} else {
			window.document.body.scrollTop += offset | 0;
			messageItem.classList.add("non-anim");
			if(name != null) name.classList.add("non-anim");
		}
		var _g = 0;
		var _g1 = window.document.getElementsByClassName("imgmessage");
		while(_g < _g1.length) {
			var i = _g1[_g];
			++_g;
			var image = i;
			i.onclick = (function(f1,a11) {
				return function() {
					f1(a11);
				};
			})($bind(this,this._openInNewTab),image.src);
			i.onload = (function(f2,a12,a2) {
				return function() {
					f2(a12,a2);
				};
			})($bind(this,this._tryScroll),false,i);
			i.onmousemove = (function(f3,a13) {
				return function(e1) {
					f3(e1,a13);
				};
			})($bind(this,this._tryExpandImages),i);
		}
		return messageItem;
	}
	,_setTheme: function(theme) {
		switch(theme) {
		case "light":
			var lightCss;
			var _this = window.document;
			lightCss = _this.createElement("link");
			lightCss.rel = "stylesheet";
			lightCss.type = "text/css";
			lightCss.href = "bin/css/clientstyle_light.css";
			window.document.head.appendChild(lightCss);
			this.lightTheme = true;
			break;
		default:
			var _g = 0;
			var _g1 = window.document.head.getElementsByTagName("link");
			while(_g < _g1.length) {
				var css = _g1[_g];
				++_g;
				var link = css;
				if(link.href.indexOf("_light") != -1) {
					window.document.head.removeChild(link);
					break;
				}
			}
		}
	}
	,_tryDeleteMessage: function(e,id,text) {
		var _g = this;
		if(e.ctrlKey && e.shiftKey && e.altKey) this._request(this.basePath + ("api/deleteMessage/" + this.room + "/" + this.adminPassword + "/" + id),function(d) {
			if(d == "deleted") _g._addMessage("message deleted."); else _g._addMessage("you are not authorized to moderate " + _g.room + ".");
		},function(e1) {
			haxe_Log.trace(e1,{ fileName : "Main.hx", lineNumber : 1272, className : "Main", methodName : "_tryDeleteMessage"});
			_g._addMessage("failed to connect to api, couldn't delete message.");
		}); else if(e.altKey) this.chatbox.value = "~" + text + " " + id + "~";
	}
	,_parseMessage: function(raw,safe,id) {
		if(safe == null) safe = true;
		var parsed = StringTools.replace(raw,"\n"," ");
		if(safe) {
			parsed = StringTools.htmlEscape(parsed);
			parsed = StringTools.replace(parsed,"\"","&quot;");
			parsed = StringTools.replace(parsed,":","&colon;");
			parsed = StringTools.replace(parsed,"\\*","&ast;");
			parsed = StringTools.replace(parsed,"\\#","&num;");
			parsed = StringTools.replace(parsed,"\\^","&Hat;");
			parsed = StringTools.replace(parsed,"\\`","&grave;");
			parsed = StringTools.replace(parsed,"\\~","&tilde;");
			parsed = StringTools.replace(parsed,"\\\\n","&bsol;n");
			parsed = StringTools.replace(parsed,"\\\\t","&bsol;t");
			parsed = StringTools.replace(parsed,"\\n","<br/>");
			parsed = StringTools.replace(parsed,"\\t","&nbsp;&nbsp;&nbsp;");
		}
		while(this.imgBB.match(parsed)) {
			var imgPath = this.imgBB.matched(1);
			var chunks = imgPath.split(" ");
			var imgTag;
			var _g = chunks.length;
			switch(_g) {
			case 1:
				imgTag = "<img src=\"" + chunks[0] + "\" style=\"width:800px\" class=\"imgmessage\"></img>";
				break;
			case 2:
				imgTag = "<img src=\"" + chunks[0] + "\" style=\"width:" + chunks[1] + "px\" class=\"imgmessage\"></img>";
				break;
			case 3:
				imgTag = "<img src=\"" + chunks[0] + "\" style=\"width:" + chunks[1] + "px\" height=\"" + chunks[2] + "\" class=\"imgmessage\"></img>";
				break;
			default:
				imgTag = "";
			}
			parsed = this.imgBB.replace(parsed,imgTag);
		}
		while(this.boldBB.match(parsed)) {
			var text = this.boldBB.matched(1);
			var strongTag = "<strong>" + text + "</strong>";
			parsed = this.boldBB.replace(parsed,strongTag);
		}
		while(this.italicBB.match(parsed)) {
			var text1 = this.italicBB.matched(1);
			var emTag = "<em>" + text1 + "</em>";
			parsed = this.italicBB.replace(parsed,emTag);
		}
		while(this.quoteMD.match(parsed)) {
			var text2 = this.quoteMD.matched(1);
			var id1 = this.quoteMD.matched(2);
			var quoteTag;
			var _g1 = id1 != null;
			switch(_g1) {
			case false:
				quoteTag = "<em style=\"color:" + this._generateColorFromID(id1) + ";\">" + text2 + "</em>";
				break;
			case true:
				quoteTag = "<em style=\"color:" + this._generateColorFromID(id1) + ";\">" + text2 + "</em>";
				break;
			}
			parsed = this.quoteMD.replace(parsed,quoteTag);
		}
		while(this.codeBB.match(parsed)) {
			var text3 = this.codeBB.matched(1);
			var preTag = "<pre>" + text3 + "</pre>";
			parsed = this.codeBB.replace(parsed,preTag);
		}
		while(this.headerMD.match(parsed)) {
			var text4 = this.headerMD.matched(1);
			var preTag1 = "<h1>" + text4 + "</h1>";
			parsed = this.headerMD.replace(parsed,preTag1);
		}
		return parsed;
	}
	,_checkKeyPress: function(e) {
		var _g = this;
		var code = null;
		if(e != null) if(e.keyCode != null) code = e.keyCode; else code = e.which;
		if(this.chatbox.value.charAt(0) == "/") {
			if(this.helpbox.style.display != "block") {
				this.helpbox.style.display = "block";
				this.commandIndex = -1;
			}
			if(code == 40 || code == 38) {
				var activeChilren = [];
				var _g1 = 0;
				var _g11 = this.helpbox.children;
				while(_g1 < _g11.length) {
					var c = _g11[_g1];
					++_g1;
					if(c.style.display == "list-item") activeChilren.push(c);
					if(c.classList.contains("selected") && this.commandIndex < 0) this.commandIndex = 0;
					c.classList.remove("selected");
				}
				if(code == 40) {
					this.commandIndex++;
					if(this.commandIndex >= activeChilren.length) this.commandIndex = 0;
				} else if(code == 38) {
					this.commandIndex--;
					if(this.commandIndex <= -1) this.commandIndex = activeChilren.length - 1;
				}
				activeChilren[this.commandIndex].classList.add("selected");
				this.selectedElem = activeChilren[this.commandIndex];
				this.helpbox.scrollTop = activeChilren[this.commandIndex].offsetTop;
			} else if(code != 13 && code != 32) this._filterHelp();
			if(this.selectedElem != null) {
				var command = this.selectedElem.getAttribute("data-command");
				var replacement = "/" + command + " ";
				if(this.chatbox.value.indexOf(command) == -1) {
					if(this.chatbox.value.charAt(this.chatbox.value.length - 1) == " " || code != null && (code == 13 || code == 9)) {
						haxe_Log.trace(this.chatbox.value,{ fileName : "Main.hx", lineNumber : 1418, className : "Main", methodName : "_checkKeyPress", customParams : [replacement]});
						this.chatbox.value = replacement;
						this._filterHelp();
						if((code == 13 || code == 9) && this.commandInfos.get(command).requiresArgs == true) {
							this.chatbox.focus();
							return;
						}
					}
				}
			}
		} else {
			this.helpbox.style.display = "none";
			if(!this.locked && this.token != null) {
				if(this.canSendTypingNotification) {
					if(this.chatbox.value != this.lastChatboxValue) {
						var typingHttp = new haxe_Http(this.basePath + ("api/typing/" + this.room + "/" + this.id));
						typingHttp.request(true);
						this.canSendTypingNotification = false;
						haxe_Timer.delay(function() {
							_g.canSendTypingNotification = true;
						},2500);
					}
					this.lastChatboxValue = this.chatbox.value;
				}
			}
		}
		if(code != null && code == 13) this._determineMessageUse();
	}
	,_filterHelp: function() {
		var selected = false;
		var _g = 0;
		var _g1 = this.helpbox.children;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			var li = c;
			var command = li.getAttribute("data-command");
			var sub = HxOverrides.substr(this.chatbox.value,1,null);
			var trimmed = false;
			if(sub.indexOf(" ") != -1) {
				trimmed = true;
				sub = sub.substring(0,sub.indexOf(" "));
			}
			var end;
			if(!trimmed) end = sub.length; else end = command.length;
			if(HxOverrides.substr(command,0,end) != sub) li.style.display = "none"; else {
				li.style.display = "list-item";
				if(!selected && sub.length > 0) {
					li.classList.add("selected");
					this.selectedElem = li;
					selected = true;
				} else li.classList.remove("selected");
			}
		}
	}
	,_determineMessageUse: function() {
		if(this.token == null) {
			var t = this.chatbox.value;
			this._setToken(t != null?t:"-1");
		} else if(this.chatbox.value.charAt(0) == "/") this._parseCommand(HxOverrides.substr(this.chatbox.value,1,null)); else if(this.locked) {
			this._addMessage("attempting to unlock room with: " + this.chatbox.value + ".");
			this._setPassword(this.chatbox.value);
		} else if(this.parsingSystemMessage) this.systemMessage += this.chatbox.value + "\n"; else {
			this._postMessage(this.chatbox.value);
			this.lastMessage = this.chatbox.value;
			this._update();
		}
		this.chatbox.value = "";
		this.helpbox.style.display = "none";
	}
	,_postMessage: function(msg) {
		if(StringTools.trim(msg) != "") {
			if(this.password == null) this.postHttp.url = this.basePath + "chat/" + encodeURIComponent(msg) + "/" + this.room + "/" + this.id + "/" + this.privateID + "/" + this.token; else this.postHttp.url = this.basePath + "chat/" + encodeURIComponent(msg) + "/" + this.room + "/" + this.password + "/" + this.id + "/" + this.privateID + "/" + this.token;
			this.postHttp.request(true);
		}
	}
	,_openInNewTab: function(src) {
		var win = window.open(src,"_blank");
		win.focus();
	}
	,_makeSpan: function(pointer,id) {
		if(pointer == null) pointer = false;
		var span;
		var _this = window.document;
		span = _this.createElement("span");
		if(pointer) {
			span.innerHTML = ">";
			span.style.color = this._generateColorFromID(id);
		}
		span.innerHTML += "\t";
		if(!this.first) haxe_Timer.delay(function() {
			span.classList.add("loaded");
		},10); else span.classList.add("non-anim");
		return span;
	}
	,_makeName: function(id) {
		var name;
		var _this = window.document;
		name = _this.createElement("div");
		var _this1 = window.document;
		name = _this1.createElement("div");
		name.innerHTML = id + ": ";
		name.classList.add("messageitem");
		name.style.color = this._generateColorFromID(id);
		return name;
	}
	,_checkVisited: function() {
		if(js_Cookie.exists("" + this.room + "_visited")) return true; else {
			js_Cookie.set("" + this.room + "_visited","true");
			return false;
		}
	}
	,_generateColorFromID: function(id,dark) {
		if(dark == null) dark = false;
		var max = 0.5;
		var min = 0.3;
		if(this.lightTheme) {
			max = 0.4;
			min = 0.2;
		}
		var hsl;
		if(id != null && id != "-1") {
			var intID = 0;
			var _g1 = 0;
			var _g = id.length;
			while(_g1 < _g) {
				var i = _g1++;
				var s = HxOverrides.cca(id,i);
				intID += s;
			}
			var hue = new Random(intID * 12189234)["float"](0,360);
			var sat = new Random(intID * 12189234)["float"](0.7,1.0);
			var light = new Random(intID * 12189234)["float"](min,max);
			hsl = [hue,sat,light];
			if(!this.lightTheme && dark) hsl = thx_color__$Hsl_Hsl_$Impl_$.darker(hsl,1 - max);
		} else hsl = [0,1,1];
		return "#" + StringTools.hex(thx_color__$Hsl_Hsl_$Impl_$.toRgb(hsl),6);
	}
	,_setID: function(id_) {
		if(Std.parseInt(id_) != null) {
			this._getID();
			return;
		}
		this.id = id_;
		js_Cookie.set("id",this.id,315360000);
		this.chatbox.style.borderTopColor = this._generateColorFromID(this.id,true);
	}
	,_setPassword: function(password_) {
		this.password = password_;
		js_Cookie.set("" + this.room + "-password",this.password,315360000);
	}
	,_setAdminPassword: function(password_) {
		this.adminPassword = password_;
		js_Cookie.set("" + this.room + "admin-password",this.adminPassword,315360000);
	}
	,_request: function(path,onData,onError,push) {
		if(push == null) push = true;
		var http = new haxe_Http(path);
		http.onData = onData;
		http.onError = onError;
		http.request(push);
	}
	,_inIframe: function() {
		try {
			return window.self != window.top;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return true;
		}
	}
};
Math.__name__ = true;
var Random = function(_initial_seed) {
	this.initial = this.seed = _initial_seed;
	this.seed = this.initial;
};
Random.__name__ = true;
Random.prototype = {
	'float': function(min,max) {
		if(max == null) {
			max = min;
			min = 0;
		}
		return ((this.seed = this.seed * 16807 % 2147483647) / 2147483647 + 0.000000000233) * (max - min) + min;
	}
	,'int': function(min,max) {
		if(max == null) {
			max = min;
			min = 0;
		}
		return Math.floor(this["float"](min,max));
	}
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std["int"] = function(x) {
	return x | 0;
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
var StringTools = function() { };
StringTools.__name__ = true;
StringTools.urlEncode = function(s) {
	return encodeURIComponent(s);
};
StringTools.htmlEscape = function(s,quotes) {
	s = s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
	if(quotes) return s.split("\"").join("&quot;").split("'").join("&#039;"); else return s;
};
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	return c > 8 && c < 14 || c == 32;
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) r++;
	if(r > 0) return HxOverrides.substr(s,r,l - r); else return s;
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) r++;
	if(r > 0) return HxOverrides.substr(s,0,l - r); else return s;
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
StringTools.hex = function(n,digits) {
	var s = "";
	var hexChars = "0123456789ABCDEF";
	do {
		s = hexChars.charAt(n & 15) + s;
		n >>>= 4;
	} while(n > 0);
	if(digits != null) while(s.length < digits) s = "0" + s;
	return s;
};
var haxe_IMap = function() { };
haxe_IMap.__name__ = true;
var haxe_Http = function(url) {
	this.url = url;
	this.headers = new List();
	this.params = new List();
	this.async = true;
};
haxe_Http.__name__ = true;
haxe_Http.prototype = {
	cancel: function() {
		if(this.req == null) return;
		this.req.abort();
		this.req = null;
	}
	,request: function(post) {
		var me = this;
		me.responseData = null;
		var r = this.req = js_Browser.createXMLHttpRequest();
		var onreadystatechange = function(_) {
			if(r.readyState != 4) return;
			var s;
			try {
				s = r.status;
			} catch( e ) {
				if (e instanceof js__$Boot_HaxeError) e = e.val;
				s = null;
			}
			if(s != null) {
				var protocol = window.location.protocol.toLowerCase();
				var rlocalProtocol = new EReg("^(?:about|app|app-storage|.+-extension|file|res|widget):$","");
				var isLocal = rlocalProtocol.match(protocol);
				if(isLocal) if(r.responseText != null) s = 200; else s = 404;
			}
			if(s == undefined) s = null;
			if(s != null) me.onStatus(s);
			if(s != null && s >= 200 && s < 400) {
				me.req = null;
				me.onData(me.responseData = r.responseText);
			} else if(s == null) {
				me.req = null;
				me.onError("Failed to connect or resolve host");
			} else switch(s) {
			case 12029:
				me.req = null;
				me.onError("Failed to connect to host");
				break;
			case 12007:
				me.req = null;
				me.onError("Unknown host");
				break;
			default:
				me.req = null;
				me.responseData = r.responseText;
				me.onError("Http Error #" + r.status);
			}
		};
		if(this.async) r.onreadystatechange = onreadystatechange;
		var uri = this.postData;
		if(uri != null) post = true; else {
			var _g_head = this.params.h;
			var _g_val = null;
			while(_g_head != null) {
				var p;
				p = (function($this) {
					var $r;
					_g_val = _g_head[0];
					_g_head = _g_head[1];
					$r = _g_val;
					return $r;
				}(this));
				if(uri == null) uri = ""; else uri += "&";
				uri += encodeURIComponent(p.param) + "=" + encodeURIComponent(p.value);
			}
		}
		try {
			if(post) r.open("POST",this.url,this.async); else if(uri != null) {
				var question = this.url.split("?").length <= 1;
				r.open("GET",this.url + (question?"?":"&") + uri,this.async);
				uri = null;
			} else r.open("GET",this.url,this.async);
		} catch( e1 ) {
			if (e1 instanceof js__$Boot_HaxeError) e1 = e1.val;
			me.req = null;
			this.onError(e1.toString());
			return;
		}
		if(!Lambda.exists(this.headers,function(h) {
			return h.header == "Content-Type";
		}) && post && this.postData == null) r.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		var _g_head1 = this.headers.h;
		var _g_val1 = null;
		while(_g_head1 != null) {
			var h1;
			h1 = (function($this) {
				var $r;
				_g_val1 = _g_head1[0];
				_g_head1 = _g_head1[1];
				$r = _g_val1;
				return $r;
			}(this));
			r.setRequestHeader(h1.header,h1.value);
		}
		r.send(uri);
		if(!this.async) onreadystatechange(null);
	}
	,onData: function(data) {
	}
	,onError: function(msg) {
	}
	,onStatus: function(status) {
	}
};
var haxe_Log = function() { };
haxe_Log.__name__ = true;
haxe_Log.trace = function(v,infos) {
	js_Boot.__trace(v,infos);
};
var haxe_Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe_Timer.__name__ = true;
haxe_Timer.delay = function(f,time_ms) {
	var t = new haxe_Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe_Timer.prototype = {
	stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
haxe_ds_StringMap.__name__ = true;
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	set: function(key,value) {
		if(__map_reserved[key] != null) this.setReserved(key,value); else this.h[key] = value;
	}
	,get: function(key) {
		if(__map_reserved[key] != null) return this.getReserved(key);
		return this.h[key];
	}
	,exists: function(key) {
		if(__map_reserved[key] != null) return this.existsReserved(key);
		return this.h.hasOwnProperty(key);
	}
	,setReserved: function(key,value) {
		if(this.rh == null) this.rh = { };
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) return null; else return this.rh["$" + key];
	}
	,existsReserved: function(key) {
		if(this.rh == null) return false;
		return this.rh.hasOwnProperty("$" + key);
	}
	,keys: function() {
		var _this = this.arrayKeys();
		return HxOverrides.iter(_this);
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) out.push(key);
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) out.push(key.substr(1));
			}
		}
		return out;
	}
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__unhtml = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
};
js_Boot.__trace = function(v,i) {
	var msg;
	if(i != null) msg = i.fileName + ":" + i.lineNumber + ": "; else msg = "";
	msg += js_Boot.__string_rec(v,"");
	if(i != null && i.customParams != null) {
		var _g = 0;
		var _g1 = i.customParams;
		while(_g < _g1.length) {
			var v1 = _g1[_g];
			++_g;
			msg += "," + js_Boot.__string_rec(v1,"");
		}
	}
	var d;
	if(typeof(document) != "undefined" && (d = document.getElementById("haxe:trace")) != null) d.innerHTML += js_Boot.__unhtml(msg) + "<br/>"; else if(typeof console != "undefined" && console.log != null) console.log(msg);
};
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
var js_Browser = function() { };
js_Browser.__name__ = true;
js_Browser.createXMLHttpRequest = function() {
	if(typeof XMLHttpRequest != "undefined") return new XMLHttpRequest();
	if(typeof ActiveXObject != "undefined") return new ActiveXObject("Microsoft.XMLHTTP");
	throw new js__$Boot_HaxeError("Unable to create XMLHttpRequest object.");
};
var js_Cookie = function() { };
js_Cookie.__name__ = true;
js_Cookie.set = function(name,value,expireDelay,path,domain) {
	var s = name + "=" + encodeURIComponent(value);
	if(expireDelay != null) {
		var d = DateTools.delta(new Date(),expireDelay * 1000);
		s += ";expires=" + d.toGMTString();
	}
	if(path != null) s += ";path=" + path;
	if(domain != null) s += ";domain=" + domain;
	window.document.cookie = s;
};
js_Cookie.all = function() {
	var h = new haxe_ds_StringMap();
	var a = window.document.cookie.split(";");
	var _g = 0;
	while(_g < a.length) {
		var e = a[_g];
		++_g;
		e = StringTools.ltrim(e);
		var t = e.split("=");
		if(t.length < 2) continue;
		h.set(t[0],decodeURIComponent(t[1].split("+").join(" ")));
	}
	return h;
};
js_Cookie.get = function(name) {
	return js_Cookie.all().get(name);
};
js_Cookie.exists = function(name) {
	return js_Cookie.all().exists(name);
};
js_Cookie.remove = function(name,path,domain) {
	js_Cookie.set(name,"",-10,path,domain);
};
var thx_Floats = function() { };
thx_Floats.__name__ = true;
thx_Floats.interpolate = function(f,a,b) {
	return (b - a) * f + a;
};
thx_Floats.wrapCircular = function(v,max) {
	v = v % max;
	if(v < 0) v += max;
	return v;
};
var thx_color__$Hsl_Hsl_$Impl_$ = {};
thx_color__$Hsl_Hsl_$Impl_$.__name__ = true;
thx_color__$Hsl_Hsl_$Impl_$.darker = function(this1,t) {
	var channels = [this1[0],this1[1],thx_Floats.interpolate(t,this1[2],0)];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toRgbx = function(this1) {
	var channels = [thx_color__$Hsl_Hsl_$Impl_$._c(this1[0] + 120,this1[1],this1[2]),thx_color__$Hsl_Hsl_$Impl_$._c(this1[0],this1[1],this1[2]),thx_color__$Hsl_Hsl_$Impl_$._c(this1[0] - 120,this1[1],this1[2])];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$._c = function(d,s,l) {
	var m2;
	if(l <= 0.5) m2 = l * (1 + s); else m2 = l + s - l * s;
	var m1 = 2 * l - m2;
	d = thx_Floats.wrapCircular(d,360);
	if(d < 60) return m1 + (m2 - m1) * d / 60; else if(d < 180) return m2; else if(d < 240) return m1 + (m2 - m1) * (240 - d) / 60; else return m1;
};
var thx_color__$Rgbx_Rgbx_$Impl_$ = {};
thx_color__$Rgbx_Rgbx_$Impl_$.__name__ = true;
thx_color__$Rgbx_Rgbx_$Impl_$.toRgb = function(this1) {
	var red = Math.round(this1[0] * 255);
	var green = Math.round(this1[1] * 255);
	var blue = Math.round(this1[2] * 255);
	return (red & 255) << 16 | (green & 255) << 8 | blue & 255;
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
String.__name__ = true;
Array.__name__ = true;
Date.__name__ = ["Date"];
var __map_reserved = {}
Main.main();
})(typeof console != "undefined" ? console : {log:function(){}});

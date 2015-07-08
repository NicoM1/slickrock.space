(function (console) { "use strict";
var $estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var DateTools = function() { };
DateTools.__name__ = ["DateTools"];
DateTools.delta = function(d,t) {
	var t1 = d.getTime() + t;
	var d1 = new Date();
	d1.setTime(t1);
	return d1;
};
DateTools.getMonthDays = function(d) {
	var month = d.getMonth();
	var year = d.getFullYear();
	if(month != 1) return DateTools.DAYS_OF_MONTH[month];
	var isB = year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
	if(isB) return 29; else return 28;
};
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
EReg.__name__ = ["EReg"];
EReg.prototype = {
	r: null
	,match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw new js__$Boot_HaxeError("EReg::matched");
	}
	,matchedPos: function() {
		if(this.r.m == null) throw new js__$Boot_HaxeError("No string matched");
		return { pos : this.r.m.index, len : this.r.m[0].length};
	}
	,matchSub: function(s,pos,len) {
		if(len == null) len = -1;
		if(this.r.global) {
			this.r.lastIndex = pos;
			this.r.m = this.r.exec(len < 0?s:HxOverrides.substr(s,0,pos + len));
			var b = this.r.m != null;
			if(b) this.r.s = s;
			return b;
		} else {
			var b1 = this.match(len < 0?HxOverrides.substr(s,pos,null):HxOverrides.substr(s,pos,len));
			if(b1) {
				this.r.s = s;
				this.r.m.index += pos;
			}
			return b1;
		}
	}
	,split: function(s) {
		var d = "#__delim__#";
		return s.replace(this.r,d).split(d);
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,map: function(s,f) {
		var offset = 0;
		var buf = new StringBuf();
		do {
			if(offset >= s.length) break; else if(!this.matchSub(s,offset)) {
				buf.add(HxOverrides.substr(s,offset,null));
				break;
			}
			var p = this.matchedPos();
			buf.add(HxOverrides.substr(s,offset,p.pos - offset));
			buf.add(f(this));
			if(p.len == 0) {
				buf.add(HxOverrides.substr(s,p.pos,1));
				offset = p.pos + 1;
			} else offset = p.pos + p.len;
		} while(this.r.global);
		if(!this.r.global && offset > 0 && offset < s.length) buf.add(HxOverrides.substr(s,offset,null));
		return buf.b;
	}
	,__class__: EReg
};
var HxOverrides = function() { };
HxOverrides.__name__ = ["HxOverrides"];
HxOverrides.dateStr = function(date) {
	var m = date.getMonth() + 1;
	var d = date.getDate();
	var h = date.getHours();
	var mi = date.getMinutes();
	var s = date.getSeconds();
	return date.getFullYear() + "-" + (m < 10?"0" + m:"" + m) + "-" + (d < 10?"0" + d:"" + d) + " " + (h < 10?"0" + h:"" + h) + ":" + (mi < 10?"0" + mi:"" + mi) + ":" + (s < 10?"0" + s:"" + s);
};
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
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = function() { };
Lambda.__name__ = ["Lambda"];
Lambda.has = function(it,elt) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(x == elt) return true;
	}
	return false;
};
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
List.__name__ = ["List"];
List.prototype = {
	h: null
	,length: null
	,iterator: function() {
		return new _$List_ListIterator(this.h);
	}
	,__class__: List
};
var _$List_ListIterator = function(head) {
	this.head = head;
	this.val = null;
};
_$List_ListIterator.__name__ = ["_List","ListIterator"];
_$List_ListIterator.prototype = {
	head: null
	,val: null
	,hasNext: function() {
		return this.head != null;
	}
	,next: function() {
		this.val = this.head[0];
		this.head = this.head[1];
		return this.val;
	}
	,__class__: _$List_ListIterator
};
var Main = function() {
	this.selectedElem = null;
	this.sitelink = new EReg(" /[^\\s]+?( |$)","i");
	this.headerMD = new EReg("\\^(.*?)\\^","i");
	this.codeBB = new EReg("(?:\\[code\\]|`)(.*?)(?:\\[/code\\]|`)","i");
	this.boldBB = new EReg("(?:\\[b\\]|\\*\\*)(.*?)(?:\\[/b\\]|\\*\\*)","i");
	this.italicBB = new EReg("(?:\\[i\\]|\\*)(.*?)(?:\\[/i\\]|\\*)","i");
	this.imgBB = new EReg("(?:\\[img\\]|#)(.*?)(?:\\[/img\\]|#)","i");
	this.embedTemplate = "<iframe src=\"[SRC]\" width=\"[WIDTH]\" height=\"[HEIGHT]\" style=\"border-color: #333333; border-style: solid;\"></iframe>";
	this.counter = 0;
	this.alphanumeric = "0123456789abcdefghijklmnopqrstuvwxyz";
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
Main.__name__ = ["Main"];
Main.main = function() {
	new Main();
};
Main.prototype = {
	room: null
	,basePath: null
	,id: null
	,privateID: null
	,token: null
	,password: null
	,adminPassword: null
	,lastIndex: null
	,firstIndex: null
	,lastUserID: null
	,getHttp: null
	,postHttp: null
	,authHttp: null
	,chatbox: null
	,helpbox: null
	,messages: null
	,chevron: null
	,messageSound: null
	,lastParagraph: null
	,favicons: null
	,typings: null
	,requestInProgress: null
	,histRequestInProgress: null
	,parsingSystemMessage: null
	,first: null
	,initialScroll: null
	,focussed: null
	,locked: null
	,hasTriedAuth: null
	,wasLocked: null
	,canSendTypingNotification: null
	,notification: null
	,numNotifications: null
	,commands: null
	,lastMessage: null
	,sendLast: null
	,commandIndex: null
	,lastY: null
	,lastChatboxValue: null
	,lightTheme: null
	,ios: null
	,systemMessage: null
	,_windowLoaded: function() {
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
				haxe_Log.trace(error,{ fileName : "Main.hx", lineNumber : 143, className : "Main", methodName : "_windowLoaded"});
				_g._addMessage("Could not connect to authentication api, please refresh the page.");
			};
			this.getHttp = new haxe_Http(this.basePath + this.lastIndex);
			this.getHttp.onData = (function(f1,a2) {
				return function(a1) {
					f1(a1,a2);
				};
			})($bind(this,this._parseMessages),false);
			this.getHttp.onError = function(error1) {
				haxe_Log.trace(error1,{ fileName : "Main.hx", lineNumber : 150, className : "Main", methodName : "_windowLoaded"});
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
				haxe_Log.trace(error2,{ fileName : "Main.hx", lineNumber : 168, className : "Main", methodName : "_windowLoaded"});
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
			this._setupHelpbox();
			if(this.ios) this.chatbox.style.position = "static";
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
	,_testScrolling: function(e) {
		var code = null;
		if(e != null) if(e.keyCode != null) code = e.keyCode; else code = e.which;
		if(code == 38) this._tryGetOldMessages();
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
					haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 311, className : "Main", methodName : "_tryGetOldMessages"});
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
	,alphanumeric: null
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 373, className : "Main", methodName : "_checkValid"});
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
	,counter: null
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
		if(Notification == null) return;
		if(force || Notification.permission == "default") {
			var ua = window.navigator.userAgent;
			if(!new EReg("Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile","i").match(ua)) Notification.requestPermission(function(permission) {
			});
		}
	}
	,_sendNotification: function(text) {
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
	,commandInfos: null
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 655, className : "Main", methodName : "_getID"});
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 707, className : "Main", methodName : "_claimRoom"});
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 731, className : "Main", methodName : "_reclaimRoom"});
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 756, className : "Main", methodName : "_authorizeRoom"});
			_g._addMessage("failed to connect to api, couldn't authorize admin.");
		});
	}
	,embedTemplate: null
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 813, className : "Main", methodName : "_lockRoom"});
			_g._addMessage("failed to connect to api, couldn't lock room.");
		});
	}
	,_unlockRoom: function(_) {
		var _g = this;
		this._request(this.basePath + ("api/unlock/" + this.room + "/" + this.privateID + "/" + this.adminPassword),function(d) {
			if(d == "unlocked") _g._addMessage("" + _g.room + " unlocked."); else _g._addMessage("you are not authorized to unlock " + _g.room + ".");
		},function(e) {
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 830, className : "Main", methodName : "_unlockRoom"});
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 852, className : "Main", methodName : "_emptyRoom"});
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 899, className : "Main", methodName : "_setDefaultTheme"});
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
			haxe_Log.trace(e,{ fileName : "Main.hx", lineNumber : 938, className : "Main", methodName : "_submitSystemMessage"});
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
			window.document.body.scrollTop = Std["int"]($(window.document).height());
			this.initialScroll = false;
		}
	}
	,_atBottom: function(img) {
		var offset = 0;
		if(img != null) offset = $(img).outerHeight();
		if(window.document.body.scrollTop + window.innerHeight + offset > window.document.body.scrollHeight - 100) return true;
		return false;
	}
	,_addMessage: function(msg,id,customHTML,hist,safe,first,_id,names) {
		if(names == null) names = false;
		if(first == null) first = false;
		if(safe == null) safe = true;
		if(hist == null) hist = false;
		msg = this._parseMessage(msg,safe);
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
		if(_id != null) messageItem.onclick = (function(f,id1) {
			return function(e) {
				f(e,id1);
			};
		})($bind(this,this._tryDeleteMessage),_id);
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
			i.onclick = (function(f1,a1) {
				return function() {
					f1(a1);
				};
			})($bind(this,this._openInNewTab),image.src);
			i.onload = (function(f2,a11,a2) {
				return function() {
					f2(a11,a2);
				};
			})($bind(this,this._tryScroll),false,i);
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
	,_tryDeleteMessage: function(e,id) {
		var _g = this;
		if(e.ctrlKey && e.shiftKey && e.altKey) this._request(this.basePath + ("api/deleteMessage/" + this.room + "/" + this.adminPassword + "/" + id),function(d) {
			if(d == "deleted") _g._addMessage("message deleted."); else _g._addMessage("you are not authorized to moderate " + _g.room + ".");
		},function(e1) {
			haxe_Log.trace(e1,{ fileName : "Main.hx", lineNumber : 1252, className : "Main", methodName : "_tryDeleteMessage"});
			_g._addMessage("failed to connect to api, couldn't delete message.");
		});
	}
	,imgBB: null
	,italicBB: null
	,boldBB: null
	,codeBB: null
	,headerMD: null
	,sitelink: null
	,_parseMessage: function(raw,safe) {
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
				imgTag = "<img src=\"" + chunks[0] + "\" class=\"imgmessage\"></img>";
				break;
			case 2:
				imgTag = "<img src=\"" + chunks[0] + "\" width=\"" + chunks[1] + "\" class=\"imgmessage\"></img>";
				break;
			case 3:
				imgTag = "<img src=\"" + chunks[0] + "\" width=\"" + chunks[1] + "\" height=\"" + chunks[2] + "\" class=\"imgmessage\"></img>";
				break;
			default:
				return "";
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
		while(this.codeBB.match(parsed)) {
			var text2 = this.codeBB.matched(1);
			var preTag = "<pre>" + text2 + "</pre>";
			parsed = this.codeBB.replace(parsed,preTag);
		}
		while(this.headerMD.match(parsed)) {
			var text3 = this.headerMD.matched(1);
			var preTag1 = "<h1>" + text3 + "</h1>";
			parsed = this.headerMD.replace(parsed,preTag1);
		}
		return parsed;
	}
	,selectedElem: null
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
						haxe_Log.trace(this.chatbox.value,{ fileName : "Main.hx", lineNumber : 1383, className : "Main", methodName : "_checkKeyPress", customParams : [replacement]});
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
		name.innerText = id + ": ";
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
			haxe_CallStack.lastException = e;
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return true;
		}
	}
	,__class__: Main
};
Math.__name__ = ["Math"];
var Random = function(_initial_seed) {
	this.initial = this.seed = _initial_seed;
	this.seed = this.initial;
};
Random.__name__ = ["Random"];
Random.prototype = {
	get: function() {
		return (this.seed = this.seed * 16807 % 2147483647) / 2147483647 + 0.000000000233;
	}
	,'float': function(min,max) {
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
	,bool: function(chance) {
		if(chance == null) chance = 0.5;
		return (this.seed = this.seed * 16807 % 2147483647) / 2147483647 + 0.000000000233 < chance;
	}
	,sign: function(chance) {
		if(chance == null) chance = 0.5;
		if((this.seed = this.seed * 16807 % 2147483647) / 2147483647 + 0.000000000233 < chance) return 1; else return -1;
	}
	,bit: function(chance) {
		if(chance == null) chance = 0.5;
		if((this.seed = this.seed * 16807 % 2147483647) / 2147483647 + 0.000000000233 < chance) return 1; else return 0;
	}
	,reset: function() {
		var s = this.seed;
		this.initial = this.seed = s;
		this.initial;
	}
	,seed: null
	,initial: null
	,set_initial: function(_initial) {
		this.initial = this.seed = _initial;
		return this.initial;
	}
	,__class__: Random
};
var Reflect = function() { };
Reflect.__name__ = ["Reflect"];
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
Reflect.setField = function(o,field,value) {
	o[field] = value;
};
Reflect.callMethod = function(o,func,args) {
	return func.apply(o,args);
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && !(f.__name__ || f.__ename__);
};
Reflect.compareMethods = function(f1,f2) {
	if(f1 == f2) return true;
	if(!Reflect.isFunction(f1) || !Reflect.isFunction(f2)) return false;
	return f1.scope == f2.scope && f1.method == f2.method && f1.method != null;
};
Reflect.isObject = function(v) {
	if(v == null) return false;
	var t = typeof(v);
	return t == "string" || t == "object" && v.__enum__ == null || t == "function" && (v.__name__ || v.__ename__) != null;
};
Reflect.deleteField = function(o,field) {
	if(!Object.prototype.hasOwnProperty.call(o,field)) return false;
	delete(o[field]);
	return true;
};
var Std = function() { };
Std.__name__ = ["Std"];
Std.instance = function(value,c) {
	if((value instanceof c)) return value; else return null;
};
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
Std.random = function(x) {
	if(x <= 0) return 0; else return Math.floor(Math.random() * x);
};
var StringBuf = function() {
	this.b = "";
};
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype = {
	b: null
	,add: function(x) {
		this.b += Std.string(x);
	}
	,__class__: StringBuf
};
var StringTools = function() { };
StringTools.__name__ = ["StringTools"];
StringTools.urlEncode = function(s) {
	return encodeURIComponent(s);
};
StringTools.htmlEscape = function(s,quotes) {
	s = s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
	if(quotes) return s.split("\"").join("&quot;").split("'").join("&#039;"); else return s;
};
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && HxOverrides.substr(s,0,start.length) == start;
};
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	return slen >= elen && HxOverrides.substr(s,slen - elen,elen) == end;
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
var ValueType = { __ename__ : ["ValueType"], __constructs__ : ["TNull","TInt","TFloat","TBool","TObject","TFunction","TClass","TEnum","TUnknown"] };
ValueType.TNull = ["TNull",0];
ValueType.TNull.toString = $estr;
ValueType.TNull.__enum__ = ValueType;
ValueType.TInt = ["TInt",1];
ValueType.TInt.toString = $estr;
ValueType.TInt.__enum__ = ValueType;
ValueType.TFloat = ["TFloat",2];
ValueType.TFloat.toString = $estr;
ValueType.TFloat.__enum__ = ValueType;
ValueType.TBool = ["TBool",3];
ValueType.TBool.toString = $estr;
ValueType.TBool.__enum__ = ValueType;
ValueType.TObject = ["TObject",4];
ValueType.TObject.toString = $estr;
ValueType.TObject.__enum__ = ValueType;
ValueType.TFunction = ["TFunction",5];
ValueType.TFunction.toString = $estr;
ValueType.TFunction.__enum__ = ValueType;
ValueType.TClass = function(c) { var $x = ["TClass",6,c]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TEnum = function(e) { var $x = ["TEnum",7,e]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TUnknown = ["TUnknown",8];
ValueType.TUnknown.toString = $estr;
ValueType.TUnknown.__enum__ = ValueType;
var Type = function() { };
Type.__name__ = ["Type"];
Type.getClass = function(o) {
	if(o == null) return null; else return js_Boot.getClass(o);
};
Type.getEnum = function(o) {
	if(o == null) return null;
	return o.__enum__;
};
Type.getSuperClass = function(c) {
	return c.__super__;
};
Type.getClassName = function(c) {
	var a = c.__name__;
	if(a == null) return null;
	return a.join(".");
};
Type.getEnumName = function(e) {
	var a = e.__ename__;
	return a.join(".");
};
Type.createEmptyInstance = function(cl) {
	function empty() {}; empty.prototype = cl.prototype;
	return new empty();
};
Type.getInstanceFields = function(c) {
	var a = [];
	for(var i in c.prototype) a.push(i);
	HxOverrides.remove(a,"__class__");
	HxOverrides.remove(a,"__properties__");
	return a;
};
Type["typeof"] = function(v) {
	var _g = typeof(v);
	switch(_g) {
	case "boolean":
		return ValueType.TBool;
	case "string":
		return ValueType.TClass(String);
	case "number":
		if(Math.ceil(v) == v % 2147483648.0) return ValueType.TInt;
		return ValueType.TFloat;
	case "object":
		if(v == null) return ValueType.TNull;
		var e = v.__enum__;
		if(e != null) return ValueType.TEnum(e);
		var c = js_Boot.getClass(v);
		if(c != null) return ValueType.TClass(c);
		return ValueType.TObject;
	case "function":
		if(v.__name__ || v.__ename__) return ValueType.TObject;
		return ValueType.TFunction;
	case "undefined":
		return ValueType.TNull;
	default:
		return ValueType.TUnknown;
	}
};
Type.enumConstructor = function(e) {
	return e[0];
};
Type.enumParameters = function(e) {
	return e.slice(2);
};
Type.enumIndex = function(e) {
	return e[1];
};
var haxe_StackItem = { __ename__ : ["haxe","StackItem"], __constructs__ : ["CFunction","Module","FilePos","Method","LocalFunction"] };
haxe_StackItem.CFunction = ["CFunction",0];
haxe_StackItem.CFunction.toString = $estr;
haxe_StackItem.CFunction.__enum__ = haxe_StackItem;
haxe_StackItem.Module = function(m) { var $x = ["Module",1,m]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.FilePos = function(s,file,line) { var $x = ["FilePos",2,s,file,line]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.Method = function(classname,method) { var $x = ["Method",3,classname,method]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.LocalFunction = function(v) { var $x = ["LocalFunction",4,v]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
var haxe_CallStack = function() { };
haxe_CallStack.__name__ = ["haxe","CallStack"];
haxe_CallStack.getStack = function(e) {
	if(e == null) return [];
	var oldValue = Error.prepareStackTrace;
	Error.prepareStackTrace = function(error,callsites) {
		var stack = [];
		var _g = 0;
		while(_g < callsites.length) {
			var site = callsites[_g];
			++_g;
			if(haxe_CallStack.wrapCallSite != null) site = haxe_CallStack.wrapCallSite(site);
			var method = null;
			var fullName = site.getFunctionName();
			if(fullName != null) {
				var idx = fullName.lastIndexOf(".");
				if(idx >= 0) {
					var className = HxOverrides.substr(fullName,0,idx);
					var methodName = HxOverrides.substr(fullName,idx + 1,null);
					method = haxe_StackItem.Method(className,methodName);
				}
			}
			stack.push(haxe_StackItem.FilePos(method,site.getFileName(),site.getLineNumber()));
		}
		return stack;
	};
	var a = haxe_CallStack.makeStack(e.stack);
	Error.prepareStackTrace = oldValue;
	return a;
};
haxe_CallStack.callStack = function() {
	try {
		throw new Error();
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		var a = haxe_CallStack.getStack(e);
		a.shift();
		return a;
	}
};
haxe_CallStack.exceptionStack = function() {
	return haxe_CallStack.getStack(haxe_CallStack.lastException);
};
haxe_CallStack.toString = function(stack) {
	var b = new StringBuf();
	var _g = 0;
	while(_g < stack.length) {
		var s = stack[_g];
		++_g;
		b.b += "\nCalled from ";
		haxe_CallStack.itemToString(b,s);
	}
	return b.b;
};
haxe_CallStack.itemToString = function(b,s) {
	switch(s[1]) {
	case 0:
		b.b += "a C function";
		break;
	case 1:
		var m = s[2];
		b.b += "module ";
		if(m == null) b.b += "null"; else b.b += "" + m;
		break;
	case 2:
		var line = s[4];
		var file = s[3];
		var s1 = s[2];
		if(s1 != null) {
			haxe_CallStack.itemToString(b,s1);
			b.b += " (";
		}
		if(file == null) b.b += "null"; else b.b += "" + file;
		b.b += " line ";
		if(line == null) b.b += "null"; else b.b += "" + line;
		if(s1 != null) b.b += ")";
		break;
	case 3:
		var meth = s[3];
		var cname = s[2];
		if(cname == null) b.b += "null"; else b.b += "" + cname;
		b.b += ".";
		if(meth == null) b.b += "null"; else b.b += "" + meth;
		break;
	case 4:
		var n = s[2];
		b.b += "local function #";
		if(n == null) b.b += "null"; else b.b += "" + n;
		break;
	}
};
haxe_CallStack.makeStack = function(s) {
	if(s == null) return []; else if(typeof(s) == "string") {
		var stack = s.split("\n");
		if(stack[0] == "Error") stack.shift();
		var m = [];
		var rie10 = new EReg("^   at ([A-Za-z0-9_. ]+) \\(([^)]+):([0-9]+):([0-9]+)\\)$","");
		var _g = 0;
		while(_g < stack.length) {
			var line = stack[_g];
			++_g;
			if(rie10.match(line)) {
				var path = rie10.matched(1).split(".");
				var meth = path.pop();
				var file = rie10.matched(2);
				var line1 = Std.parseInt(rie10.matched(3));
				m.push(haxe_StackItem.FilePos(meth == "Anonymous function"?haxe_StackItem.LocalFunction():meth == "Global code"?null:haxe_StackItem.Method(path.join("."),meth),file,line1));
			} else m.push(haxe_StackItem.Module(StringTools.trim(line)));
		}
		return m;
	} else return s;
};
var haxe_IMap = function() { };
haxe_IMap.__name__ = ["haxe","IMap"];
haxe_IMap.prototype = {
	get: null
	,set: null
	,exists: null
	,keys: null
	,__class__: haxe_IMap
};
var haxe_Http = function(url) {
	this.url = url;
	this.headers = new List();
	this.params = new List();
	this.async = true;
};
haxe_Http.__name__ = ["haxe","Http"];
haxe_Http.prototype = {
	url: null
	,responseData: null
	,async: null
	,postData: null
	,headers: null
	,params: null
	,req: null
	,cancel: function() {
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
				haxe_CallStack.lastException = e;
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
			haxe_CallStack.lastException = e1;
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
	,__class__: haxe_Http
};
var haxe_Log = function() { };
haxe_Log.__name__ = ["haxe","Log"];
haxe_Log.trace = function(v,infos) {
	js_Boot.__trace(v,infos);
};
var haxe_Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe_Timer.__name__ = ["haxe","Timer"];
haxe_Timer.delay = function(f,time_ms) {
	var t = new haxe_Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe_Timer.prototype = {
	id: null
	,stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
	,__class__: haxe_Timer
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
haxe_ds_StringMap.__name__ = ["haxe","ds","StringMap"];
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	h: null
	,rh: null
	,set: function(key,value) {
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
	,__class__: haxe_ds_StringMap
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
js__$Boot_HaxeError.__name__ = ["js","_Boot","HaxeError"];
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
	val: null
	,__class__: js__$Boot_HaxeError
});
var js_Boot = function() { };
js_Boot.__name__ = ["js","Boot"];
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
js_Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else {
		var cl = o.__class__;
		if(cl != null) return cl;
		var name = js_Boot.__nativeClassName(o);
		if(name != null) return js_Boot.__resolveNativeClass(name);
		return null;
	}
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
			haxe_CallStack.lastException = e;
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
js_Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js_Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js_Boot.__interfLoop(cc.__super__,cl);
};
js_Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js_Boot.__interfLoop(js_Boot.getClass(o),cl)) return true;
			} else if(typeof(cl) == "object" && js_Boot.__isNativeObj(cl)) {
				if(o instanceof cl) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js_Boot.__nativeClassName = function(o) {
	var name = js_Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") return null;
	return name;
};
js_Boot.__isNativeObj = function(o) {
	return js_Boot.__nativeClassName(o) != null;
};
js_Boot.__resolveNativeClass = function(name) {
	return (Function("return typeof " + name + " != \"undefined\" ? " + name + " : null"))();
};
var js_Browser = function() { };
js_Browser.__name__ = ["js","Browser"];
js_Browser.createXMLHttpRequest = function() {
	if(typeof XMLHttpRequest != "undefined") return new XMLHttpRequest();
	if(typeof ActiveXObject != "undefined") return new ActiveXObject("Microsoft.XMLHTTP");
	throw new js__$Boot_HaxeError("Unable to create XMLHttpRequest object.");
};
var js_Cookie = function() { };
js_Cookie.__name__ = ["js","Cookie"];
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
var thx_Arrays = function() { };
thx_Arrays.__name__ = ["thx","Arrays"];
thx_Arrays.after = function(array,element) {
	return array.slice(HxOverrides.indexOf(array,element,0) + 1);
};
thx_Arrays.all = function(arr,predicate) {
	var _g = 0;
	while(_g < arr.length) {
		var item = arr[_g];
		++_g;
		if(!predicate(item)) return false;
	}
	return true;
};
thx_Arrays.any = function(arr,predicate) {
	var _g = 0;
	while(_g < arr.length) {
		var item = arr[_g];
		++_g;
		if(predicate(item)) return true;
	}
	return false;
};
thx_Arrays.at = function(arr,indexes) {
	return indexes.map(function(i) {
		return arr[i];
	});
};
thx_Arrays.before = function(array,element) {
	return array.slice(0,HxOverrides.indexOf(array,element,0));
};
thx_Arrays.compact = function(arr) {
	return arr.filter(function(v) {
		return null != v;
	});
};
thx_Arrays.compare = function(a,b) {
	var v;
	if((v = a.length - b.length) != 0) return v;
	var _g1 = 0;
	var _g = a.length;
	while(_g1 < _g) {
		var i = _g1++;
		if((v = thx_Dynamics.compare(a[i],b[i])) != 0) return v;
	}
	return 0;
};
thx_Arrays.contains = function(array,element,eq) {
	if(null == eq) return HxOverrides.indexOf(array,element,0) >= 0; else {
		var _g1 = 0;
		var _g = array.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(eq(array[i],element)) return true;
		}
		return false;
	}
};
thx_Arrays.containsAny = function(array,elements,eq) {
	var $it0 = $iterator(elements)();
	while( $it0.hasNext() ) {
		var el = $it0.next();
		if(thx_Arrays.contains(array,el,eq)) return true;
	}
	return false;
};
thx_Arrays.cross = function(a,b) {
	var r = [];
	var _g = 0;
	while(_g < a.length) {
		var va = a[_g];
		++_g;
		var _g1 = 0;
		while(_g1 < b.length) {
			var vb = b[_g1];
			++_g1;
			r.push([va,vb]);
		}
	}
	return r;
};
thx_Arrays.crossMulti = function(array) {
	var acopy = array.slice();
	var result = acopy.shift().map(function(v) {
		return [v];
	});
	while(acopy.length > 0) {
		var array1 = acopy.shift();
		var tresult = result;
		result = [];
		var _g = 0;
		while(_g < array1.length) {
			var v1 = array1[_g];
			++_g;
			var _g1 = 0;
			while(_g1 < tresult.length) {
				var ar = tresult[_g1];
				++_g1;
				var t = ar.slice();
				t.push(v1);
				result.push(t);
			}
		}
	}
	return result;
};
thx_Arrays.distinct = function(array,predicate) {
	var result = [];
	if(array.length <= 1) return array;
	if(null == predicate) predicate = thx_Functions.equality;
	var _g = 0;
	while(_g < array.length) {
		var v = [array[_g]];
		++_g;
		var keep = !thx_Arrays.any(result,(function(v) {
			return function(r) {
				return predicate(r,v[0]);
			};
		})(v));
		if(keep) result.push(v[0]);
	}
	return result;
};
thx_Arrays.eachPair = function(array,callback) {
	var _g1 = 0;
	var _g = array.length;
	while(_g1 < _g) {
		var i = _g1++;
		var _g3 = i;
		var _g2 = array.length;
		while(_g3 < _g2) {
			var j = _g3++;
			if(!callback(array[i],array[j])) return;
		}
	}
};
thx_Arrays.equals = function(a,b,equality) {
	if(a == null || b == null || a.length != b.length) return false;
	if(null == equality) equality = thx_Functions.equality;
	var _g1 = 0;
	var _g = a.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(!equality(a[i],b[i])) return false;
	}
	return true;
};
thx_Arrays.extract = function(a,predicate) {
	var _g1 = 0;
	var _g = a.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(predicate(a[i])) return a.splice(i,1)[0];
	}
	return null;
};
thx_Arrays.filterNull = function(a) {
	var arr = [];
	var _g = 0;
	while(_g < a.length) {
		var v = a[_g];
		++_g;
		if(null != v) arr.push(v);
	}
	return arr;
};
thx_Arrays.find = function(array,predicate) {
	var _g = 0;
	while(_g < array.length) {
		var item = array[_g];
		++_g;
		if(predicate(item)) return item;
	}
	return null;
};
thx_Arrays.findLast = function(array,predicate) {
	var len = array.length;
	var j;
	var _g = 0;
	while(_g < len) {
		var i = _g++;
		j = len - i - 1;
		if(predicate(array[j])) return array[j];
	}
	return null;
};
thx_Arrays.first = function(array) {
	return array[0];
};
thx_Arrays.flatMap = function(array,callback) {
	return thx_Arrays.flatten(array.map(callback));
};
thx_Arrays.flatten = function(array) {
	return Array.prototype.concat.apply([],array);
};
thx_Arrays.from = function(array,element) {
	return array.slice(HxOverrides.indexOf(array,element,0));
};
thx_Arrays.groupByAppend = function(arr,resolver,map) {
	arr.map(function(v) {
		var key = resolver(v);
		var arr1 = map.get(key);
		if(null == arr1) {
			arr1 = [v];
			map.set(key,arr1);
		} else arr1.push(v);
	});
	return map;
};
thx_Arrays.head = function(array) {
	return array[0];
};
thx_Arrays.ifEmpty = function(value,alt) {
	if(null != value && 0 != value.length) return value; else return alt;
};
thx_Arrays.initial = function(array) {
	return array.slice(0,array.length - 1);
};
thx_Arrays.isEmpty = function(array) {
	return array.length == 0;
};
thx_Arrays.last = function(array) {
	return array[array.length - 1];
};
thx_Arrays.mapi = function(array,callback) {
	var r = [];
	var _g1 = 0;
	var _g = array.length;
	while(_g1 < _g) {
		var i = _g1++;
		r.push(callback(array[i],i));
	}
	return r;
};
thx_Arrays.mapRight = function(array,callback) {
	var i = array.length;
	var result = [];
	while(--i >= 0) result.push(callback(array[i]));
	return result;
};
thx_Arrays.order = function(array,sort) {
	var n = array.slice();
	n.sort(sort);
	return n;
};
thx_Arrays.pull = function(array,toRemove,equality) {
	var _g = 0;
	while(_g < toRemove.length) {
		var item = toRemove[_g];
		++_g;
		thx_Arrays.removeAll(array,item,equality);
	}
};
thx_Arrays.pushIf = function(array,condition,value) {
	if(condition) array.push(value);
	return array;
};
thx_Arrays.reduce = function(array,callback,initial) {
	return array.reduce(callback,initial);
};
thx_Arrays.resize = function(array,length,fill) {
	while(array.length < length) array.push(fill);
	array.splice(length,array.length - length);
	return array;
};
thx_Arrays.reducei = function(array,callback,initial) {
	return array.reduce(callback,initial);
};
thx_Arrays.reduceRight = function(array,callback,initial) {
	var i = array.length;
	while(--i >= 0) initial = callback(initial,array[i]);
	return initial;
};
thx_Arrays.removeAll = function(array,element,equality) {
	if(null == equality) equality = thx_Functions.equality;
	var i = array.length;
	while(--i >= 0) if(equality(array[i],element)) array.splice(i,1);
};
thx_Arrays.rest = function(array) {
	return array.slice(1);
};
thx_Arrays.sample = function(array,n) {
	n = thx_Ints.min(n,array.length);
	var copy = array.slice();
	var result = [];
	var _g = 0;
	while(_g < n) {
		var i = _g++;
		result.push(copy.splice(Std.random(copy.length),1)[0]);
	}
	return result;
};
thx_Arrays.sampleOne = function(array) {
	return array[Std.random(array.length)];
};
thx_Arrays.string = function(arr) {
	return "[" + arr.map(thx_Dynamics.string).join(", ") + "]";
};
thx_Arrays.shuffle = function(a) {
	var t = thx_Ints.range(a.length);
	var array = [];
	while(t.length > 0) {
		var pos = Std.random(t.length);
		var index = t[pos];
		t.splice(pos,1);
		array.push(a[index]);
	}
	return array;
};
thx_Arrays.split = function(array,parts) {
	var len = Math.ceil(array.length / parts);
	return thx_Arrays.splitBy(array,len);
};
thx_Arrays.splitBy = function(array,len) {
	var res = [];
	len = thx_Ints.min(len,array.length);
	var _g1 = 0;
	var _g = Math.ceil(array.length / len);
	while(_g1 < _g) {
		var p = _g1++;
		res.push(array.slice(p * len,(p + 1) * len));
	}
	return res;
};
thx_Arrays.take = function(arr,n) {
	return arr.slice(0,n);
};
thx_Arrays.takeLast = function(arr,n) {
	return arr.slice(arr.length - n);
};
thx_Arrays.rotate = function(arr) {
	var result = [];
	var _g1 = 0;
	var _g = arr[0].length;
	while(_g1 < _g) {
		var i = _g1++;
		var row = [];
		result.push(row);
		var _g3 = 0;
		var _g2 = arr.length;
		while(_g3 < _g2) {
			var j = _g3++;
			row.push(arr[j][i]);
		}
	}
	return result;
};
thx_Arrays.unzip = function(array) {
	var a1 = [];
	var a2 = [];
	array.map(function(t) {
		a1.push(t._0);
		a2.push(t._1);
	});
	return { _0 : a1, _1 : a2};
};
thx_Arrays.unzip3 = function(array) {
	var a1 = [];
	var a2 = [];
	var a3 = [];
	array.map(function(t) {
		a1.push(t._0);
		a2.push(t._1);
		a3.push(t._2);
	});
	return { _0 : a1, _1 : a2, _2 : a3};
};
thx_Arrays.unzip4 = function(array) {
	var a1 = [];
	var a2 = [];
	var a3 = [];
	var a4 = [];
	array.map(function(t) {
		a1.push(t._0);
		a2.push(t._1);
		a3.push(t._2);
		a4.push(t._3);
	});
	return { _0 : a1, _1 : a2, _2 : a3, _3 : a4};
};
thx_Arrays.unzip5 = function(array) {
	var a1 = [];
	var a2 = [];
	var a3 = [];
	var a4 = [];
	var a5 = [];
	array.map(function(t) {
		a1.push(t._0);
		a2.push(t._1);
		a3.push(t._2);
		a4.push(t._3);
		a5.push(t._4);
	});
	return { _0 : a1, _1 : a2, _2 : a3, _3 : a4, _4 : a5};
};
thx_Arrays.zip = function(array1,array2) {
	var length = thx_Ints.min(array1.length,array2.length);
	var array = [];
	var _g = 0;
	while(_g < length) {
		var i = _g++;
		array.push({ _0 : array1[i], _1 : array2[i]});
	}
	return array;
};
thx_Arrays.zip3 = function(array1,array2,array3) {
	var length = thx_ArrayInts.min([array1.length,array2.length,array3.length]);
	var array = [];
	var _g = 0;
	while(_g < length) {
		var i = _g++;
		array.push({ _0 : array1[i], _1 : array2[i], _2 : array3[i]});
	}
	return array;
};
thx_Arrays.zip4 = function(array1,array2,array3,array4) {
	var length = thx_ArrayInts.min([array1.length,array2.length,array3.length,array4.length]);
	var array = [];
	var _g = 0;
	while(_g < length) {
		var i = _g++;
		array.push({ _0 : array1[i], _1 : array2[i], _2 : array3[i], _3 : array4[i]});
	}
	return array;
};
thx_Arrays.zip5 = function(array1,array2,array3,array4,array5) {
	var length = thx_ArrayInts.min([array1.length,array2.length,array3.length,array4.length,array5.length]);
	var array = [];
	var _g = 0;
	while(_g < length) {
		var i = _g++;
		array.push({ _0 : array1[i], _1 : array2[i], _2 : array3[i], _3 : array4[i], _4 : array5[i]});
	}
	return array;
};
var thx_ArrayFloats = function() { };
thx_ArrayFloats.__name__ = ["thx","ArrayFloats"];
thx_ArrayFloats.average = function(arr) {
	return thx_ArrayFloats.sum(arr) / arr.length;
};
thx_ArrayFloats.compact = function(arr) {
	return arr.filter(function(v) {
		return null != v && isFinite(v);
	});
};
thx_ArrayFloats.max = function(arr) {
	if(arr.length == 0) return null; else return arr.reduce(function(max,v) {
		if(v > max) return v; else return max;
	},arr[0]);
};
thx_ArrayFloats.min = function(arr) {
	if(arr.length == 0) return null; else return arr.reduce(function(min,v) {
		if(v < min) return v; else return min;
	},arr[0]);
};
thx_ArrayFloats.resize = function(array,length,fill) {
	if(fill == null) fill = 0.0;
	while(array.length < length) array.push(fill);
	array.splice(length,array.length - length);
	return array;
};
thx_ArrayFloats.sum = function(arr) {
	return arr.reduce(function(tot,v) {
		return tot + v;
	},0.0);
};
var thx_ArrayInts = function() { };
thx_ArrayInts.__name__ = ["thx","ArrayInts"];
thx_ArrayInts.average = function(arr) {
	return thx_ArrayInts.sum(arr) / arr.length;
};
thx_ArrayInts.max = function(arr) {
	if(arr.length == 0) return null; else return arr.reduce(function(max,v) {
		if(v > max) return v; else return max;
	},arr[0]);
};
thx_ArrayInts.min = function(arr) {
	if(arr.length == 0) return null; else return arr.reduce(function(min,v) {
		if(v < min) return v; else return min;
	},arr[0]);
};
thx_ArrayInts.resize = function(array,length,fill) {
	if(fill == null) fill = 0;
	while(array.length < length) array.push(fill);
	array.splice(length,array.length - length);
	return array;
};
thx_ArrayInts.sum = function(arr) {
	return arr.reduce(function(tot,v) {
		return tot + v;
	},0);
};
var thx_ArrayStrings = function() { };
thx_ArrayStrings.__name__ = ["thx","ArrayStrings"];
thx_ArrayStrings.compact = function(arr) {
	return arr.filter(function(v) {
		return !thx_Strings.isEmpty(v);
	});
};
thx_ArrayStrings.max = function(arr) {
	if(arr.length == 0) return null; else return arr.reduce(function(max,v) {
		if(v > max) return v; else return max;
	},arr[0]);
};
thx_ArrayStrings.min = function(arr) {
	if(arr.length == 0) return null; else return arr.reduce(function(min,v) {
		if(v < min) return v; else return min;
	},arr[0]);
};
var thx_Bools = function() { };
thx_Bools.__name__ = ["thx","Bools"];
thx_Bools.compare = function(a,b) {
	if(a == b) return 0; else if(a) return -1; else return 1;
};
thx_Bools.toInt = function(v) {
	if(v) return 1; else return 0;
};
thx_Bools.canParse = function(v) {
	var _g = v.toLowerCase();
	if(_g == null) return true; else switch(_g) {
	case "true":case "false":case "0":case "1":case "on":case "off":
		return true;
	default:
		return false;
	}
};
thx_Bools.parse = function(v) {
	var _g = v.toLowerCase();
	var v1 = _g;
	if(_g == null) return false; else switch(_g) {
	case "true":case "1":case "on":
		return true;
	case "false":case "0":case "off":
		return false;
	default:
		throw new js__$Boot_HaxeError("unable to parse \"" + v1 + "\"");
	}
};
var thx_Dates = function() { };
thx_Dates.__name__ = ["thx","Dates"];
thx_Dates.compare = function(a,b) {
	return thx_Floats.compare(a.getTime(),b.getTime());
};
thx_Dates.create = function(year,month,day,hour,minute,second) {
	if(second == null) second = 0;
	if(minute == null) minute = 0;
	if(hour == null) hour = 0;
	if(day == null) day = 1;
	if(month == null) month = 0;
	minute += Math.floor(second / 60);
	second = second % 60;
	if(second < 0) second += 60;
	hour += Math.floor(minute / 60);
	minute = minute % 60;
	if(minute < 0) minute += 60;
	day += Math.floor(hour / 24);
	hour = hour % 24;
	if(hour < 0) hour += 24;
	if(day == 0) {
		month -= 1;
		if(month < 0) {
			month = 11;
			year -= 1;
		}
		day = thx_Dates.numDaysInMonth(month,year);
	}
	year += Math.floor(month / 12);
	month = month % 12;
	if(month < 0) month += 12;
	var daysInMonth = thx_Dates.numDaysInMonth(month,year);
	while(day > daysInMonth) {
		if(day > daysInMonth) {
			day -= daysInMonth;
			month++;
		}
		if(month > 11) {
			month -= 12;
			year++;
		}
		daysInMonth = thx_Dates.numDaysInMonth(month,year);
	}
	return new Date(year,month,day,hour,minute,second);
};
thx_Dates.daysRange = function(start,end) {
	if(end.getTime() < start.getTime()) return [];
	var days = [];
	while(!thx_Dates.sameDay(start,end)) {
		days.push(start);
		start = thx_Dates.jump(start,thx_TimePeriod.Day,1);
	}
	days.push(end);
	return days;
};
thx_Dates.equals = function(self,other) {
	return self.getTime() == other.getTime();
};
thx_Dates.nearEquals = function(self,other,units,period) {
	if(units == null) units = 1;
	if(null == period) period = thx_TimePeriod.Second;
	if(units < 0) units = -units;
	var min = thx_Dates.jump(self,period,-units);
	var max = thx_Dates.jump(self,period,units);
	return min.getTime() <= other.getTime() && max.getTime() >= other.getTime();
};
thx_Dates.more = function(self,other) {
	return self.getTime() > other.getTime();
};
thx_Dates.less = function(self,other) {
	return self.getTime() < other.getTime();
};
thx_Dates.moreEqual = function(self,other) {
	return self.getTime() >= other.getTime();
};
thx_Dates.lessEqual = function(self,other) {
	return self.getTime() <= other.getTime();
};
thx_Dates.isLeapYear = function(year) {
	if(year % 4 != 0) return false;
	if(year % 100 == 0) return year % 400 == 0;
	return true;
};
thx_Dates.isInLeapYear = function(d) {
	return thx_Dates.isLeapYear(d.getFullYear());
};
thx_Dates.numDaysInMonth = function(month,year) {
	switch(month) {
	case 0:case 2:case 4:case 6:case 7:case 9:case 11:
		return 31;
	case 3:case 5:case 8:case 10:
		return 30;
	case 1:
		if(thx_Dates.isLeapYear(year)) return 29; else return 28;
		break;
	default:
		throw new js__$Boot_HaxeError("Invalid month \"" + month + "\".  Month should be a number, Jan=0, Dec=11");
	}
};
thx_Dates.numDaysInThisMonth = function(d) {
	return thx_Dates.numDaysInMonth(d.getMonth(),d.getFullYear());
};
thx_Dates.sameYear = function(self,other) {
	return self.getFullYear() == other.getFullYear();
};
thx_Dates.sameMonth = function(self,other) {
	return thx_Dates.sameYear(self,other) && self.getFullYear() == other.getFullYear();
};
thx_Dates.sameDay = function(self,other) {
	return thx_Dates.sameMonth(self,other) && self.getDate() == other.getDate();
};
thx_Dates.sameHour = function(self,other) {
	return thx_Dates.sameDay(self,other) && self.getHours() == other.getHours();
};
thx_Dates.sameMinute = function(self,other) {
	return thx_Dates.sameHour(self,other) && self.getMinutes() == other.getMinutes();
};
thx_Dates.snapNext = function(date,period) {
	var t = thx_Timestamps.snapNext(date.getTime(),period);
	var d = new Date();
	d.setTime(t);
	return d;
};
thx_Dates.snapPrev = function(date,period) {
	var t = thx_Timestamps.snapPrev(date.getTime(),period);
	var d = new Date();
	d.setTime(t);
	return d;
};
thx_Dates.snapTo = function(date,period) {
	var t = thx_Timestamps.snapTo(date.getTime(),period);
	var d = new Date();
	d.setTime(t);
	return d;
};
thx_Dates.jump = function(date,period,amount) {
	var sec = date.getSeconds();
	var min = date.getMinutes();
	var hour = date.getHours();
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	switch(period[1]) {
	case 0:
		sec += amount;
		break;
	case 1:
		min += amount;
		break;
	case 2:
		hour += amount;
		break;
	case 3:
		day += amount;
		break;
	case 4:
		day += amount * 7;
		break;
	case 5:
		month += amount;
		break;
	case 6:
		year += amount;
		break;
	}
	return thx_Dates.create(year,month,day,hour,min,sec);
};
thx_Dates.max = function(self,other) {
	if(self.getTime() > other.getTime()) return self; else return other;
};
thx_Dates.min = function(self,other) {
	if(self.getTime() < other.getTime()) return self; else return other;
};
thx_Dates.snapToWeekDay = function(date,day,firstDayOfWk) {
	if(firstDayOfWk == null) firstDayOfWk = 0;
	var d = date.getDay();
	var s = day;
	if(s < firstDayOfWk) s = s + 7;
	if(d < firstDayOfWk) d = d + 7;
	return thx_Dates.jump(date,thx_TimePeriod.Day,s - d);
};
thx_Dates.snapNextWeekDay = function(date,day) {
	var d = date.getDay();
	var s = day;
	if(s < d) s = s + 7;
	return thx_Dates.jump(date,thx_TimePeriod.Day,s - d);
};
thx_Dates.snapPrevWeekDay = function(date,day) {
	var d = date.getDay();
	var s = day;
	if(s > d) s = s - 7;
	return thx_Dates.jump(date,thx_TimePeriod.Day,s - d);
};
thx_Dates.prevYear = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Year,-1);
};
thx_Dates.nextYear = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Year,1);
};
thx_Dates.prevMonth = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Month,-1);
};
thx_Dates.nextMonth = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Month,1);
};
thx_Dates.prevWeek = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Week,-1);
};
thx_Dates.nextWeek = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Week,1);
};
thx_Dates.prevDay = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Day,-1);
};
thx_Dates.nextDay = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Day,1);
};
thx_Dates.prevHour = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Hour,-1);
};
thx_Dates.nextHour = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Hour,1);
};
thx_Dates.prevMinute = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Minute,-1);
};
thx_Dates.nextMinute = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Minute,1);
};
thx_Dates.prevSecond = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Second,-1);
};
thx_Dates.nextSecond = function(d) {
	return thx_Dates.jump(d,thx_TimePeriod.Second,1);
};
thx_Dates.withYear = function(date,year) {
	return thx_Dates.create(year,date.getMonth(),date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds());
};
thx_Dates.withMonth = function(date,month) {
	return thx_Dates.create(date.getFullYear(),month,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds());
};
thx_Dates.withDay = function(date,day) {
	return thx_Dates.create(date.getFullYear(),date.getMonth(),day,date.getHours(),date.getMinutes(),date.getSeconds());
};
thx_Dates.withHour = function(date,hour) {
	return thx_Dates.create(date.getFullYear(),date.getMonth(),date.getDate(),hour,date.getMinutes(),date.getSeconds());
};
thx_Dates.withMinute = function(date,minute) {
	return thx_Dates.create(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),minute,date.getSeconds());
};
thx_Dates.withSecond = function(date,second) {
	return thx_Dates.create(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),date.getMinutes(),second);
};
var thx_Timestamps = function() { };
thx_Timestamps.__name__ = ["thx","Timestamps"];
thx_Timestamps.create = function(year,month,day,hour,minute,second) {
	return thx_Dates.create(year,month,day,hour,minute,second).getTime();
};
thx_Timestamps.snapNext = function(time,period) {
	switch(period[1]) {
	case 0:
		return Math.ceil(time / 1000.0) * 1000.0;
	case 1:
		return Math.ceil(time / 60000.0) * 60000.0;
	case 2:
		return Math.ceil(time / 3600000.0) * 3600000.0;
	case 3:
		var d;
		var d1 = new Date();
		d1.setTime(time);
		d = d1;
		return thx_Timestamps.create(d.getFullYear(),d.getMonth(),d.getDate() + 1,0,0,0);
	case 4:
		var d2;
		var d3 = new Date();
		d3.setTime(time);
		d2 = d3;
		var wd = d2.getDay();
		return thx_Timestamps.create(d2.getFullYear(),d2.getMonth(),d2.getDate() + 7 - wd,0,0,0);
	case 5:
		var d4;
		var d5 = new Date();
		d5.setTime(time);
		d4 = d5;
		return thx_Timestamps.create(d4.getFullYear(),d4.getMonth() + 1,1,0,0,0);
	case 6:
		var d6;
		var d7 = new Date();
		d7.setTime(time);
		d6 = d7;
		return thx_Timestamps.create(d6.getFullYear() + 1,0,1,0,0,0);
	}
};
thx_Timestamps.snapPrev = function(time,period) {
	switch(period[1]) {
	case 0:
		return Math.floor(time / 1000.0) * 1000.0;
	case 1:
		return Math.floor(time / 60000.0) * 60000.0;
	case 2:
		return Math.floor(time / 3600000.0) * 3600000.0;
	case 3:
		var d;
		var d1 = new Date();
		d1.setTime(time);
		d = d1;
		return thx_Timestamps.create(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0);
	case 4:
		var d2;
		var d3 = new Date();
		d3.setTime(time);
		d2 = d3;
		var wd = d2.getDay();
		return thx_Timestamps.create(d2.getFullYear(),d2.getMonth(),d2.getDate() - wd,0,0,0);
	case 5:
		var d4;
		var d5 = new Date();
		d5.setTime(time);
		d4 = d5;
		return thx_Timestamps.create(d4.getFullYear(),d4.getMonth(),1,0,0,0);
	case 6:
		var d6;
		var d7 = new Date();
		d7.setTime(time);
		d6 = d7;
		return thx_Timestamps.create(d6.getFullYear(),0,1,0,0,0);
	}
};
thx_Timestamps.snapTo = function(time,period) {
	switch(period[1]) {
	case 0:
		return Math.round(time / 1000.0) * 1000.0;
	case 1:
		return Math.round(time / 60000.0) * 60000.0;
	case 2:
		return Math.round(time / 3600000.0) * 3600000.0;
	case 3:
		var d;
		var d1 = new Date();
		d1.setTime(time);
		d = d1;
		var mod;
		if(d.getHours() >= 12) mod = 1; else mod = 0;
		return thx_Timestamps.create(d.getFullYear(),d.getMonth(),d.getDate() + mod,0,0,0);
	case 4:
		var d2;
		var d3 = new Date();
		d3.setTime(time);
		d2 = d3;
		var wd = d2.getDay();
		var mod1;
		if(wd < 3) mod1 = -wd; else if(wd > 3) mod1 = 7 - wd; else if(d2.getHours() < 12) mod1 = -wd; else mod1 = 7 - wd;
		return thx_Timestamps.create(d2.getFullYear(),d2.getMonth(),d2.getDate() + mod1,0,0,0);
	case 5:
		var d4;
		var d5 = new Date();
		d5.setTime(time);
		d4 = d5;
		var mod2;
		if(d4.getDate() > Math.round(DateTools.getMonthDays(d4) / 2)) mod2 = 1; else mod2 = 0;
		return thx_Timestamps.create(d4.getFullYear(),d4.getMonth() + mod2,1,0,0,0);
	case 6:
		var d6;
		var d7 = new Date();
		d7.setTime(time);
		d6 = d7;
		var mod3;
		if(time > new Date(d6.getFullYear(),6,2,0,0,0).getTime()) mod3 = 1; else mod3 = 0;
		return thx_Timestamps.create(d6.getFullYear() + mod3,0,1,0,0,0);
	}
};
thx_Timestamps.snapToWeekDay = function(time,day,firstDayOfWk) {
	return thx_Dates.snapToWeekDay((function($this) {
		var $r;
		var d = new Date();
		d.setTime(time);
		$r = d;
		return $r;
	}(this)),day,firstDayOfWk).getTime();
};
thx_Timestamps.snapNextWeekDay = function(time,day) {
	return thx_Dates.snapNextWeekDay((function($this) {
		var $r;
		var d = new Date();
		d.setTime(time);
		$r = d;
		return $r;
	}(this)),day).getTime();
};
thx_Timestamps.snapPrevWeekDay = function(time,day) {
	return thx_Dates.snapPrevWeekDay((function($this) {
		var $r;
		var d = new Date();
		d.setTime(time);
		$r = d;
		return $r;
	}(this)),day).getTime();
};
thx_Timestamps.r = function(t,v) {
	return Math.round(t / v) * v;
};
thx_Timestamps.f = function(t,v) {
	return Math.floor(t / v) * v;
};
thx_Timestamps.c = function(t,v) {
	return Math.ceil(t / v) * v;
};
var thx_TimePeriod = { __ename__ : ["thx","TimePeriod"], __constructs__ : ["Second","Minute","Hour","Day","Week","Month","Year"] };
thx_TimePeriod.Second = ["Second",0];
thx_TimePeriod.Second.toString = $estr;
thx_TimePeriod.Second.__enum__ = thx_TimePeriod;
thx_TimePeriod.Minute = ["Minute",1];
thx_TimePeriod.Minute.toString = $estr;
thx_TimePeriod.Minute.__enum__ = thx_TimePeriod;
thx_TimePeriod.Hour = ["Hour",2];
thx_TimePeriod.Hour.toString = $estr;
thx_TimePeriod.Hour.__enum__ = thx_TimePeriod;
thx_TimePeriod.Day = ["Day",3];
thx_TimePeriod.Day.toString = $estr;
thx_TimePeriod.Day.__enum__ = thx_TimePeriod;
thx_TimePeriod.Week = ["Week",4];
thx_TimePeriod.Week.toString = $estr;
thx_TimePeriod.Week.__enum__ = thx_TimePeriod;
thx_TimePeriod.Month = ["Month",5];
thx_TimePeriod.Month.toString = $estr;
thx_TimePeriod.Month.__enum__ = thx_TimePeriod;
thx_TimePeriod.Year = ["Year",6];
thx_TimePeriod.Year.toString = $estr;
thx_TimePeriod.Year.__enum__ = thx_TimePeriod;
var thx_Dynamics = function() { };
thx_Dynamics.__name__ = ["thx","Dynamics"];
thx_Dynamics.equals = function(a,b) {
	if(!thx_Types.sameType(a,b)) return false;
	if(a == b) return true;
	{
		var _g = Type["typeof"](a);
		switch(_g[1]) {
		case 2:case 0:case 1:case 3:
			return false;
		case 5:
			return Reflect.compareMethods(a,b);
		case 6:
			var c = _g[2];
			var ca = Type.getClassName(c);
			var cb = Type.getClassName(b == null?null:js_Boot.getClass(b));
			if(ca != cb) return false;
			if(typeof(a) == "string") return false;
			if((a instanceof Array) && a.__enum__ == null) {
				var aa = a;
				var ab = b;
				if(aa.length != ab.length) return false;
				var _g2 = 0;
				var _g1 = aa.length;
				while(_g2 < _g1) {
					var i = _g2++;
					if(!thx_Dynamics.equals(aa[i],ab[i])) return false;
				}
				return true;
			}
			if(js_Boot.__instanceof(a,Date)) return a.getTime() == b.getTime();
			if(js_Boot.__instanceof(a,haxe_IMap)) {
				var ha = a;
				var hb = b;
				var ka = thx_Iterators.toArray(ha.keys());
				var kb = thx_Iterators.toArray(hb.keys());
				if(ka.length != kb.length) return false;
				var _g11 = 0;
				while(_g11 < ka.length) {
					var key = ka[_g11];
					++_g11;
					if(!hb.exists(key) || !thx_Dynamics.equals(ha.get(key),hb.get(key))) return false;
				}
				return true;
			}
			var t = false;
			if((t = thx_Iterators.isIterator(a)) || thx_Iterables.isIterable(a)) {
				var va;
				if(t) va = thx_Iterators.toArray(a); else va = thx_Iterators.toArray($iterator(a)());
				var vb;
				if(t) vb = thx_Iterators.toArray(b); else vb = thx_Iterators.toArray($iterator(b)());
				if(va.length != vb.length) return false;
				var _g21 = 0;
				var _g12 = va.length;
				while(_g21 < _g12) {
					var i1 = _g21++;
					if(!thx_Dynamics.equals(va[i1],vb[i1])) return false;
				}
				return true;
			}
			var f = null;
			if(Object.prototype.hasOwnProperty.call(a,"equals") && Reflect.isFunction(f = Reflect.field(a,"equals"))) return f.apply(a,[b]);
			var fields = Type.getInstanceFields(a == null?null:js_Boot.getClass(a));
			var _g13 = 0;
			while(_g13 < fields.length) {
				var field = fields[_g13];
				++_g13;
				var va1 = Reflect.field(a,field);
				if(Reflect.isFunction(va1)) continue;
				var vb1 = Reflect.field(b,field);
				if(!thx_Dynamics.equals(va1,vb1)) return false;
			}
			return true;
		case 7:
			var e = _g[2];
			var ea = Type.getEnumName(e);
			var teb = Type.getEnum(b);
			var eb = Type.getEnumName(teb);
			if(ea != eb) return false;
			if(a[1] != b[1]) return false;
			var pa = a.slice(2);
			var pb = b.slice(2);
			var _g22 = 0;
			var _g14 = pa.length;
			while(_g22 < _g14) {
				var i2 = _g22++;
				if(!thx_Dynamics.equals(pa[i2],pb[i2])) return false;
			}
			return true;
		case 4:
			var fa = Reflect.fields(a);
			var fb = Reflect.fields(b);
			var _g15 = 0;
			while(_g15 < fa.length) {
				var field1 = fa[_g15];
				++_g15;
				HxOverrides.remove(fb,field1);
				if(!Object.prototype.hasOwnProperty.call(b,field1)) return false;
				var va2 = Reflect.field(a,field1);
				if(Reflect.isFunction(va2)) continue;
				var vb2 = Reflect.field(b,field1);
				if(!thx_Dynamics.equals(va2,vb2)) return false;
			}
			if(fb.length > 0) return false;
			var t1 = false;
			if((t1 = thx_Iterators.isIterator(a)) || thx_Iterables.isIterable(a)) {
				if(t1 && !thx_Iterators.isIterator(b)) return false;
				if(!t1 && !thx_Iterables.isIterable(b)) return false;
				var aa1;
				if(t1) aa1 = thx_Iterators.toArray(a); else aa1 = thx_Iterators.toArray($iterator(a)());
				var ab1;
				if(t1) ab1 = thx_Iterators.toArray(b); else ab1 = thx_Iterators.toArray($iterator(b)());
				if(aa1.length != ab1.length) return false;
				var _g23 = 0;
				var _g16 = aa1.length;
				while(_g23 < _g16) {
					var i3 = _g23++;
					if(!thx_Dynamics.equals(aa1[i3],ab1[i3])) return false;
				}
				return true;
			}
			return true;
		case 8:
			throw new js__$Boot_HaxeError("Unable to compare two unknown types");
			break;
		}
	}
	throw new thx_Error("Unable to compare values: " + Std.string(a) + " and " + Std.string(b),null,{ fileName : "Dynamics.hx", lineNumber : 153, className : "thx.Dynamics", methodName : "equals"});
};
thx_Dynamics.clone = function(v,cloneInstances) {
	if(cloneInstances == null) cloneInstances = false;
	{
		var _g = Type["typeof"](v);
		switch(_g[1]) {
		case 0:
			return null;
		case 1:case 2:case 3:case 7:case 8:case 5:
			return v;
		case 4:
			return thx_Objects.copyTo(v,{ });
		case 6:
			var c = _g[2];
			var name = Type.getClassName(c);
			switch(name) {
			case "Array":
				return v.map(function(v1) {
					return thx_Dynamics.clone(v1,cloneInstances);
				});
			case "String":case "Date":
				return v;
			default:
				if(cloneInstances) {
					var o = Type.createEmptyInstance(c);
					var _g1 = 0;
					var _g2 = Type.getInstanceFields(c);
					while(_g1 < _g2.length) {
						var field = _g2[_g1];
						++_g1;
						Reflect.setField(o,field,thx_Dynamics.clone(Reflect.field(v,field),cloneInstances));
					}
					return o;
				} else return v;
			}
			break;
		}
	}
};
thx_Dynamics.compare = function(a,b) {
	if(null == a && null == b) return 0;
	if(null == a) return -1;
	if(null == b) return 1;
	if(!thx_Types.sameType(a,b)) return thx_Strings.compare(thx_Types.valueTypeToString(a),thx_Types.valueTypeToString(b));
	{
		var _g = Type["typeof"](a);
		switch(_g[1]) {
		case 1:
			return thx_Ints.compare(a,b);
		case 2:
			return thx_Floats.compare(a,b);
		case 3:
			return thx_Bools.compare(a,b);
		case 4:
			return thx_Objects.compare(a,b);
		case 6:
			var c = _g[2];
			var name = Type.getClassName(c);
			switch(name) {
			case "Array":
				return thx_Arrays.compare(a,b);
			case "String":
				return thx_Strings.compare(a,b);
			case "Date":
				return thx_Dates.compare(a,b);
			default:
				if(Object.prototype.hasOwnProperty.call(a,"compare")) return Reflect.callMethod(a,Reflect.field(a,"compare"),[b]); else return thx_Strings.compare(Std.string(a),Std.string(b));
			}
			break;
		case 7:
			var e = _g[2];
			return thx_Enums.compare(a,b);
		default:
			return 0;
		}
	}
};
thx_Dynamics.string = function(v) {
	{
		var _g = Type["typeof"](v);
		switch(_g[1]) {
		case 0:
			return "null";
		case 1:case 2:case 3:
			return "" + Std.string(v);
		case 4:
			return thx_Objects.string(v);
		case 6:
			var c = _g[2];
			var name = Type.getClassName(c);
			switch(name) {
			case "Array":
				return thx_Arrays.string(v);
			case "String":
				return thx_Strings.quote(v);
			case "Date":
				return HxOverrides.dateStr(v);
			default:
				return Std.string(v);
			}
			break;
		case 7:
			var e = _g[2];
			return thx_Enums.string(v);
		case 8:
			return "<unknown>";
		case 5:
			return "<function>";
		}
	}
};
var thx_DynamicsT = function() { };
thx_DynamicsT.__name__ = ["thx","DynamicsT"];
thx_DynamicsT.isEmpty = function(o) {
	return Reflect.fields(o).length == 0;
};
thx_DynamicsT.exists = function(o,name) {
	return Object.prototype.hasOwnProperty.call(o,name);
};
thx_DynamicsT.fields = function(o) {
	return Reflect.fields(o);
};
thx_DynamicsT.merge = function(to,from,replacef) {
	if(null == replacef) replacef = function(field,oldv,newv) {
		return newv;
	};
	var _g = 0;
	var _g1 = Reflect.fields(from);
	while(_g < _g1.length) {
		var field1 = _g1[_g];
		++_g;
		var newv1 = Reflect.field(from,field1);
		if(Object.prototype.hasOwnProperty.call(to,field1)) Reflect.setField(to,field1,replacef(field1,Reflect.field(to,field1),newv1)); else to[field1] = newv1;
	}
	return to;
};
thx_DynamicsT.size = function(o) {
	return Reflect.fields(o).length;
};
thx_DynamicsT.values = function(o) {
	return Reflect.fields(o).map(function(key) {
		return Reflect.field(o,key);
	});
};
thx_DynamicsT.tuples = function(o) {
	return Reflect.fields(o).map(function(key) {
		var _1 = Reflect.field(o,key);
		return { _0 : key, _1 : _1};
	});
};
var thx_Enums = function() { };
thx_Enums.__name__ = ["thx","Enums"];
thx_Enums.string = function(e) {
	var cons = Type.enumConstructor(e);
	var params = [];
	var _g = 0;
	var _g1 = Type.enumParameters(e);
	while(_g < _g1.length) {
		var param = _g1[_g];
		++_g;
		params.push(thx_Dynamics.string(param));
	}
	return cons + (params.length == 0?"":"(" + params.join(", ") + ")");
};
thx_Enums.compare = function(a,b) {
	var v = thx_Ints.compare(Type.enumIndex(a),Type.enumIndex(b));
	if(v != 0) return v;
	return thx_Arrays.compare(Type.enumParameters(a),Type.enumParameters(b));
};
var thx_Error = function(message,stack,pos) {
	Error.call(this,message);
	this.message = message;
	if(null == stack) {
		try {
			stack = haxe_CallStack.exceptionStack();
		} catch( e ) {
			haxe_CallStack.lastException = e;
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			stack = [];
		}
		if(stack.length == 0) try {
			stack = haxe_CallStack.callStack();
		} catch( e1 ) {
			haxe_CallStack.lastException = e1;
			if (e1 instanceof js__$Boot_HaxeError) e1 = e1.val;
			stack = [];
		}
	}
	this.stackItems = stack;
	this.pos = pos;
};
thx_Error.__name__ = ["thx","Error"];
thx_Error.fromDynamic = function(err,pos) {
	if(js_Boot.__instanceof(err,thx_Error)) return err;
	return new thx_error_ErrorWrapper("" + Std.string(err),err,null,pos);
};
thx_Error.__super__ = Error;
thx_Error.prototype = $extend(Error.prototype,{
	pos: null
	,stackItems: null
	,toString: function() {
		return this.message + "\nfrom: " + this.pos.className + "." + this.pos.methodName + "() at " + this.pos.lineNumber + "\n\n" + haxe_CallStack.toString(this.stackItems);
	}
	,__class__: thx_Error
});
var thx_Floats = function() { };
thx_Floats.__name__ = ["thx","Floats"];
thx_Floats.angleDifference = function(a,b,turn) {
	if(turn == null) turn = 360.0;
	var r = (b - a) % turn;
	if(r < 0) r += turn;
	if(r > turn / 2) r -= turn;
	return r;
};
thx_Floats.ceilTo = function(f,decimals) {
	var p = Math.pow(10,decimals);
	return Math.ceil(f * p) / p;
};
thx_Floats.canParse = function(s) {
	return thx_Floats.pattern_parse.match(s);
};
thx_Floats.clamp = function(v,min,max) {
	if(v < min) return min; else if(v > max) return max; else return v;
};
thx_Floats.clampSym = function(v,max) {
	return thx_Floats.clamp(v,-max,max);
};
thx_Floats.compare = function(a,b) {
	if(a < b) return -1; else if(a > b) return 1; else return 0;
};
thx_Floats.floorTo = function(f,decimals) {
	var p = Math.pow(10,decimals);
	return Math.floor(f * p) / p;
};
thx_Floats.interpolate = function(f,a,b) {
	return (b - a) * f + a;
};
thx_Floats.interpolateAngle = function(f,a,b,turn) {
	if(turn == null) turn = 360;
	return thx_Floats.wrapCircular(thx_Floats.interpolate(f,a,a + thx_Floats.angleDifference(a,b,turn)),turn);
};
thx_Floats.interpolateAngleWidest = function(f,a,b,turn) {
	if(turn == null) turn = 360;
	return thx_Floats.wrapCircular(thx_Floats.interpolateAngle(f,a,b,turn) - turn / 2,turn);
};
thx_Floats.interpolateAngleCW = function(f,a,b,turn) {
	if(turn == null) turn = 360;
	a = thx_Floats.wrapCircular(a,turn);
	b = thx_Floats.wrapCircular(b,turn);
	if(b < a) b += turn;
	return thx_Floats.wrapCircular(thx_Floats.interpolate(f,a,b),turn);
};
thx_Floats.interpolateAngleCCW = function(f,a,b,turn) {
	if(turn == null) turn = 360;
	a = thx_Floats.wrapCircular(a,turn);
	b = thx_Floats.wrapCircular(b,turn);
	if(b > a) b -= turn;
	return thx_Floats.wrapCircular(thx_Floats.interpolate(f,a,b),turn);
};
thx_Floats.max = function(a,b) {
	if(a > b) return a; else return b;
};
thx_Floats.min = function(a,b) {
	if(a < b) return a; else return b;
};
thx_Floats.nearEquals = function(a,b,tollerance) {
	if(tollerance == null) tollerance = 10e-10;
	return Math.abs(a - b) <= tollerance;
};
thx_Floats.nearEqualAngles = function(a,b,turn,tollerance) {
	if(tollerance == null) tollerance = 10e-10;
	if(turn == null) turn = 360.0;
	return Math.abs(thx_Floats.angleDifference(a,b,turn)) <= tollerance;
};
thx_Floats.nearZero = function(n,tollerance) {
	if(tollerance == null) tollerance = 10e-10;
	return Math.abs(n) <= tollerance;
};
thx_Floats.normalize = function(v) {
	return v < 0?0:v > 1?1:v;
};
thx_Floats.parse = function(s) {
	if(s.substring(0,1) == "+") s = s.substring(1);
	return parseFloat(s);
};
thx_Floats.root = function(base,index) {
	return Math.pow(base,1 / index);
};
thx_Floats.roundTo = function(f,decimals) {
	var p = Math.pow(10,decimals);
	return Math.round(f * p) / p;
};
thx_Floats.sign = function(value) {
	if(value < 0) return -1; else return 1;
};
thx_Floats.wrap = function(v,min,max) {
	var range = max - min + 1;
	if(v < min) v += range * ((min - v) / range + 1);
	return min + (v - min) % range;
};
thx_Floats.wrapCircular = function(v,max) {
	v = v % max;
	if(v < 0) v += max;
	return v;
};
var thx_Functions0 = function() { };
thx_Functions0.__name__ = ["thx","Functions0"];
thx_Functions0.after = function(callback,n) {
	return function() {
		if(--n == 0) callback();
	};
};
thx_Functions0.join = function(fa,fb) {
	return function() {
		fa();
		fb();
	};
};
thx_Functions0.once = function(f) {
	return function() {
		var t = f;
		f = thx_Functions.noop;
		t();
	};
};
thx_Functions0.negate = function(callback) {
	return function() {
		return !callback();
	};
};
thx_Functions0.times = function(n,callback) {
	return function() {
		return thx_Ints.range(n).map(function(_) {
			return callback();
		});
	};
};
thx_Functions0.timesi = function(n,callback) {
	return function() {
		return thx_Ints.range(n).map(function(i) {
			return callback(i);
		});
	};
};
var thx_Functions1 = function() { };
thx_Functions1.__name__ = ["thx","Functions1"];
thx_Functions1.compose = function(fa,fb) {
	return function(v) {
		return fa(fb(v));
	};
};
thx_Functions1.join = function(fa,fb) {
	return function(v) {
		fa(v);
		fb(v);
	};
};
thx_Functions1.memoize = function(callback,resolver) {
	if(null == resolver) resolver = function(v) {
		return "" + Std.string(v);
	};
	var map = new haxe_ds_StringMap();
	return function(v1) {
		var key = resolver(v1);
		if(__map_reserved[key] != null?map.existsReserved(key):map.h.hasOwnProperty(key)) return __map_reserved[key] != null?map.getReserved(key):map.h[key];
		var result = callback(v1);
		if(__map_reserved[key] != null) map.setReserved(key,result); else map.h[key] = result;
		return result;
	};
};
thx_Functions1.negate = function(callback) {
	return function(v) {
		return !callback(v);
	};
};
thx_Functions1.noop = function(_) {
};
thx_Functions1.times = function(n,callback) {
	return function(value) {
		return thx_Ints.range(n).map(function(_) {
			return callback(value);
		});
	};
};
thx_Functions1.timesi = function(n,callback) {
	return function(value) {
		return thx_Ints.range(n).map(function(i) {
			return callback(value,i);
		});
	};
};
thx_Functions1.swapArguments = function(callback) {
	return function(a2,a1) {
		return callback(a1,a2);
	};
};
var thx_Functions2 = function() { };
thx_Functions2.__name__ = ["thx","Functions2"];
thx_Functions2.memoize = function(callback,resolver) {
	if(null == resolver) resolver = function(v1,v2) {
		return "" + Std.string(v1) + ":" + Std.string(v2);
	};
	var map = new haxe_ds_StringMap();
	return function(v11,v21) {
		var key = resolver(v11,v21);
		if(__map_reserved[key] != null?map.existsReserved(key):map.h.hasOwnProperty(key)) return __map_reserved[key] != null?map.getReserved(key):map.h[key];
		var result = callback(v11,v21);
		if(__map_reserved[key] != null) map.setReserved(key,result); else map.h[key] = result;
		return result;
	};
};
thx_Functions2.negate = function(callback) {
	return function(v1,v2) {
		return !callback(v1,v2);
	};
};
var thx_Functions3 = function() { };
thx_Functions3.__name__ = ["thx","Functions3"];
thx_Functions3.memoize = function(callback,resolver) {
	if(null == resolver) resolver = function(v1,v2,v3) {
		return "" + Std.string(v1) + ":" + Std.string(v2) + ":" + Std.string(v3);
	};
	var map = new haxe_ds_StringMap();
	return function(v11,v21,v31) {
		var key = resolver(v11,v21,v31);
		if(__map_reserved[key] != null?map.existsReserved(key):map.h.hasOwnProperty(key)) return __map_reserved[key] != null?map.getReserved(key):map.h[key];
		var result = callback(v11,v21,v31);
		if(__map_reserved[key] != null) map.setReserved(key,result); else map.h[key] = result;
		return result;
	};
};
thx_Functions3.negate = function(callback) {
	return function(v1,v2,v3) {
		return !callback(v1,v2,v3);
	};
};
var thx_Functions = function() { };
thx_Functions.__name__ = ["thx","Functions"];
thx_Functions.constant = function(v) {
	return function() {
		return v;
	};
};
thx_Functions.equality = function(a,b) {
	return a == b;
};
thx_Functions.identity = function(value) {
	return value;
};
thx_Functions.noop = function() {
};
var thx_Ints = function() { };
thx_Ints.__name__ = ["thx","Ints"];
thx_Ints.abs = function(v) {
	if(v < 0) return -v; else return v;
};
thx_Ints.canParse = function(s) {
	return thx_Ints.pattern_parse.match(s);
};
thx_Ints.clamp = function(v,min,max) {
	if(v < min) return min; else if(v > max) return max; else return v;
};
thx_Ints.clampSym = function(v,max) {
	return thx_Ints.clamp(v,-max,max);
};
thx_Ints.compare = function(a,b) {
	return a - b;
};
thx_Ints.interpolate = function(f,a,b) {
	return Math.round(a + (b - a) * f);
};
thx_Ints.isEven = function(v) {
	return v % 2 == 0;
};
thx_Ints.isOdd = function(v) {
	return v % 2 != 0;
};
thx_Ints.max = function(a,b) {
	if(a > b) return a; else return b;
};
thx_Ints.min = function(a,b) {
	if(a < b) return a; else return b;
};
thx_Ints.parse = function(s,base) {
	var v = parseInt(s,base);
	if(isNaN(v)) return null; else return v;
};
thx_Ints.random = function(min,max) {
	if(min == null) min = 0;
	return Std.random(max + 1) + min;
};
thx_Ints.range = function(start,stop,step) {
	if(step == null) step = 1;
	if(null == stop) {
		stop = start;
		start = 0;
	}
	if((stop - start) / step == Infinity) throw new js__$Boot_HaxeError("infinite range");
	var range = [];
	var i = -1;
	var j;
	if(step < 0) while((j = start + step * ++i) > stop) range.push(j); else while((j = start + step * ++i) < stop) range.push(j);
	return range;
};
thx_Ints.toString = function(value,base) {
	return value.toString(base);
};
thx_Ints.toBool = function(v) {
	return v != 0;
};
thx_Ints.sign = function(value) {
	if(value < 0) return -1; else return 1;
};
thx_Ints.wrapCircular = function(v,max) {
	v = v % max;
	if(v < 0) v += max;
	return v;
};
var thx_Iterables = function() { };
thx_Iterables.__name__ = ["thx","Iterables"];
thx_Iterables.all = function(it,predicate) {
	return thx_Iterators.all($iterator(it)(),predicate);
};
thx_Iterables.any = function(it,predicate) {
	return thx_Iterators.any($iterator(it)(),predicate);
};
thx_Iterables.eachPair = function(it,handler) {
	thx_Iterators.eachPair($iterator(it)(),handler);
	return;
};
thx_Iterables.filter = function(it,predicate) {
	return thx_Iterators.filter($iterator(it)(),predicate);
};
thx_Iterables.find = function(it,predicate) {
	return thx_Iterators.find($iterator(it)(),predicate);
};
thx_Iterables.first = function(it) {
	return thx_Iterators.first($iterator(it)());
};
thx_Iterables.last = function(it) {
	return thx_Iterators.last($iterator(it)());
};
thx_Iterables.isEmpty = function(it) {
	return thx_Iterators.isEmpty($iterator(it)());
};
thx_Iterables.isIterable = function(v) {
	var fields;
	if(Reflect.isObject(v) && null == Type.getClass(v)) fields = Reflect.fields(v); else fields = Type.getInstanceFields(Type.getClass(v));
	if(!Lambda.has(fields,"iterator")) return false;
	return Reflect.isFunction(Reflect.field(v,"iterator"));
};
thx_Iterables.map = function(it,f) {
	return thx_Iterators.map($iterator(it)(),f);
};
thx_Iterables.mapi = function(it,f) {
	return thx_Iterators.mapi($iterator(it)(),f);
};
thx_Iterables.order = function(it,sort) {
	return thx_Iterators.order($iterator(it)(),sort);
};
thx_Iterables.reduce = function(it,callback,initial) {
	return thx_Iterators.reduce($iterator(it)(),callback,initial);
};
thx_Iterables.reducei = function(it,callback,initial) {
	return thx_Iterators.reducei($iterator(it)(),callback,initial);
};
thx_Iterables.toArray = function(it) {
	return thx_Iterators.toArray($iterator(it)());
};
thx_Iterables.unzip = function(it) {
	return thx_Iterators.unzip($iterator(it)());
};
thx_Iterables.unzip3 = function(it) {
	return thx_Iterators.unzip3($iterator(it)());
};
thx_Iterables.unzip4 = function(it) {
	return thx_Iterators.unzip4($iterator(it)());
};
thx_Iterables.unzip5 = function(it) {
	return thx_Iterators.unzip5($iterator(it)());
};
thx_Iterables.zip = function(it1,it2) {
	return thx_Iterators.zip($iterator(it1)(),$iterator(it2)());
};
thx_Iterables.zip3 = function(it1,it2,it3) {
	return thx_Iterators.zip3($iterator(it1)(),$iterator(it2)(),$iterator(it3)());
};
thx_Iterables.zip4 = function(it1,it2,it3,it4) {
	return thx_Iterators.zip4($iterator(it1)(),$iterator(it2)(),$iterator(it3)(),$iterator(it4)());
};
thx_Iterables.zip5 = function(it1,it2,it3,it4,it5) {
	return thx_Iterators.zip5($iterator(it1)(),$iterator(it2)(),$iterator(it3)(),$iterator(it4)(),$iterator(it5)());
};
var thx_Iterators = function() { };
thx_Iterators.__name__ = ["thx","Iterators"];
thx_Iterators.all = function(it,predicate) {
	while( it.hasNext() ) {
		var item = it.next();
		if(!predicate(item)) return false;
	}
	return true;
};
thx_Iterators.any = function(it,predicate) {
	while( it.hasNext() ) {
		var item = it.next();
		if(predicate(item)) return true;
	}
	return false;
};
thx_Iterators.eachPair = function(it,handler) {
	thx_Arrays.eachPair(thx_Iterators.toArray(it),handler);
};
thx_Iterators.filter = function(it,predicate) {
	return thx_Iterators.reduce(it,function(acc,item) {
		if(predicate(item)) acc.push(item);
		return acc;
	},[]);
};
thx_Iterators.find = function(it,f) {
	while( it.hasNext() ) {
		var item = it.next();
		if(f(item)) return item;
	}
	return null;
};
thx_Iterators.first = function(it) {
	if(it.hasNext()) return it.next(); else return null;
};
thx_Iterators.isEmpty = function(it) {
	return !it.hasNext();
};
thx_Iterators.isIterator = function(v) {
	var fields;
	if(Reflect.isObject(v) && null == Type.getClass(v)) fields = Reflect.fields(v); else fields = Type.getInstanceFields(Type.getClass(v));
	if(!Lambda.has(fields,"next") || !Lambda.has(fields,"hasNext")) return false;
	return Reflect.isFunction(Reflect.field(v,"next")) && Reflect.isFunction(Reflect.field(v,"hasNext"));
};
thx_Iterators.last = function(it) {
	var buf = null;
	while(it.hasNext()) buf = it.next();
	return buf;
};
thx_Iterators.map = function(it,f) {
	var acc = [];
	while( it.hasNext() ) {
		var v = it.next();
		acc.push(f(v));
	}
	return acc;
};
thx_Iterators.mapi = function(it,f) {
	var acc = [];
	var i = 0;
	while( it.hasNext() ) {
		var v = it.next();
		acc.push(f(v,i++));
	}
	return acc;
};
thx_Iterators.order = function(it,sort) {
	var n = thx_Iterators.toArray(it);
	n.sort(sort);
	return n;
};
thx_Iterators.reduce = function(it,callback,initial) {
	thx_Iterators.map(it,function(v) {
		initial = callback(initial,v);
	});
	return initial;
};
thx_Iterators.reducei = function(it,callback,initial) {
	thx_Iterators.mapi(it,function(v,i) {
		initial = callback(initial,v,i);
	});
	return initial;
};
thx_Iterators.toArray = function(it) {
	var items = [];
	while( it.hasNext() ) {
		var item = it.next();
		items.push(item);
	}
	return items;
};
thx_Iterators.unzip = function(it) {
	var a1 = [];
	var a2 = [];
	thx_Iterators.map(it,function(t) {
		a1.push(t._0);
		a2.push(t._1);
	});
	return { _0 : a1, _1 : a2};
};
thx_Iterators.unzip3 = function(it) {
	var a1 = [];
	var a2 = [];
	var a3 = [];
	thx_Iterators.map(it,function(t) {
		a1.push(t._0);
		a2.push(t._1);
		a3.push(t._2);
	});
	return { _0 : a1, _1 : a2, _2 : a3};
};
thx_Iterators.unzip4 = function(it) {
	var a1 = [];
	var a2 = [];
	var a3 = [];
	var a4 = [];
	thx_Iterators.map(it,function(t) {
		a1.push(t._0);
		a2.push(t._1);
		a3.push(t._2);
		a4.push(t._3);
	});
	return { _0 : a1, _1 : a2, _2 : a3, _3 : a4};
};
thx_Iterators.unzip5 = function(it) {
	var a1 = [];
	var a2 = [];
	var a3 = [];
	var a4 = [];
	var a5 = [];
	thx_Iterators.map(it,function(t) {
		a1.push(t._0);
		a2.push(t._1);
		a3.push(t._2);
		a4.push(t._3);
		a5.push(t._4);
	});
	return { _0 : a1, _1 : a2, _2 : a3, _3 : a4, _4 : a5};
};
thx_Iterators.zip = function(it1,it2) {
	var array = [];
	while(it1.hasNext() && it2.hasNext()) array.push((function($this) {
		var $r;
		var _0 = it1.next();
		var _1 = it2.next();
		$r = { _0 : _0, _1 : _1};
		return $r;
	}(this)));
	return array;
};
thx_Iterators.zip3 = function(it1,it2,it3) {
	var array = [];
	while(it1.hasNext() && it2.hasNext() && it3.hasNext()) array.push((function($this) {
		var $r;
		var _0 = it1.next();
		var _1 = it2.next();
		var _2 = it3.next();
		$r = { _0 : _0, _1 : _1, _2 : _2};
		return $r;
	}(this)));
	return array;
};
thx_Iterators.zip4 = function(it1,it2,it3,it4) {
	var array = [];
	while(it1.hasNext() && it2.hasNext() && it3.hasNext() && it4.hasNext()) array.push((function($this) {
		var $r;
		var _0 = it1.next();
		var _1 = it2.next();
		var _2 = it3.next();
		var _3 = it4.next();
		$r = { _0 : _0, _1 : _1, _2 : _2, _3 : _3};
		return $r;
	}(this)));
	return array;
};
thx_Iterators.zip5 = function(it1,it2,it3,it4,it5) {
	var array = [];
	while(it1.hasNext() && it2.hasNext() && it3.hasNext() && it4.hasNext() && it5.hasNext()) array.push((function($this) {
		var $r;
		var _0 = it1.next();
		var _1 = it2.next();
		var _2 = it3.next();
		var _3 = it4.next();
		var _4 = it5.next();
		$r = { _0 : _0, _1 : _1, _2 : _2, _3 : _3, _4 : _4};
		return $r;
	}(this)));
	return array;
};
var thx_Maps = function() { };
thx_Maps.__name__ = ["thx","Maps"];
thx_Maps.tuples = function(map) {
	return thx_Iterators.map(map.keys(),function(key) {
		var _1 = map.get(key);
		return { _0 : key, _1 : _1};
	});
};
thx_Maps.toObject = function(map) {
	return thx_Arrays.reduce(thx_Maps.tuples(map),function(o,t) {
		o[t._0] = t._1;
		return o;
	},{ });
};
thx_Maps.getAlt = function(map,key,alt) {
	var v = map.get(key);
	if(null == v) return alt; else return v;
};
thx_Maps.isMap = function(v) {
	return js_Boot.__instanceof(v,haxe_IMap);
};
var thx_Nil = { __ename__ : ["thx","Nil"], __constructs__ : ["nil"] };
thx_Nil.nil = ["nil",0];
thx_Nil.nil.toString = $estr;
thx_Nil.nil.__enum__ = thx_Nil;
var thx_Objects = function() { };
thx_Objects.__name__ = ["thx","Objects"];
thx_Objects.compare = function(a,b) {
	var v;
	var fields;
	if((v = thx_Arrays.compare(fields = Reflect.fields(a),Reflect.fields(b))) != 0) return v;
	var _g = 0;
	while(_g < fields.length) {
		var field = fields[_g];
		++_g;
		if((v = thx_Dynamics.compare(Reflect.field(a,field),Reflect.field(b,field))) != 0) return v;
	}
	return 0;
};
thx_Objects.isEmpty = function(o) {
	return Reflect.fields(o).length == 0;
};
thx_Objects.exists = function(o,name) {
	return Object.prototype.hasOwnProperty.call(o,name);
};
thx_Objects.fields = function(o) {
	return Reflect.fields(o);
};
thx_Objects.merge = function(to,from,replacef) {
	if(null == replacef) replacef = function(field,oldv,newv) {
		return newv;
	};
	var _g = 0;
	var _g1 = Reflect.fields(from);
	while(_g < _g1.length) {
		var field1 = _g1[_g];
		++_g;
		var newv1 = Reflect.field(from,field1);
		if(Object.prototype.hasOwnProperty.call(to,field1)) Reflect.setField(to,field1,replacef(field1,Reflect.field(to,field1),newv1)); else to[field1] = newv1;
	}
	return to;
};
thx_Objects.copyTo = function(src,dst,cloneInstances) {
	if(cloneInstances == null) cloneInstances = false;
	var _g = 0;
	var _g1 = Reflect.fields(src);
	while(_g < _g1.length) {
		var field = _g1[_g];
		++_g;
		var sv = thx_Dynamics.clone(Reflect.field(src,field),cloneInstances);
		var dv = Reflect.field(dst,field);
		if(Reflect.isObject(sv) && null == Type.getClass(sv) && (Reflect.isObject(dv) && null == Type.getClass(dv))) thx_Objects.copyTo(sv,dv); else dst[field] = sv;
	}
	return dst;
};
thx_Objects.clone = function(src,cloneInstances) {
	if(cloneInstances == null) cloneInstances = false;
	return thx_Dynamics.clone(src,cloneInstances);
};
thx_Objects.toMap = function(o) {
	return thx_Arrays.reduce(thx_Objects.tuples(o),function(map,t) {
		var value = t._1;
		map.set(t._0,value);
		return map;
	},new haxe_ds_StringMap());
};
thx_Objects.size = function(o) {
	return Reflect.fields(o).length;
};
thx_Objects.string = function(o) {
	return "{" + Reflect.fields(o).map(function(key) {
		return "" + key + " : " + thx_Objects.string(Reflect.field(o,key));
	}).join(", ") + "}";
};
thx_Objects.values = function(o) {
	return Reflect.fields(o).map(function(key) {
		return Reflect.field(o,key);
	});
};
thx_Objects.tuples = function(o) {
	return Reflect.fields(o).map(function(key) {
		var _1 = Reflect.field(o,key);
		return { _0 : key, _1 : _1};
	});
};
thx_Objects.hasPath = function(o,path) {
	var paths = path.split(".");
	var current = o;
	var _g = 0;
	while(_g < paths.length) {
		var currentPath = paths[_g];
		++_g;
		if(thx_Strings.DIGITS.match(currentPath)) {
			var index = Std.parseInt(currentPath);
			var arr = Std.instance(current,Array);
			if(null == arr || arr.length <= index) return false;
			current = arr[index];
		} else if(Object.prototype.hasOwnProperty.call(current,currentPath)) current = Reflect.field(current,currentPath); else return false;
	}
	return true;
};
thx_Objects.hasPathValue = function(o,path) {
	return thx_Objects.getPath(o,path) != null;
};
thx_Objects.getPath = function(o,path) {
	var paths = path.split(".");
	var current = o;
	var _g = 0;
	while(_g < paths.length) {
		var currentPath = paths[_g];
		++_g;
		if(thx_Strings.DIGITS.match(currentPath)) {
			var index = Std.parseInt(currentPath);
			var arr = Std.instance(current,Array);
			if(null == arr) return null;
			current = arr[index];
		} else if(Object.prototype.hasOwnProperty.call(current,currentPath)) current = Reflect.field(current,currentPath); else return null;
	}
	return current;
};
thx_Objects.setPath = function(o,path,val) {
	var paths = path.split(".");
	var current = o;
	var _g1 = 0;
	var _g = paths.length - 1;
	while(_g1 < _g) {
		var i = _g1++;
		var currentPath = paths[i];
		var nextPath = paths[i + 1];
		if(thx_Strings.DIGITS.match(currentPath)) {
			var index = Std.parseInt(currentPath);
			if(current[index] == null) {
				if(thx_Strings.DIGITS.match(nextPath)) current[index] = []; else current[index] = { };
			}
			current = current[index];
		} else {
			if(!Object.prototype.hasOwnProperty.call(current,currentPath)) {
				if(thx_Strings.DIGITS.match(nextPath)) current[currentPath] = []; else current[currentPath] = { };
			}
			current = Reflect.field(current,currentPath);
		}
	}
	var p = paths[paths.length - 1];
	if(thx_Strings.DIGITS.match(p)) {
		var index1 = Std.parseInt(p);
		current[index1] = val;
	} else current[p] = val;
	return o;
};
thx_Objects.removePath = function(o,path) {
	var paths = path.split(".");
	var target = paths.pop();
	try {
		var sub = paths.reduce(function(existing,nextPath) {
			if(thx_Strings.DIGITS.match(nextPath)) {
				var current = existing;
				var index = Std.parseInt(nextPath);
				return current[index];
			} else return Reflect.field(existing,nextPath);
		},o);
		if(null != sub) Reflect.deleteField(sub,target);
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
	}
	return o;
};
var thx_Strings = function() { };
thx_Strings.__name__ = ["thx","Strings"];
thx_Strings.after = function(value,searchFor) {
	var pos = value.indexOf(searchFor);
	if(pos < 0) return ""; else return value.substring(pos + searchFor.length);
};
thx_Strings.capitalize = function(s) {
	return s.substring(0,1).toUpperCase() + s.substring(1);
};
thx_Strings.capitalizeWords = function(value,whiteSpaceOnly) {
	if(whiteSpaceOnly == null) whiteSpaceOnly = false;
	if(whiteSpaceOnly) return thx_Strings.UCWORDSWS.map(value.substring(0,1).toUpperCase() + value.substring(1),thx_Strings.upperMatch); else return thx_Strings.UCWORDS.map(value.substring(0,1).toUpperCase() + value.substring(1),thx_Strings.upperMatch);
};
thx_Strings.collapse = function(value) {
	return thx_Strings.WSG.replace(StringTools.trim(value)," ");
};
thx_Strings.compare = function(a,b) {
	if(a < b) return -1; else if(a > b) return 1; else return 0;
};
thx_Strings.contains = function(s,test) {
	return s.indexOf(test) >= 0;
};
thx_Strings.containsAny = function(s,tests) {
	return thx_Arrays.any(tests,(function(f,s1) {
		return function(a1) {
			return f(s1,a1);
		};
	})(thx_Strings.contains,s));
};
thx_Strings.dasherize = function(s) {
	return StringTools.replace(s,"_","-");
};
thx_Strings.ellipsis = function(s,maxlen,symbol) {
	if(symbol == null) symbol = "...";
	if(maxlen == null) maxlen = 20;
	if(s.length > maxlen) return s.substring(0,symbol.length > maxlen - symbol.length?symbol.length:maxlen - symbol.length) + symbol; else return s;
};
thx_Strings.filter = function(s,predicate) {
	return s.split("").filter(predicate).join("");
};
thx_Strings.filterCharcode = function(s,predicate) {
	return thx_Strings.toCharcodeArray(s).filter(predicate).map(function(i) {
		return String.fromCharCode(i);
	}).join("");
};
thx_Strings.from = function(value,searchFor) {
	var pos = value.indexOf(searchFor);
	if(pos < 0) return ""; else return value.substring(pos);
};
thx_Strings.humanize = function(s) {
	return StringTools.replace(thx_Strings.underscore(s),"_"," ");
};
thx_Strings.isAlphaNum = function(value) {
	return thx_Strings.ALPHANUM.match(value);
};
thx_Strings.isLowerCase = function(value) {
	return value.toLowerCase() == value;
};
thx_Strings.isUpperCase = function(value) {
	return value.toUpperCase() == value;
};
thx_Strings.ifEmpty = function(value,alt) {
	if(null != value && "" != value) return value; else return alt;
};
thx_Strings.isDigitsOnly = function(value) {
	return thx_Strings.DIGITS.match(value);
};
thx_Strings.isEmpty = function(value) {
	return value == null || value == "";
};
thx_Strings.random = function(value,length) {
	if(length == null) length = 1;
	var pos = Math.floor((value.length - length + 1) * Math.random());
	return HxOverrides.substr(value,pos,length);
};
thx_Strings.iterator = function(s) {
	var _this = s.split("");
	return HxOverrides.iter(_this);
};
thx_Strings.map = function(value,callback) {
	return value.split("").map(callback);
};
thx_Strings.remove = function(value,toremove) {
	return StringTools.replace(value,toremove,"");
};
thx_Strings.removeAfter = function(value,toremove) {
	if(StringTools.endsWith(value,toremove)) return value.substring(0,value.length - toremove.length); else return value;
};
thx_Strings.removeBefore = function(value,toremove) {
	if(StringTools.startsWith(value,toremove)) return value.substring(toremove.length); else return value;
};
thx_Strings.repeat = function(s,times) {
	return ((function($this) {
		var $r;
		var _g = [];
		{
			var _g1 = 0;
			while(_g1 < times) {
				var i = _g1++;
				_g.push(s);
			}
		}
		$r = _g;
		return $r;
	}(this))).join("");
};
thx_Strings.reverse = function(s) {
	var arr = s.split("");
	arr.reverse();
	return arr.join("");
};
thx_Strings.quote = function(s) {
	if(s.indexOf("\"") < 0) return "\"" + s + "\""; else if(s.indexOf("'") < 0) return "'" + s + "'"; else return "\"" + StringTools.replace(s,"\"","\\\"") + "\"";
};
thx_Strings.stripTags = function(s) {
	return thx_Strings.STRIPTAGS.replace(s,"");
};
thx_Strings.surround = function(s,left,right) {
	return "" + left + s + (null == right?left:right);
};
thx_Strings.toArray = function(s) {
	return s.split("");
};
thx_Strings.toCharcodeArray = function(s) {
	return thx_Strings.map(s,function(s1) {
		return HxOverrides.cca(s1,0);
	});
};
thx_Strings.toChunks = function(s,len) {
	var chunks = [];
	while(s.length > 0) {
		chunks.push(s.substring(0,len));
		s = s.substring(len);
	}
	return chunks;
};
thx_Strings.trimChars = function(value,charlist) {
	return thx_Strings.trimCharsRight(thx_Strings.trimCharsLeft(value,charlist),charlist);
};
thx_Strings.trimCharsLeft = function(value,charlist) {
	var pos = 0;
	var _g1 = 0;
	var _g = value.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(thx_Strings.contains(charlist,value.charAt(i))) pos++; else break;
	}
	return value.substring(pos);
};
thx_Strings.trimCharsRight = function(value,charlist) {
	var len = value.length;
	var pos = len;
	var i;
	var _g = 0;
	while(_g < len) {
		var j = _g++;
		i = len - j - 1;
		if(thx_Strings.contains(charlist,value.charAt(i))) pos = i; else break;
	}
	return value.substring(0,pos);
};
thx_Strings.underscore = function(s) {
	s = new EReg("::","g").replace(s,"/");
	s = new EReg("([A-Z]+)([A-Z][a-z])","g").replace(s,"$1_$2");
	s = new EReg("([a-z\\d])([A-Z])","g").replace(s,"$1_$2");
	s = new EReg("-","g").replace(s,"_");
	return s.toLowerCase();
};
thx_Strings.upTo = function(value,searchFor) {
	var pos = value.indexOf(searchFor);
	if(pos < 0) return value; else return value.substring(0,pos);
};
thx_Strings.wrapColumns = function(s,columns,indent,newline) {
	if(newline == null) newline = "\n";
	if(indent == null) indent = "";
	if(columns == null) columns = 78;
	return thx_Strings.SPLIT_LINES.split(s).map(function(part) {
		return thx_Strings.wrapLine(StringTools.trim(thx_Strings.WSG.replace(part," ")),columns,indent,newline);
	}).join(newline);
};
thx_Strings.upperMatch = function(re) {
	return re.matched(0).toUpperCase();
};
thx_Strings.wrapLine = function(s,columns,indent,newline) {
	var parts = [];
	var pos = 0;
	var len = s.length;
	var ilen = indent.length;
	columns -= ilen;
	while(true) {
		if(pos + columns >= len - ilen) {
			parts.push(s.substring(pos));
			break;
		}
		var i = 0;
		while(!StringTools.isSpace(s,pos + columns - i) && i < columns) i++;
		if(i == columns) {
			i = 0;
			while(!StringTools.isSpace(s,pos + columns + i) && pos + columns + i < len) i++;
			parts.push(s.substring(pos,pos + columns + i));
			pos += columns + i + 1;
		} else {
			parts.push(s.substring(pos,pos + columns - i));
			pos += columns - i + 1;
		}
	}
	return indent + parts.join(newline + indent);
};
var thx__$Tuple_Tuple0_$Impl_$ = {};
thx__$Tuple_Tuple0_$Impl_$.__name__ = ["thx","_Tuple","Tuple0_Impl_"];
thx__$Tuple_Tuple0_$Impl_$._new = function() {
	return thx_Nil.nil;
};
thx__$Tuple_Tuple0_$Impl_$["with"] = function(this1,v) {
	return v;
};
thx__$Tuple_Tuple0_$Impl_$.toString = function(this1) {
	return "Tuple0()";
};
thx__$Tuple_Tuple0_$Impl_$.toNil = function(this1) {
	return this1;
};
thx__$Tuple_Tuple0_$Impl_$.nilToTuple = function(v) {
	return thx_Nil.nil;
};
var thx__$Tuple_Tuple1_$Impl_$ = {};
thx__$Tuple_Tuple1_$Impl_$.__name__ = ["thx","_Tuple","Tuple1_Impl_"];
thx__$Tuple_Tuple1_$Impl_$._new = function(_0) {
	return _0;
};
thx__$Tuple_Tuple1_$Impl_$.get__0 = function(this1) {
	return this1;
};
thx__$Tuple_Tuple1_$Impl_$["with"] = function(this1,v) {
	return { _0 : this1, _1 : v};
};
thx__$Tuple_Tuple1_$Impl_$.toString = function(this1) {
	return "Tuple1(" + Std.string(this1) + ")";
};
thx__$Tuple_Tuple1_$Impl_$.arrayToTuple = function(v) {
	return v[0];
};
var thx__$Tuple_Tuple2_$Impl_$ = {};
thx__$Tuple_Tuple2_$Impl_$.__name__ = ["thx","_Tuple","Tuple2_Impl_"];
thx__$Tuple_Tuple2_$Impl_$._new = function(_0,_1) {
	return { _0 : _0, _1 : _1};
};
thx__$Tuple_Tuple2_$Impl_$.get_left = function(this1) {
	return this1._0;
};
thx__$Tuple_Tuple2_$Impl_$.get_right = function(this1) {
	return this1._1;
};
thx__$Tuple_Tuple2_$Impl_$.flip = function(this1) {
	return { _0 : this1._1, _1 : this1._0};
};
thx__$Tuple_Tuple2_$Impl_$.dropLeft = function(this1) {
	return this1._1;
};
thx__$Tuple_Tuple2_$Impl_$.dropRight = function(this1) {
	return this1._0;
};
thx__$Tuple_Tuple2_$Impl_$["with"] = function(this1,v) {
	return { _0 : this1._0, _1 : this1._1, _2 : v};
};
thx__$Tuple_Tuple2_$Impl_$.toString = function(this1) {
	return "Tuple2(" + Std.string(this1._0) + "," + Std.string(this1._1) + ")";
};
thx__$Tuple_Tuple2_$Impl_$.arrayToTuple2 = function(v) {
	return { _0 : v[0], _1 : v[1]};
};
var thx__$Tuple_Tuple3_$Impl_$ = {};
thx__$Tuple_Tuple3_$Impl_$.__name__ = ["thx","_Tuple","Tuple3_Impl_"];
thx__$Tuple_Tuple3_$Impl_$._new = function(_0,_1,_2) {
	return { _0 : _0, _1 : _1, _2 : _2};
};
thx__$Tuple_Tuple3_$Impl_$.flip = function(this1) {
	return { _0 : this1._2, _1 : this1._1, _2 : this1._0};
};
thx__$Tuple_Tuple3_$Impl_$.dropLeft = function(this1) {
	return { _0 : this1._1, _1 : this1._2};
};
thx__$Tuple_Tuple3_$Impl_$.dropRight = function(this1) {
	return { _0 : this1._0, _1 : this1._1};
};
thx__$Tuple_Tuple3_$Impl_$["with"] = function(this1,v) {
	return { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : v};
};
thx__$Tuple_Tuple3_$Impl_$.toString = function(this1) {
	return "Tuple3(" + Std.string(this1._0) + "," + Std.string(this1._1) + "," + Std.string(this1._2) + ")";
};
thx__$Tuple_Tuple3_$Impl_$.arrayToTuple3 = function(v) {
	return { _0 : v[0], _1 : v[1], _2 : v[2]};
};
var thx__$Tuple_Tuple4_$Impl_$ = {};
thx__$Tuple_Tuple4_$Impl_$.__name__ = ["thx","_Tuple","Tuple4_Impl_"];
thx__$Tuple_Tuple4_$Impl_$._new = function(_0,_1,_2,_3) {
	return { _0 : _0, _1 : _1, _2 : _2, _3 : _3};
};
thx__$Tuple_Tuple4_$Impl_$.flip = function(this1) {
	return { _0 : this1._3, _1 : this1._2, _2 : this1._1, _3 : this1._0};
};
thx__$Tuple_Tuple4_$Impl_$.dropLeft = function(this1) {
	return { _0 : this1._1, _1 : this1._2, _2 : this1._3};
};
thx__$Tuple_Tuple4_$Impl_$.dropRight = function(this1) {
	return { _0 : this1._0, _1 : this1._1, _2 : this1._2};
};
thx__$Tuple_Tuple4_$Impl_$["with"] = function(this1,v) {
	return { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3, _4 : v};
};
thx__$Tuple_Tuple4_$Impl_$.toString = function(this1) {
	return "Tuple4(" + Std.string(this1._0) + "," + Std.string(this1._1) + "," + Std.string(this1._2) + "," + Std.string(this1._3) + ")";
};
thx__$Tuple_Tuple4_$Impl_$.arrayToTuple4 = function(v) {
	return { _0 : v[0], _1 : v[1], _2 : v[2], _3 : v[3]};
};
var thx__$Tuple_Tuple5_$Impl_$ = {};
thx__$Tuple_Tuple5_$Impl_$.__name__ = ["thx","_Tuple","Tuple5_Impl_"];
thx__$Tuple_Tuple5_$Impl_$._new = function(_0,_1,_2,_3,_4) {
	return { _0 : _0, _1 : _1, _2 : _2, _3 : _3, _4 : _4};
};
thx__$Tuple_Tuple5_$Impl_$.flip = function(this1) {
	return { _0 : this1._4, _1 : this1._3, _2 : this1._2, _3 : this1._1, _4 : this1._0};
};
thx__$Tuple_Tuple5_$Impl_$.dropLeft = function(this1) {
	return { _0 : this1._1, _1 : this1._2, _2 : this1._3, _3 : this1._4};
};
thx__$Tuple_Tuple5_$Impl_$.dropRight = function(this1) {
	return { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3};
};
thx__$Tuple_Tuple5_$Impl_$["with"] = function(this1,v) {
	return { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3, _4 : this1._4, _5 : v};
};
thx__$Tuple_Tuple5_$Impl_$.toString = function(this1) {
	return "Tuple5(" + Std.string(this1._0) + "," + Std.string(this1._1) + "," + Std.string(this1._2) + "," + Std.string(this1._3) + "," + Std.string(this1._4) + ")";
};
thx__$Tuple_Tuple5_$Impl_$.arrayToTuple5 = function(v) {
	return { _0 : v[0], _1 : v[1], _2 : v[2], _3 : v[3], _4 : v[4]};
};
var thx__$Tuple_Tuple6_$Impl_$ = {};
thx__$Tuple_Tuple6_$Impl_$.__name__ = ["thx","_Tuple","Tuple6_Impl_"];
thx__$Tuple_Tuple6_$Impl_$._new = function(_0,_1,_2,_3,_4,_5) {
	return { _0 : _0, _1 : _1, _2 : _2, _3 : _3, _4 : _4, _5 : _5};
};
thx__$Tuple_Tuple6_$Impl_$.flip = function(this1) {
	return { _0 : this1._5, _1 : this1._4, _2 : this1._3, _3 : this1._2, _4 : this1._1, _5 : this1._0};
};
thx__$Tuple_Tuple6_$Impl_$.dropLeft = function(this1) {
	return { _0 : this1._1, _1 : this1._2, _2 : this1._3, _3 : this1._4, _4 : this1._5};
};
thx__$Tuple_Tuple6_$Impl_$.dropRight = function(this1) {
	return { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3, _4 : this1._4};
};
thx__$Tuple_Tuple6_$Impl_$.toString = function(this1) {
	return "Tuple6(" + Std.string(this1._0) + "," + Std.string(this1._1) + "," + Std.string(this1._2) + "," + Std.string(this1._3) + "," + Std.string(this1._4) + "," + Std.string(this1._5) + ")";
};
thx__$Tuple_Tuple6_$Impl_$.arrayToTuple6 = function(v) {
	return { _0 : v[0], _1 : v[1], _2 : v[2], _3 : v[3], _4 : v[4], _5 : v[5]};
};
var thx_Types = function() { };
thx_Types.__name__ = ["thx","Types"];
thx_Types.isAnonymousObject = function(v) {
	return Reflect.isObject(v) && null == Type.getClass(v);
};
thx_Types.isPrimitive = function(v) {
	{
		var _g = Type["typeof"](v);
		switch(_g[1]) {
		case 1:case 2:case 3:
			return true;
		case 0:case 5:case 7:case 4:case 8:
			return false;
		case 6:
			var c = _g[2];
			return Type.getClassName(c) == "String";
		}
	}
};
thx_Types.hasSuperClass = function(cls,sup) {
	while(null != cls) {
		if(cls == sup) return true;
		cls = Type.getSuperClass(cls);
	}
	return false;
};
thx_Types.sameType = function(a,b) {
	return thx_Types.toString(Type["typeof"](a)) == thx_Types.toString(Type["typeof"](b));
};
thx_Types.typeInheritance = function(type) {
	switch(type[1]) {
	case 1:
		return ["Int"];
	case 2:
		return ["Float"];
	case 3:
		return ["Bool"];
	case 4:
		return ["{}"];
	case 5:
		return ["Function"];
	case 6:
		var c = type[2];
		var classes = [];
		while(null != c) {
			classes.push(c);
			c = Type.getSuperClass(c);
		}
		return classes.map(Type.getClassName);
	case 7:
		var e = type[2];
		return [Type.getEnumName(e)];
	default:
		throw new js__$Boot_HaxeError("invalid type " + Std.string(type));
	}
};
thx_Types.toString = function(type) {
	switch(type[1]) {
	case 0:
		return "Null";
	case 1:
		return "Int";
	case 2:
		return "Float";
	case 3:
		return "Bool";
	case 4:
		return "{}";
	case 5:
		return "Function";
	case 6:
		var c = type[2];
		return Type.getClassName(c);
	case 7:
		var e = type[2];
		return Type.getEnumName(e);
	default:
		throw new js__$Boot_HaxeError("invalid type " + Std.string(type));
	}
};
thx_Types.valueTypeInheritance = function(value) {
	return thx_Types.typeInheritance(Type["typeof"](value));
};
thx_Types.valueTypeToString = function(value) {
	return thx_Types.toString(Type["typeof"](value));
};
var thx_color__$CieLCh_CieLCh_$Impl_$ = {};
thx_color__$CieLCh_CieLCh_$Impl_$.__name__ = ["thx","color","_CieLCh","CieLCh_Impl_"];
thx_color__$CieLCh_CieLCh_$Impl_$.create = function(lightness,chroma,hue) {
	return [lightness,chroma,hue];
};
thx_color__$CieLCh_CieLCh_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$CieLCh_CieLCh_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cielch":case "lch":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		case "hcl":
			var c = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return [c[2],c[1],c[0]];
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$CieLCh_CieLCh_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$CieLCh_CieLCh_$Impl_$.analogous = function(this1,spread) {
	if(spread == null) spread = 30.0;
	var _0 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$CieLCh_CieLCh_$Impl_$.complement = function(this1) {
	return thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,180);
};
thx_color__$CieLCh_CieLCh_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolateAngle(t,this1[2],other[2],360)];
	return channels;
};
thx_color__$CieLCh_CieLCh_$Impl_$.interpolateWidest = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolateAngleWidest(t,this1[2],other[2],360)];
	return channels;
};
thx_color__$CieLCh_CieLCh_$Impl_$.min = function(this1,other) {
	var lightness = Math.min(this1[0],other[0]);
	var chroma = Math.min(this1[1],other[1]);
	var hue = Math.min(this1[2],other[2]);
	return [lightness,chroma,hue];
};
thx_color__$CieLCh_CieLCh_$Impl_$.max = function(this1,other) {
	var lightness = Math.max(this1[0],other[0]);
	var chroma = Math.max(this1[1],other[1]);
	var hue = Math.max(this1[2],other[2]);
	return [lightness,chroma,hue];
};
thx_color__$CieLCh_CieLCh_$Impl_$.normalize = function(this1) {
	var lightness = thx_Floats.clamp(this1[0],0,1);
	var chroma = thx_Floats.clamp(this1[1],0,1);
	var hue = thx_Floats.wrapCircular(this1[2],360);
	return [lightness,chroma,hue];
};
thx_color__$CieLCh_CieLCh_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$CieLCh_CieLCh_$Impl_$.normalize(thx_color__$CieLCh_CieLCh_$Impl_$.withHue(this1,this1[2] + angle));
};
thx_color__$CieLCh_CieLCh_$Impl_$.roundTo = function(this1,decimals) {
	var lightness = thx_Floats.roundTo(this1[0],decimals);
	var chroma = thx_Floats.roundTo(this1[1],decimals);
	var hue = thx_Floats.roundTo(this1[2],decimals);
	return [lightness,chroma,hue];
};
thx_color__$CieLCh_CieLCh_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 144.0;
	var _0 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$CieLCh_CieLCh_$Impl_$.square = function(this1) {
	return thx_color__$CieLCh_CieLCh_$Impl_$.tetrad(this1,90);
};
thx_color__$CieLCh_CieLCh_$Impl_$.tetrad = function(this1,angle) {
	var _0 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,0);
	var _1 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,angle);
	var _2 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,180);
	var _3 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,180 + angle);
	return { _0 : _0, _1 : _1, _2 : _2, _3 : _3};
};
thx_color__$CieLCh_CieLCh_$Impl_$.triad = function(this1) {
	var _0 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,-120);
	var _1 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,0);
	var _2 = thx_color__$CieLCh_CieLCh_$Impl_$.rotate(this1,120);
	return { _0 : _0, _1 : _1, _2 : _2};
};
thx_color__$CieLCh_CieLCh_$Impl_$.withLightness = function(this1,newlightness) {
	return [newlightness,this1[1],this1[2]];
};
thx_color__$CieLCh_CieLCh_$Impl_$.withChroma = function(this1,newchroma) {
	return [this1[0],newchroma,this1[2]];
};
thx_color__$CieLCh_CieLCh_$Impl_$.withHue = function(this1,newhue) {
	return [this1[0],this1[1],newhue];
};
thx_color__$CieLCh_CieLCh_$Impl_$.equals = function(this1,other) {
	return thx_color__$CieLCh_CieLCh_$Impl_$.nearEquals(this1,other);
};
thx_color__$CieLCh_CieLCh_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(thx_Floats.angleDifference(this1[0],other[0],360.0)) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$CieLCh_CieLCh_$Impl_$.toString = function(this1) {
	return "cielch(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$CieLCh_CieLCh_$Impl_$.toHclString = function(this1) {
	return "hcl(" + this1[2] + "," + this1[1] + "," + this1[0] + ")";
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCieLab = function(this1) {
	var hradi = this1[2] * (Math.PI / 180);
	var a = Math.cos(hradi) * this1[1];
	var b = Math.sin(hradi) * this1[1];
	return [this1[0],a,b];
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$CieLCh_CieLCh_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$CieLCh_CieLCh_$Impl_$.toXyz(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbxa(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toRgbx(thx_color__$CieLCh_CieLCh_$Impl_$.toCieLab(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toXyz = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toXyz(thx_color__$CieLCh_CieLCh_$Impl_$.toCieLab(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toYxy = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toYxy(thx_color__$CieLCh_CieLCh_$Impl_$.toCieLab(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.get_lightness = function(this1) {
	return this1[0];
};
thx_color__$CieLCh_CieLCh_$Impl_$.get_chroma = function(this1) {
	return this1[1];
};
thx_color__$CieLCh_CieLCh_$Impl_$.get_hue = function(this1) {
	return this1[2];
};
var thx_color__$CieLab_CieLab_$Impl_$ = {};
thx_color__$CieLab_CieLab_$Impl_$.__name__ = ["thx","color","_CieLab","CieLab_Impl_"];
thx_color__$CieLab_CieLab_$Impl_$.create = function(l,a,b) {
	return [l,a,b];
};
thx_color__$CieLab_CieLab_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$CieLab_CieLab_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cielab":case "lab":
			return thx_color__$CieLab_CieLab_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false));
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$CieLab_CieLab_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$CieLab_CieLab_$Impl_$.distance = function(this1,other) {
	return (this1[0] - other[0]) * (this1[0] - other[0]) + (this1[1] - other[1]) * (this1[1] - other[1]) + (this1[2] - other[2]) * (this1[2] - other[2]);
};
thx_color__$CieLab_CieLab_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$CieLab_CieLab_$Impl_$.match = function(this1,palette) {
	var it = palette;
	if(null == it) throw new thx_error_NullArgument("Iterable argument \"this\" cannot be null",{ fileName : "NullArgument.hx", lineNumber : 73, className : "thx.color._CieLab.CieLab_Impl_", methodName : "match"}); else if(!$iterator(it)().hasNext()) throw new thx_error_NullArgument("Iterable argument \"this\" cannot be empty",{ fileName : "NullArgument.hx", lineNumber : 75, className : "thx.color._CieLab.CieLab_Impl_", methodName : "match"});
	var dist = Infinity;
	var closest = null;
	var $it0 = $iterator(palette)();
	while( $it0.hasNext() ) {
		var color = $it0.next();
		var ndist = thx_color__$CieLab_CieLab_$Impl_$.distance(this1,color);
		if(ndist < dist) {
			dist = ndist;
			closest = color;
		}
	}
	return closest;
};
thx_color__$CieLab_CieLab_$Impl_$.min = function(this1,other) {
	var l = Math.min(this1[0],other[0]);
	var a = Math.min(this1[1],other[1]);
	var b = Math.min(this1[2],other[2]);
	return [l,a,b];
};
thx_color__$CieLab_CieLab_$Impl_$.max = function(this1,other) {
	var l = Math.max(this1[0],other[0]);
	var a = Math.max(this1[1],other[1]);
	var b = Math.max(this1[2],other[2]);
	return [l,a,b];
};
thx_color__$CieLab_CieLab_$Impl_$.roundTo = function(this1,decimals) {
	var l = thx_Floats.roundTo(this1[0],decimals);
	var a = thx_Floats.roundTo(this1[1],decimals);
	var b = thx_Floats.roundTo(this1[2],decimals);
	return [l,a,b];
};
thx_color__$CieLab_CieLab_$Impl_$.equals = function(this1,other) {
	return thx_color__$CieLab_CieLab_$Impl_$.nearEquals(this1,other);
};
thx_color__$CieLab_CieLab_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$CieLab_CieLab_$Impl_$.withL = function(this1,newl) {
	return [newl,this1[1],this1[2]];
};
thx_color__$CieLab_CieLab_$Impl_$.withA = function(this1,newa) {
	return [this1[0],newa,this1[2]];
};
thx_color__$CieLab_CieLab_$Impl_$.withB = function(this1,newb) {
	return [this1[0],this1[1],newb];
};
thx_color__$CieLab_CieLab_$Impl_$.toString = function(this1) {
	return "cielab(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$CieLab_CieLab_$Impl_$.toCieLCh = function(this1) {
	var h = Math.atan2(this1[2],this1[1]) * 180 / Math.PI;
	var c = Math.sqrt(this1[1] * this1[1] + this1[2] * this1[2]);
	return [this1[0],c,h];
};
thx_color__$CieLab_CieLab_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$CieLab_CieLab_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$CieLab_CieLab_$Impl_$.toXyz(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$CieLab_CieLab_$Impl_$.toRgbxa(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toRgbx(thx_color__$CieLab_CieLab_$Impl_$.toXyz(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toXyz = function(this1) {
	var f = function(t) {
		if(t > 0.20689655172413793) return Math.pow(t,3); else return 0.12841854934601665 * (t - 0.13793103448275862);
	};
	var x = thx_color__$Xyz_Xyz_$Impl_$.whiteReference[0] * f(0.0086206896551724137 * (this1[0] + 16) + 0.002 * this1[1]);
	var y = thx_color__$Xyz_Xyz_$Impl_$.whiteReference[1] * f(0.0086206896551724137 * (this1[0] + 16));
	var z = thx_color__$Xyz_Xyz_$Impl_$.whiteReference[2] * f(0.0086206896551724137 * (this1[0] + 16) - 0.005 * this1[2]);
	return [x,y,z];
};
thx_color__$CieLab_CieLab_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toYxy = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toYxy(thx_color__$CieLab_CieLab_$Impl_$.toXyz(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.get_l = function(this1) {
	return this1[0];
};
thx_color__$CieLab_CieLab_$Impl_$.get_a = function(this1) {
	return this1[1];
};
thx_color__$CieLab_CieLab_$Impl_$.get_b = function(this1) {
	return this1[2];
};
var thx_color__$CieLuv_CieLuv_$Impl_$ = {};
thx_color__$CieLuv_CieLuv_$Impl_$.__name__ = ["thx","color","_CieLuv","CieLuv_Impl_"];
thx_color__$CieLuv_CieLuv_$Impl_$.create = function(l,u,v) {
	return [l,u,v];
};
thx_color__$CieLuv_CieLuv_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$CieLuv_CieLuv_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cieluv":case "luv":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$CieLuv_CieLuv_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$CieLuv_CieLuv_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$CieLuv_CieLuv_$Impl_$.min = function(this1,other) {
	var l = Math.min(this1[0],other[0]);
	var u = Math.min(this1[1],other[1]);
	var v = Math.min(this1[2],other[2]);
	return [l,u,v];
};
thx_color__$CieLuv_CieLuv_$Impl_$.max = function(this1,other) {
	var l = Math.max(this1[0],other[0]);
	var u = Math.max(this1[1],other[1]);
	var v = Math.max(this1[2],other[2]);
	return [l,u,v];
};
thx_color__$CieLuv_CieLuv_$Impl_$.normalize = function(this1) {
	var l = thx_Floats.normalize(this1[0]);
	var u = thx_Floats.clamp(this1[1],-0.436,0.436);
	var v = thx_Floats.clamp(this1[2],-0.615,0.615);
	return [l,u,v];
};
thx_color__$CieLuv_CieLuv_$Impl_$.roundTo = function(this1,decimals) {
	var l = thx_Floats.roundTo(this1[0],decimals);
	var u = thx_Floats.roundTo(this1[1],decimals);
	var v = thx_Floats.roundTo(this1[2],decimals);
	return [l,u,v];
};
thx_color__$CieLuv_CieLuv_$Impl_$.withY = function(this1,newy) {
	return [newy,this1[1],this1[2]];
};
thx_color__$CieLuv_CieLuv_$Impl_$.withU = function(this1,newu) {
	return [this1[0],this1[1],this1[2]];
};
thx_color__$CieLuv_CieLuv_$Impl_$.withV = function(this1,newv) {
	return [this1[0],this1[1],this1[2]];
};
thx_color__$CieLuv_CieLuv_$Impl_$.toString = function(this1) {
	return "cieluv(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$CieLuv_CieLuv_$Impl_$.equals = function(this1,other) {
	return thx_color__$CieLuv_CieLuv_$Impl_$.nearEquals(this1,other);
};
thx_color__$CieLuv_CieLuv_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$CieLuv_CieLuv_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$CieLuv_CieLuv_$Impl_$.toXyz(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$CieLuv_CieLuv_$Impl_$.toCieLab(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$CieLuv_CieLuv_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$CieLuv_CieLuv_$Impl_$.toXyz(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbxa(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toRgbx(thx_color__$CieLuv_CieLuv_$Impl_$.toXyz(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$CieLuv_CieLuv_$Impl_$.toRgbx(this1));
};
thx_color__$CieLuv_CieLuv_$Impl_$.toXyz = function(this1) {
	var l = this1[0] * 100;
	var u = this1[1] * 100;
	var v = this1[2] * 100;
	var x = 9 * u / (9 * u - 16 * v + 12);
	var y = 4 * v / (9 * u - 16 * v + 12);
	var uPrime;
	uPrime = (function($this) {
		var $r;
		try {
			$r = u / (13 * l);
		} catch( e ) {
			haxe_CallStack.lastException = e;
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			$r = 0;
		}
		return $r;
	}(this)) + thx_color__$Xyz_Xyz_$Impl_$.get_u(thx_color__$Xyz_Xyz_$Impl_$.whiteReference) * 100;
	var vPrime;
	vPrime = (function($this) {
		var $r;
		try {
			$r = v / (13 * l);
		} catch( e1 ) {
			haxe_CallStack.lastException = e1;
			if (e1 instanceof js__$Boot_HaxeError) e1 = e1.val;
			$r = 0;
		}
		return $r;
	}(this)) + thx_color__$Xyz_Xyz_$Impl_$.get_v(thx_color__$Xyz_Xyz_$Impl_$.whiteReference) * 100;
	var Y;
	if(l > 8) Y = thx_color__$Xyz_Xyz_$Impl_$.whiteReference[1] * 100 * Math.pow((l + 16) / 116,3); else Y = thx_color__$Xyz_Xyz_$Impl_$.whiteReference[1] * 100 * l * Math.pow(0.10344827586206896,3);
	var X = Y * 9 * uPrime / (4 * vPrime);
	var Z = Y * (12 - 3 * uPrime - 20 * vPrime) / (4 * vPrime);
	return [X / 100,Y / 100,Z / 100];
};
thx_color__$CieLuv_CieLuv_$Impl_$.get_l = function(this1) {
	return this1[0];
};
thx_color__$CieLuv_CieLuv_$Impl_$.get_u = function(this1) {
	return this1[1];
};
thx_color__$CieLuv_CieLuv_$Impl_$.get_v = function(this1) {
	return this1[2];
};
var thx_color__$Cmy_Cmy_$Impl_$ = {};
thx_color__$Cmy_Cmy_$Impl_$.__name__ = ["thx","color","_Cmy","Cmy_Impl_"];
thx_color__$Cmy_Cmy_$Impl_$.create = function(cyan,magenta,yellow) {
	return [cyan,magenta,yellow];
};
thx_color__$Cmy_Cmy_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$Cmy_Cmy_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cmy":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Cmy_Cmy_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Cmy_Cmy_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Cmy_Cmy_$Impl_$.min = function(this1,other) {
	var cyan = Math.min(this1[0],other[0]);
	var magenta = Math.min(this1[1],other[1]);
	var yellow = Math.min(this1[2],other[2]);
	return [cyan,magenta,yellow];
};
thx_color__$Cmy_Cmy_$Impl_$.max = function(this1,other) {
	var cyan = Math.max(this1[0],other[0]);
	var magenta = Math.max(this1[1],other[1]);
	var yellow = Math.max(this1[2],other[2]);
	return [cyan,magenta,yellow];
};
thx_color__$Cmy_Cmy_$Impl_$.normalize = function(this1) {
	var cyan = thx_Floats.normalize(this1[0]);
	var magenta = thx_Floats.normalize(this1[1]);
	var yellow = thx_Floats.normalize(this1[2]);
	return [cyan,magenta,yellow];
};
thx_color__$Cmy_Cmy_$Impl_$.roundTo = function(this1,decimals) {
	var cyan = thx_Floats.roundTo(this1[0],decimals);
	var magenta = thx_Floats.roundTo(this1[1],decimals);
	var yellow = thx_Floats.roundTo(this1[2],decimals);
	return [cyan,magenta,yellow];
};
thx_color__$Cmy_Cmy_$Impl_$.withCyan = function(this1,newcyan) {
	return [newcyan,this1[1],this1[2]];
};
thx_color__$Cmy_Cmy_$Impl_$.withMagenta = function(this1,newmagenta) {
	return [this1[0],newmagenta,this1[2]];
};
thx_color__$Cmy_Cmy_$Impl_$.withYellow = function(this1,newyellow) {
	return [this1[0],this1[1],newyellow];
};
thx_color__$Cmy_Cmy_$Impl_$.toString = function(this1) {
	return "cmy(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$Cmy_Cmy_$Impl_$.equals = function(this1,other) {
	return thx_color__$Cmy_Cmy_$Impl_$.nearEquals(this1,other);
};
thx_color__$Cmy_Cmy_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$Cmy_Cmy_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Cmy_Cmy_$Impl_$.toXyz(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Cmy_Cmy_$Impl_$.toCieLab(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toCmyk = function(this1) {
	var k = Math.min(Math.min(this1[0],this1[1]),this1[2]);
	if(k == 1) return [0,0,0,1]; else return [(this1[0] - k) / (1 - k),(this1[1] - k) / (1 - k),(this1[2] - k) / (1 - k),k];
};
thx_color__$Cmy_Cmy_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Cmy_Cmy_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Cmy_Cmy_$Impl_$.toXyz(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Cmy_Cmy_$Impl_$.toRgbxa(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toRgbx = function(this1) {
	return [1 - this1[0],1 - this1[1],1 - this1[2]];
};
thx_color__$Cmy_Cmy_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.get_cyan = function(this1) {
	return this1[0];
};
thx_color__$Cmy_Cmy_$Impl_$.get_magenta = function(this1) {
	return this1[1];
};
thx_color__$Cmy_Cmy_$Impl_$.get_yellow = function(this1) {
	return this1[2];
};
var thx_color__$Cmyk_Cmyk_$Impl_$ = {};
thx_color__$Cmyk_Cmyk_$Impl_$.__name__ = ["thx","color","_Cmyk","Cmyk_Impl_"];
thx_color__$Cmyk_Cmyk_$Impl_$.create = function(cyan,magenta,yellow,black) {
	return [cyan,magenta,yellow,black];
};
thx_color__$Cmyk_Cmyk_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return [arr[0],arr[1],arr[2],arr[3]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cmyk":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,4,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Cmyk_Cmyk_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Cmyk_Cmyk_$Impl_$.darker = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Floats.interpolate(t,this1[3],1)];
	return channels;
};
thx_color__$Cmyk_Cmyk_$Impl_$.lighter = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Floats.interpolate(t,this1[3],0)];
	return channels;
};
thx_color__$Cmyk_Cmyk_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2]),thx_Floats.interpolate(t,this1[3],other[3])];
	return channels;
};
thx_color__$Cmyk_Cmyk_$Impl_$.min = function(this1,other) {
	var cyan = Math.min(this1[0],other[0]);
	var magenta = Math.min(this1[1],other[1]);
	var yellow = Math.min(this1[2],other[2]);
	var black = Math.min(this1[3],other[3]);
	return [cyan,magenta,yellow,black];
};
thx_color__$Cmyk_Cmyk_$Impl_$.max = function(this1,other) {
	var cyan = Math.max(this1[0],other[0]);
	var magenta = Math.max(this1[1],other[1]);
	var yellow = Math.max(this1[2],other[2]);
	var black = Math.max(this1[3],other[3]);
	return [cyan,magenta,yellow,black];
};
thx_color__$Cmyk_Cmyk_$Impl_$.normalize = function(this1) {
	var cyan = thx_Floats.normalize(this1[0]);
	var magenta = thx_Floats.normalize(this1[1]);
	var yellow = thx_Floats.normalize(this1[2]);
	var black = thx_Floats.normalize(this1[3]);
	return [cyan,magenta,yellow,black];
};
thx_color__$Cmyk_Cmyk_$Impl_$.roundTo = function(this1,decimals) {
	var cyan = thx_Floats.roundTo(this1[0],decimals);
	var magenta = thx_Floats.roundTo(this1[1],decimals);
	var yellow = thx_Floats.roundTo(this1[2],decimals);
	var black = thx_Floats.roundTo(this1[3],decimals);
	return [cyan,magenta,yellow,black];
};
thx_color__$Cmyk_Cmyk_$Impl_$.withCyan = function(this1,newcyan) {
	return [newcyan,this1[1],this1[2],this1[3]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.withMagenta = function(this1,newmagenta) {
	return [this1[0],newmagenta,this1[2],this1[3]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.withYellow = function(this1,newyellow) {
	return [this1[0],this1[1],newyellow,this1[3]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.withBlack = function(this1,newblack) {
	return [this1[0],this1[1],this1[2],newblack];
};
thx_color__$Cmyk_Cmyk_$Impl_$.toString = function(this1) {
	return "cmyk(" + this1[0] + "," + this1[1] + "," + this1[2] + "," + this1[3] + ")";
};
thx_color__$Cmyk_Cmyk_$Impl_$.equals = function(this1,other) {
	return thx_color__$Cmyk_Cmyk_$Impl_$.nearEquals(this1,other);
};
thx_color__$Cmyk_Cmyk_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance && Math.abs(this1[3] - other[3]) <= tolerance;
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Cmyk_Cmyk_$Impl_$.toXyz(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Cmyk_Cmyk_$Impl_$.toCieLab(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCmy = function(this1) {
	return [this1[3] + (1 - this1[3]) * this1[0],this1[3] + (1 - this1[3]) * this1[1],this1[3] + (1 - this1[3]) * this1[2]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Cmyk_Cmyk_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Cmyk_Cmyk_$Impl_$.toXyz(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbxa(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx = function(this1) {
	return [(1 - this1[3]) * (1 - this1[0]),(1 - this1[3]) * (1 - this1[1]),(1 - this1[3]) * (1 - this1[2])];
};
thx_color__$Cmyk_Cmyk_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.get_cyan = function(this1) {
	return this1[0];
};
thx_color__$Cmyk_Cmyk_$Impl_$.get_magenta = function(this1) {
	return this1[1];
};
thx_color__$Cmyk_Cmyk_$Impl_$.get_yellow = function(this1) {
	return this1[2];
};
thx_color__$Cmyk_Cmyk_$Impl_$.get_black = function(this1) {
	return this1[3];
};
var thx_color__$CubeHelix_CubeHelix_$Impl_$ = {};
thx_color__$CubeHelix_CubeHelix_$Impl_$.__name__ = ["thx","color","_CubeHelix","CubeHelix_Impl_"];
thx_color__$CubeHelix_CubeHelix_$Impl_$.create = function(hue,saturation,lightness,gamma) {
	return [hue,saturation,lightness,null == gamma?1.0:gamma];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.fromFloats = function(arr) {
	if(arr.length < 4) {
		thx_ArrayFloats.resize(arr,3);
		arr.push(1);
	}
	var gamma = arr[3];
	return [arr[0],arr[1],arr[2],null == gamma?1.0:gamma];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cubehelix":
			if(info.channels.length >= 4) {
				var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,4,false);
				return channels;
			} else {
				var channels1 = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false).concat([1.0]);
				return channels1;
			}
			break;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$CubeHelix_CubeHelix_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.analogous = function(this1,spread) {
	if(spread == null) spread = 30.0;
	var _0 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.complement = function(this1) {
	return thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,180);
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.darker = function(this1,t) {
	var channels = [this1[0],this1[1],thx_Floats.interpolate(t,this1[2],0),this1[3]];
	return channels;
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.lighter = function(this1,t) {
	var channels = [this1[0],this1[1],thx_Floats.interpolate(t,this1[2],1),this1[3]];
	return channels;
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngle(t,this1[0],other[0],360),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2]),thx_Floats.interpolate(t,this1[3],other[3])];
	return channels;
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.interpolateWidest = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngleWidest(t,this1[0],other[0],360),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2]),thx_Floats.interpolate(t,this1[3],other[3])];
	return channels;
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.min = function(this1,other) {
	var hue = Math.min(this1[0],other[0]);
	var saturation = Math.min(this1[1],other[1]);
	var lightness = Math.min(this1[2],other[2]);
	var gamma = Math.min(this1[3],other[3]);
	return [hue,saturation,lightness,null == gamma?1.0:gamma];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.max = function(this1,other) {
	var hue = Math.max(this1[0],other[0]);
	var saturation = Math.max(this1[1],other[1]);
	var lightness = Math.max(this1[2],other[2]);
	var gamma = Math.max(this1[3],other[3]);
	return [hue,saturation,lightness,null == gamma?1.0:gamma];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.normalize = function(this1) {
	var hue = thx_Floats.wrapCircular(this1[0],360);
	var saturation = thx_Floats.normalize(this1[1]);
	var lightness = thx_Floats.normalize(this1[2]);
	var gamma = thx_Floats.normalize(this1[3]);
	return [hue,saturation,lightness,null == gamma?1.0:gamma];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$CubeHelix_CubeHelix_$Impl_$.withHue(this1,this1[0] + angle);
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.roundTo = function(this1,decimals) {
	var hue = thx_Floats.roundTo(this1[0],decimals);
	var saturation = thx_Floats.roundTo(this1[1],decimals);
	var lightness = thx_Floats.roundTo(this1[2],decimals);
	var gamma = thx_Floats.roundTo(this1[3],decimals);
	return [hue,saturation,lightness,null == gamma?1.0:gamma];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 144.0;
	var _0 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.square = function(this1) {
	return thx_color__$CubeHelix_CubeHelix_$Impl_$.tetrad(this1,90);
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.tetrad = function(this1,angle) {
	var _0 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,0);
	var _1 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,angle);
	var _2 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,180);
	var _3 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,180 + angle);
	return { _0 : _0, _1 : _1, _2 : _2, _3 : _3};
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.triad = function(this1) {
	var _0 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,-120);
	var _1 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,0);
	var _2 = thx_color__$CubeHelix_CubeHelix_$Impl_$.rotate(this1,120);
	return { _0 : _0, _1 : _1, _2 : _2};
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.withGamma = function(this1,newgamma) {
	return [this1[0],this1[1],this1[2],newgamma];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.withHue = function(this1,newhue) {
	return [newhue,this1[1],this1[2],this1[3]];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.withLightness = function(this1,newlightness) {
	return [this1[0],this1[1],newlightness,this1[3]];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation,this1[2],this1[3]];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toCss3 = function(this1) {
	return thx_color__$CubeHelix_CubeHelix_$Impl_$.toString(this1);
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toString = function(this1) {
	if(this1[3] != 1) return "cubehelix(" + this1[0] + "," + this1[1] + "," + this1[2] + ", " + this1[3] + ")"; else return "cubehelix(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.equals = function(this1,other) {
	return thx_color__$CubeHelix_CubeHelix_$Impl_$.nearEquals(this1,other);
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(thx_Floats.angleDifference(this1[0],other[0],360.0)) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance && Math.abs(this1[3] - other[3]) <= tolerance;
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$CubeHelix_CubeHelix_$Impl_$.toXyz(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$CubeHelix_CubeHelix_$Impl_$.toCieLab(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$CubeHelix_CubeHelix_$Impl_$.toXyz(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbxa(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx = function(this1) {
	var h;
	if(isNaN(this1[0])) h = 0; else h = (this1[0] + 120) / 180 * Math.PI;
	var l = Math.pow(this1[2],this1[3]);
	var a;
	if(isNaN(this1[1])) a = 0; else a = this1[1] * l * (1 - l);
	var cosh = Math.cos(h);
	var sinh = Math.sin(h);
	return [l + a * (-0.14861 * cosh + 1.78277 * sinh),l + a * (-0.29227 * cosh + -0.90649 * sinh),l + a * (1.97294 * cosh)];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$CubeHelix_CubeHelix_$Impl_$.toRgbx(this1));
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.get_hue = function(this1) {
	return this1[0];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.get_saturation = function(this1) {
	return this1[1];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.get_lightness = function(this1) {
	return this1[2];
};
thx_color__$CubeHelix_CubeHelix_$Impl_$.get_gamma = function(this1) {
	return this1[3];
};
var thx_color__$Grey_Grey_$Impl_$ = {};
thx_color__$Grey_Grey_$Impl_$.__name__ = ["thx","color","_Grey","Grey_Impl_"];
thx_color__$Grey_Grey_$Impl_$.create = function(v) {
	return v;
};
thx_color__$Grey_Grey_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "grey":case "gray":
			var grey = thx_color_parse_ColorParser.getFloatChannels(info.channels,1,false)[0];
			return grey;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Grey_Grey_$Impl_$._new = function(grey) {
	return grey;
};
thx_color__$Grey_Grey_$Impl_$.contrast = function(this1) {
	if(this1 > 0.5) return thx_color__$Grey_Grey_$Impl_$.black; else return thx_color__$Grey_Grey_$Impl_$.white;
};
thx_color__$Grey_Grey_$Impl_$.darker = function(this1,t) {
	var grey = thx_Floats.interpolate(t,this1,0);
	return grey;
};
thx_color__$Grey_Grey_$Impl_$.lighter = function(this1,t) {
	var grey = thx_Floats.interpolate(t,this1,1);
	return grey;
};
thx_color__$Grey_Grey_$Impl_$.interpolate = function(this1,other,t) {
	var grey = thx_Floats.interpolate(t,this1,other);
	return grey;
};
thx_color__$Grey_Grey_$Impl_$.min = function(this1,other) {
	var v = Math.min(this1,other);
	return v;
};
thx_color__$Grey_Grey_$Impl_$.max = function(this1,other) {
	var v = Math.max(this1,other);
	return v;
};
thx_color__$Grey_Grey_$Impl_$.normalize = function(this1) {
	return this1 < 0?0:this1 > 1?1:this1;
};
thx_color__$Grey_Grey_$Impl_$.roundTo = function(this1,decimals) {
	var v = thx_Floats.roundTo(this1,decimals);
	return v;
};
thx_color__$Grey_Grey_$Impl_$.toString = function(this1) {
	return "grey(" + this1 * 100 + "%)";
};
thx_color__$Grey_Grey_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1 - other) <= 10e-10;
};
thx_color__$Grey_Grey_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1 - other) <= tolerance;
};
thx_color__$Grey_Grey_$Impl_$.get_grey = function(this1) {
	return this1;
};
thx_color__$Grey_Grey_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Grey_Grey_$Impl_$.toXyz(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Grey_Grey_$Impl_$.toCieLab(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Grey_Grey_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Grey_Grey_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Grey_Grey_$Impl_$.toXyz(this1));
};
thx_color__$Grey_Grey_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Grey_Grey_$Impl_$.toRgbxa(this1));
};
thx_color__$Grey_Grey_$Impl_$.toRgbx = function(this1) {
	return [this1,this1,this1];
};
thx_color__$Grey_Grey_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
var thx_color__$Hsl_Hsl_$Impl_$ = {};
thx_color__$Hsl_Hsl_$Impl_$.__name__ = ["thx","color","_Hsl","Hsl_Impl_"];
thx_color__$Hsl_Hsl_$Impl_$.create = function(hue,saturation,lightness) {
	return [hue,saturation,lightness];
};
thx_color__$Hsl_Hsl_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$Hsl_Hsl_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "hsl":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Hsl_Hsl_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.analogous = function(this1,spread) {
	if(spread == null) spread = 30.0;
	var _0 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsl_Hsl_$Impl_$.complement = function(this1) {
	return thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,180);
};
thx_color__$Hsl_Hsl_$Impl_$.darker = function(this1,t) {
	var channels = [this1[0],this1[1],thx_Floats.interpolate(t,this1[2],0)];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.lighter = function(this1,t) {
	var channels = [this1[0],this1[1],thx_Floats.interpolate(t,this1[2],1)];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngle(t,this1[0],other[0],360),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.interpolateWidest = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngleWidest(t,this1[0],other[0],360),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.min = function(this1,other) {
	var hue = Math.min(this1[0],other[0]);
	var saturation = Math.min(this1[1],other[1]);
	var lightness = Math.min(this1[2],other[2]);
	return [hue,saturation,lightness];
};
thx_color__$Hsl_Hsl_$Impl_$.max = function(this1,other) {
	var hue = Math.max(this1[0],other[0]);
	var saturation = Math.max(this1[1],other[1]);
	var lightness = Math.max(this1[2],other[2]);
	return [hue,saturation,lightness];
};
thx_color__$Hsl_Hsl_$Impl_$.normalize = function(this1) {
	var hue = thx_Floats.wrapCircular(this1[0],360);
	var saturation = thx_Floats.normalize(this1[1]);
	var lightness = thx_Floats.normalize(this1[2]);
	return [hue,saturation,lightness];
};
thx_color__$Hsl_Hsl_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$Hsl_Hsl_$Impl_$.withHue(this1,this1[0] + angle);
};
thx_color__$Hsl_Hsl_$Impl_$.roundTo = function(this1,decimals) {
	var hue = thx_Floats.roundTo(this1[0],decimals);
	var saturation = thx_Floats.roundTo(this1[1],decimals);
	var lightness = thx_Floats.roundTo(this1[2],decimals);
	return [hue,saturation,lightness];
};
thx_color__$Hsl_Hsl_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 144.0;
	var _0 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsl_Hsl_$Impl_$.square = function(this1) {
	return thx_color__$Hsl_Hsl_$Impl_$.tetrad(this1,90);
};
thx_color__$Hsl_Hsl_$Impl_$.tetrad = function(this1,angle) {
	var _0 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,0);
	var _1 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,angle);
	var _2 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,180);
	var _3 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,180 + angle);
	return { _0 : _0, _1 : _1, _2 : _2, _3 : _3};
};
thx_color__$Hsl_Hsl_$Impl_$.triad = function(this1) {
	var _0 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,-120);
	var _1 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,0);
	var _2 = thx_color__$Hsl_Hsl_$Impl_$.rotate(this1,120);
	return { _0 : _0, _1 : _1, _2 : _2};
};
thx_color__$Hsl_Hsl_$Impl_$.withAlpha = function(this1,alpha) {
	var channels = this1.concat([alpha]);
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.withHue = function(this1,newhue) {
	return [newhue,this1[1],this1[2]];
};
thx_color__$Hsl_Hsl_$Impl_$.withLightness = function(this1,newlightness) {
	return [this1[0],this1[1],newlightness];
};
thx_color__$Hsl_Hsl_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation,this1[2]];
};
thx_color__$Hsl_Hsl_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Hsl_Hsl_$Impl_$.toString(this1);
};
thx_color__$Hsl_Hsl_$Impl_$.toString = function(this1) {
	return "hsl(" + this1[0] + "," + this1[1] * 100 + "%," + this1[2] * 100 + "%)";
};
thx_color__$Hsl_Hsl_$Impl_$.equals = function(this1,other) {
	return thx_color__$Hsl_Hsl_$Impl_$.nearEquals(this1,other);
};
thx_color__$Hsl_Hsl_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(thx_Floats.angleDifference(this1[0],other[0],360.0)) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$Hsl_Hsl_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Hsl_Hsl_$Impl_$.toXyz(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Hsl_Hsl_$Impl_$.toCieLab(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Hsl_Hsl_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Hsl_Hsl_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toRgbx = function(this1) {
	var channels = [thx_color__$Hsl_Hsl_$Impl_$._c(this1[0] + 120,this1[1],this1[2]),thx_color__$Hsl_Hsl_$Impl_$._c(this1[0],this1[1],this1[2]),thx_color__$Hsl_Hsl_$Impl_$._c(this1[0] - 120,this1[1],this1[2])];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toHsla = function(this1) {
	return thx_color__$Hsl_Hsl_$Impl_$.withAlpha(this1,1.0);
};
thx_color__$Hsl_Hsl_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Hsl_Hsl_$Impl_$.toXyz(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.get_hue = function(this1) {
	return this1[0];
};
thx_color__$Hsl_Hsl_$Impl_$.get_saturation = function(this1) {
	return this1[1];
};
thx_color__$Hsl_Hsl_$Impl_$.get_lightness = function(this1) {
	return this1[2];
};
thx_color__$Hsl_Hsl_$Impl_$._c = function(d,s,l) {
	var m2;
	if(l <= 0.5) m2 = l * (1 + s); else m2 = l + s - l * s;
	var m1 = 2 * l - m2;
	d = thx_Floats.wrapCircular(d,360);
	if(d < 60) return m1 + (m2 - m1) * d / 60; else if(d < 180) return m2; else if(d < 240) return m1 + (m2 - m1) * (240 - d) / 60; else return m1;
};
var thx_color__$Hsla_Hsla_$Impl_$ = {};
thx_color__$Hsla_Hsla_$Impl_$.__name__ = ["thx","color","_Hsla","Hsla_Impl_"];
thx_color__$Hsla_Hsla_$Impl_$.create = function(hue,saturation,lightness,alpha) {
	return [hue,saturation,lightness,alpha];
};
thx_color__$Hsla_Hsla_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return [arr[0],arr[1],arr[2],arr[3]];
};
thx_color__$Hsla_Hsla_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "hsl":
			return thx_color__$Hsl_Hsl_$Impl_$.toHsla((function($this) {
				var $r;
				var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
				$r = channels;
				return $r;
			}(this)));
		case "hsla":
			var channels1 = thx_color_parse_ColorParser.getFloatChannels(info.channels,4,false);
			return channels1;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Hsla_Hsla_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.analogous = function(this1,spread) {
	if(spread == null) spread = 30.0;
	var _0 = thx_color__$Hsla_Hsla_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsla_Hsla_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsla_Hsla_$Impl_$.complement = function(this1) {
	return thx_color__$Hsla_Hsla_$Impl_$.rotate(this1,180);
};
thx_color__$Hsla_Hsla_$Impl_$.darker = function(this1,t) {
	var channels = [this1[0],this1[1],thx_Floats.interpolate(t,this1[2],0),this1[3]];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.lighter = function(this1,t) {
	var channels = [this1[0],this1[1],thx_Floats.interpolate(t,this1[2],1),this1[3]];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.normalize = function(this1) {
	var hue = thx_Floats.wrapCircular(this1[0],360);
	var saturation = thx_Floats.normalize(this1[1]);
	var lightness = thx_Floats.normalize(this1[2]);
	var alpha = thx_Floats.normalize(this1[3]);
	return [hue,saturation,lightness,alpha];
};
thx_color__$Hsla_Hsla_$Impl_$.roundTo = function(this1,decimals) {
	var hue = thx_Floats.roundTo(this1[0],decimals);
	var saturation = thx_Floats.roundTo(this1[1],decimals);
	var lightness = thx_Floats.roundTo(this1[2],decimals);
	var alpha = thx_Floats.roundTo(this1[3],decimals);
	return [hue,saturation,lightness,alpha];
};
thx_color__$Hsla_Hsla_$Impl_$.transparent = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Floats.interpolate(t,this1[3],0)];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.opaque = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Floats.interpolate(t,this1[3],1)];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngle(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2]),thx_Floats.interpolate(t,this1[3],other[3])];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.rotate = function(this1,angle) {
	return [this1[0] + angle,this1[1],this1[2],this1[3]];
};
thx_color__$Hsla_Hsla_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 150.0;
	var _0 = thx_color__$Hsla_Hsla_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsla_Hsla_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsla_Hsla_$Impl_$.withAlpha = function(this1,newalpha) {
	return [this1[0],this1[1],this1[2],newalpha];
};
thx_color__$Hsla_Hsla_$Impl_$.withHue = function(this1,newhue) {
	return [newhue,this1[1],this1[2],this1[3]];
};
thx_color__$Hsla_Hsla_$Impl_$.withLightness = function(this1,newlightness) {
	return [this1[0],this1[1],newlightness,this1[3]];
};
thx_color__$Hsla_Hsla_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation,this1[2],this1[3]];
};
thx_color__$Hsla_Hsla_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Hsla_Hsla_$Impl_$.toString(this1);
};
thx_color__$Hsla_Hsla_$Impl_$.toString = function(this1) {
	return "hsla(" + this1[0] + "," + this1[1] * 100 + "%," + this1[2] * 100 + "%," + this1[3] + ")";
};
thx_color__$Hsla_Hsla_$Impl_$.equals = function(this1,other) {
	return thx_color__$Hsla_Hsla_$Impl_$.nearEquals(this1,other);
};
thx_color__$Hsla_Hsla_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(thx_Floats.angleDifference(this1[0],other[0],360.0)) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance && Math.abs(this1[3] - other[3]) <= tolerance;
};
thx_color__$Hsla_Hsla_$Impl_$.toHsl = function(this1) {
	var channels = this1.slice(0,3);
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.toHsva = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toHsva(thx_color__$Hsla_Hsla_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsla_Hsla_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgb(thx_color__$Hsla_Hsla_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsla_Hsla_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Hsla_Hsla_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsla_Hsla_$Impl_$.toRgbxa = function(this1) {
	var channels = [thx_color__$Hsl_Hsl_$Impl_$._c(this1[0] + 120,this1[1],this1[2]),thx_color__$Hsl_Hsl_$Impl_$._c(this1[0],this1[1],this1[2]),thx_color__$Hsl_Hsl_$Impl_$._c(this1[0] - 120,this1[1],this1[2]),this1[3]];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.get_hue = function(this1) {
	return this1[0];
};
thx_color__$Hsla_Hsla_$Impl_$.get_saturation = function(this1) {
	return this1[1];
};
thx_color__$Hsla_Hsla_$Impl_$.get_lightness = function(this1) {
	return this1[2];
};
thx_color__$Hsla_Hsla_$Impl_$.get_alpha = function(this1) {
	return this1[3];
};
var thx_color__$Hsv_Hsv_$Impl_$ = {};
thx_color__$Hsv_Hsv_$Impl_$.__name__ = ["thx","color","_Hsv","Hsv_Impl_"];
thx_color__$Hsv_Hsv_$Impl_$.create = function(hue,saturation,value) {
	return [hue,saturation,value];
};
thx_color__$Hsv_Hsv_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$Hsv_Hsv_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "hsv":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Hsv_Hsv_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Hsv_Hsv_$Impl_$.analogous = function(this1,spread) {
	if(spread == null) spread = 30.0;
	var _0 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsv_Hsv_$Impl_$.complement = function(this1) {
	return thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,180);
};
thx_color__$Hsv_Hsv_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngle(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Hsv_Hsv_$Impl_$.interpolateWidest = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngleWidest(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Hsv_Hsv_$Impl_$.min = function(this1,other) {
	var hue = Math.min(this1[0],other[0]);
	var saturation = Math.min(this1[1],other[1]);
	var value = Math.min(this1[2],other[2]);
	return [hue,saturation,value];
};
thx_color__$Hsv_Hsv_$Impl_$.max = function(this1,other) {
	var hue = Math.max(this1[0],other[0]);
	var saturation = Math.max(this1[1],other[1]);
	var value = Math.max(this1[2],other[2]);
	return [hue,saturation,value];
};
thx_color__$Hsv_Hsv_$Impl_$.normalize = function(this1) {
	var hue = thx_Floats.wrapCircular(this1[0],360);
	var saturation = thx_Floats.normalize(this1[1]);
	var value = thx_Floats.normalize(this1[2]);
	return [hue,saturation,value];
};
thx_color__$Hsv_Hsv_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$Hsv_Hsv_$Impl_$.normalize(thx_color__$Hsv_Hsv_$Impl_$.withHue(this1,this1[0] + angle));
};
thx_color__$Hsv_Hsv_$Impl_$.roundTo = function(this1,decimals) {
	var hue = thx_Floats.roundTo(this1[0],decimals);
	var saturation = thx_Floats.roundTo(this1[1],decimals);
	var value = thx_Floats.roundTo(this1[2],decimals);
	return [hue,saturation,value];
};
thx_color__$Hsv_Hsv_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 144.0;
	var _0 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsv_Hsv_$Impl_$.square = function(this1) {
	return thx_color__$Hsv_Hsv_$Impl_$.tetrad(this1,90);
};
thx_color__$Hsv_Hsv_$Impl_$.tetrad = function(this1,angle) {
	var _0 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,0);
	var _1 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,angle);
	var _2 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,180);
	var _3 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,180 + angle);
	return { _0 : _0, _1 : _1, _2 : _2, _3 : _3};
};
thx_color__$Hsv_Hsv_$Impl_$.triad = function(this1) {
	var _0 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,-120);
	var _1 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,0);
	var _2 = thx_color__$Hsv_Hsv_$Impl_$.rotate(this1,120);
	return { _0 : _0, _1 : _1, _2 : _2};
};
thx_color__$Hsv_Hsv_$Impl_$.withAlpha = function(this1,alpha) {
	var channels = this1.concat([alpha]);
	return channels;
};
thx_color__$Hsv_Hsv_$Impl_$.withHue = function(this1,newhue) {
	return [newhue,this1[1],this1[2]];
};
thx_color__$Hsv_Hsv_$Impl_$.withValue = function(this1,newvalue) {
	return [this1[0],this1[1],newvalue];
};
thx_color__$Hsv_Hsv_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation,this1[2]];
};
thx_color__$Hsv_Hsv_$Impl_$.toString = function(this1) {
	return "hsv(" + this1[0] + "," + this1[1] * 100 + "%," + this1[2] * 100 + "%)";
};
thx_color__$Hsv_Hsv_$Impl_$.equals = function(this1,other) {
	return thx_color__$Hsv_Hsv_$Impl_$.nearEquals(this1,other);
};
thx_color__$Hsv_Hsv_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(thx_Floats.angleDifference(this1[0],other[0],360.0)) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$Hsv_Hsv_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Hsv_Hsv_$Impl_$.toXyz(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Hsv_Hsv_$Impl_$.toCieLab(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Hsv_Hsv_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toHsva = function(this1) {
	return thx_color__$Hsv_Hsv_$Impl_$.withAlpha(this1,1.0);
};
thx_color__$Hsv_Hsv_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Hsv_Hsv_$Impl_$.toXyz(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Hsv_Hsv_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toRgbx = function(this1) {
	if(this1[1] == 0) return [this1[2],this1[2],this1[2]];
	var r;
	var g;
	var b;
	var i;
	var f;
	var p;
	var q;
	var t;
	var h = this1[0] / 60;
	i = Math.floor(h);
	f = h - i;
	p = this1[2] * (1 - this1[1]);
	q = this1[2] * (1 - f * this1[1]);
	t = this1[2] * (1 - (1 - f) * this1[1]);
	switch(i) {
	case 0:
		r = this1[2];
		g = t;
		b = p;
		break;
	case 1:
		r = q;
		g = this1[2];
		b = p;
		break;
	case 2:
		r = p;
		g = this1[2];
		b = t;
		break;
	case 3:
		r = p;
		g = q;
		b = this1[2];
		break;
	case 4:
		r = t;
		g = p;
		b = this1[2];
		break;
	default:
		r = this1[2];
		g = p;
		b = q;
	}
	return [r,g,b];
};
thx_color__$Hsv_Hsv_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.get_hue = function(this1) {
	return this1[0];
};
thx_color__$Hsv_Hsv_$Impl_$.get_saturation = function(this1) {
	return this1[1];
};
thx_color__$Hsv_Hsv_$Impl_$.get_value = function(this1) {
	return this1[2];
};
var thx_color__$Hsva_Hsva_$Impl_$ = {};
thx_color__$Hsva_Hsva_$Impl_$.__name__ = ["thx","color","_Hsva","Hsva_Impl_"];
thx_color__$Hsva_Hsva_$Impl_$.create = function(hue,saturation,value,alpha) {
	return [hue,saturation,value,alpha];
};
thx_color__$Hsva_Hsva_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return [arr[0],arr[1],arr[2],arr[3]];
};
thx_color__$Hsva_Hsva_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "hsv":
			return thx_color__$Hsv_Hsv_$Impl_$.toHsva((function($this) {
				var $r;
				var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
				$r = channels;
				return $r;
			}(this)));
		case "hsva":
			var channels1 = thx_color_parse_ColorParser.getFloatChannels(info.channels,4,false);
			return channels1;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Hsva_Hsva_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.analogous = function(this1,spread) {
	if(spread == null) spread = 30.0;
	var _0 = thx_color__$Hsva_Hsva_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsva_Hsva_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsva_Hsva_$Impl_$.complement = function(this1) {
	return thx_color__$Hsva_Hsva_$Impl_$.rotate(this1,180);
};
thx_color__$Hsva_Hsva_$Impl_$.normalize = function(this1) {
	var hue = thx_Floats.wrapCircular(this1[0],360);
	var saturation = thx_Floats.normalize(this1[1]);
	var value = thx_Floats.normalize(this1[2]);
	var alpha = thx_Floats.normalize(this1[3]);
	return [hue,saturation,value,alpha];
};
thx_color__$Hsva_Hsva_$Impl_$.transparent = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Floats.interpolate(t,this1[3],0)];
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.opaque = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Floats.interpolate(t,this1[3],1)];
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngle(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2]),thx_Floats.interpolate(t,this1[3],other[3])];
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.interpolateWidest = function(this1,other,t) {
	var channels = [thx_Floats.interpolateAngleWidest(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2]),thx_Floats.interpolate(t,this1[3],other[3])];
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$Hsva_Hsva_$Impl_$.normalize([this1[0] + angle,this1[1],this1[2],this1[3]]);
};
thx_color__$Hsva_Hsva_$Impl_$.roundTo = function(this1,decimals) {
	var hue = thx_Floats.roundTo(this1[0],decimals);
	var saturation = thx_Floats.roundTo(this1[1],decimals);
	var value = thx_Floats.roundTo(this1[2],decimals);
	var alpha = thx_Floats.roundTo(this1[3],decimals);
	return [hue,saturation,value,alpha];
};
thx_color__$Hsva_Hsva_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 150.0;
	var _0 = thx_color__$Hsva_Hsva_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsva_Hsva_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsva_Hsva_$Impl_$.withAlpha = function(this1,newalpha) {
	return [this1[0],this1[1],this1[2],newalpha];
};
thx_color__$Hsva_Hsva_$Impl_$.withHue = function(this1,newhue) {
	return [newhue,this1[1],this1[2],this1[3]];
};
thx_color__$Hsva_Hsva_$Impl_$.withLightness = function(this1,newvalue) {
	return [this1[0],this1[1],newvalue,this1[3]];
};
thx_color__$Hsva_Hsva_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation,this1[2],this1[3]];
};
thx_color__$Hsva_Hsva_$Impl_$.toString = function(this1) {
	return "hsva(" + this1[0] + "," + this1[1] * 100 + "%," + this1[2] * 100 + "%," + this1[3] + ")";
};
thx_color__$Hsva_Hsva_$Impl_$.equals = function(this1,other) {
	return thx_color__$Hsva_Hsva_$Impl_$.nearEquals(this1,other);
};
thx_color__$Hsva_Hsva_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(thx_Floats.angleDifference(this1[0],other[0],360.0)) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance && Math.abs(this1[3] - other[3]) <= tolerance;
};
thx_color__$Hsva_Hsva_$Impl_$.toHsv = function(this1) {
	var channels = this1.slice(0,3);
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.toHsla = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toHsla(thx_color__$Hsva_Hsva_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsva_Hsva_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgb(thx_color__$Hsva_Hsva_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsva_Hsva_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Hsva_Hsva_$Impl_$.toRgbxa(this1));
};
thx_color__$Hsva_Hsva_$Impl_$.toRgbxa = function(this1) {
	if(this1[1] == 0) return [this1[2],this1[2],this1[2],this1[3]];
	var r;
	var g;
	var b;
	var i;
	var f;
	var p;
	var q;
	var t;
	var h = this1[0] / 60;
	i = Math.floor(h);
	f = h - i;
	p = this1[2] * (1 - this1[1]);
	q = this1[2] * (1 - f * this1[1]);
	t = this1[2] * (1 - (1 - f) * this1[1]);
	switch(i) {
	case 0:
		r = this1[2];
		g = t;
		b = p;
		break;
	case 1:
		r = q;
		g = this1[2];
		b = p;
		break;
	case 2:
		r = p;
		g = this1[2];
		b = t;
		break;
	case 3:
		r = p;
		g = q;
		b = this1[2];
		break;
	case 4:
		r = t;
		g = p;
		b = this1[2];
		break;
	default:
		r = this1[2];
		g = p;
		b = q;
	}
	return [r,g,b,this1[3]];
};
thx_color__$Hsva_Hsva_$Impl_$.get_hue = function(this1) {
	return this1[0];
};
thx_color__$Hsva_Hsva_$Impl_$.get_saturation = function(this1) {
	return this1[1];
};
thx_color__$Hsva_Hsva_$Impl_$.get_value = function(this1) {
	return this1[2];
};
thx_color__$Hsva_Hsva_$Impl_$.get_alpha = function(this1) {
	return this1[3];
};
var thx_color__$HunterLab_HunterLab_$Impl_$ = {};
thx_color__$HunterLab_HunterLab_$Impl_$.__name__ = ["thx","color","_HunterLab","HunterLab_Impl_"];
thx_color__$HunterLab_HunterLab_$Impl_$.create = function(l,a,b) {
	return [l,a,b];
};
thx_color__$HunterLab_HunterLab_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$HunterLab_HunterLab_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "hunterlab":
			return thx_color__$HunterLab_HunterLab_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false));
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$HunterLab_HunterLab_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$HunterLab_HunterLab_$Impl_$.distance = function(this1,other) {
	return (this1[0] - other[0]) * (this1[0] - other[0]) + (this1[1] - other[1]) * (this1[1] - other[1]) + (this1[2] - other[2]) * (this1[2] - other[2]);
};
thx_color__$HunterLab_HunterLab_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$HunterLab_HunterLab_$Impl_$.match = function(this1,palette) {
	var it = palette;
	if(null == it) throw new thx_error_NullArgument("Iterable argument \"this\" cannot be null",{ fileName : "NullArgument.hx", lineNumber : 73, className : "thx.color._HunterLab.HunterLab_Impl_", methodName : "match"}); else if(!$iterator(it)().hasNext()) throw new thx_error_NullArgument("Iterable argument \"this\" cannot be empty",{ fileName : "NullArgument.hx", lineNumber : 75, className : "thx.color._HunterLab.HunterLab_Impl_", methodName : "match"});
	var dist = Infinity;
	var closest = null;
	var $it0 = $iterator(palette)();
	while( $it0.hasNext() ) {
		var color = $it0.next();
		var ndist = thx_color__$HunterLab_HunterLab_$Impl_$.distance(this1,color);
		if(ndist < dist) {
			dist = ndist;
			closest = color;
		}
	}
	return closest;
};
thx_color__$HunterLab_HunterLab_$Impl_$.min = function(this1,other) {
	var l = Math.min(this1[0],other[0]);
	var a = Math.min(this1[1],other[1]);
	var b = Math.min(this1[2],other[2]);
	return [l,a,b];
};
thx_color__$HunterLab_HunterLab_$Impl_$.max = function(this1,other) {
	var l = Math.max(this1[0],other[0]);
	var a = Math.max(this1[1],other[1]);
	var b = Math.max(this1[2],other[2]);
	return [l,a,b];
};
thx_color__$HunterLab_HunterLab_$Impl_$.roundTo = function(this1,decimals) {
	var l = thx_Floats.roundTo(this1[0],decimals);
	var a = thx_Floats.roundTo(this1[1],decimals);
	var b = thx_Floats.roundTo(this1[2],decimals);
	return [l,a,b];
};
thx_color__$HunterLab_HunterLab_$Impl_$.equals = function(this1,other) {
	return thx_color__$HunterLab_HunterLab_$Impl_$.nearEquals(this1,other);
};
thx_color__$HunterLab_HunterLab_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$HunterLab_HunterLab_$Impl_$.withL = function(this1,newl) {
	return [newl,this1[1],this1[2]];
};
thx_color__$HunterLab_HunterLab_$Impl_$.withA = function(this1,newa) {
	return [this1[0],newa,this1[2]];
};
thx_color__$HunterLab_HunterLab_$Impl_$.withB = function(this1,newb) {
	return [this1[0],this1[1],newb];
};
thx_color__$HunterLab_HunterLab_$Impl_$.toString = function(this1) {
	return "hunterlab(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$HunterLab_HunterLab_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$HunterLab_HunterLab_$Impl_$.toXyz(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$HunterLab_HunterLab_$Impl_$.toCieLab(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$HunterLab_HunterLab_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbxa(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toRgbx(thx_color__$HunterLab_HunterLab_$Impl_$.toXyz(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toXyz = function(this1) {
	var x = this1[1] / 17.5 * (this1[0] / 10.0);
	var l10 = this1[0] / 10.0;
	var y = l10 * l10;
	var z = this1[2] / 7.0 * (this1[0] / 10.0);
	return [(x + y) / 1.02,y,-(z - y) / 0.847];
};
thx_color__$HunterLab_HunterLab_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$HunterLab_HunterLab_$Impl_$.toRgbx(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.toYxy = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toYxy(thx_color__$HunterLab_HunterLab_$Impl_$.toXyz(this1));
};
thx_color__$HunterLab_HunterLab_$Impl_$.get_l = function(this1) {
	return this1[0];
};
thx_color__$HunterLab_HunterLab_$Impl_$.get_a = function(this1) {
	return this1[1];
};
thx_color__$HunterLab_HunterLab_$Impl_$.get_b = function(this1) {
	return this1[2];
};
var thx_color__$Rgb_Rgb_$Impl_$ = {};
thx_color__$Rgb_Rgb_$Impl_$.__name__ = ["thx","color","_Rgb","Rgb_Impl_"];
thx_color__$Rgb_Rgb_$Impl_$.create = function(red,green,blue) {
	return (red & 255) << 16 | (green & 255) << 8 | blue & 255;
};
thx_color__$Rgb_Rgb_$Impl_$.createf = function(red,green,blue) {
	var red1 = Math.round(red * 255);
	var green1 = Math.round(green * 255);
	var blue1 = Math.round(blue * 255);
	return (red1 & 255) << 16 | (green1 & 255) << 8 | blue1 & 255;
};
thx_color__$Rgb_Rgb_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseHex(color);
	if(null == info) info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "rgb":
			return thx_color__$Rgb_Rgb_$Impl_$.fromInts(thx_color_parse_ColorParser.getInt8Channels(info.channels,3));
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Rgb_Rgb_$Impl_$.fromInts = function(arr) {
	thx_ArrayInts.resize(arr,3);
	return (arr[0] & 255) << 16 | (arr[1] & 255) << 8 | arr[2] & 255;
};
thx_color__$Rgb_Rgb_$Impl_$._new = function(rgb) {
	return rgb;
};
thx_color__$Rgb_Rgb_$Impl_$.darker = function(this1,t) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Rgbx_Rgbx_$Impl_$.darker(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1),t));
};
thx_color__$Rgb_Rgb_$Impl_$.lighter = function(this1,t) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Rgbx_Rgbx_$Impl_$.lighter(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1),t));
};
thx_color__$Rgb_Rgb_$Impl_$.interpolate = function(this1,other,t) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Rgbx_Rgbx_$Impl_$.interpolate(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1),thx_color__$Rgb_Rgb_$Impl_$.toRgbx(other),t));
};
thx_color__$Rgb_Rgb_$Impl_$.min = function(this1,other) {
	var red = thx_Ints.min(thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),thx_color__$Rgb_Rgb_$Impl_$.get_red(other));
	var green = thx_Ints.min(thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),thx_color__$Rgb_Rgb_$Impl_$.get_green(other));
	var blue = thx_Ints.min(thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1),thx_color__$Rgb_Rgb_$Impl_$.get_blue(other));
	return (red & 255) << 16 | (green & 255) << 8 | blue & 255;
};
thx_color__$Rgb_Rgb_$Impl_$.max = function(this1,other) {
	var red = thx_Ints.max(thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),thx_color__$Rgb_Rgb_$Impl_$.get_red(other));
	var green = thx_Ints.max(thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),thx_color__$Rgb_Rgb_$Impl_$.get_green(other));
	var blue = thx_Ints.max(thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1),thx_color__$Rgb_Rgb_$Impl_$.get_blue(other));
	return (red & 255) << 16 | (green & 255) << 8 | blue & 255;
};
thx_color__$Rgb_Rgb_$Impl_$.withAlpha = function(this1,alpha) {
	return thx_color__$Rgba_Rgba_$Impl_$.fromInts([thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1),alpha]);
};
thx_color__$Rgb_Rgb_$Impl_$.withRed = function(this1,newred) {
	return thx_color__$Rgb_Rgb_$Impl_$.fromInts([newred,thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1)]);
};
thx_color__$Rgb_Rgb_$Impl_$.withGreen = function(this1,newgreen) {
	return thx_color__$Rgb_Rgb_$Impl_$.fromInts([thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),newgreen,thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1)]);
};
thx_color__$Rgb_Rgb_$Impl_$.withBlue = function(this1,newblue) {
	return thx_color__$Rgb_Rgb_$Impl_$.fromInts([thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),newblue]);
};
thx_color__$Rgb_Rgb_$Impl_$.toCss3 = function(this1) {
	return "rgb(" + thx_color__$Rgb_Rgb_$Impl_$.get_red(this1) + "," + thx_color__$Rgb_Rgb_$Impl_$.get_green(this1) + "," + thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1) + ")";
};
thx_color__$Rgb_Rgb_$Impl_$.toString = function(this1) {
	return thx_color__$Rgb_Rgb_$Impl_$.toHex(this1);
};
thx_color__$Rgb_Rgb_$Impl_$.toHex = function(this1,prefix) {
	if(prefix == null) prefix = "#";
	return "" + prefix + StringTools.hex(thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),2) + StringTools.hex(thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),2) + StringTools.hex(thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1),2);
};
thx_color__$Rgb_Rgb_$Impl_$.equals = function(this1,other) {
	return thx_color__$Rgb_Rgb_$Impl_$.get_red(this1) == thx_color__$Rgb_Rgb_$Impl_$.get_red(other) && thx_color__$Rgb_Rgb_$Impl_$.get_green(this1) == thx_color__$Rgb_Rgb_$Impl_$.get_green(other) && thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1) == thx_color__$Rgb_Rgb_$Impl_$.get_blue(other);
};
thx_color__$Rgb_Rgb_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Rgb_Rgb_$Impl_$.toXyz(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Rgb_Rgb_$Impl_$.toCieLab(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Rgb_Rgb_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Rgb_Rgb_$Impl_$.toXyz(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.fromInts([thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1)]);
};
thx_color__$Rgb_Rgb_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgb_Rgb_$Impl_$.withAlpha(this1,255);
};
thx_color__$Rgb_Rgb_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(thx_color__$Rgb_Rgb_$Impl_$.toRgba(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.get_red = function(this1) {
	return this1 >> 16 & 255;
};
thx_color__$Rgb_Rgb_$Impl_$.get_green = function(this1) {
	return this1 >> 8 & 255;
};
thx_color__$Rgb_Rgb_$Impl_$.get_blue = function(this1) {
	return this1 & 255;
};
var thx_color__$Rgba_Rgba_$Impl_$ = {};
thx_color__$Rgba_Rgba_$Impl_$.__name__ = ["thx","color","_Rgba","Rgba_Impl_"];
thx_color__$Rgba_Rgba_$Impl_$.create = function(red,green,blue,alpha) {
	return (red & 255) << 24 | (green & 255) << 16 | (blue & 255) << 8 | alpha & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.fromFloats = function(arr) {
	var ints = thx_ArrayFloats.resize(arr,4).map(function(_) {
		return Math.round(_ * 255);
	});
	return (ints[0] & 255) << 24 | (ints[1] & 255) << 16 | (ints[2] & 255) << 8 | ints[3] & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.fromInt = function(rgba) {
	return rgba;
};
thx_color__$Rgba_Rgba_$Impl_$.fromInts = function(arr) {
	thx_ArrayInts.resize(arr,4);
	return (arr[0] & 255) << 24 | (arr[1] & 255) << 16 | (arr[2] & 255) << 8 | arr[3] & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseHex(color);
	if(null == info) info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "rgb":
			return thx_color__$Rgb_Rgb_$Impl_$.toRgba(thx_color__$Rgb_Rgb_$Impl_$.fromInts(thx_color_parse_ColorParser.getInt8Channels(info.channels,3)));
		case "rgba":
			var red = thx_color_parse_ColorParser.getInt8Channel(info.channels[0]);
			var green = thx_color_parse_ColorParser.getInt8Channel(info.channels[1]);
			var blue = thx_color_parse_ColorParser.getInt8Channel(info.channels[2]);
			var alpha = Math.round(thx_color_parse_ColorParser.getFloatChannel(info.channels[3]) * 255);
			return (red & 255) << 24 | (green & 255) << 16 | (blue & 255) << 8 | alpha & 255;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Rgba_Rgba_$Impl_$._new = function(rgba) {
	return rgba;
};
thx_color__$Rgba_Rgba_$Impl_$.darker = function(this1,t) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Rgbxa_Rgbxa_$Impl_$.darker(thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(this1),t));
};
thx_color__$Rgba_Rgba_$Impl_$.lighter = function(this1,t) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Rgbxa_Rgbxa_$Impl_$.lighter(thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(this1),t));
};
thx_color__$Rgba_Rgba_$Impl_$.transparent = function(this1,t) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Rgbxa_Rgbxa_$Impl_$.transparent(thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(this1),t));
};
thx_color__$Rgba_Rgba_$Impl_$.opaque = function(this1,t) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Rgbxa_Rgbxa_$Impl_$.opaque(thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(this1),t));
};
thx_color__$Rgba_Rgba_$Impl_$.interpolate = function(this1,other,t) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Rgbxa_Rgbxa_$Impl_$.interpolate(thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(this1),thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(other),t));
};
thx_color__$Rgba_Rgba_$Impl_$.withAlpha = function(this1,newalpha) {
	return thx_color__$Rgba_Rgba_$Impl_$.fromInts([this1 >> 24 & 255,this1 >> 16 & 255,this1 >> 8 & 255,newalpha]);
};
thx_color__$Rgba_Rgba_$Impl_$.withRed = function(this1,newred) {
	return thx_color__$Rgba_Rgba_$Impl_$.fromInts([newred,this1 >> 16 & 255,this1 >> 8 & 255]);
};
thx_color__$Rgba_Rgba_$Impl_$.withGreen = function(this1,newgreen) {
	return thx_color__$Rgba_Rgba_$Impl_$.fromInts([this1 >> 24 & 255,newgreen,this1 >> 8 & 255]);
};
thx_color__$Rgba_Rgba_$Impl_$.withBlue = function(this1,newblue) {
	return thx_color__$Rgba_Rgba_$Impl_$.fromInts([this1 >> 24 & 255,this1 >> 16 & 255,newblue]);
};
thx_color__$Rgba_Rgba_$Impl_$.toHsla = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toHsla(thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(this1));
};
thx_color__$Rgba_Rgba_$Impl_$.toHsva = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toHsva(thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(this1));
};
thx_color__$Rgba_Rgba_$Impl_$.toRgb = function(this1) {
	return (this1 >> 24 & 255 & 255) << 16 | (this1 >> 16 & 255 & 255) << 8 | this1 >> 8 & 255 & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.fromInts([this1 >> 24 & 255,this1 >> 16 & 255,this1 >> 8 & 255]);
};
thx_color__$Rgba_Rgba_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.fromInts([this1 >> 24 & 255,this1 >> 16 & 255,this1 >> 8 & 255,this1 & 255]);
};
thx_color__$Rgba_Rgba_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Rgba_Rgba_$Impl_$.toString(this1);
};
thx_color__$Rgba_Rgba_$Impl_$.toString = function(this1) {
	return "rgba(" + (this1 >> 24 & 255) + "," + (this1 >> 16 & 255) + "," + (this1 >> 8 & 255) + "," + (this1 & 255) / 255 + ")";
};
thx_color__$Rgba_Rgba_$Impl_$.toHex = function(this1,prefix) {
	if(prefix == null) prefix = "#";
	return "" + prefix + StringTools.hex(this1 & 255,2) + StringTools.hex(this1 >> 24 & 255,2) + StringTools.hex(this1 >> 16 & 255,2) + StringTools.hex(this1 >> 8 & 255,2);
};
thx_color__$Rgba_Rgba_$Impl_$.equals = function(this1,other) {
	return (this1 >> 24 & 255) == (other >> 24 & 255) && (this1 & 255) == (other & 255) && (this1 >> 16 & 255) == (other >> 16 & 255) && (this1 >> 8 & 255) == (other >> 8 & 255);
};
thx_color__$Rgba_Rgba_$Impl_$.get_alpha = function(this1) {
	return this1 & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.get_red = function(this1) {
	return this1 >> 24 & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.get_green = function(this1) {
	return this1 >> 16 & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.get_blue = function(this1) {
	return this1 >> 8 & 255;
};
var thx_color__$Rgbx_Rgbx_$Impl_$ = {};
thx_color__$Rgbx_Rgbx_$Impl_$.__name__ = ["thx","color","_Rgbx","Rgbx_Impl_"];
thx_color__$Rgbx_Rgbx_$Impl_$.create = function(red,green,blue) {
	return [red,green,blue];
};
thx_color__$Rgbx_Rgbx_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$Rgbx_Rgbx_$Impl_$.fromInts = function(arr) {
	thx_ArrayInts.resize(arr,3);
	return [arr[0] / 255.0,arr[1] / 255.0,arr[2] / 255.0];
};
thx_color__$Rgbx_Rgbx_$Impl_$.fromInt = function(value) {
	var rgb = value;
	var red = thx_color__$Rgb_Rgb_$Impl_$.get_red(rgb) / 255;
	var green = thx_color__$Rgb_Rgb_$Impl_$.get_green(rgb) / 255;
	var blue = thx_color__$Rgb_Rgb_$Impl_$.get_blue(rgb) / 255;
	return [red,green,blue];
};
thx_color__$Rgbx_Rgbx_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseHex(color);
	if(null == info) info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "rgb":
			return thx_color__$Rgbx_Rgbx_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,3,true));
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Rgbx_Rgbx_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.darker = function(this1,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],0),thx_Floats.interpolate(t,this1[1],0),thx_Floats.interpolate(t,this1[2],0)];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.lighter = function(this1,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],1),thx_Floats.interpolate(t,this1[1],1),thx_Floats.interpolate(t,this1[2],1)];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.min = function(this1,other) {
	var red = Math.min(this1[0],other[0]);
	var green = Math.min(this1[1],other[1]);
	var blue = Math.min(this1[2],other[2]);
	return [red,green,blue];
};
thx_color__$Rgbx_Rgbx_$Impl_$.max = function(this1,other) {
	var red = Math.max(this1[0],other[0]);
	var green = Math.max(this1[1],other[1]);
	var blue = Math.max(this1[2],other[2]);
	return [red,green,blue];
};
thx_color__$Rgbx_Rgbx_$Impl_$.normalize = function(this1) {
	var channels = [thx_Floats.normalize(this1[0]),thx_Floats.normalize(this1[1]),thx_Floats.normalize(this1[2])];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.roundTo = function(this1,decimals) {
	var red = thx_Floats.roundTo(this1[0],decimals);
	var green = thx_Floats.roundTo(this1[1],decimals);
	var blue = thx_Floats.roundTo(this1[2],decimals);
	return [red,green,blue];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toString(this1);
};
thx_color__$Rgbx_Rgbx_$Impl_$.toString = function(this1) {
	return "rgb(" + this1[0] * 100 + "%," + this1[1] * 100 + "%," + this1[2] * 100 + "%)";
};
thx_color__$Rgbx_Rgbx_$Impl_$.toHex = function(this1,prefix) {
	if(prefix == null) prefix = "#";
	return "" + prefix + StringTools.hex(thx_color__$Rgbx_Rgbx_$Impl_$.get_red(this1),2) + StringTools.hex(thx_color__$Rgbx_Rgbx_$Impl_$.get_green(this1),2) + StringTools.hex(thx_color__$Rgbx_Rgbx_$Impl_$.get_blue(this1),2);
};
thx_color__$Rgbx_Rgbx_$Impl_$.equals = function(this1,other) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.nearEquals(this1,other);
};
thx_color__$Rgbx_Rgbx_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withAlpha = function(this1,alpha) {
	var channels = this1.concat([alpha]);
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withRed = function(this1,newred) {
	var channels = [newred,thx_color__$Rgbx_Rgbx_$Impl_$.get_green(this1),thx_color__$Rgbx_Rgbx_$Impl_$.get_blue(this1)];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withGreen = function(this1,newgreen) {
	var channels = [thx_color__$Rgbx_Rgbx_$Impl_$.get_red(this1),newgreen,thx_color__$Rgbx_Rgbx_$Impl_$.get_blue(this1)];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withBlue = function(this1,newblue) {
	var channels = [thx_color__$Rgbx_Rgbx_$Impl_$.get_red(this1),thx_color__$Rgbx_Rgbx_$Impl_$.get_green(this1),newblue];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(this1));
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(this1));
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLuv(thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(this1));
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCmy = function(this1) {
	return [1 - this1[0],1 - this1[1],1 - this1[2]];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk = function(this1) {
	var c = 0.0;
	var y = 0.0;
	var m = 0.0;
	var k;
	if(this1[0] + this1[1] + this1[2] == 0) k = 1.0; else {
		k = 1 - Math.max(Math.max(this1[0],this1[1]),this1[2]);
		c = (1 - this1[0] - k) / (1 - k);
		m = (1 - this1[1] - k) / (1 - k);
		y = (1 - this1[2] - k) / (1 - k);
	}
	return [c,m,y,k];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelix = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this1,1);
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma = function(this1,gamma) {
	var l = (-0.65576366679999987 * this1[2] + -1.7884503806 * this1[0] - 3.5172982438 * this1[1]) / -5.9615122912;
	var bl = this1[2] - l;
	var k = (1.97294 * (this1[1] - l) - -0.29227 * bl) / -0.90649;
	var lgamma = Math.pow(l,gamma);
	var s;
	try {
		s = Math.sqrt(k * k + bl * bl) / (1.97294 * lgamma * (1 - lgamma));
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		s = 0.0;
	}
	var h;
	try {
		if(s != 0) h = Math.atan2(k,bl) / Math.PI * 180 - 120; else {
			h = NaN;
		}
	} catch( e1 ) {
		haxe_CallStack.lastException = e1;
		if (e1 instanceof js__$Boot_HaxeError) e1 = e1.val;
		h = 0.0;
	}
	if(isNaN(s)) s = 0;
	if(isNaN(h)) h = 0;
	if(h < 0) h += 360;
	return [h,s,l,1];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toGrey = function(this1) {
	return this1[0] * .2126 + this1[1] * .7152 + this1[2] * .0722;
};
thx_color__$Rgbx_Rgbx_$Impl_$.toPerceivedGrey = function(this1) {
	return this1[0] * .299 + this1[1] * .587 + this1[2] * .114;
};
thx_color__$Rgbx_Rgbx_$Impl_$.toPerceivedAccurateGrey = function(this1) {
	var grey = Math.pow(this1[0],2) * .241 + Math.pow(this1[1],2) * .691 + Math.pow(this1[2],2) * .068;
	return grey;
};
thx_color__$Rgbx_Rgbx_$Impl_$.toHsl = function(this1) {
	var min = Math.min(Math.min(this1[0],this1[1]),this1[2]);
	var max = Math.max(Math.max(this1[0],this1[1]),this1[2]);
	var delta = max - min;
	var h;
	var s;
	var l = (max + min) / 2;
	if(delta == 0.0) s = h = 0.0; else {
		if(l < 0.5) s = delta / (max + min); else s = delta / (2 - max - min);
		if(this1[0] == max) h = (this1[1] - this1[2]) / delta + (this1[1] < thx_color__$Rgbx_Rgbx_$Impl_$.get_blue(this1)?6:0); else if(this1[1] == max) h = (this1[2] - this1[0]) / delta + 2; else h = (this1[0] - this1[1]) / delta + 4;
		h *= 60;
	}
	return [h,s,l];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toHsv = function(this1) {
	var min = Math.min(Math.min(this1[0],this1[1]),this1[2]);
	var max = Math.max(Math.max(this1[0],this1[1]),this1[2]);
	var delta = max - min;
	var h;
	var s;
	var v = max;
	if(delta != 0) s = delta / max; else {
		s = 0;
		h = -1;
		return [h,s,v];
	}
	if(this1[0] == max) h = (this1[1] - this1[2]) / delta; else if(this1[1] == max) h = 2 + (this1[2] - this1[0]) / delta; else h = 4 + (this1[0] - this1[1]) / delta;
	h *= 60;
	if(h < 0) h += 360;
	return [h,s,v];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(this1));
};
thx_color__$Rgbx_Rgbx_$Impl_$.toRgb = function(this1) {
	var red = Math.round(this1[0] * 255);
	var green = Math.round(this1[1] * 255);
	var blue = Math.round(this1[2] * 255);
	return (red & 255) << 16 | (green & 255) << 8 | blue & 255;
};
thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.withAlpha(this1,1.0);
};
thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature = function(this1) {
	var t = 0;
	var rgb;
	var epsilon = 0.4;
	var minT = 1000;
	var maxT = 40000;
	while(maxT - minT > epsilon) {
		t = (maxT + minT) / 2;
		rgb = thx_color__$Temperature_Temperature_$Impl_$.temperatureToRgbx(t);
		if(rgb[2] / rgb[0] >= this1[2] / this1[0]) maxT = t; else minT = t;
	}
	return t;
};
thx_color__$Rgbx_Rgbx_$Impl_$.toXyz = function(this1) {
	var r = this1[0];
	var g = this1[1];
	var b = this1[2];
	if(r > 0.04045) r = Math.pow((r + 0.055) / 1.055,2.4); else r = r / 12.92;
	if(g > 0.04045) g = Math.pow((g + 0.055) / 1.055,2.4); else g = g / 12.92;
	if(b > 0.04045) b = Math.pow((b + 0.055) / 1.055,2.4); else b = b / 12.92;
	return [r * 0.4124564 + g * 0.3575761 + b * 0.1804375,r * 0.2126729 + g * 0.7151522 + b * 0.0721750,r * 0.0193339 + g * 0.1191920 + b * 0.9503041];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toYuv = function(this1) {
	var r = this1[0];
	var g = this1[1];
	var b = this1[2];
	var y = 0.299 * r + 0.587 * g + 0.114 * b;
	var u = -0.14713 * r - 0.28886 * g + 0.436 * b;
	var v = 0.615 * r - 0.51499 * g - 0.10001 * b;
	return [y,u,v];
};
thx_color__$Rgbx_Rgbx_$Impl_$.toYxy = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toYxy(thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(this1));
};
thx_color__$Rgbx_Rgbx_$Impl_$.get_red = function(this1) {
	return Math.round(this1[0] * 255);
};
thx_color__$Rgbx_Rgbx_$Impl_$.get_green = function(this1) {
	return Math.round(this1[1] * 255);
};
thx_color__$Rgbx_Rgbx_$Impl_$.get_blue = function(this1) {
	return Math.round(this1[2] * 255);
};
thx_color__$Rgbx_Rgbx_$Impl_$.get_redf = function(this1) {
	return this1[0];
};
thx_color__$Rgbx_Rgbx_$Impl_$.get_greenf = function(this1) {
	return this1[1];
};
thx_color__$Rgbx_Rgbx_$Impl_$.get_bluef = function(this1) {
	return this1[2];
};
thx_color__$Rgbx_Rgbx_$Impl_$.get_inSpace = function(this1) {
	return this1[0] >= 0 && this1[0] <= 1 && this1[1] >= 0 && this1[1] <= 1 && this1[2] >= 0 && this1[2] <= 1;
};
var thx_color__$Rgbxa_Rgbxa_$Impl_$ = {};
thx_color__$Rgbxa_Rgbxa_$Impl_$.__name__ = ["thx","color","_Rgbxa","Rgbxa_Impl_"];
thx_color__$Rgbxa_Rgbxa_$Impl_$.create = function(red,green,blue,alpha) {
	return [red,green,blue,alpha];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return [arr[0],arr[1],arr[2],arr[3]];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.fromInts = function(arr) {
	thx_ArrayInts.resize(arr,4);
	return [arr[0] / 255.0,arr[1] / 255.0,arr[2] / 255.0,arr[3] / 255.0];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.fromInt = function(value) {
	var rgba = value;
	return [(rgba >> 24 & 255) / 255,(rgba >> 16 & 255) / 255,(rgba >> 8 & 255) / 255,(rgba & 255) / 255];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseHex(color);
	if(null == info) info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "rgb":
			return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Rgbx_Rgbx_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,3,true)));
		case "rgba":
			return thx_color__$Rgbxa_Rgbxa_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,4,true));
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Rgbxa_Rgbxa_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.darker = function(this1,t) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.withAlpha(thx_color__$Rgbx_Rgbx_$Impl_$.darker(thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgbx(this1),t),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1));
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.lighter = function(this1,t) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.withAlpha(thx_color__$Rgbx_Rgbx_$Impl_$.lighter(thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgbx(this1),t),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1));
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.transparent = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Ints.interpolate(t,this1[3],0)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.opaque = function(this1,t) {
	var channels = [this1[0],this1[1],this1[2],thx_Ints.interpolate(t,this1[3],1)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Ints.interpolate(t,this1[0],other[0]),thx_Ints.interpolate(t,this1[1],other[1]),thx_Ints.interpolate(t,this1[2],other[2]),thx_Ints.interpolate(t,this1[3],other[3])];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.normalize = function(this1) {
	var channels = [thx_Floats.normalize(this1[0]),thx_Floats.normalize(this1[1]),thx_Floats.normalize(this1[2]),thx_Floats.normalize(this1[3])];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.roundTo = function(this1,decimals) {
	var red = thx_Floats.roundTo(this1[0],decimals);
	var green = thx_Floats.roundTo(this1[1],decimals);
	var blue = thx_Floats.roundTo(this1[2],decimals);
	var alpha = thx_Floats.roundTo(this1[3],decimals);
	return [red,green,blue,alpha];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.withAlpha = function(this1,newalpha) {
	var channels = [thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),newalpha];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.withRed = function(this1,newred) {
	var channels = [newred,thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.withGreen = function(this1,newgreen) {
	var channels = [thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),newgreen,thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.withBlue = function(this1,newblue) {
	var channels = [thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),newblue,thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toString(this1);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toString = function(this1) {
	return "rgba(" + this1[0] * 100 + "%," + this1[1] * 100 + "%," + this1[2] * 100 + "%," + this1[3] + ")";
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toHex = function(this1,prefix) {
	if(prefix == null) prefix = "#";
	return "" + prefix + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1),2) + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),2) + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),2) + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),2);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.equals = function(this1,other) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.nearEquals(this1,other);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance && Math.abs(this1[3] - other[3]) <= tolerance;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toHsla = function(this1) {
	return thx_color__$Hsl_Hsl_$Impl_$.withAlpha(thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgbx(this1)),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1));
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toHsva = function(this1) {
	return thx_color__$Hsv_Hsv_$Impl_$.withAlpha(thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgbx(this1)),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1));
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgbx(this1));
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgbx = function(this1) {
	var channels = this1.slice(0,3);
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgba_Rgba_$Impl_$.fromFloats([this1[0],this1[1],this1[2],this1[3]]);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red = function(this1) {
	return Math.round(this1[0] * 255);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green = function(this1) {
	return Math.round(this1[1] * 255);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue = function(this1) {
	return Math.round(this1[2] * 255);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha = function(this1) {
	return Math.round(this1[3] * 255);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_redf = function(this1) {
	return this1[0];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_greenf = function(this1) {
	return this1[1];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_bluef = function(this1) {
	return this1[2];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alphaf = function(this1) {
	return this1[3];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.get_inSpace = function(this1) {
	return this1[0] >= 0 && this1[0] <= 1 && this1[1] >= 0 && this1[1] <= 1 && this1[2] >= 0 && this1[2] <= 1 && this1[3] >= 0 && this1[3] <= 1;
};
var thx_color__$Temperature_Temperature_$Impl_$ = {};
thx_color__$Temperature_Temperature_$Impl_$.__name__ = ["thx","color","_Temperature","Temperature_Impl_"];
thx_color__$Temperature_Temperature_$Impl_$.temperatureToRgbx = function(kelvin) {
	var t = kelvin / 100.0;
	var r;
	var g;
	var b;
	if(t < 66.0) r = 1; else {
		r = t - 55.0;
		r = (351.97690566805693 + 0.114206453784165 * r - 40.25366309332127 * Math.log(r)) / 255;
		if(r < 0) r = 0;
		if(r > 1) r = 1;
	}
	if(t < 66.0) {
		g = t - 2;
		g = (-155.25485562709179 - 0.44596950469579133 * g + 104.49216199393888 * Math.log(g)) / 255;
		if(g < 0) g = 0;
		if(g > 1) g = 1;
	} else {
		g = t - 50;
		g = (325.4494125711974 + 0.07943456536662342 * g - 28.0852963507957 * Math.log(g)) / 255;
		if(g < 0) g = 0;
		if(g > 1) g = 1;
	}
	if(t >= 66.0) b = 1; else if(t <= 20.0) b = 0; else {
		b = t - 10;
		b = (-254.76935184120902 + 0.8274096064007395 * b + 115.67994401066147 * Math.log(b)) / 255;
		if(b < 0) b = 0;
		if(b > 1) b = 1;
	}
	return [r,g,b];
};
thx_color__$Temperature_Temperature_$Impl_$.create = function(v) {
	return v;
};
thx_color__$Temperature_Temperature_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "temperature":
			var kelvin = thx_color_parse_ColorParser.getFloatChannels(info.channels,1,false)[0];
			return kelvin;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Temperature_Temperature_$Impl_$._new = function(kelvin) {
	return kelvin;
};
thx_color__$Temperature_Temperature_$Impl_$.interpolate = function(this1,other,t) {
	var kelvin = thx_Floats.interpolate(t,this1,other);
	return kelvin;
};
thx_color__$Temperature_Temperature_$Impl_$.min = function(this1,other) {
	var v = Math.min(this1,other);
	return v;
};
thx_color__$Temperature_Temperature_$Impl_$.max = function(this1,other) {
	var v = Math.max(this1,other);
	return v;
};
thx_color__$Temperature_Temperature_$Impl_$.roundTo = function(this1,decimals) {
	var v = thx_Floats.roundTo(this1,decimals);
	return v;
};
thx_color__$Temperature_Temperature_$Impl_$.toString = function(this1) {
	return "temperature(" + this1 + ")";
};
thx_color__$Temperature_Temperature_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1 - other) <= 10e-10;
};
thx_color__$Temperature_Temperature_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1 - other) <= tolerance;
};
thx_color__$Temperature_Temperature_$Impl_$.get_kelvin = function(this1) {
	return this1;
};
thx_color__$Temperature_Temperature_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Temperature_Temperature_$Impl_$.toXyz(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Temperature_Temperature_$Impl_$.toCieLab(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Temperature_Temperature_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Temperature_Temperature_$Impl_$.toXyz(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Temperature_Temperature_$Impl_$.toRgbxa(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toRgbxTannerHelland = function(this1) {
	var t = this1 / 100;
	var r;
	var g;
	var b;
	if(t <= 66) r = 1; else {
		r = t - 60;
		r = 329.698727446 * Math.pow(r,-0.1332047592) / 1;
		if(r < 0) r = 0;
		if(r > 1) r = 1;
	}
	if(t <= 66.0) {
		g = t;
		g = (99.4708025861 * Math.log(g) - 161.1195681661) / 1;
		if(g < 0) g = 0;
		if(g > 1) g = 1;
	} else {
		g = t - 60.0;
		g = 288.1221695283 * Math.pow(g,-0.0755148492) / 1;
		if(g < 0) g = 0;
		if(g > 1) g = 1;
	}
	if(t >= 66.0) b = 1; else if(t <= 19.0) b = 0; else {
		b = t - 10;
		b = (138.5177312231 * Math.log(b) - 305.0447927307) / 1;
		if(b < 0) b = 0;
		if(b > 1) b = 1;
	}
	return [r,g,b];
};
thx_color__$Temperature_Temperature_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Temperature_Temperature_$Impl_$.temperatureToRgbx(this1);
};
thx_color__$Temperature_Temperature_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
thx_color__$Temperature_Temperature_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Temperature_Temperature_$Impl_$.toRgbx(this1));
};
var thx_color__$Xyz_Xyz_$Impl_$ = {};
thx_color__$Xyz_Xyz_$Impl_$.__name__ = ["thx","color","_Xyz","Xyz_Impl_"];
thx_color__$Xyz_Xyz_$Impl_$.create = function(x,y,z) {
	return [x,y,z];
};
thx_color__$Xyz_Xyz_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$Xyz_Xyz_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "ciexyz":case "xyz":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Xyz_Xyz_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Xyz_Xyz_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Xyz_Xyz_$Impl_$.min = function(this1,other) {
	var x = Math.min(this1[0],other[0]);
	var y = Math.min(this1[1],other[1]);
	var z = Math.min(this1[2],other[2]);
	return [x,y,z];
};
thx_color__$Xyz_Xyz_$Impl_$.max = function(this1,other) {
	var x = Math.max(this1[0],other[0]);
	var y = Math.max(this1[1],other[1]);
	var z = Math.max(this1[2],other[2]);
	return [x,y,z];
};
thx_color__$Xyz_Xyz_$Impl_$.roundTo = function(this1,decimals) {
	var x = thx_Floats.roundTo(this1[0],decimals);
	var y = thx_Floats.roundTo(this1[1],decimals);
	var z = thx_Floats.roundTo(this1[2],decimals);
	return [x,y,z];
};
thx_color__$Xyz_Xyz_$Impl_$.withX = function(this1,newx) {
	return [newx,this1[1],this1[2]];
};
thx_color__$Xyz_Xyz_$Impl_$.withY = function(this1,newy) {
	return [this1[0],newy,this1[2]];
};
thx_color__$Xyz_Xyz_$Impl_$.withZ = function(this1,newz) {
	return [this1[0],this1[1],newz];
};
thx_color__$Xyz_Xyz_$Impl_$.toString = function(this1) {
	return "xyz(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$Xyz_Xyz_$Impl_$.equals = function(this1,other) {
	return thx_color__$Xyz_Xyz_$Impl_$.nearEquals(this1,other);
};
thx_color__$Xyz_Xyz_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$Xyz_Xyz_$Impl_$.toCieLab = function(this1) {
	var f = function(t) {
		if(t > 0.0088564516790356311) return Math.pow(t,0.33333333333333331); else return 7.7870370370370354 * t + 0.13793103448275862;
	};
	var x1 = this1[0] / thx_color__$Xyz_Xyz_$Impl_$.whiteReference[0];
	var y1 = this1[1] / thx_color__$Xyz_Xyz_$Impl_$.whiteReference[1];
	var z1 = this1[2] / thx_color__$Xyz_Xyz_$Impl_$.whiteReference[2];
	var fy1 = f(y1);
	var l = 116 * fy1 - 16;
	var a = 500 * (f(x1) - fy1);
	var b = 200 * (fy1 - f(z1));
	return [l,a,b];
};
thx_color__$Xyz_Xyz_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Xyz_Xyz_$Impl_$.toCieLab(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toCieLuv = function(this1) {
	var x = this1[0] * 100;
	var y = this1[1] * 100;
	var z = this1[2] * 100;
	var f = y / (thx_color__$Xyz_Xyz_$Impl_$.whiteReference[1] * 100);
	var r = Math.pow(0.20689655172413793,3);
	var l;
	if(f > r) l = 116 * Math.pow(f,0.33333333333333331) - 16; else l = Math.pow(9.6666666666666661,3) * f;
	var u = 13 * l * (thx_color__$Xyz_Xyz_$Impl_$.get_u(this1) - thx_color__$Xyz_Xyz_$Impl_$.get_u(thx_color__$Xyz_Xyz_$Impl_$.whiteReference) * 100);
	var v = 13 * l * (thx_color__$Xyz_Xyz_$Impl_$.get_v(this1) - thx_color__$Xyz_Xyz_$Impl_$.get_v(thx_color__$Xyz_Xyz_$Impl_$.whiteReference) * 100);
	return [l / 100,u / 100,v / 100];
};
thx_color__$Xyz_Xyz_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Xyz_Xyz_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toHunterLab = function(this1) {
	var l = 10.0 * Math.sqrt(this1[1]);
	var a;
	if(this1[1] != 0) a = 17.5 * ((1.02 * this1[0] - this1[1]) / Math.sqrt(this1[1])); else a = 0;
	var b;
	if(this1[1] != 0) b = 7.0 * ((this1[1] - .847 * this1[2]) / Math.sqrt(this1[1])); else b = 0;
	return [l,a,b];
};
thx_color__$Xyz_Xyz_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Xyz_Xyz_$Impl_$.toRgbxa(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toRgbx = function(this1) {
	var x = this1[0];
	var y = this1[1];
	var z = this1[2];
	var r = x * 3.2406 + y * -1.5372 + z * -0.4986;
	var g = x * -0.9689 + y * 1.8758 + z * 0.0415;
	var b = x * 0.0557 + y * -0.204 + z * 1.0570;
	if(r > 0.0031308) r = 1.055 * Math.pow(r,0.41666666666666669) - 0.055; else r = 12.92 * r;
	if(g > 0.0031308) g = 1.055 * Math.pow(g,0.41666666666666669) - 0.055; else g = 12.92 * g;
	if(b > 0.0031308) b = 1.055 * Math.pow(b,0.41666666666666669) - 0.055; else b = 12.92 * b;
	return [r,g,b];
};
thx_color__$Xyz_Xyz_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toYxy = function(this1) {
	var sum = this1[0] + this1[1] + this1[2];
	return [this1[1],sum == 0?1:this1[0] / sum,sum == 0?1:this1[1] / sum];
};
thx_color__$Xyz_Xyz_$Impl_$.get_x = function(this1) {
	return this1[0];
};
thx_color__$Xyz_Xyz_$Impl_$.get_y = function(this1) {
	return this1[1];
};
thx_color__$Xyz_Xyz_$Impl_$.get_z = function(this1) {
	return this1[2];
};
thx_color__$Xyz_Xyz_$Impl_$.get_u = function(this1) {
	try {
		return 4 * this1[0] / (this1[0] + 15 * this1[1] + 3 * this1[2]);
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return 0;
	}
};
thx_color__$Xyz_Xyz_$Impl_$.get_v = function(this1) {
	try {
		return 9 * this1[1] / (this1[0] + 15 * this1[1] + 3 * this1[2]);
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return 0;
	}
};
var thx_color__$Yuv_Yuv_$Impl_$ = {};
thx_color__$Yuv_Yuv_$Impl_$.__name__ = ["thx","color","_Yuv","Yuv_Impl_"];
thx_color__$Yuv_Yuv_$Impl_$.create = function(y,u,v) {
	return [y,u,v];
};
thx_color__$Yuv_Yuv_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$Yuv_Yuv_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "yuv":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Yuv_Yuv_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Yuv_Yuv_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Yuv_Yuv_$Impl_$.min = function(this1,other) {
	var y = Math.min(this1[0],other[0]);
	var u = Math.min(this1[1],other[1]);
	var v = Math.min(this1[2],other[2]);
	return [y,u,v];
};
thx_color__$Yuv_Yuv_$Impl_$.max = function(this1,other) {
	var y = Math.max(this1[0],other[0]);
	var u = Math.max(this1[1],other[1]);
	var v = Math.max(this1[2],other[2]);
	return [y,u,v];
};
thx_color__$Yuv_Yuv_$Impl_$.normalize = function(this1) {
	var y = thx_Floats.normalize(this1[0]);
	var u = thx_Floats.clamp(this1[1],-0.436,0.436);
	var v = thx_Floats.clamp(this1[2],-0.615,0.615);
	return [y,u,v];
};
thx_color__$Yuv_Yuv_$Impl_$.roundTo = function(this1,decimals) {
	var y = thx_Floats.roundTo(this1[0],decimals);
	var u = thx_Floats.roundTo(this1[1],decimals);
	var v = thx_Floats.roundTo(this1[2],decimals);
	return [y,u,v];
};
thx_color__$Yuv_Yuv_$Impl_$.withY = function(this1,newy) {
	return [newy,this1[1],this1[2]];
};
thx_color__$Yuv_Yuv_$Impl_$.withU = function(this1,newu) {
	return [this1[0],this1[1],this1[2]];
};
thx_color__$Yuv_Yuv_$Impl_$.withV = function(this1,newv) {
	return [this1[0],this1[1],this1[2]];
};
thx_color__$Yuv_Yuv_$Impl_$.toString = function(this1) {
	return "yuv(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$Yuv_Yuv_$Impl_$.equals = function(this1,other) {
	return thx_color__$Yuv_Yuv_$Impl_$.nearEquals(this1,other);
};
thx_color__$Yuv_Yuv_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$Yuv_Yuv_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Yuv_Yuv_$Impl_$.toXyz(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Yuv_Yuv_$Impl_$.toCieLab(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toCubeHelix = function(this1) {
	var this2 = thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1);
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCubeHelixWithGamma(this2,1);
};
thx_color__$Yuv_Yuv_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Yuv_Yuv_$Impl_$.toXyz(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Yuv_Yuv_$Impl_$.toRgbxa(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toRgbx = function(this1) {
	var r = this1[0] + 1.139837398373983740 * this1[2];
	var g = this1[0] - 0.3946517043589703515 * this1[1] - 0.5805986066674976801 * this1[2];
	var b = this1[0] + 2.032110091743119266 * this1[1];
	return [r,g,b];
};
thx_color__$Yuv_Yuv_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Yuv_Yuv_$Impl_$.toRgbx(this1));
};
thx_color__$Yuv_Yuv_$Impl_$.get_y = function(this1) {
	return this1[0];
};
thx_color__$Yuv_Yuv_$Impl_$.get_u = function(this1) {
	return this1[1];
};
thx_color__$Yuv_Yuv_$Impl_$.get_v = function(this1) {
	return this1[2];
};
var thx_color__$Yxy_Yxy_$Impl_$ = {};
thx_color__$Yxy_Yxy_$Impl_$.__name__ = ["thx","color","_Yxy","Yxy_Impl_"];
thx_color__$Yxy_Yxy_$Impl_$.create = function(y1,x,y2) {
	return [y1,x,y2];
};
thx_color__$Yxy_Yxy_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return [arr[0],arr[1],arr[2]];
};
thx_color__$Yxy_Yxy_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "yxy":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false);
			return channels;
		default:
			return null;
		}
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
thx_color__$Yxy_Yxy_$Impl_$._new = function(channels) {
	return channels;
};
thx_color__$Yxy_Yxy_$Impl_$.interpolate = function(this1,other,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],other[0]),thx_Floats.interpolate(t,this1[1],other[1]),thx_Floats.interpolate(t,this1[2],other[2])];
	return channels;
};
thx_color__$Yxy_Yxy_$Impl_$.min = function(this1,other) {
	var y1 = Math.min(this1[0],other[0]);
	var x = Math.min(this1[1],other[1]);
	var y2 = Math.min(this1[2],other[2]);
	return [y1,x,y2];
};
thx_color__$Yxy_Yxy_$Impl_$.max = function(this1,other) {
	var y1 = Math.max(this1[0],other[0]);
	var x = Math.max(this1[1],other[1]);
	var y2 = Math.max(this1[2],other[2]);
	return [y1,x,y2];
};
thx_color__$Yxy_Yxy_$Impl_$.roundTo = function(this1,decimals) {
	var y1 = thx_Floats.roundTo(this1[0],decimals);
	var x = thx_Floats.roundTo(this1[1],decimals);
	var y2 = thx_Floats.roundTo(this1[2],decimals);
	return [y1,x,y2];
};
thx_color__$Yxy_Yxy_$Impl_$.withY1 = function(this1,newy1) {
	return [newy1,this1[1],this1[2]];
};
thx_color__$Yxy_Yxy_$Impl_$.withY = function(this1,newx) {
	return [this1[0],this1[1],this1[2]];
};
thx_color__$Yxy_Yxy_$Impl_$.withZ = function(this1,newy2) {
	return [this1[0],this1[1],this1[2]];
};
thx_color__$Yxy_Yxy_$Impl_$.toString = function(this1) {
	return "yxy(" + this1[0] + "," + this1[1] + "," + this1[2] + ")";
};
thx_color__$Yxy_Yxy_$Impl_$.equals = function(this1,other) {
	return thx_color__$Yxy_Yxy_$Impl_$.nearEquals(this1,other);
};
thx_color__$Yxy_Yxy_$Impl_$.nearEquals = function(this1,other,tolerance) {
	if(tolerance == null) tolerance = 10e-10;
	return Math.abs(this1[0] - other[0]) <= tolerance && Math.abs(this1[1] - other[1]) <= tolerance && Math.abs(this1[2] - other[2]) <= tolerance;
};
thx_color__$Yxy_Yxy_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Yxy_Yxy_$Impl_$.toCieLab(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCieLuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLuv(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCmy = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCmy(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCmyk(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCubeHelix = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCubeHelix(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toGrey = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toGrey(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toHsv = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHsv(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toHunterLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toHunterLab(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgb = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toRgb(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Yxy_Yxy_$Impl_$.toRgbxa(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toRgbx(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toRgbxa(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toTemperature = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toTemperature(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toYuv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYuv(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toXyz = function(this1) {
	return [this1[1] * (this1[0] / this1[2]),this1[0],(1 - this1[1] - this1[2]) * (this1[0] / this1[2])];
};
thx_color__$Yxy_Yxy_$Impl_$.get_y1 = function(this1) {
	return this1[0];
};
thx_color__$Yxy_Yxy_$Impl_$.get_x = function(this1) {
	return this1[1];
};
thx_color__$Yxy_Yxy_$Impl_$.get_y2 = function(this1) {
	return this1[2];
};
var thx_color_parse_ColorParser = function() {
	this.pattern_color = new EReg("^\\s*([^(]+)\\s*\\(([^)]*)\\)\\s*$","i");
	this.pattern_channel = new EReg("^\\s*(-?\\d*.\\d+|-?\\d+)(%|deg|rad)?\\s*$","i");
};
thx_color_parse_ColorParser.__name__ = ["thx","color","parse","ColorParser"];
thx_color_parse_ColorParser.parseColor = function(s) {
	return thx_color_parse_ColorParser.parser.processColor(s);
};
thx_color_parse_ColorParser.parseHex = function(s) {
	return thx_color_parse_ColorParser.parser.processHex(s);
};
thx_color_parse_ColorParser.parseChannel = function(s) {
	return thx_color_parse_ColorParser.parser.processChannel(s);
};
thx_color_parse_ColorParser.getFloatChannels = function(channels,length,useInt8) {
	if(length != channels.length) throw new js__$Boot_HaxeError("invalid number of channels, expected " + length + " but it is " + channels.length);
	return channels.map((function(f,a2) {
		return function(a1) {
			return f(a1,a2);
		};
	})(thx_color_parse_ColorParser.getFloatChannel,useInt8));
};
thx_color_parse_ColorParser.getInt8Channels = function(channels,length) {
	if(length != channels.length) throw new js__$Boot_HaxeError("invalid number of channels, expected " + length + " but it is " + channels.length);
	return channels.map(thx_color_parse_ColorParser.getInt8Channel);
};
thx_color_parse_ColorParser.getFloatChannel = function(channel,useInt8) {
	if(useInt8 == null) useInt8 = true;
	switch(channel[1]) {
	case 5:
		var v = channel[2];
		if(v) return 1; else return 0;
		break;
	case 1:
		var v1 = channel[2];
		return v1;
	case 4:
		var v2 = channel[2];
		return v2;
	case 2:
		var v3 = channel[2];
		return v3;
	case 3:
		var v4 = channel[2];
		if(useInt8) return v4 / 255; else {
			var v5 = channel[2];
			return v5;
		}
		break;
	case 0:
		var v6 = channel[2];
		return v6 / 100;
	}
};
thx_color_parse_ColorParser.getInt8Channel = function(channel) {
	switch(channel[1]) {
	case 5:
		var v = channel[2];
		if(v) return 1; else return 0;
		break;
	case 3:
		var v1 = channel[2];
		return v1;
	case 0:
		var v2 = channel[2];
		return Math.round(255 * v2 / 100);
	default:
		throw new js__$Boot_HaxeError("unable to extract a valid int8 value");
	}
};
thx_color_parse_ColorParser.prototype = {
	pattern_color: null
	,pattern_channel: null
	,processHex: function(s) {
		if(!thx_color_parse_ColorParser.isPureHex.match(s)) {
			if(HxOverrides.substr(s,0,1) == "#") {
				if(s.length == 4) s = s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2) + s.charAt(3) + s.charAt(3); else if(s.length == 5) s = s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2) + s.charAt(3) + s.charAt(3) + s.charAt(4) + s.charAt(4); else s = HxOverrides.substr(s,1,null);
			} else if(HxOverrides.substr(s,0,2) == "0x") s = HxOverrides.substr(s,2,null); else return null;
		}
		var channels = [];
		while(s.length > 0) {
			channels.push(thx_color_parse_ChannelInfo.CIInt8(Std.parseInt("0x" + HxOverrides.substr(s,0,2))));
			s = HxOverrides.substr(s,2,null);
		}
		if(channels.length == 4) return new thx_color_parse_ColorInfo("rgba",channels.slice(1).concat([channels[0]])); else return new thx_color_parse_ColorInfo("rgb",channels);
	}
	,processColor: function(s) {
		if(!this.pattern_color.match(s)) return null;
		var name = this.pattern_color.matched(1);
		if(null == name) return null;
		name = name.toLowerCase();
		var m2 = this.pattern_color.matched(2);
		var s_channels;
		if(null == m2) s_channels = []; else s_channels = m2.split(",");
		var channels = [];
		var channel;
		var _g = 0;
		while(_g < s_channels.length) {
			var s_channel = s_channels[_g];
			++_g;
			channel = this.processChannel(s_channel);
			if(null == channel) return null;
			channels.push(channel);
		}
		return new thx_color_parse_ColorInfo(name,channels);
	}
	,processChannel: function(s) {
		if(!this.pattern_channel.match(s)) return null;
		var value = this.pattern_channel.matched(1);
		var unit = this.pattern_channel.matched(2);
		if(unit == null) unit = "";
		try {
			switch(unit) {
			case "%":
				if(thx_Floats.canParse(value)) return thx_color_parse_ChannelInfo.CIPercent(thx_Floats.parse(value)); else return null;
				break;
			case "deg":
				if(thx_Floats.canParse(value)) return thx_color_parse_ChannelInfo.CIDegree(thx_Floats.parse(value)); else return null;
				break;
			case "DEG":
				if(thx_Floats.canParse(value)) return thx_color_parse_ChannelInfo.CIDegree(thx_Floats.parse(value)); else return null;
				break;
			case "rad":
				if(thx_Floats.canParse(value)) return thx_color_parse_ChannelInfo.CIDegree(thx_Floats.parse(value) * 180 / Math.PI); else return null;
				break;
			case "RAD":
				if(thx_Floats.canParse(value)) return thx_color_parse_ChannelInfo.CIDegree(thx_Floats.parse(value) * 180 / Math.PI); else return null;
				break;
			case "":
				if(thx_Ints.canParse(value)) {
					var i = thx_Ints.parse(value);
					if(i == 0) return thx_color_parse_ChannelInfo.CIBool(false); else if(i == 1) return thx_color_parse_ChannelInfo.CIBool(true); else if(i < 256) return thx_color_parse_ChannelInfo.CIInt8(i); else return thx_color_parse_ChannelInfo.CIInt(i);
				} else if(thx_Floats.canParse(value)) return thx_color_parse_ChannelInfo.CIFloat(thx_Floats.parse(value)); else return null;
				break;
			default:
				return null;
			}
		} catch( e ) {
			haxe_CallStack.lastException = e;
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return null;
		}
	}
	,__class__: thx_color_parse_ColorParser
};
var thx_color_parse_ColorInfo = function(name,channels) {
	this.name = name;
	this.channels = channels;
};
thx_color_parse_ColorInfo.__name__ = ["thx","color","parse","ColorInfo"];
thx_color_parse_ColorInfo.prototype = {
	name: null
	,channels: null
	,toString: function() {
		return "" + this.name + ", channels: " + Std.string(this.channels);
	}
	,__class__: thx_color_parse_ColorInfo
};
var thx_color_parse_ChannelInfo = { __ename__ : ["thx","color","parse","ChannelInfo"], __constructs__ : ["CIPercent","CIFloat","CIDegree","CIInt8","CIInt","CIBool"] };
thx_color_parse_ChannelInfo.CIPercent = function(value) { var $x = ["CIPercent",0,value]; $x.__enum__ = thx_color_parse_ChannelInfo; $x.toString = $estr; return $x; };
thx_color_parse_ChannelInfo.CIFloat = function(value) { var $x = ["CIFloat",1,value]; $x.__enum__ = thx_color_parse_ChannelInfo; $x.toString = $estr; return $x; };
thx_color_parse_ChannelInfo.CIDegree = function(value) { var $x = ["CIDegree",2,value]; $x.__enum__ = thx_color_parse_ChannelInfo; $x.toString = $estr; return $x; };
thx_color_parse_ChannelInfo.CIInt8 = function(value) { var $x = ["CIInt8",3,value]; $x.__enum__ = thx_color_parse_ChannelInfo; $x.toString = $estr; return $x; };
thx_color_parse_ChannelInfo.CIInt = function(value) { var $x = ["CIInt",4,value]; $x.__enum__ = thx_color_parse_ChannelInfo; $x.toString = $estr; return $x; };
thx_color_parse_ChannelInfo.CIBool = function(value) { var $x = ["CIBool",5,value]; $x.__enum__ = thx_color_parse_ChannelInfo; $x.toString = $estr; return $x; };
var thx_error_ErrorWrapper = function(message,innerError,stack,pos) {
	thx_Error.call(this,message,stack,pos);
	this.innerError = innerError;
};
thx_error_ErrorWrapper.__name__ = ["thx","error","ErrorWrapper"];
thx_error_ErrorWrapper.__super__ = thx_Error;
thx_error_ErrorWrapper.prototype = $extend(thx_Error.prototype,{
	innerError: null
	,__class__: thx_error_ErrorWrapper
});
var thx_error_NullArgument = function(message,posInfo) {
	thx_Error.call(this,message,null,posInfo);
};
thx_error_NullArgument.__name__ = ["thx","error","NullArgument"];
thx_error_NullArgument.__super__ = thx_Error;
thx_error_NullArgument.prototype = $extend(thx_Error.prototype,{
	__class__: thx_error_NullArgument
});
var thx_math_random_PseudoRandom = function(seed) {
	if(seed == null) seed = 1;
	this.seed = seed;
};
thx_math_random_PseudoRandom.__name__ = ["thx","math","random","PseudoRandom"];
thx_math_random_PseudoRandom.prototype = {
	seed: null
	,'int': function() {
		return (this.seed = this.seed * 48271.0 % 2147483647.0 | 0) & 1073741823;
	}
	,'float': function() {
		return this["int"]() / 1073741823.0;
	}
	,__class__: thx_math_random_PseudoRandom
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
String.prototype.__class__ = String;
String.__name__ = ["String"];
Array.__name__ = ["Array"];
Date.prototype.__class__ = Date;
Date.__name__ = ["Date"];
var Int = { __name__ : ["Int"]};
var Dynamic = { __name__ : ["Dynamic"]};
var Float = Number;
Float.__name__ = ["Float"];
var Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = { __name__ : ["Class"]};
var Enum = { };
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
if(Array.prototype.filter == null) Array.prototype.filter = function(f1) {
	var a1 = [];
	var _g11 = 0;
	var _g2 = this.length;
	while(_g11 < _g2) {
		var i1 = _g11++;
		var e = this[i1];
		if(f1(e)) a1.push(e);
	}
	return a1;
};
var __map_reserved = {}

      // Production steps of ECMA-262, Edition 5, 15.4.4.21
      // Reference: http://es5.github.io/#x15.4.4.21
      if (!Array.prototype.reduce) {
        Array.prototype.reduce = function(callback /*, initialValue*/) {
          'use strict';
          if (this == null) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
          }
          if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
          }
          var t = Object(this), len = t.length >>> 0, k = 0, value;
          if (arguments.length == 2) {
            value = arguments[1];
          } else {
            while (k < len && ! k in t) {
              k++;
            }
            if (k >= len) {
              throw new TypeError('Reduce of empty array with no initial value');
            }
            value = t[k++];
          }
          for (; k < len; k++) {
            if (k in t) {
              value = callback(value, t[k], k, t);
            }
          }
          return value;
        };
      }
    ;
DateTools.DAYS_OF_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
js_Boot.__toStr = {}.toString;
thx_Floats.TOLERANCE = 10e-5;
thx_Floats.EPSILON = 10e-10;
thx_Floats.pattern_parse = new EReg("^(\\+|-)?\\d+(\\.\\d+)?(e-?\\d+)?$","");
thx_Ints.pattern_parse = new EReg("^[+-]?(\\d+|0x[0-9A-F]+)$","i");
thx_Ints.BASE = "0123456789abcdefghijklmnopqrstuvwxyz";
thx_Strings.UCWORDS = new EReg("[^a-zA-Z]([a-z])","g");
thx_Strings.UCWORDSWS = new EReg("[ \t\r\n][a-z]","g");
thx_Strings.ALPHANUM = new EReg("^[a-z0-9]+$","i");
thx_Strings.DIGITS = new EReg("^[0-9]+$","");
thx_Strings.STRIPTAGS = new EReg("</?[a-z]+[^>]*>","gi");
thx_Strings.WSG = new EReg("[ \t\r\n]+","g");
thx_Strings.SPLIT_LINES = new EReg("\r\n|\n\r|\n|\r","g");
thx_color__$CubeHelix_CubeHelix_$Impl_$.A = -0.14861;
thx_color__$CubeHelix_CubeHelix_$Impl_$.B = 1.78277;
thx_color__$CubeHelix_CubeHelix_$Impl_$.C = -0.29227;
thx_color__$CubeHelix_CubeHelix_$Impl_$.D = -0.90649;
thx_color__$CubeHelix_CubeHelix_$Impl_$.E = 1.97294;
thx_color__$CubeHelix_CubeHelix_$Impl_$.ED = -1.7884503806;
thx_color__$CubeHelix_CubeHelix_$Impl_$.EB = 3.5172982438;
thx_color__$CubeHelix_CubeHelix_$Impl_$.BC_DA = -0.65576366679999987;
thx_color__$Grey_Grey_$Impl_$.black = 0;
thx_color__$Grey_Grey_$Impl_$.white = 1;
thx_color__$Xyz_Xyz_$Impl_$.whiteReference = [0.95047,1,1.08883];
thx_color__$Xyz_Xyz_$Impl_$.epsilon = 0.0088564516790356311;
thx_color__$Xyz_Xyz_$Impl_$.kappa = 903.2962962962963;
thx_color_parse_ColorParser.parser = new thx_color_parse_ColorParser();
thx_color_parse_ColorParser.isPureHex = new EReg("^([0-9a-f]{2}){3,4}$","i");
Main.main();
})(typeof console != "undefined" ? console : {log:function(){}});

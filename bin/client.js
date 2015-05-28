(function (console) { "use strict";
var $estr = function() { return js_Boot.__string_rec(this,''); };
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
	,__class__: List
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
	,__class__: _$List_ListIterator
};
var Main = function() {
	this.codeBB = new EReg("(?:\\[code\\]|`)(.*?)(?:\\[/code\\]|`)","i");
	this.boldBB = new EReg("(?:\\[b\\]|\\*\\*)(.*?)(?:\\[/b\\]|\\*\\*)","i");
	this.italicBB = new EReg("(?:\\[i\\]|\\*)(.*?)(?:\\[/i\\]|\\*)","i");
	this.imgBB = new EReg("(?:\\[img\\]|#)(.*?)(?:\\[/img\\]|#)","i");
	this.ticker = 0;
	this.commands = new haxe_ds_StringMap();
	this.numNotifications = 0;
	this.notifications = [];
	this.first = true;
	this.lastMessage = "";
	this.focussed = true;
	this.requestInProgress = false;
	this.lastUserID = -2;
	this.lastIndex = -1;
	this.basePath = "https://aqueous-basin.herokuapp.com/";
	var _g = this;
	this._buildCommands();
	this.getHttp = new haxe_Http(this.basePath + this.lastIndex);
	this.getHttp.async = true;
	this.getHttp.onData = $bind(this,this._parseMessages);
	this.getHttp.onError = function(error) {
		console.log(error);
	};
	this.postHttp = new haxe_Http(this.basePath);
	this.postHttp.async = true;
	this.postHttp.onError = function(error1) {
		console.log(error1);
		_g.requestInProgress = false;
		_g.chatbox.value = _g.lastMessage;
	};
	if(!js_Cookie.exists("id")) this._generateID(); else this.id = Std.parseInt(js_Cookie.get("id"));
	window.onload = $bind(this,this._windowLoaded);
	window.onfocus = function() {
		_g.focussed = true;
		window.document.title = "aqueous-basin.";
		_g._clearNotifications();
		_g.numNotifications = 0;
	};
	window.onblur = function() {
		_g.focussed = false;
	};
	this._loop();
};
Main.__name__ = true;
Main.main = function() {
	new Main();
};
Main.prototype = {
	_buildCommands: function() {
		this.commands.set("new",$bind(this,this._generateID));
	}
	,_generateID: function($arguments) {
		this.id = new Random(Math.random() * 16777215)["int"](0,16777215);
		js_Cookie.set("id",Std.string(this.id),315360000);
	}
	,_clearNotifications: function() {
		var _g = 0;
		var _g1 = this.notifications;
		while(_g < _g1.length) {
			var n = _g1[_g];
			++_g;
			n.close();
		}
		this.notifications = [];
	}
	,_windowLoaded: function() {
		this.chatbox = window.document.getElementById("chatbox");
		this.messages = window.document.getElementById("messages");
		this.messageSound = window.document.getElementById("messagesound");
		this.chatbox.onclick = $bind(this,this._testNotification);
		this.chatbox.onkeypress = $bind(this,this._checkKeyPress);
		this.chatbox.focus();
	}
	,_testNotification: function() {
		if(Notification.permission == "default") Notification.requestPermission(function(permission) {
		});
	}
	,_sendNotification: function(text) {
		if(Notification.permission == "granted") {
			var options = { };
			options.body = "aqueous-basin.";
			if(this.numNotifications <= 1) this.notifications.push(new Notification(text,options)); else {
				this._clearNotifications();
				this.notifications.push(new Notification("" + this.numNotifications + " new messages.",options));
			}
			this.notifications[this.notifications.length - 1].onclick = function() {
				window.focus();
			};
		}
	}
	,_checkKeyPress: function(e) {
		var code;
		if(e.keyCode != null) code = e.keyCode; else code = e.which;
		if(code == 13) {
			if(this.chatbox.value.charAt(0) == "/") this._parseCommand(HxOverrides.substr(this.chatbox.value,1,null)); else {
				this.postHttp.url = this.basePath + "chat/" + encodeURIComponent(this.chatbox.value) + "/" + this.id;
				this.lastMessage = this.chatbox.value;
				this.postHttp.request(true);
				this._update();
			}
			this.chatbox.value = "";
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
		if(this.commands.exists(command)) this.commands.get(command)(args); else this._addMessage("Unrecognized command.");
	}
	,_addMessage: function(msg,id) {
		var message;
		var differentUser = false;
		if(id == null || id == -1 || id != this.lastUserID) differentUser = true;
		if(differentUser) {
			var _this = window.document;
			message = _this.createElement("div");
			message.className = "messageblock";
			this.lastParagraph = message;
			this.messages.appendChild(this._makeSpan(differentUser,id));
			this.messages.appendChild(message);
		} else message = this.lastParagraph;
		var messageItem;
		var _this1 = window.document;
		messageItem = _this1.createElement("div");
		messageItem.className = "messageitem";
		messageItem.innerHTML = msg;
		message.appendChild(messageItem);
		window.scrollTo(0,window.document.body.scrollHeight);
		return messageItem;
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
			this.ticker++;
			if(this.ticker > 5) window.location.reload(true);
			return;
		}
		this.ticker = 0;
		this.getHttp.url = this.basePath + "api/" + this.lastIndex;
		this.requestInProgress = true;
		this.getHttp.request(true);
	}
	,_parseMessages: function(data) {
		var parsed = JSON.parse(data);
		var _g = 0;
		var _g1 = parsed.messages.messages;
		while(_g < _g1.length) {
			var p = _g1[_g];
			++_g;
			var bbParsed = this._parseMessage(p.text);
			var message = this._addMessage(bbParsed,p.id);
			if(!this.focussed && !this.first) {
				window.document.title = "# aqueous-basin.";
				this.messageSound.play();
				this.numNotifications++;
				this._sendNotification(message.innerText != null?message.innerText:message.textContent);
			}
			this.lastUserID = p.id;
		}
		this.lastIndex = parsed.lastID;
		this.first = false;
		var _g2 = 0;
		var _g11 = window.document.getElementsByClassName("imgmessage");
		while(_g2 < _g11.length) {
			var i = _g11[_g2];
			++_g2;
			var image = i;
			i.onclick = (function(f,a1) {
				return function() {
					f(a1);
				};
			})($bind(this,this._openImageInNewTab),image.src);
		}
		this.requestInProgress = false;
	}
	,_openImageInNewTab: function(src) {
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
			var hsl;
			if(id != null && id != -1) {
				var hue = new Random(id * 12189234)["float"](0,360);
				var sat = new Random(id * 12189234)["float"](0.3,0.5);
				var light = new Random(id * 12189234)["float"](0.3,0.5);
				hsl = thx_color__$Hsl_Hsl_$Impl_$.create(hue,sat,light);
			} else hsl = thx_color__$Hsl_Hsl_$Impl_$.create(0,1,1);
			span.style.color = "#" + StringTools.hex(thx_color__$Hsl_Hsl_$Impl_$.toRgb(hsl),6);
		}
		span.innerHTML += "\t";
		return span;
	}
	,_parseMessage: function(raw) {
		var parsed = StringTools.replace(raw,"\n"," ");
		parsed = StringTools.htmlEscape(parsed);
		while(this.imgBB.match(parsed)) {
			var imgPath = this.imgBB.matched(1);
			var imgTag = "<img src=" + imgPath + " class=\"imgmessage\"></img>";
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
		return parsed;
	}
	,__class__: Main
};
Math.__name__ = true;
var Random = function(_initial_seed) {
	this.initial = this.seed = _initial_seed;
	this.seed = this.initial;
};
Random.__name__ = true;
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
	,set_initial: function(_initial) {
		this.initial = this.seed = _initial;
		return this.initial;
	}
	,__class__: Random
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
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
StringBuf.__name__ = true;
StringBuf.prototype = {
	add: function(x) {
		this.b += Std.string(x);
	}
	,__class__: StringBuf
};
var StringTools = function() { };
StringTools.__name__ = true;
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
var haxe_StackItem = { __ename__ : true, __constructs__ : ["CFunction","Module","FilePos","Method","LocalFunction"] };
haxe_StackItem.CFunction = ["CFunction",0];
haxe_StackItem.CFunction.toString = $estr;
haxe_StackItem.CFunction.__enum__ = haxe_StackItem;
haxe_StackItem.Module = function(m) { var $x = ["Module",1,m]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.FilePos = function(s,file,line) { var $x = ["FilePos",2,s,file,line]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.Method = function(classname,method) { var $x = ["Method",3,classname,method]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.LocalFunction = function(v) { var $x = ["LocalFunction",4,v]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
var haxe_CallStack = function() { };
haxe_CallStack.__name__ = true;
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
haxe_IMap.__name__ = true;
haxe_IMap.prototype = {
	__class__: haxe_IMap
};
var haxe_Http = function(url) {
	this.url = url;
	this.headers = new List();
	this.params = new List();
	this.async = true;
};
haxe_Http.__name__ = true;
haxe_Http.prototype = {
	request: function(post) {
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
	,__class__: haxe_Timer
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
	,__class__: haxe_ds_StringMap
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
	__class__: js__$Boot_HaxeError
});
var js_Boot = function() { };
js_Boot.__name__ = true;
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
var thx_Arrays = function() { };
thx_Arrays.__name__ = true;
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
thx_ArrayFloats.__name__ = true;
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
thx_ArrayInts.__name__ = true;
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
thx_ArrayStrings.__name__ = true;
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
thx_Error.__name__ = true;
thx_Error.fromDynamic = function(err,pos) {
	if(js_Boot.__instanceof(err,thx_Error)) return err;
	return new thx_error_ErrorWrapper("" + Std.string(err),err,null,pos);
};
thx_Error.__super__ = Error;
thx_Error.prototype = $extend(Error.prototype,{
	toString: function() {
		return this.message + "\nfrom: " + this.pos.className + "." + this.pos.methodName + "() at " + this.pos.lineNumber + "\n\n" + haxe_CallStack.toString(this.stackItems);
	}
	,__class__: thx_Error
});
var thx_Floats = function() { };
thx_Floats.__name__ = true;
thx_Floats.angleDifference = function(a,b,turn) {
	if(turn == null) turn = 360;
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
thx_Floats.nearEquals = function(a,b) {
	return Math.abs(a - b) <= 10e-10;
};
thx_Floats.nearZero = function(n) {
	return Math.abs(n) <= 10e-10;
};
thx_Floats.normalize = function(v) {
	if(v < 0) return 0; else if(v > 1) return 1; else return v;
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
thx_Functions0.__name__ = true;
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
thx_Functions1.__name__ = true;
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
thx_Functions2.__name__ = true;
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
thx_Functions3.__name__ = true;
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
thx_Functions.__name__ = true;
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
thx_Ints.__name__ = true;
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
var thx_Nil = { __ename__ : true, __constructs__ : ["nil"] };
thx_Nil.nil = ["nil",0];
thx_Nil.nil.toString = $estr;
thx_Nil.nil.__enum__ = thx_Nil;
var thx_Strings = function() { };
thx_Strings.__name__ = true;
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
thx__$Tuple_Tuple0_$Impl_$.__name__ = true;
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
thx__$Tuple_Tuple1_$Impl_$.__name__ = true;
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
thx__$Tuple_Tuple2_$Impl_$.__name__ = true;
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
thx__$Tuple_Tuple3_$Impl_$.__name__ = true;
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
thx__$Tuple_Tuple4_$Impl_$.__name__ = true;
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
thx__$Tuple_Tuple5_$Impl_$.__name__ = true;
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
thx__$Tuple_Tuple6_$Impl_$.__name__ = true;
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
var thx_color__$CieLCh_CieLCh_$Impl_$ = {};
thx_color__$CieLCh_CieLCh_$Impl_$.__name__ = true;
thx_color__$CieLCh_CieLCh_$Impl_$.create = function(lightness,chroma,hue) {
	var channels = [lightness,chroma,thx_Floats.wrapCircular(hue,360)];
	return channels;
};
thx_color__$CieLCh_CieLCh_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$CieLCh_CieLCh_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$CieLCh_CieLCh_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cielch":
			return thx_color__$CieLCh_CieLCh_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,3,false));
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
thx_color__$CieLCh_CieLCh_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$CieLCh_CieLCh_$Impl_$.withHue(this1,this1[2] + angle);
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
	var channels = [this1[0],this1[1],thx_Floats.wrapCircular(newhue,360)];
	return channels;
};
thx_color__$CieLCh_CieLCh_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$CieLCh_CieLCh_$Impl_$.toString = function(this1) {
	return "CieLCh(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1],6) + "," + thx_Floats.roundTo(this1[2],6) + ")";
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCieLab = function(this1) {
	var hradi = this1[2] * (Math.PI / 180);
	var a = Math.cos(hradi) * this1[1];
	var b = Math.sin(hradi) * this1[1];
	return [this1[0],a,b];
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
};
thx_color__$CieLCh_CieLCh_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$CieLCh_CieLCh_$Impl_$.toRgbx(this1));
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
thx_color__$CieLCh_CieLCh_$Impl_$.toXyz = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toXyz(thx_color__$CieLCh_CieLCh_$Impl_$.toCieLab(this1));
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
thx_color__$CieLab_CieLab_$Impl_$.__name__ = true;
thx_color__$CieLab_CieLab_$Impl_$.create = function(l,a,b) {
	return [l,a,b];
};
thx_color__$CieLab_CieLab_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$CieLab_CieLab_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$CieLab_CieLab_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cielab":
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
thx_color__$CieLab_CieLab_$Impl_$.darker = function(this1,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],0),this1[1],this1[2]];
	return channels;
};
thx_color__$CieLab_CieLab_$Impl_$.lighter = function(this1,t) {
	var channels = [thx_Floats.interpolate(t,this1[0],100),this1[1],this1[2]];
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
thx_color__$CieLab_CieLab_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$CieLab_CieLab_$Impl_$.withLightness = function(this1,lightness) {
	return [lightness,this1[1],this1[2]];
};
thx_color__$CieLab_CieLab_$Impl_$.withA = function(this1,newa) {
	return [this1[0],newa,this1[2]];
};
thx_color__$CieLab_CieLab_$Impl_$.withB = function(this1,newb) {
	return [this1[0],this1[1],newb];
};
thx_color__$CieLab_CieLab_$Impl_$.toString = function(this1) {
	return "CieLab(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1],6) + "," + thx_Floats.roundTo(this1[2],6) + ")";
};
thx_color__$CieLab_CieLab_$Impl_$.toCieLCh = function(this1) {
	var h = thx_Floats.wrapCircular(Math.atan2(this1[2],this1[1]) * 180 / Math.PI,360);
	var c = Math.sqrt(this1[1] * this1[1] + this1[2] * this1[2]);
	return [this1[0],c,h];
};
thx_color__$CieLab_CieLab_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
};
thx_color__$CieLab_CieLab_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$CieLab_CieLab_$Impl_$.toRgbx(this1));
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
thx_color__$CieLab_CieLab_$Impl_$.toXyz = function(this1) {
	var y = (this1[0] + 16) / 116;
	var x = this1[1] / 500 + y;
	var z = y - this1[2] / 200;
	var p;
	p = Math.pow(y,3);
	if(p > 0.008856) y = p; else y = (y - 0.13793103448275862) / 7.787;
	p = Math.pow(x,3);
	if(p > 0.008856) x = p; else x = (x - 0.13793103448275862) / 7.787;
	p = Math.pow(z,3);
	if(p > 0.008856) z = p; else z = (z - 0.13793103448275862) / 7.787;
	return [95.047 * x,100 * y,108.883 * z];
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
var thx_color__$Cmy_Cmy_$Impl_$ = {};
thx_color__$Cmy_Cmy_$Impl_$.__name__ = true;
thx_color__$Cmy_Cmy_$Impl_$.create = function(cyan,magenta,yellow) {
	return [cyan < 0?0:cyan > 1?1:cyan,magenta < 0?0:magenta > 1?1:magenta,yellow < 0?0:yellow > 1?1:yellow];
};
thx_color__$Cmy_Cmy_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$Cmy_Cmy_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$Cmy_Cmy_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cmy":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3);
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
thx_color__$Cmy_Cmy_$Impl_$.withCyan = function(this1,newcyan) {
	return [newcyan < 0?0:newcyan > 1?1:newcyan,this1[1],this1[2]];
};
thx_color__$Cmy_Cmy_$Impl_$.withMagenta = function(this1,newmagenta) {
	return [this1[0],newmagenta < 0?0:newmagenta > 1?1:newmagenta,this1[2]];
};
thx_color__$Cmy_Cmy_$Impl_$.withYellow = function(this1,newyellow) {
	return [this1[0],this1[1],newyellow < 0?0:newyellow > 1?1:newyellow];
};
thx_color__$Cmy_Cmy_$Impl_$.toString = function(this1) {
	return "cmy(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1],6) + "," + thx_Floats.roundTo(this1[2],6) + ")";
};
thx_color__$Cmy_Cmy_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$Cmy_Cmy_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
};
thx_color__$Cmy_Cmy_$Impl_$.toCmyk = function(this1) {
	var k = Math.min(Math.min(this1[0],this1[1]),this1[2]);
	if(k == 1) return [0,0,0,1]; else return [(this1[0] - k) / (1 - k),(this1[1] - k) / (1 - k),(this1[2] - k) / (1 - k),k];
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
thx_color__$Cmy_Cmy_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Cmy_Cmy_$Impl_$.toRgbx(this1));
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
thx_color__$Cmyk_Cmyk_$Impl_$.__name__ = true;
thx_color__$Cmyk_Cmyk_$Impl_$.create = function(cyan,magenta,yellow,black) {
	return [cyan < 0?0:cyan > 1?1:cyan,magenta < 0?0:magenta > 1?1:magenta,yellow < 0?0:yellow > 1?1:yellow,black < 0?0:black > 1?1:black];
};
thx_color__$Cmyk_Cmyk_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return thx_color__$Cmyk_Cmyk_$Impl_$.create(arr[0],arr[1],arr[2],arr[3]);
};
thx_color__$Cmyk_Cmyk_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "cmyk":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,4);
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
thx_color__$Cmyk_Cmyk_$Impl_$.withCyan = function(this1,newcyan) {
	return [newcyan < 0?0:newcyan > 1?1:newcyan,this1[1],this1[2],this1[3]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.withMagenta = function(this1,newmagenta) {
	return [this1[0],newmagenta < 0?0:newmagenta > 1?1:newmagenta,this1[2],this1[3]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.withYellow = function(this1,newyellow) {
	return [this1[0],this1[1],newyellow < 0?0:newyellow > 1?1:newyellow,this1[3]];
};
thx_color__$Cmyk_Cmyk_$Impl_$.withBlack = function(this1,newblack) {
	return [this1[0],this1[1],this1[2],newblack < 0?0:newblack > 1?1:newblack];
};
thx_color__$Cmyk_Cmyk_$Impl_$.toString = function(this1) {
	return "cmyk(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1],6) + "," + thx_Floats.roundTo(this1[2],6) + "," + thx_Floats.roundTo(this1[3],6) + ")";
};
thx_color__$Cmyk_Cmyk_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10 && Math.abs(this1[3] - other[3]) <= 10e-10;
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toCmy = function(this1) {
	return [this1[3] + (1 - this1[3]) * this1[0],this1[3] + (1 - this1[3]) * this1[1],this1[3] + (1 - this1[3]) * this1[2]];
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
thx_color__$Cmyk_Cmyk_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
thx_color__$Cmyk_Cmyk_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Cmyk_Cmyk_$Impl_$.toRgbx(this1));
};
var thx_color__$Grey_Grey_$Impl_$ = {};
thx_color__$Grey_Grey_$Impl_$.__name__ = true;
thx_color__$Grey_Grey_$Impl_$.create = function(v) {
	return v < 0?0:v > 1?1:v;
};
thx_color__$Grey_Grey_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "grey":case "gray":
			var grey = thx_color_parse_ColorParser.getFloatChannels(info.channels,1)[0];
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
thx_color__$Grey_Grey_$Impl_$.toString = function(this1) {
	return "grey(" + thx_Floats.roundTo(this1 * 100,6) + "%)";
};
thx_color__$Grey_Grey_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1 - other) <= 10e-10;
};
thx_color__$Grey_Grey_$Impl_$.get_grey = function(this1) {
	return this1;
};
thx_color__$Grey_Grey_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
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
thx_color__$Grey_Grey_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
thx_color__$Grey_Grey_$Impl_$.toYxy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toYxy(thx_color__$Grey_Grey_$Impl_$.toRgbx(this1));
};
var thx_color__$Hsl_Hsl_$Impl_$ = {};
thx_color__$Hsl_Hsl_$Impl_$.__name__ = true;
thx_color__$Hsl_Hsl_$Impl_$.create = function(hue,saturation,lightness) {
	var channels = [thx_Floats.wrapCircular(hue,360),saturation < 0?0:saturation > 1?1:saturation,lightness < 0?0:lightness > 1?1:lightness];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$Hsl_Hsl_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$Hsl_Hsl_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "hsl":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3);
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
thx_color__$Hsl_Hsl_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$Hsl_Hsl_$Impl_$.withHue(this1,this1[0] + angle);
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
	var channels = this1.concat([alpha < 0?0:alpha > 1?1:alpha]);
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.withHue = function(this1,newhue) {
	var channels = [thx_Floats.wrapCircular(newhue,360),this1[1],this1[2]];
	return channels;
};
thx_color__$Hsl_Hsl_$Impl_$.withLightness = function(this1,newlightness) {
	return [this1[0],this1[1],newlightness < 0?0:newlightness > 1?1:newlightness];
};
thx_color__$Hsl_Hsl_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation < 0?0:newsaturation > 1?1:newsaturation,this1[2]];
};
thx_color__$Hsl_Hsl_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Hsl_Hsl_$Impl_$.toString(this1);
};
thx_color__$Hsl_Hsl_$Impl_$.toString = function(this1) {
	return "hsl(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1] * 100,6) + "%," + thx_Floats.roundTo(this1[2] * 100,6) + "%)";
};
thx_color__$Hsl_Hsl_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$Hsl_Hsl_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
};
thx_color__$Hsl_Hsl_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
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
thx_color__$Hsl_Hsl_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Hsl_Hsl_$Impl_$.toRgbx(this1));
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
thx_color__$Hsla_Hsla_$Impl_$.__name__ = true;
thx_color__$Hsla_Hsla_$Impl_$.create = function(hue,saturation,lightness,alpha) {
	var channels = [thx_Floats.wrapCircular(hue,360),saturation < 0?0:saturation > 1?1:saturation,lightness < 0?0:lightness > 1?1:lightness,alpha < 0?0:alpha > 1?1:alpha];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return thx_color__$Hsla_Hsla_$Impl_$.create(arr[0],arr[1],arr[2],arr[3]);
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
				var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3);
				$r = channels;
				return $r;
			}(this)));
		case "hsla":
			var channels1 = thx_color_parse_ColorParser.getFloatChannels(info.channels,4);
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
	return thx_color__$Hsla_Hsla_$Impl_$.create(this1[0] + angle,this1[1],this1[2],this1[3]);
};
thx_color__$Hsla_Hsla_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 150.0;
	var _0 = thx_color__$Hsla_Hsla_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsla_Hsla_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsla_Hsla_$Impl_$.withAlpha = function(this1,newalpha) {
	return [this1[0],this1[1],this1[2],newalpha < 0?0:newalpha > 1?1:newalpha];
};
thx_color__$Hsla_Hsla_$Impl_$.withHue = function(this1,newhue) {
	var channels = [thx_Floats.wrapCircular(newhue,360),this1[1],this1[2],this1[3]];
	return channels;
};
thx_color__$Hsla_Hsla_$Impl_$.withLightness = function(this1,newlightness) {
	return [this1[0],this1[1],newlightness < 0?0:newlightness > 1?1:newlightness,this1[3]];
};
thx_color__$Hsla_Hsla_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation < 0?0:newsaturation > 1?1:newsaturation,this1[2],this1[3]];
};
thx_color__$Hsla_Hsla_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Hsla_Hsla_$Impl_$.toString(this1);
};
thx_color__$Hsla_Hsla_$Impl_$.toString = function(this1) {
	return "hsla(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1] * 100,6) + "%," + thx_Floats.roundTo(this1[2] * 100,6) + "%," + thx_Floats.roundTo(this1[3],6) + ")";
};
thx_color__$Hsla_Hsla_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10 && Math.abs(this1[3] - other[3]) <= 10e-10;
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
	var channels = [thx_color__$Hsla_Hsla_$Impl_$._c(this1[0] + 120,this1[1],this1[2]),thx_color__$Hsla_Hsla_$Impl_$._c(this1[0],this1[1],this1[2]),thx_color__$Hsla_Hsla_$Impl_$._c(this1[0] - 120,this1[1],this1[2]),this1[3]];
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
thx_color__$Hsla_Hsla_$Impl_$._c = function(d,s,l) {
	var m2;
	if(l <= 0.5) m2 = l * (1 + s); else m2 = l + s - l * s;
	var m1 = 2 * l - m2;
	d = thx_Floats.wrapCircular(d,360);
	if(d < 60) return m1 + (m2 - m1) * d / 60; else if(d < 180) return m2; else if(d < 240) return m1 + (m2 - m1) * (240 - d) / 60; else return m1;
};
var thx_color__$Hsv_Hsv_$Impl_$ = {};
thx_color__$Hsv_Hsv_$Impl_$.__name__ = true;
thx_color__$Hsv_Hsv_$Impl_$.create = function(hue,saturation,lightness) {
	var channels = [thx_Floats.wrapCircular(hue,360),saturation < 0?0:saturation > 1?1:saturation,lightness < 0?0:lightness > 1?1:lightness];
	return channels;
};
thx_color__$Hsv_Hsv_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$Hsv_Hsv_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$Hsv_Hsv_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "hsv":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3);
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
thx_color__$Hsv_Hsv_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$Hsv_Hsv_$Impl_$.withHue(this1,this1[0] + angle);
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
	var channels = this1.concat([alpha < 0?0:alpha > 1?1:alpha]);
	return channels;
};
thx_color__$Hsv_Hsv_$Impl_$.withHue = function(this1,newhue) {
	var channels = [thx_Floats.wrapCircular(newhue,360),this1[1],this1[2]];
	return channels;
};
thx_color__$Hsv_Hsv_$Impl_$.withValue = function(this1,newvalue) {
	return [this1[0],this1[1],newvalue < 0?0:newvalue > 1?1:newvalue];
};
thx_color__$Hsv_Hsv_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation < 0?0:newsaturation > 1?1:newsaturation,this1[2]];
};
thx_color__$Hsv_Hsv_$Impl_$.toString = function(this1) {
	return "hsv(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1] * 100,6) + "%," + thx_Floats.roundTo(this1[2] * 100,6) + "%)";
};
thx_color__$Hsv_Hsv_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$Hsv_Hsv_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
};
thx_color__$Hsv_Hsv_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
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
thx_color__$Hsv_Hsv_$Impl_$.toXyz = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(thx_color__$Hsv_Hsv_$Impl_$.toRgbx(this1));
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
thx_color__$Hsva_Hsva_$Impl_$.__name__ = true;
thx_color__$Hsva_Hsva_$Impl_$.create = function(hue,saturation,value,alpha) {
	var channels = [thx_Floats.wrapCircular(hue,360),saturation < 0?0:saturation > 1?1:saturation,value < 0?0:value > 1?1:value,alpha < 0?0:alpha > 1?1:alpha];
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return thx_color__$Hsva_Hsva_$Impl_$.create(arr[0],arr[1],arr[2],arr[3]);
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
				var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3);
				$r = channels;
				return $r;
			}(this)));
		case "hsva":
			var channels1 = thx_color_parse_ColorParser.getFloatChannels(info.channels,4);
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
thx_color__$Hsva_Hsva_$Impl_$.rotate = function(this1,angle) {
	return thx_color__$Hsva_Hsva_$Impl_$.create(this1[0] + angle,this1[1],this1[2],this1[3]);
};
thx_color__$Hsva_Hsva_$Impl_$.split = function(this1,spread) {
	if(spread == null) spread = 150.0;
	var _0 = thx_color__$Hsva_Hsva_$Impl_$.rotate(this1,-spread);
	var _1 = thx_color__$Hsva_Hsva_$Impl_$.rotate(this1,spread);
	return { _0 : _0, _1 : _1};
};
thx_color__$Hsva_Hsva_$Impl_$.withAlpha = function(this1,newalpha) {
	return [this1[0],this1[1],this1[2],newalpha < 0?0:newalpha > 1?1:newalpha];
};
thx_color__$Hsva_Hsva_$Impl_$.withHue = function(this1,newhue) {
	var channels = [thx_Floats.wrapCircular(newhue,360),this1[1],this1[2],this1[3]];
	return channels;
};
thx_color__$Hsva_Hsva_$Impl_$.withLightness = function(this1,newvalue) {
	return [this1[0],this1[1],newvalue < 0?0:newvalue > 1?1:newvalue,this1[3]];
};
thx_color__$Hsva_Hsva_$Impl_$.withSaturation = function(this1,newsaturation) {
	return [this1[0],newsaturation < 0?0:newsaturation > 1?1:newsaturation,this1[2],this1[3]];
};
thx_color__$Hsva_Hsva_$Impl_$.toString = function(this1) {
	return "hsva(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1] * 100,6) + "%," + thx_Floats.roundTo(this1[2] * 100,6) + "%," + thx_Floats.roundTo(this1[3],6) + ")";
};
thx_color__$Hsva_Hsva_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10 && Math.abs(this1[3] - other[3]) <= 10e-10;
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
var thx_color__$Rgb_Rgb_$Impl_$ = {};
thx_color__$Rgb_Rgb_$Impl_$.__name__ = true;
thx_color__$Rgb_Rgb_$Impl_$.create = function(red,green,blue) {
	return (red & 255) << 16 | (green & 255) << 8 | blue & 255;
};
thx_color__$Rgb_Rgb_$Impl_$.createf = function(red,green,blue) {
	return thx_color__$Rgb_Rgb_$Impl_$.create(Math.round(red * 255),Math.round(green * 255),Math.round(blue * 255));
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
	return thx_color__$Rgb_Rgb_$Impl_$.create(arr[0],arr[1],arr[2]);
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
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
};
thx_color__$Rgb_Rgb_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Rgb_Rgb_$Impl_$.toRgbx(this1));
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
thx_color__$Rgb_Rgb_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.fromInts([thx_color__$Rgb_Rgb_$Impl_$.get_red(this1),thx_color__$Rgb_Rgb_$Impl_$.get_green(this1),thx_color__$Rgb_Rgb_$Impl_$.get_blue(this1)]);
};
thx_color__$Rgb_Rgb_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgb_Rgb_$Impl_$.withAlpha(this1,255);
};
thx_color__$Rgb_Rgb_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgba_Rgba_$Impl_$.toRgbxa(thx_color__$Rgb_Rgb_$Impl_$.toRgba(this1));
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
thx_color__$Rgba_Rgba_$Impl_$.__name__ = true;
thx_color__$Rgba_Rgba_$Impl_$.create = function(red,green,blue,alpha) {
	return (red & 255) << 24 | (green & 255) << 16 | (blue & 255) << 8 | alpha & 255;
};
thx_color__$Rgba_Rgba_$Impl_$.fromFloats = function(arr) {
	var ints = thx_ArrayFloats.resize(arr,4).map(function(_) {
		return Math.round(_ * 255);
	});
	return thx_color__$Rgba_Rgba_$Impl_$.create(ints[0],ints[1],ints[2],ints[3]);
};
thx_color__$Rgba_Rgba_$Impl_$.fromInt = function(rgba) {
	return rgba;
};
thx_color__$Rgba_Rgba_$Impl_$.fromInts = function(arr) {
	thx_ArrayInts.resize(arr,4);
	return thx_color__$Rgba_Rgba_$Impl_$.create(arr[0],arr[1],arr[2],arr[3]);
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
			return thx_color__$Rgba_Rgba_$Impl_$.create(thx_color_parse_ColorParser.getInt8Channel(info.channels[0]),thx_color_parse_ColorParser.getInt8Channel(info.channels[1]),thx_color_parse_ColorParser.getInt8Channel(info.channels[2]),Math.round(thx_color_parse_ColorParser.getFloatChannel(info.channels[3]) * 255));
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
	return thx_color__$Rgb_Rgb_$Impl_$.create(this1 >> 24 & 255,this1 >> 16 & 255,this1 >> 8 & 255);
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
thx_color__$Rgbx_Rgbx_$Impl_$.__name__ = true;
thx_color__$Rgbx_Rgbx_$Impl_$.create = function(red,green,blue) {
	return [red < 0?0:red > 1?1:red,green < 0?0:green > 1?1:green,blue < 0?0:blue > 1?1:blue];
};
thx_color__$Rgbx_Rgbx_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$Rgbx_Rgbx_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$Rgbx_Rgbx_$Impl_$.fromInts = function(arr) {
	thx_ArrayInts.resize(arr,3);
	return thx_color__$Rgbx_Rgbx_$Impl_$.create(arr[0] / 255,arr[1] / 255,arr[2] / 255);
};
thx_color__$Rgbx_Rgbx_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseHex(color);
	if(null == info) info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "rgb":
			return thx_color__$Rgbx_Rgbx_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,3));
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
thx_color__$Rgbx_Rgbx_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toString(this1);
};
thx_color__$Rgbx_Rgbx_$Impl_$.toString = function(this1) {
	return "rgb(" + thx_Floats.roundTo(this1[0] * 100,6) + "%," + thx_Floats.roundTo(this1[1] * 100,6) + "%," + thx_Floats.roundTo(this1[2] * 100,6) + "%)";
};
thx_color__$Rgbx_Rgbx_$Impl_$.toHex = function(this1,prefix) {
	if(prefix == null) prefix = "#";
	return "" + prefix + StringTools.hex(thx_color__$Rgbx_Rgbx_$Impl_$.get_red(this1),2) + StringTools.hex(thx_color__$Rgbx_Rgbx_$Impl_$.get_green(this1),2) + StringTools.hex(thx_color__$Rgbx_Rgbx_$Impl_$.get_blue(this1),2);
};
thx_color__$Rgbx_Rgbx_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withAlpha = function(this1,alpha) {
	var channels = this1.concat([alpha < 0?0:alpha > 1?1:alpha]);
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withRed = function(this1,newred) {
	var channels = [newred < 0?0:newred > 1?1:newred,thx_color__$Rgbx_Rgbx_$Impl_$.get_green(this1),thx_color__$Rgbx_Rgbx_$Impl_$.get_blue(this1)];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withGreen = function(this1,newgreen) {
	var channels = [thx_color__$Rgbx_Rgbx_$Impl_$.get_red(this1),newgreen < 0?0:newgreen > 1?1:newgreen,thx_color__$Rgbx_Rgbx_$Impl_$.get_blue(this1)];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.withBlue = function(this1,newblue) {
	var channels = [thx_color__$Rgbx_Rgbx_$Impl_$.get_red(this1),thx_color__$Rgbx_Rgbx_$Impl_$.get_green(this1),newblue < 0?0:newblue > 1?1:newblue];
	return channels;
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Rgbx_Rgbx_$Impl_$.toXyz(this1));
};
thx_color__$Rgbx_Rgbx_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Rgbx_Rgbx_$Impl_$.toCieLab(this1));
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
thx_color__$Rgbx_Rgbx_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgb_Rgb_$Impl_$.createf(this1[0],this1[1],this1[2]);
};
thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.withAlpha(this1,1.0);
};
thx_color__$Rgbx_Rgbx_$Impl_$.toXyz = function(this1) {
	var r = this1[0];
	var g = this1[1];
	var b = this1[2];
	r = 100 * (r > 0.04045?Math.pow((r + 0.055) / 1.055,2.4):r / 12.92);
	g = 100 * (g > 0.04045?Math.pow((g + 0.055) / 1.055,2.4):g / 12.92);
	b = 100 * (b > 0.04045?Math.pow((b + 0.055) / 1.055,2.4):b / 12.92);
	return [r * 0.4124 + g * 0.3576 + b * 0.1805,r * 0.2126 + g * 0.7152 + b * 0.0722,r * 0.0193 + g * 0.1192 + b * 0.9505];
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
var thx_color__$Rgbxa_Rgbxa_$Impl_$ = {};
thx_color__$Rgbxa_Rgbxa_$Impl_$.__name__ = true;
thx_color__$Rgbxa_Rgbxa_$Impl_$.create = function(red,green,blue,alpha) {
	return [red < 0?0:red > 1?1:red,green < 0?0:green > 1?1:green,blue < 0?0:blue > 1?1:blue,alpha < 0?0:alpha > 1?1:alpha];
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,4);
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.create(arr[0],arr[1],arr[2],arr[3]);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.fromInts = function(arr) {
	thx_ArrayInts.resize(arr,4);
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.create(arr[0] / 255,arr[1] / 255,arr[2] / 255,arr[3] / 255);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseHex(color);
	if(null == info) info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "rgb":
			return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Rgbx_Rgbx_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,3)));
		case "rgba":
			return thx_color__$Rgbxa_Rgbxa_$Impl_$.fromFloats(thx_color_parse_ColorParser.getFloatChannels(info.channels,4));
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
thx_color__$Rgbxa_Rgbxa_$Impl_$.withAlpha = function(this1,newalpha) {
	var channels = [thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),newalpha < 0?0:newalpha > 1?1:newalpha];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.withRed = function(this1,newred) {
	var channels = [newred < 0?0:newred > 1?1:newred,thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.withGreen = function(this1,newgreen) {
	var channels = [thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),newgreen < 0?0:newgreen > 1?1:newgreen,thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.withBlue = function(this1,newblue) {
	var channels = [thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),newblue < 0?0:newblue > 1?1:newblue,thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1)];
	return channels;
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toCss3 = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toString(this1);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toString = function(this1) {
	return "rgba(" + thx_Floats.roundTo(this1[0] * 100,6) + "%," + thx_Floats.roundTo(this1[1] * 100,6) + "%," + thx_Floats.roundTo(this1[2] * 100,6) + "%," + thx_Floats.roundTo(this1[3],6) + ")";
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.toHex = function(this1,prefix) {
	if(prefix == null) prefix = "#";
	return "" + prefix + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_alpha(this1),2) + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_red(this1),2) + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_green(this1),2) + StringTools.hex(thx_color__$Rgbxa_Rgbxa_$Impl_$.get_blue(this1),2);
};
thx_color__$Rgbxa_Rgbxa_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10 && Math.abs(this1[3] - other[3]) <= 10e-10;
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
var thx_color__$Xyz_Xyz_$Impl_$ = {};
thx_color__$Xyz_Xyz_$Impl_$.__name__ = true;
thx_color__$Xyz_Xyz_$Impl_$.create = function(x,y,z) {
	return [x,y,z];
};
thx_color__$Xyz_Xyz_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$Xyz_Xyz_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$Xyz_Xyz_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "ciexyz":case "xyz":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3);
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
	return "Xyz(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1],6) + "," + thx_Floats.roundTo(this1[2],6) + ")";
};
thx_color__$Xyz_Xyz_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$Xyz_Xyz_$Impl_$.toCieLab = function(this1) {
	var x = this1[0] * 0.0105211106;
	var y = this1[1] * 0.01;
	var z = this1[2] * 0.00918417016;
	var p;
	if(x > 0.008856) x = Math.pow(x,0.33333333333333331); else x = 7.787 * x + 0.13793103448275862;
	if(y > 0.008856) y = Math.pow(y,0.33333333333333331); else y = 7.787 * y + 0.13793103448275862;
	if(z > 0.008856) z = Math.pow(z,0.33333333333333331); else z = 7.787 * z + 0.13793103448275862;
	return y > 0.008856?[116 * y - 16,500 * (x - y),200 * (y - z)]:[903.3 * y,500 * (x - y),200 * (y - z)];
};
thx_color__$Xyz_Xyz_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Xyz_Xyz_$Impl_$.toCieLab(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
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
thx_color__$Xyz_Xyz_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Xyz_Xyz_$Impl_$.toRgbx(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Xyz_Xyz_$Impl_$.toRgbxa(this1));
};
thx_color__$Xyz_Xyz_$Impl_$.toRgbx = function(this1) {
	var x = this1[0] / 100;
	var y = this1[1] / 100;
	var z = this1[2] / 100;
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
var thx_color__$Yxy_Yxy_$Impl_$ = {};
thx_color__$Yxy_Yxy_$Impl_$.__name__ = true;
thx_color__$Yxy_Yxy_$Impl_$.create = function(y1,x,y2) {
	return [y1,x,y2];
};
thx_color__$Yxy_Yxy_$Impl_$.fromFloats = function(arr) {
	thx_ArrayFloats.resize(arr,3);
	return thx_color__$Yxy_Yxy_$Impl_$.create(arr[0],arr[1],arr[2]);
};
thx_color__$Yxy_Yxy_$Impl_$.fromString = function(color) {
	var info = thx_color_parse_ColorParser.parseColor(color);
	if(null == info) return null;
	try {
		var _g = info.name;
		switch(_g) {
		case "yxy":
			var channels = thx_color_parse_ColorParser.getFloatChannels(info.channels,3);
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
	return "Yxy(" + thx_Floats.roundTo(this1[0],6) + "," + thx_Floats.roundTo(this1[1],6) + "," + thx_Floats.roundTo(this1[2],6) + ")";
};
thx_color__$Yxy_Yxy_$Impl_$.equals = function(this1,other) {
	return Math.abs(this1[0] - other[0]) <= 10e-10 && Math.abs(this1[1] - other[1]) <= 10e-10 && Math.abs(this1[2] - other[2]) <= 10e-10;
};
thx_color__$Yxy_Yxy_$Impl_$.toCieLab = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toCieLab(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCieLCh = function(this1) {
	return thx_color__$CieLab_CieLab_$Impl_$.toCieLCh(thx_color__$Yxy_Yxy_$Impl_$.toCieLab(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCmy = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmy(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toCmyk = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toCmyk(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toGrey = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toGrey(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toHsl = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsl(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toHsv = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toHsv(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgb = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgb(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgba = function(this1) {
	return thx_color__$Rgbxa_Rgbxa_$Impl_$.toRgba(thx_color__$Yxy_Yxy_$Impl_$.toRgbxa(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgbx = function(this1) {
	return thx_color__$Xyz_Xyz_$Impl_$.toRgbx(thx_color__$Yxy_Yxy_$Impl_$.toXyz(this1));
};
thx_color__$Yxy_Yxy_$Impl_$.toRgbxa = function(this1) {
	return thx_color__$Rgbx_Rgbx_$Impl_$.toRgbxa(thx_color__$Yxy_Yxy_$Impl_$.toRgbx(this1));
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
	this.pattern_channel = new EReg("^\\s*(\\d*.\\d+|\\d+)(%|deg|rad)?\\s*$","i");
};
thx_color_parse_ColorParser.__name__ = true;
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
	if(useInt8 == null) useInt8 = true;
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
	processHex: function(s) {
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
thx_color_parse_ColorInfo.__name__ = true;
thx_color_parse_ColorInfo.prototype = {
	toString: function() {
		return "" + this.name + ", channels: " + Std.string(this.channels);
	}
	,__class__: thx_color_parse_ColorInfo
};
var thx_color_parse_ChannelInfo = { __ename__ : true, __constructs__ : ["CIPercent","CIFloat","CIDegree","CIInt8","CIInt","CIBool"] };
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
thx_error_ErrorWrapper.__name__ = true;
thx_error_ErrorWrapper.__super__ = thx_Error;
thx_error_ErrorWrapper.prototype = $extend(thx_Error.prototype,{
	__class__: thx_error_ErrorWrapper
});
var thx_error_NullArgument = function(message,posInfo) {
	thx_Error.call(this,message,null,posInfo);
};
thx_error_NullArgument.__name__ = true;
thx_error_NullArgument.__super__ = thx_Error;
thx_error_NullArgument.prototype = $extend(thx_Error.prototype,{
	__class__: thx_error_NullArgument
});
var thx_math_random_PseudoRandom = function(seed) {
	if(seed == null) seed = 1;
	this.seed = seed;
};
thx_math_random_PseudoRandom.__name__ = true;
thx_math_random_PseudoRandom.prototype = {
	'int': function() {
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
String.__name__ = true;
Array.__name__ = true;
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
thx_color__$Grey_Grey_$Impl_$.black = 0;
thx_color__$Grey_Grey_$Impl_$.white = 1;
thx_color_parse_ColorParser.parser = new thx_color_parse_ColorParser();
thx_color_parse_ColorParser.isPureHex = new EReg("^([0-9a-f]{2}){3,4}$","i");
Main.main();
})(typeof console != "undefined" ? console : {log:function(){}});

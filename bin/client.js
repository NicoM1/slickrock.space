(function (console) { "use strict";
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
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
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
var Lambda = function() { };
Lambda.exists = function(it,f) {
	var $it0 = it.iterator();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(f(x)) return true;
	}
	return false;
};
var List = function() {
	this.length = 0;
};
List.prototype = {
	iterator: function() {
		return new _$List_ListIterator(this.h);
	}
};
var _$List_ListIterator = function(head) {
	this.head = head;
	this.val = null;
};
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
	this.boldBB = new EReg("(?:\\[b\\]|\\*)(.*?)(?:\\[/b\\]|\\*)","i");
	this.italicBB = new EReg("(?:\\[i\\]|\\*\\*)(.*?)(?:\\[/i\\]|\\*\\*)","i");
	this.imgBB = new EReg("(?:\\[img\\]|#)(.*?)(?:\\[/img\\]|#)","i");
	this.requestInProgress = false;
	this.lastUserID = -2;
	this.lastIndex = -1;
	this.basePath = "https://aqueous-basin-8995.herokuapp.com/";
	var _g = this;
	this.http = new haxe_Http(this.basePath + this.lastIndex);
	this.http.async = true;
	this.http.onData = $bind(this,this._parseMessages);
	this.http.onError = function(error) {
		console.log(error);
		_g.requestInProgress = false;
	};
	var userHttp = new haxe_Http(this.basePath + "api/getuser/");
	userHttp.onData = function(data) {
		_g.id = Std.parseInt(data);
		console.log(_g.id);
	};
	userHttp.onError = function(error1) {
		_g.id = -1;
		console.log(_g.id);
	};
	userHttp.request(true);
	window.onload = $bind(this,this._windowLoaded);
	this._loop();
};
Main.main = function() {
	new Main();
};
Main.prototype = {
	_windowLoaded: function() {
		this.chatbox = window.document.getElementById("chatbox");
		this.messages = window.document.getElementById("messages");
		this.chatbox.onkeypress = $bind(this,this._checkKeyPress);
	}
	,_checkKeyPress: function(e) {
		var code;
		if(e.keyCode != null) code = e.keyCode; else code = e.which;
		if(code == 13) {
			this.http.url = this.basePath + "chat/" + encodeURIComponent(this.chatbox.value) + "/" + this.id;
			this.http.request(true);
			this._update();
			this.chatbox.value = "";
		}
	}
	,_loop: function() {
		var _g = this;
		haxe_Timer.delay(function() {
			_g._update();
			_g._loop();
		},1000);
	}
	,_update: function() {
		if(this.requestInProgress) return;
		this.http.url = this.basePath + "api/" + this.lastIndex;
		this.requestInProgress = true;
		this.http.request(true);
	}
	,_parseMessages: function(data) {
		this.requestInProgress = false;
		var parsed = JSON.parse(data);
		var _g = 0;
		var _g1 = parsed.messages.messages;
		while(_g < _g1.length) {
			var p = _g1[_g];
			++_g;
			var bbParsed = this._parseMessage(p.text);
			var message;
			var _this = window.document;
			message = _this.createElement("div");
			message.innerHTML = bbParsed;
			var differentUser = false;
			if(p.id == -1 || p.id != this.lastUserID) differentUser = true;
			this.messages.appendChild(this._makeSpan(differentUser));
			this.messages.appendChild(message);
			window.scrollTo(0,window.document.body.scrollHeight);
			this.lastUserID = p.id;
		}
		this.lastIndex = parsed.lastID;
	}
	,_makeSpan: function(pointer) {
		if(pointer == null) pointer = false;
		var span;
		var _this = window.document;
		span = _this.createElement("span");
		if(pointer) span.innerHTML = ">";
		span.innerHTML += "\t";
		return span;
	}
	,_parseMessage: function(raw) {
		var parsed = StringTools.replace(raw,"\n"," ");
		parsed = StringTools.htmlEscape(parsed);
		while(this.imgBB.match(parsed)) {
			var imgPath = this.imgBB.matched(1);
			var imgTag = "<img src=" + imgPath + "></img>";
			parsed = this.imgBB.replace(parsed,imgTag);
		}
		while(this.italicBB.match(parsed)) {
			var text = this.italicBB.matched(1);
			var emTag = "<em>" + text + "</em>";
			parsed = this.italicBB.replace(parsed,emTag);
		}
		while(this.boldBB.match(parsed)) {
			var text1 = this.boldBB.matched(1);
			var strongTag = "<strong>" + text1 + "</strong>";
			parsed = this.boldBB.replace(parsed,strongTag);
		}
		return parsed;
	}
};
var Std = function() { };
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
var StringTools = function() { };
StringTools.htmlEscape = function(s,quotes) {
	s = s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
	if(quotes) return s.split("\"").join("&quot;").split("'").join("&#039;"); else return s;
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
var haxe_Http = function(url) {
	this.url = url;
	this.headers = new List();
	this.params = new List();
	this.async = true;
};
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
var haxe_Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
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
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Browser = function() { };
js_Browser.createXMLHttpRequest = function() {
	if(typeof XMLHttpRequest != "undefined") return new XMLHttpRequest();
	if(typeof ActiveXObject != "undefined") return new ActiveXObject("Microsoft.XMLHTTP");
	throw new js__$Boot_HaxeError("Unable to create XMLHttpRequest object.");
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
Main.main();
})(typeof console != "undefined" ? console : {log:function(){}});

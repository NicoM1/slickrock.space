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
HxOverrides.strDate = function(s) {
	var _g = s.length;
	switch(_g) {
	case 8:
		var k = s.split(":");
		var d = new Date();
		d.setTime(0);
		d.setUTCHours(k[0]);
		d.setUTCMinutes(k[1]);
		d.setUTCSeconds(k[2]);
		return d;
	case 10:
		var k1 = s.split("-");
		return new Date(k1[0],k1[1] - 1,k1[2],0,0,0);
	case 19:
		var k2 = s.split(" ");
		var y = k2[0].split("-");
		var t = k2[1].split(":");
		return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
	default:
		throw new js__$Boot_HaxeError("Invalid date format : " + s);
	}
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
var Main = function() {
	this.mongoUrl = "";
	Main.animalWords = js_node_Fs.readFileSync("bin/animals.txt",{ encoding : "utf8"}).split("\n");
	Main.adjectives = js_node_Fs.readFileSync("bin/adjectives.txt",{ encoding : "utf8"}).split("\n");
	this._setupMongo();
	Main.rooms = new haxe_ds_StringMap();
	Main.typingTimers = new haxe_ds_StringMap();
	Main.tokens = new haxe_ds_StringMap();
	var app = new abe_App();
	(function(instance,parent) {
		var router = parent.mount("/");
		var filters = new abe_core_ArgumentsFilter();
		var processor = new abe_core_ArgumentProcessor(filters,[]);
		var $process = new RouteHandler_$index_$RouteProcess({ },instance,processor);
		var uses = [];
		router.registerMethod("/","get",$process,uses,[]);
		var filters1 = new abe_core_ArgumentsFilter();
		var processor1 = new abe_core_ArgumentProcessor(filters1,[{ name : "room", optional : false, type : "String", sources : ["params"]}]);
		var process1 = new RouteHandler_$chatroom_$RouteProcess({ room : null},instance,processor1);
		var uses1 = [];
		router.registerMethod("/:room","get",process1,uses1,[]);
		var filters2 = new abe_core_ArgumentsFilter();
		var processor2 = new abe_core_ArgumentProcessor(filters2,[{ name : "message", optional : false, type : "String", sources : ["params"]},{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "id", optional : false, type : "String", sources : ["params"]},{ name : "privateID", optional : false, type : "String", sources : ["params"]},{ name : "token", optional : false, type : "String", sources : ["params"]}]);
		var process2 = new RouteHandler_$sendMessage_$RouteProcess({ message : null, room : null, id : null, privateID : null, token : null},instance,processor2);
		var uses2 = [];
		router.registerMethod("/chat/:message/:room/:id/:privateID/:token","post",process2,uses2,[]);
		var filters3 = new abe_core_ArgumentsFilter();
		var processor3 = new abe_core_ArgumentProcessor(filters3,[{ name : "message", optional : false, type : "String", sources : ["params"]},{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "password", optional : false, type : "String", sources : ["params"]},{ name : "id", optional : false, type : "String", sources : ["params"]},{ name : "privateID", optional : false, type : "String", sources : ["params"]},{ name : "token", optional : false, type : "String", sources : ["params"]}]);
		var process3 = new RouteHandler_$sendMessageWithPass_$RouteProcess({ message : null, room : null, password : null, id : null, privateID : null, token : null},instance,processor3);
		var uses3 = [];
		router.registerMethod("/chat/:message/:room/:password/:id/:privateID/:token","post",process3,uses3,[]);
		var filters4 = new abe_core_ArgumentsFilter();
		var processor4 = new abe_core_ArgumentProcessor(filters4,[]);
		var process4 = new RouteHandler_$getID_$RouteProcess({ },instance,processor4);
		var uses4 = [];
		router.registerMethod("/api/getID","post",process4,uses4,[]);
		var filters5 = new abe_core_ArgumentsFilter();
		var processor5 = new abe_core_ArgumentProcessor(filters5,[{ name : "privateID", optional : false, type : "String", sources : ["params"]}]);
		var process5 = new RouteHandler_$getToken_$RouteProcess({ privateID : null},instance,processor5);
		var uses5 = [];
		router.registerMethod("/api/gettoken/:privateID","post",process5,uses5,[]);
		var filters6 = new abe_core_ArgumentsFilter();
		var processor6 = new abe_core_ArgumentProcessor(filters6,[{ name : "privateID", optional : false, type : "String", sources : ["params"]},{ name : "token", optional : false, type : "String", sources : ["params"]}]);
		var process6 = new RouteHandler_$checkValid_$RouteProcess({ privateID : null, token : null},instance,processor6);
		var uses6 = [];
		router.registerMethod("/api/checkvalid/:privateID/:token","post",process6,uses6,[]);
		var filters7 = new abe_core_ArgumentsFilter();
		var processor7 = new abe_core_ArgumentProcessor(filters7,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "id", optional : false, type : "String", sources : ["params"]}]);
		var process7 = new RouteHandler_$typing_$RouteProcess({ room : null, id : null},instance,processor7);
		var uses7 = [];
		router.registerMethod("/api/typing/:room/:id","get",process7,uses7,[]);
		var filters8 = new abe_core_ArgumentsFilter();
		var processor8 = new abe_core_ArgumentProcessor(filters8,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "id", optional : false, type : "String", sources : ["params"]}]);
		var process8 = new RouteHandler_$typing_$RouteProcess({ room : null, id : null},instance,processor8);
		var uses8 = [];
		router.registerMethod("/api/typing/:room/:id","post",process8,uses8,[]);
		var filters9 = new abe_core_ArgumentsFilter();
		var processor9 = new abe_core_ArgumentProcessor(filters9,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "privateID", optional : false, type : "String", sources : ["params"]},{ name : "password", optional : false, type : "String", sources : ["params"]},{ name : "privatePass", optional : false, type : "String", sources : ["params"]}]);
		var process9 = new RouteHandler_$lockRoom_$RouteProcess({ room : null, privateID : null, password : null, privatePass : null},instance,processor9);
		var uses9 = [];
		router.registerMethod("/api/lock/:room/:privateID/:password/:privatePass","post",process9,uses9,[]);
		var filters10 = new abe_core_ArgumentsFilter();
		var processor10 = new abe_core_ArgumentProcessor(filters10,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "privateID", optional : false, type : "String", sources : ["params"]},{ name : "privatePass", optional : false, type : "String", sources : ["params"]}]);
		var process10 = new RouteHandler_$unlockRoom_$RouteProcess({ room : null, privateID : null, privatePass : null},instance,processor10);
		var uses10 = [];
		router.registerMethod("/api/unlock/:room/:privateID/:privatePass","post",process10,uses10,[]);
		var filters11 = new abe_core_ArgumentsFilter();
		var processor11 = new abe_core_ArgumentProcessor(filters11,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "privateID", optional : false, type : "String", sources : ["params"]},{ name : "privatePass", optional : false, type : "String", sources : ["params"]}]);
		var process11 = new RouteHandler_$claimRoom_$RouteProcess({ room : null, privateID : null, privatePass : null},instance,processor11);
		var uses11 = [];
		router.registerMethod("/api/claim/:room/:privateID/:privatePass","post",process11,uses11,[]);
		var filters12 = new abe_core_ArgumentsFilter();
		var processor12 = new abe_core_ArgumentProcessor(filters12,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "lastID", optional : false, type : "Int", sources : ["params"]}]);
		var process12 = new RouteHandler_$getMessages_$RouteProcess({ room : null, lastID : null},instance,processor12);
		var uses12 = [];
		router.registerMethod("/api/:room/:lastID","get",process12,uses12,[]);
		var filters13 = new abe_core_ArgumentsFilter();
		var processor13 = new abe_core_ArgumentProcessor(filters13,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "lastID", optional : false, type : "Int", sources : ["params"]}]);
		var process13 = new RouteHandler_$getMessages_$RouteProcess({ room : null, lastID : null},instance,processor13);
		var uses13 = [];
		router.registerMethod("/api/:room/:lastID","post",process13,uses13,[]);
		var filters14 = new abe_core_ArgumentsFilter();
		var processor14 = new abe_core_ArgumentProcessor(filters14,[{ name : "room", optional : false, type : "String", sources : ["params"]},{ name : "password", optional : false, type : "String", sources : ["params"]},{ name : "lastID", optional : false, type : "Int", sources : ["params"]}]);
		var process14 = new RouteHandler_$getMessagesWithPass_$RouteProcess({ room : null, password : null, lastID : null},instance,processor14);
		var uses14 = [];
		router.registerMethod("/api/:room/:password/:lastID","post",process14,uses14,[]);
		return router;
	})(new RouteHandler(),app.router);
	var port;
	var this1 = process.env;
	port = this1.PORT;
	app.http(port != null?Std.parseInt(port):9998);
	app.router.serve("/bin","./bin");
};
Main.__name__ = ["Main"];
Main.clearTyping = function(room,id) {
	if(Main.typingTimers.get(room) == null) {
		var v = new haxe_ds_StringMap();
		Main.typingTimers.set(room,v);
		v;
	}
	if((function($this) {
		var $r;
		var this1 = Main.typingTimers.get(room);
		$r = this1.get(id);
		return $r;
	}(this)) == null) {
		var timer = new haxe_Timer(10000);
		timer.run = (function(f,a1,id1) {
			return function() {
				f(a1,id1);
			};
		})(Main.emptyTyping,room,id);
		var this2 = Main.typingTimers.get(room);
		this2.set(id,timer);
		timer;
	} else Main.resetTypingTimer(room,id);
};
Main.resetTypingTimer = function(room,id) {
	if(Main.typingTimers.get(room) == null) {
		var v = new haxe_ds_StringMap();
		Main.typingTimers.set(room,v);
		v;
	}
	((function($this) {
		var $r;
		var this1 = Main.typingTimers.get(room);
		$r = this1.get(id);
		return $r;
	}(this))).run = (function(f,a1,id1) {
		return function() {
			f(a1,id1);
		};
	})(Main.emptyTyping,room,id);
};
Main.emptyTyping = function(room,id) {
	var _this = Main.rooms.get(room).typing;
	HxOverrides.remove(_this,id);
};
Main._parseMessages = function() {
	Main.mongodb.collection("roominfo").find().toArray(function(e,r) {
		if(e != null) {
			console.log(e);
			return;
		}
		var roominfo = r;
		var _g = 0;
		while(_g < roominfo.length) {
			var r1 = roominfo[_g];
			++_g;
			if(!Main.rooms.exists(r1._id)) {
				var value = { messages : [], lock : null, pw : null, typing : []};
				Main.rooms.set(r1._id,value);
			}
			Main.rooms.get(r1._id).lock = r1.lock;
			Main.rooms.get(r1._id).pw = r1.pw;
			Main.rooms.get(r1._id).salt = r1.salt;
		}
	});
	Main.mongodb.collection("messages").find().sort({ _id : 1}).toArray(function(e1,r2) {
		if(e1 != null) {
			console.log(e1);
			return;
		}
		var messages = r2;
		var _g1 = 0;
		while(_g1 < messages.length) {
			var m = messages[_g1];
			++_g1;
			if(!Main.rooms.exists(m.room)) {
				var value1 = { messages : [], lock : null, pw : null, typing : []};
				Main.rooms.set(m.room,value1);
			}
			Main.rooms.get(m.room).messages.push({ text : m.text, id : m.id});
		}
	});
	Main.mongodb.collection("tokens").find().toArray(function(e2,r3) {
		if(e2 != null) {
			console.log(e2);
			return;
		}
		var tokenos = r3;
		var _g2 = 0;
		while(_g2 < tokenos.length) {
			var t = tokenos[_g2];
			++_g2;
			var v = t.token;
			Main.tokens.set(t._id,v);
			v;
		}
	});
};
Main.saveMessage = function(msg) {
	if(Main.mongodb != null) Main.mongodb.collection("messages").insertOne(msg,function(e,r) {
		if(e != null) console.log(e);
	}); else console.log("mongo null");
};
Main.roomInfo = function(roomInfo) {
	Main.mongodb.collection("roominfo").save(roomInfo);
};
Main.saveToken = function(token) {
	Main.mongodb.collection("tokens").save(token);
};
Main.getUserID = function() {
	var rand = new Random(new Date().getTime());
	var ID = "";
	ID += Main.adjectives[rand["int"](Main.adjectives.length,null)];
	var second = Main.adjectives[rand["int"](Main.adjectives.length,null)];
	second = second.charAt(0).toUpperCase() + HxOverrides.substr(second,1,null);
	ID += second;
	var third = Main.animalWords[rand["int"](Main.animalWords.length,null)];
	third = third.charAt(0).toUpperCase() + HxOverrides.substr(third,1,null);
	ID += third;
	return ID;
};
Main.main = function() {
	new Main();
};
Main.prototype = {
	MongoClient: null
	,mongoUrl: null
	,_setupMongo: function() {
		this.MongoClient = require("mongodb").MongoClient;
		var this1 = process.env;
		this.mongoUrl = this1.MONGOLAB_URL;
		this.MongoClient.connect(this.mongoUrl,function(err,db) {
			if(err != null) console.log(err);
			Main.mongodb = db;
			Main._parseMessages();
		});
	}
	,_test: function(room,id,message) {
		if(!Main.rooms.exists(room)) {
			var value = { messages : [], lock : null, pw : null, typing : []};
			Main.rooms.set(room,value);
		}
		Main.emptyTyping(room,id);
		Main.rooms.get(room).messages.push({ text : message, id : id});
		Main.saveMessage({ text : message, id : id, room : room});
	}
	,__class__: Main
};
var abe_IRoute = function() { };
abe_IRoute.__name__ = ["abe","IRoute"];
var RouteHandler = function() {
	this.letters = "abcdefghijklmnopqrstuvwxyz";
	this.alphanumeric = "0123456789abcdefghijklmnopqrstuvwxyz";
};
RouteHandler.__name__ = ["RouteHandler"];
RouteHandler.__interfaces__ = [abe_IRoute];
RouteHandler.prototype = {
	index: function(request,response,next) {
		this._serveHtml("bin/index.html",function(e,d) {
			if(e == null) {
				var withRoom = "";
				var startBody = d.indexOf("head") + 6;
				withRoom = d.substring(0,startBody) + "\n\t<script>var room = \"base\"</script>\n" + HxOverrides.substr(d,startBody + 1,null);
				response.setHeader("Access-Control-Allow-Origin","*");
				response.send(withRoom);
			}
		});
	}
	,chatroom: function(room,request,response,next) {
		room = room.toLowerCase();
		this._serveHtml("bin/index.html",function(e,d) {
			if(e == null) {
				var withRoom = "";
				var startBody = d.indexOf("head") + 6;
				withRoom = d.substring(0,startBody) + ("\n\t<script>var room = \"" + room + "\"</script>\n") + HxOverrides.substr(d,startBody + 1,null);
				response.setHeader("Access-Control-Allow-Origin","*");
				response.send(withRoom);
			}
		});
	}
	,sendMessage: function(message,room,id,privateID,token,request,response,next) {
		room = room.toLowerCase();
		this._sendMessage(response,message,room,null,id,privateID,token);
	}
	,sendMessageWithPass: function(message,room,password,id,privateID,token,request,response,next) {
		room = room.toLowerCase();
		this._sendMessage(response,message,room,password,id,privateID,token);
	}
	,_sendMessage: function(response,message,room,password,id,privateID,token) {
		if(Main.tokens.get(privateID) == token) {
			if(!Main.rooms.exists(room)) {
				var value = { messages : [], lock : null, pw : null, typing : []};
				Main.rooms.set(room,value);
			}
			Main.emptyTyping(room,id);
			var roomE = Main.rooms.get(room);
			if(roomE.lock == null || roomE.lock == haxe_crypto_Sha1.encode(roomE.salt + password)) {
				Main.rooms.get(room).messages.push({ text : message, id : id});
				Main.saveMessage({ text : message, id : id, room : room});
			}
			response.setHeader("Access-Control-Allow-Origin","*");
			response.send("success");
			return;
		}
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send("failed");
	}
	,getID: function(request,response,next) {
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send(Main.getUserID());
	}
	,alphanumeric: null
	,getToken: function(privateID,request,response,next) {
		var rand = new Random(new Date().getTime());
		var token = "";
		while(token.length <= 6) token += this.alphanumeric.charAt(rand["int"](this.alphanumeric.length,null));
		{
			Main.tokens.set(privateID,token);
			token;
		}
		Main.saveToken({ _id : privateID, token : token});
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send(token);
	}
	,checkValid: function(privateID,token,request,response,next) {
		var value = "invalid";
		if(Main.tokens.get(privateID) == token) value = "valid";
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send(value);
	}
	,typing: function(room,id,request,response,next) {
		if((function($this) {
			var $r;
			var _this = Main.rooms.get(room).typing;
			$r = HxOverrides.indexOf(_this,id,0);
			return $r;
		}(this)) == -1) {
			Main.rooms.get(room).typing.push(id);
			Main.clearTyping(room,id);
		} else Main.resetTypingTimer(room,id);
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send("needs a response");
	}
	,lockRoom: function(room,privateID,password,privatePass,request,response,next) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if(roomE.pw == null) {
			response.setHeader("Access-Control-Allow-Origin","*");
			response.send("unclaimed");
			return;
		} else if(roomE.pw == haxe_crypto_Sha1.encode(roomE.salt + privatePass)) {
			roomE.salt = this.getSalt();
			roomE.lock = haxe_crypto_Sha1.encode(roomE.salt + password);
			Main.roomInfo({ _id : room, lock : roomE.lock, pw : roomE.pw, salt : roomE.salt});
			response.setHeader("Access-Control-Allow-Origin","*");
			response.send("locked");
			return;
		}
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send("failed");
	}
	,letters: null
	,getSalt: function() {
		var rand = new Random(new Date().getTime());
		return this.letters.charAt(rand["int"](this.letters.length,null)) + this.letters.charAt(rand["int"](this.letters.length,null));
	}
	,unlockRoom: function(room,privateID,privatePass,request,response,next) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if(roomE.lock != null) {
			if(roomE.pw == haxe_crypto_Sha1.encode(roomE.salt + privatePass)) {
				roomE.lock = null;
				Main.roomInfo({ _id : room, lock : null, pw : roomE.pw, salt : roomE.salt});
				response.setHeader("Access-Control-Allow-Origin","*");
				response.send("unlocked");
				return;
			}
		} else {
			response.setHeader("Access-Control-Allow-Origin","*");
			response.send("unlocked");
			return;
		}
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send("failed");
	}
	,claimRoom: function(room,privateID,privatePass,request,response,next) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if(roomE.pw == null && roomE.messages.length == 0) {
			roomE.salt = this.getSalt();
			roomE.pw = haxe_crypto_Sha1.encode(roomE.salt + privatePass);
			Main.roomInfo({ _id : room, pw : roomE.pw, salt : roomE.salt});
			response.setHeader("Access-Control-Allow-Origin","*");
			response.send("claimed");
			return;
		}
		response.setHeader("Access-Control-Allow-Origin","*");
		response.send("failed");
	}
	,getMessages: function(room,lastID,request,response,next) {
		room = room.toLowerCase();
		this._getMessages(response,room,null,lastID);
	}
	,getMessagesWithPass: function(room,password,lastID,request,response,next) {
		room = room.toLowerCase();
		this._getMessages(response,room,password,lastID);
	}
	,_getMessages: function(response,room,password,lastID) {
		if(!Main.rooms.exists(room)) {
			var value = { messages : [], lock : null, pw : null, typing : []};
			Main.rooms.set(room,value);
		}
		var roomE = Main.rooms.get(room);
		if(roomE.lock == null || roomE.lock == haxe_crypto_Sha1.encode(roomE.salt + password)) {
			var messages = { messages : { messages : [], lock : null, pw : null, typing : Main.rooms.get(room).typing}, lastID : Main.rooms.get(room).messages.length - 1};
			if(lastID < Main.rooms.get(room).messages.length - 1) {
				var _g1 = lastID + 1;
				var _g = Main.rooms.get(room).messages.length;
				while(_g1 < _g) {
					var i = _g1++;
					messages.messages.messages.push(Main.rooms.get(room).messages[i]);
				}
			}
			response.setHeader("Access-Control-Allow-Origin","*");
			response.setHeader("Content-Type","application/json");
			response.send(messages);
		} else {
			response.setHeader("Access-Control-Allow-Origin","*");
			if(password != null) response.send("password"); else response.send("locked");
		}
	}
	,_serveHtml: function(path,handler) {
		js_node_Fs.readFile(path,{ encoding : "utf8"},handler);
	}
	,toString: function() {
		return "RouteHandler";
	}
	,__class__: RouteHandler
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
var abe_core_RouteProcess = function(args,instance,argumentProcessor) {
	this.instance = instance;
	this.argumentProcessor = argumentProcessor;
	this.args = args;
};
abe_core_RouteProcess.__name__ = ["abe","core","RouteProcess"];
abe_core_RouteProcess.prototype = {
	instance: null
	,argumentProcessor: null
	,args: null
	,run: function(req,res,next) {
		var _g = this;
		this.argumentProcessor.processArguments(req,this.args).then(function(result) {
			switch(result[1]) {
			case 0:
				_g.execute(req,res,next);
				break;
			case 2:case 1:
				next();
				break;
			}
		});
	}
	,execute: function(req,res,next) {
		throw new js__$Boot_HaxeError("RouteProcess.execute() must be overwritten");
	}
	,__class__: abe_core_RouteProcess
};
var RouteHandler_$chatroom_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$chatroom_$RouteProcess.__name__ = ["RouteHandler_chatroom_RouteProcess"];
RouteHandler_$chatroom_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$chatroom_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.chatroom(this.args.room,request,response,next);
	}
	,__class__: RouteHandler_$chatroom_$RouteProcess
});
var RouteHandler_$checkValid_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$checkValid_$RouteProcess.__name__ = ["RouteHandler_checkValid_RouteProcess"];
RouteHandler_$checkValid_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$checkValid_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.checkValid(this.args.privateID,this.args.token,request,response,next);
	}
	,__class__: RouteHandler_$checkValid_$RouteProcess
});
var RouteHandler_$claimRoom_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$claimRoom_$RouteProcess.__name__ = ["RouteHandler_claimRoom_RouteProcess"];
RouteHandler_$claimRoom_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$claimRoom_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.claimRoom(this.args.room,this.args.privateID,this.args.privatePass,request,response,next);
	}
	,__class__: RouteHandler_$claimRoom_$RouteProcess
});
var RouteHandler_$getID_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$getID_$RouteProcess.__name__ = ["RouteHandler_getID_RouteProcess"];
RouteHandler_$getID_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$getID_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.getID(request,response,next);
	}
	,__class__: RouteHandler_$getID_$RouteProcess
});
var RouteHandler_$getMessagesWithPass_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$getMessagesWithPass_$RouteProcess.__name__ = ["RouteHandler_getMessagesWithPass_RouteProcess"];
RouteHandler_$getMessagesWithPass_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$getMessagesWithPass_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.getMessagesWithPass(this.args.room,this.args.password,this.args.lastID,request,response,next);
	}
	,__class__: RouteHandler_$getMessagesWithPass_$RouteProcess
});
var RouteHandler_$getMessages_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$getMessages_$RouteProcess.__name__ = ["RouteHandler_getMessages_RouteProcess"];
RouteHandler_$getMessages_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$getMessages_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.getMessages(this.args.room,this.args.lastID,request,response,next);
	}
	,__class__: RouteHandler_$getMessages_$RouteProcess
});
var RouteHandler_$getToken_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$getToken_$RouteProcess.__name__ = ["RouteHandler_getToken_RouteProcess"];
RouteHandler_$getToken_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$getToken_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.getToken(this.args.privateID,request,response,next);
	}
	,__class__: RouteHandler_$getToken_$RouteProcess
});
var RouteHandler_$index_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$index_$RouteProcess.__name__ = ["RouteHandler_index_RouteProcess"];
RouteHandler_$index_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$index_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.index(request,response,next);
	}
	,__class__: RouteHandler_$index_$RouteProcess
});
var RouteHandler_$lockRoom_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$lockRoom_$RouteProcess.__name__ = ["RouteHandler_lockRoom_RouteProcess"];
RouteHandler_$lockRoom_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$lockRoom_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.lockRoom(this.args.room,this.args.privateID,this.args.password,this.args.privatePass,request,response,next);
	}
	,__class__: RouteHandler_$lockRoom_$RouteProcess
});
var RouteHandler_$sendMessageWithPass_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$sendMessageWithPass_$RouteProcess.__name__ = ["RouteHandler_sendMessageWithPass_RouteProcess"];
RouteHandler_$sendMessageWithPass_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$sendMessageWithPass_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.sendMessageWithPass(this.args.message,this.args.room,this.args.password,this.args.id,this.args.privateID,this.args.token,request,response,next);
	}
	,__class__: RouteHandler_$sendMessageWithPass_$RouteProcess
});
var RouteHandler_$sendMessage_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$sendMessage_$RouteProcess.__name__ = ["RouteHandler_sendMessage_RouteProcess"];
RouteHandler_$sendMessage_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$sendMessage_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.sendMessage(this.args.message,this.args.room,this.args.id,this.args.privateID,this.args.token,request,response,next);
	}
	,__class__: RouteHandler_$sendMessage_$RouteProcess
});
var RouteHandler_$typing_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$typing_$RouteProcess.__name__ = ["RouteHandler_typing_RouteProcess"];
RouteHandler_$typing_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$typing_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.typing(this.args.room,this.args.id,request,response,next);
	}
	,__class__: RouteHandler_$typing_$RouteProcess
});
var RouteHandler_$unlockRoom_$RouteProcess = function(args,instance,argumentProcessor) {
	abe_core_RouteProcess.call(this,args,instance,argumentProcessor);
};
RouteHandler_$unlockRoom_$RouteProcess.__name__ = ["RouteHandler_unlockRoom_RouteProcess"];
RouteHandler_$unlockRoom_$RouteProcess.__super__ = abe_core_RouteProcess;
RouteHandler_$unlockRoom_$RouteProcess.prototype = $extend(abe_core_RouteProcess.prototype,{
	execute: function(request,response,next) {
		this.instance.unlockRoom(this.args.room,this.args.privateID,this.args.privatePass,request,response,next);
	}
	,__class__: RouteHandler_$unlockRoom_$RouteProcess
});
var Std = function() { };
Std.__name__ = ["Std"];
Std.instance = function(value,c) {
	if((value instanceof c)) return value; else return null;
};
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
var abe_App = function(options) {
	if(null != options) options = options; else options = { };
	this.express = express_Express();
	if(options.strictRoute) this.express.set("strict route",true);
	if(options.caseSensitiveRouting) this.express.set("case sensitive routing",true);
	this.express.set("x-powered-by",false);
	var r = express_Router();
	this.express["use"]("/",r);
	this.router = new abe_Router(r);
};
abe_App.__name__ = ["abe","App"];
abe_App.prototype = {
	router: null
	,express: null
	,sub: function(path) {
		var sub = new abe_App();
		this.express["use"](path,sub.express);
		return sub;
	}
	,http: function(port,host,backlog,callback) {
		var server = js_node_Http.createServer(this.express);
		server.listen(port,host,backlog,callback);
		return server;
	}
	,https: function(port,options,host,backlog,callback) {
		var server = js_node_Https.createServer(options,this.express);
		server.listen(port,host,backlog,callback);
		return server;
	}
	,__class__: abe_App
};
var abe_IFilterArgument = function() { };
abe_IFilterArgument.__name__ = ["abe","IFilterArgument"];
abe_IFilterArgument.prototype = {
	type: null
	,filter: null
	,__class__: abe_IFilterArgument
};
var abe_Router = function(expressRouter) {
	this.expressRouter = expressRouter;
};
abe_Router.__name__ = ["abe","Router"];
abe_Router.prototype = {
	expressRouter: null
	,mount: function(path) {
		var newrouter = express_Router();
		this.expressRouter["use"](path,newrouter);
		return new abe_Router(newrouter);
	}
	,'use': function(path,middleware) {
		if(null == path) this.expressRouter["use"](middleware); else this.expressRouter["use"](path,middleware);
		return this;
	}
	,error: function(middleware) {
		this.expressRouter["use"](middleware);
		return this;
	}
	,registerMethod: function(path,method,process,middlewares,errorMiddlewares) {
		var args = [path];
		if(null != middlewares) args = args.concat(middlewares);
		args.push($bind(process,process.run));
		if(null != errorMiddlewares) args = args.concat(errorMiddlewares);
		Reflect.callMethod(this.expressRouter,Reflect.field(this.expressRouter,method),args);
		return this;
	}
	,serve: function(path,root,options) {
		this.expressRouter["use"](path,express_Express["static"](root,options));
		return this;
	}
	,__class__: abe_Router
};
var abe_core_ArgumentProcessing = { __ename__ : ["abe","core","ArgumentProcessing"], __constructs__ : ["Ok","InvalidFilter","Required"] };
abe_core_ArgumentProcessing.Ok = ["Ok",0];
abe_core_ArgumentProcessing.Ok.toString = $estr;
abe_core_ArgumentProcessing.Ok.__enum__ = abe_core_ArgumentProcessing;
abe_core_ArgumentProcessing.InvalidFilter = function(err) { var $x = ["InvalidFilter",1,err]; $x.__enum__ = abe_core_ArgumentProcessing; $x.toString = $estr; return $x; };
abe_core_ArgumentProcessing.Required = function(parameter) { var $x = ["Required",2,parameter]; $x.__enum__ = abe_core_ArgumentProcessing; $x.toString = $estr; return $x; };
var abe_core_ArgumentProcessor = function(filters,requirements) {
	if(null != filters) this.filters = filters; else this.filters = new abe_core_ArgumentsFilter();
	this.requirements = requirements.map(abe_core_ArgumentProcessor.cleanUpRequirementType);
	this.filters.checkRequirements(requirements);
};
abe_core_ArgumentProcessor.__name__ = ["abe","core","ArgumentProcessor"];
abe_core_ArgumentProcessor.getValue = function(name,source,sources) {
	var o;
	var value;
	var _g = 0;
	while(_g < sources.length) {
		var sourceName = sources[_g];
		++_g;
		var o1;
		switch(sourceName) {
		case "request":
			o1 = source;
			break;
		case "body":
			o1 = source.body;
			break;
		case "params":
			o1 = source.params;
			break;
		case "query":
			o1 = source.query;
			break;
		}
		if(null == o1) continue;
		value = Reflect.field(o1,name);
		if(null != value) return haxe_ds_Option.Some(value);
	}
	return haxe_ds_Option.None;
};
abe_core_ArgumentProcessor.cleanUpRequirementType = function(requirement) {
	var type = requirement.type;
	type = StringTools.replace(type," ","");
	if(StringTools.startsWith(type,"Null<")) type = type.substring(5,type.length - 1);
	requirement.type = type;
	return requirement;
};
abe_core_ArgumentProcessor.prototype = {
	requirements: null
	,filters: null
	,processArguments: function(source,results) {
		var promises = [];
		var _g = 0;
		var _g1 = this.requirements;
		while(_g < _g1.length) {
			var r = [_g1[_g]];
			++_g;
			{
				var _g2 = abe_core_ArgumentProcessor.getValue(r[0].name,source,r[0].sources);
				switch(_g2[1]) {
				case 0:
					var v = _g2[2];
					var future = this.filters.getFilterType(r[0].type).filter(v);
					promises.push(thx_promise__$Promise_Promise_$Impl_$.success(future,(function(r) {
						return function(value) {
							results[r[0].name] = value;
						};
					})(r)));
					break;
				case 1:
					if(r[0].optional) results[r[0].name] = null; else return thx_promise_Future.value(abe_core_ArgumentProcessing.Required(r[0].name));
					break;
				}
			}
		}
		return thx_promise__$Promise_Promise_$Impl_$.mapEither(thx_promise__$Promise_Promise_$Impl_$.all(promises),function(_) {
			return abe_core_ArgumentProcessing.Ok;
		},function(err) {
			return abe_core_ArgumentProcessing.InvalidFilter(err);
		});
	}
	,__class__: abe_core_ArgumentProcessor
};
var abe_core_filters_BoolFilter = function() {
	this.type = "Bool";
};
abe_core_filters_BoolFilter.__name__ = ["abe","core","filters","BoolFilter"];
abe_core_filters_BoolFilter.__interfaces__ = [abe_IFilterArgument];
abe_core_filters_BoolFilter.prototype = {
	type: null
	,filter: function(value) {
		if(typeof(value) == "boolean") return thx_promise__$Promise_Promise_$Impl_$.value(value);
		if(((value | 0) === value)) return thx_promise__$Promise_Promise_$Impl_$.value(value != 0);
		if(!(typeof(value) == "string")) return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not a type that can be converted to a Bool",null,{ fileName : "BoolFilter.hx", lineNumber : 18, className : "abe.core.filters.BoolFilter", methodName : "filter"}));
		if(thx_Bools.canParse(value)) return thx_promise__$Promise_Promise_$Impl_$.value(thx_Bools.parse(value)); else return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not a Boolean value",null,{ fileName : "BoolFilter.hx", lineNumber : 23, className : "abe.core.filters.BoolFilter", methodName : "filter"}));
	}
	,__class__: abe_core_filters_BoolFilter
};
var abe_core_filters_DateFilter = function() {
	this.type = "Date";
};
abe_core_filters_DateFilter.__name__ = ["abe","core","filters","DateFilter"];
abe_core_filters_DateFilter.__interfaces__ = [abe_IFilterArgument];
abe_core_filters_DateFilter.prototype = {
	type: null
	,filter: function(value) {
		if(typeof(value) == "number") return thx_promise__$Promise_Promise_$Impl_$.value((function($this) {
			var $r;
			var t = value;
			var d = new Date();
			d.setTime(t);
			$r = d;
			return $r;
		}(this)));
		if(!(typeof(value) == "string")) return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not a type that can be converted to a Date",null,{ fileName : "DateFilter.hx", lineNumber : 17, className : "abe.core.filters.DateFilter", methodName : "filter"}));
		if(abe_core_filters_DateFilter.TIME_PATTERN.match(value)) return thx_promise__$Promise_Promise_$Impl_$.value((function($this) {
			var $r;
			var t1 = thx_Floats.parse(value);
			var d1 = new Date();
			d1.setTime(t1);
			$r = d1;
			return $r;
		}(this)));
		try {
			return thx_promise__$Promise_Promise_$Impl_$.value((function($this) {
				var $r;
				var s = value;
				$r = HxOverrides.strDate(s);
				return $r;
			}(this)));
		} catch( e ) {
			haxe_CallStack.lastException = e;
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not a Date value",null,{ fileName : "DateFilter.hx", lineNumber : 24, className : "abe.core.filters.DateFilter", methodName : "filter"}));
		}
	}
	,__class__: abe_core_filters_DateFilter
};
var abe_core_filters_FloatFilter = function() {
	this.type = "Float";
};
abe_core_filters_FloatFilter.__name__ = ["abe","core","filters","FloatFilter"];
abe_core_filters_FloatFilter.__interfaces__ = [abe_IFilterArgument];
abe_core_filters_FloatFilter.prototype = {
	type: null
	,filter: function(value) {
		if(typeof(value) == "number") return thx_promise__$Promise_Promise_$Impl_$.value(value);
		if(typeof(value) == "boolean") return thx_promise__$Promise_Promise_$Impl_$.value(1.0);
		if(!(typeof(value) == "string")) return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not a type that can be converted to a Float",null,{ fileName : "FloatFilter.hx", lineNumber : 19, className : "abe.core.filters.FloatFilter", methodName : "filter"}));
		if(thx_Floats.canParse(value)) return thx_promise__$Promise_Promise_$Impl_$.value(thx_Floats.parse(value)); else return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not a Float value",null,{ fileName : "FloatFilter.hx", lineNumber : 24, className : "abe.core.filters.FloatFilter", methodName : "filter"}));
	}
	,__class__: abe_core_filters_FloatFilter
};
var abe_core_filters_IntFilter = function() {
	this.type = "Int";
};
abe_core_filters_IntFilter.__name__ = ["abe","core","filters","IntFilter"];
abe_core_filters_IntFilter.__interfaces__ = [abe_IFilterArgument];
abe_core_filters_IntFilter.prototype = {
	type: null
	,filter: function(value) {
		if(((value | 0) === value)) return thx_promise__$Promise_Promise_$Impl_$.value(value);
		if(typeof(value) == "boolean") return thx_promise__$Promise_Promise_$Impl_$.value(1);
		if(!(typeof(value) == "string")) return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not a type that can be converted to a Int",null,{ fileName : "IntFilter.hx", lineNumber : 19, className : "abe.core.filters.IntFilter", methodName : "filter"}));
		if(thx_Ints.canParse(value)) return thx_promise__$Promise_Promise_$Impl_$.value(thx_Ints.parse(value)); else return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not an Integer value",null,{ fileName : "IntFilter.hx", lineNumber : 24, className : "abe.core.filters.IntFilter", methodName : "filter"}));
	}
	,__class__: abe_core_filters_IntFilter
};
var abe_core_filters_StringFilter = function() {
	this.type = "String";
};
abe_core_filters_StringFilter.__name__ = ["abe","core","filters","StringFilter"];
abe_core_filters_StringFilter.__interfaces__ = [abe_IFilterArgument];
abe_core_filters_StringFilter.prototype = {
	type: null
	,filter: function(value) {
		return thx_promise__$Promise_Promise_$Impl_$.value("" + Std.string(value));
	}
	,__class__: abe_core_filters_StringFilter
};
var abe_core_filters_ObjectFilter = function() {
	this.type = "{}";
};
abe_core_filters_ObjectFilter.__name__ = ["abe","core","filters","ObjectFilter"];
abe_core_filters_ObjectFilter.__interfaces__ = [abe_IFilterArgument];
abe_core_filters_ObjectFilter.prototype = {
	type: null
	,filter: function(value) {
		if(Reflect.isObject(value)) return thx_promise__$Promise_Promise_$Impl_$.value(value);
		if(typeof(value) == "string") {
			var v;
			try {
				v = JSON.parse(value);
			} catch( e ) {
				haxe_CallStack.lastException = e;
				if (e instanceof js__$Boot_HaxeError) e = e.val;
				v = null;
			}
			if(null != v) return thx_promise__$Promise_Promise_$Impl_$.value(v);
			v = npm_QS.parse(value);
			if(null != v) return thx_promise__$Promise_Promise_$Impl_$.value(v);
			return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" cannot be transformed to an Object value",null,{ fileName : "ObjectFilter.hx", lineNumber : 22, className : "abe.core.filters.ObjectFilter", methodName : "filter"}));
		}
		return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not an Object value",null,{ fileName : "ObjectFilter.hx", lineNumber : 25, className : "abe.core.filters.ObjectFilter", methodName : "filter"}));
	}
	,__class__: abe_core_filters_ObjectFilter
};
var abe_core_filters_ArrayFilter = function(subtype,delimiter,subfilter) {
	this.subType = subtype;
	this.type = "Array<" + subtype + ">";
	this.delimiter = delimiter;
	this.subFilter = subfilter;
};
abe_core_filters_ArrayFilter.__name__ = ["abe","core","filters","ArrayFilter"];
abe_core_filters_ArrayFilter.__interfaces__ = [abe_IFilterArgument];
abe_core_filters_ArrayFilter.prototype = {
	delimiter: null
	,subFilter: null
	,subType: null
	,type: null
	,filter: function(value) {
		if((value instanceof Array) && value.__enum__ == null) {
			var values = value;
			return thx_promise__$Promise_Promise_$Impl_$.all(values.map(($_=this.subFilter,$bind($_,$_.filter))));
		} else if(typeof(value) == "string" && null != this.delimiter) return thx_promise__$Promise_Promise_$Impl_$.all(value.split(this.delimiter).map(($_=this.subFilter,$bind($_,$_.filter)))); else return thx_promise__$Promise_Promise_$Impl_$.error(new thx_Error("\"" + Std.string(value) + "\" is not an Array of " + this.subType,null,{ fileName : "ArrayFilter.hx", lineNumber : 25, className : "abe.core.filters.ArrayFilter", methodName : "filter"}));
	}
	,__class__: abe_core_filters_ArrayFilter
};
var abe_core_ArgumentsFilter = function() {
	this.filters = new haxe_ds_StringMap();
	abe_core_ArgumentsFilter.globalFilters.map($bind(this,this.addFilter));
};
abe_core_ArgumentsFilter.__name__ = ["abe","core","ArgumentsFilter"];
abe_core_ArgumentsFilter.registerFilter = function(filter) {
	abe_core_ArgumentsFilter.globalFilters.push(filter);
};
abe_core_ArgumentsFilter.prototype = {
	filters: null
	,addFilter: function(filter) {
		if(null == filter.type) throw new js__$Boot_HaxeError("Invalid null parameter IFilterArgument.typeName");
		this.filters.set(filter.type,filter);
	}
	,canFilterType: function(type) {
		return this.filters.exists(type);
	}
	,getFilterType: function(type) {
		return this.filters.get(type);
	}
	,checkRequirements: function(requirements) {
		var _g = 0;
		while(_g < requirements.length) {
			var requirement = requirements[_g];
			++_g;
			if(!this.canFilterType(requirement.type)) throw new js__$Boot_HaxeError("No filter is specified for type " + requirement.type);
		}
	}
	,__class__: abe_core_ArgumentsFilter
};
var express_Express = require("express");
var express__$Next_Next_$Impl_$ = {};
express__$Next_Next_$Impl_$.__name__ = ["express","_Next","Next_Impl_"];
express__$Next_Next_$Impl_$.call = function(this1) {
	this1();
};
express__$Next_Next_$Impl_$.error = function(this1,err) {
	this1(err);
};
express__$Next_Next_$Impl_$.route = function(this1) {
	this1("route");
};
var express_Router = require("express").Router;
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
var haxe__$Int64__$_$_$Int64 = function(high,low) {
	this.high = high;
	this.low = low;
};
haxe__$Int64__$_$_$Int64.__name__ = ["haxe","_Int64","___Int64"];
haxe__$Int64__$_$_$Int64.prototype = {
	high: null
	,low: null
	,__class__: haxe__$Int64__$_$_$Int64
};
var haxe_Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe_Timer.__name__ = ["haxe","Timer"];
haxe_Timer.prototype = {
	id: null
	,run: function() {
	}
	,__class__: haxe_Timer
};
var haxe_crypto_Sha1 = function() {
};
haxe_crypto_Sha1.__name__ = ["haxe","crypto","Sha1"];
haxe_crypto_Sha1.encode = function(s) {
	var sh = new haxe_crypto_Sha1();
	var h = sh.doEncode(haxe_crypto_Sha1.str2blks(s));
	return sh.hex(h);
};
haxe_crypto_Sha1.str2blks = function(s) {
	var nblk = (s.length + 8 >> 6) + 1;
	var blks = [];
	var _g1 = 0;
	var _g = nblk * 16;
	while(_g1 < _g) {
		var i1 = _g1++;
		blks[i1] = 0;
	}
	var _g11 = 0;
	var _g2 = s.length;
	while(_g11 < _g2) {
		var i2 = _g11++;
		var p1 = i2 >> 2;
		blks[p1] |= HxOverrides.cca(s,i2) << 24 - ((i2 & 3) << 3);
	}
	var i = s.length;
	var p = i >> 2;
	blks[p] |= 128 << 24 - ((i & 3) << 3);
	blks[nblk * 16 - 1] = s.length * 8;
	return blks;
};
haxe_crypto_Sha1.prototype = {
	doEncode: function(x) {
		var w = [];
		var a = 1732584193;
		var b = -271733879;
		var c = -1732584194;
		var d = 271733878;
		var e = -1009589776;
		var i = 0;
		while(i < x.length) {
			var olda = a;
			var oldb = b;
			var oldc = c;
			var oldd = d;
			var olde = e;
			var j = 0;
			while(j < 80) {
				if(j < 16) w[j] = x[i + j]; else w[j] = this.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16],1);
				var t = (a << 5 | a >>> 27) + this.ft(j,b,c,d) + e + w[j] + this.kt(j);
				e = d;
				d = c;
				c = b << 30 | b >>> 2;
				b = a;
				a = t;
				j++;
			}
			a += olda;
			b += oldb;
			c += oldc;
			d += oldd;
			e += olde;
			i += 16;
		}
		return [a,b,c,d,e];
	}
	,rol: function(num,cnt) {
		return num << cnt | num >>> 32 - cnt;
	}
	,ft: function(t,b,c,d) {
		if(t < 20) return b & c | ~b & d;
		if(t < 40) return b ^ c ^ d;
		if(t < 60) return b & c | b & d | c & d;
		return b ^ c ^ d;
	}
	,kt: function(t) {
		if(t < 20) return 1518500249;
		if(t < 40) return 1859775393;
		if(t < 60) return -1894007588;
		return -899497514;
	}
	,hex: function(a) {
		var str = "";
		var _g = 0;
		while(_g < a.length) {
			var num = a[_g];
			++_g;
			str += StringTools.hex(num,8);
		}
		return str.toLowerCase();
	}
	,__class__: haxe_crypto_Sha1
};
var haxe_ds_Option = { __ename__ : ["haxe","ds","Option"], __constructs__ : ["Some","None"] };
haxe_ds_Option.Some = function(v) { var $x = ["Some",0,v]; $x.__enum__ = haxe_ds_Option; $x.toString = $estr; return $x; };
haxe_ds_Option.None = ["None",1];
haxe_ds_Option.None.toString = $estr;
haxe_ds_Option.None.__enum__ = haxe_ds_Option;
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
var haxe_io_Error = { __ename__ : ["haxe","io","Error"], __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe_io_Error.Blocked = ["Blocked",0];
haxe_io_Error.Blocked.toString = $estr;
haxe_io_Error.Blocked.__enum__ = haxe_io_Error;
haxe_io_Error.Overflow = ["Overflow",1];
haxe_io_Error.Overflow.toString = $estr;
haxe_io_Error.Overflow.__enum__ = haxe_io_Error;
haxe_io_Error.OutsideBounds = ["OutsideBounds",2];
haxe_io_Error.OutsideBounds.toString = $estr;
haxe_io_Error.OutsideBounds.__enum__ = haxe_io_Error;
haxe_io_Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe_io_Error; $x.toString = $estr; return $x; };
var haxe_io_FPHelper = function() { };
haxe_io_FPHelper.__name__ = ["haxe","io","FPHelper"];
haxe_io_FPHelper.i32ToFloat = function(i) {
	var sign = 1 - (i >>> 31 << 1);
	var exp = i >>> 23 & 255;
	var sig = i & 8388607;
	if(sig == 0 && exp == 0) return 0.0;
	return sign * (1 + Math.pow(2,-23) * sig) * Math.pow(2,exp - 127);
};
haxe_io_FPHelper.floatToI32 = function(f) {
	if(f == 0) return 0;
	var af;
	if(f < 0) af = -f; else af = f;
	var exp = Math.floor(Math.log(af) / 0.6931471805599453);
	if(exp < -127) exp = -127; else if(exp > 128) exp = 128;
	var sig = Math.round((af / Math.pow(2,exp) - 1) * 8388608) & 8388607;
	return (f < 0?-2147483648:0) | exp + 127 << 23 | sig;
};
haxe_io_FPHelper.i64ToDouble = function(low,high) {
	var sign = 1 - (high >>> 31 << 1);
	var exp = (high >> 20 & 2047) - 1023;
	var sig = (high & 1048575) * 4294967296. + (low >>> 31) * 2147483648. + (low & 2147483647);
	if(sig == 0 && exp == -1023) return 0.0;
	return sign * (1.0 + Math.pow(2,-52) * sig) * Math.pow(2,exp);
};
haxe_io_FPHelper.doubleToI64 = function(v) {
	var i64 = haxe_io_FPHelper.i64tmp;
	if(v == 0) {
		i64.low = 0;
		i64.high = 0;
	} else {
		var av;
		if(v < 0) av = -v; else av = v;
		var exp = Math.floor(Math.log(av) / 0.6931471805599453);
		var sig;
		var v1 = (av / Math.pow(2,exp) - 1) * 4503599627370496.;
		sig = Math.round(v1);
		var sig_l = sig | 0;
		var sig_h = sig / 4294967296.0 | 0;
		i64.low = sig_l;
		i64.high = (v < 0?-2147483648:0) | exp + 1023 << 20 | sig_h;
	}
	return i64;
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
var js_html_compat_ArrayBuffer = function(a) {
	if((a instanceof Array) && a.__enum__ == null) {
		this.a = a;
		this.byteLength = a.length;
	} else {
		var len = a;
		this.a = [];
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			this.a[i] = 0;
		}
		this.byteLength = len;
	}
};
js_html_compat_ArrayBuffer.__name__ = ["js","html","compat","ArrayBuffer"];
js_html_compat_ArrayBuffer.sliceImpl = function(begin,end) {
	var u = new Uint8Array(this,begin,end == null?null:end - begin);
	var result = new ArrayBuffer(u.byteLength);
	var resultArray = new Uint8Array(result);
	resultArray.set(u);
	return result;
};
js_html_compat_ArrayBuffer.prototype = {
	byteLength: null
	,a: null
	,slice: function(begin,end) {
		return new js_html_compat_ArrayBuffer(this.a.slice(begin,end));
	}
	,__class__: js_html_compat_ArrayBuffer
};
var js_html_compat_DataView = function(buffer,byteOffset,byteLength) {
	this.buf = buffer;
	if(byteOffset == null) this.offset = 0; else this.offset = byteOffset;
	if(byteLength == null) this.length = buffer.byteLength - this.offset; else this.length = byteLength;
	if(this.offset < 0 || this.length < 0 || this.offset + this.length > buffer.byteLength) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
};
js_html_compat_DataView.__name__ = ["js","html","compat","DataView"];
js_html_compat_DataView.prototype = {
	buf: null
	,offset: null
	,length: null
	,getInt8: function(byteOffset) {
		var v = this.buf.a[this.offset + byteOffset];
		if(v >= 128) return v - 256; else return v;
	}
	,getUint8: function(byteOffset) {
		return this.buf.a[this.offset + byteOffset];
	}
	,getInt16: function(byteOffset,littleEndian) {
		var v = this.getUint16(byteOffset,littleEndian);
		if(v >= 32768) return v - 65536; else return v;
	}
	,getUint16: function(byteOffset,littleEndian) {
		if(littleEndian) return this.buf.a[this.offset + byteOffset] | this.buf.a[this.offset + byteOffset + 1] << 8; else return this.buf.a[this.offset + byteOffset] << 8 | this.buf.a[this.offset + byteOffset + 1];
	}
	,getInt32: function(byteOffset,littleEndian) {
		var p = this.offset + byteOffset;
		var a = this.buf.a[p++];
		var b = this.buf.a[p++];
		var c = this.buf.a[p++];
		var d = this.buf.a[p++];
		if(littleEndian) return a | b << 8 | c << 16 | d << 24; else return d | c << 8 | b << 16 | a << 24;
	}
	,getUint32: function(byteOffset,littleEndian) {
		var v = this.getInt32(byteOffset,littleEndian);
		if(v < 0) return v + 4294967296.; else return v;
	}
	,getFloat32: function(byteOffset,littleEndian) {
		return haxe_io_FPHelper.i32ToFloat(this.getInt32(byteOffset,littleEndian));
	}
	,getFloat64: function(byteOffset,littleEndian) {
		var a = this.getInt32(byteOffset,littleEndian);
		var b = this.getInt32(byteOffset + 4,littleEndian);
		return haxe_io_FPHelper.i64ToDouble(littleEndian?a:b,littleEndian?b:a);
	}
	,setInt8: function(byteOffset,value) {
		if(value < 0) this.buf.a[byteOffset + this.offset] = value + 128 & 255; else this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setUint8: function(byteOffset,value) {
		this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setInt16: function(byteOffset,value,littleEndian) {
		this.setUint16(byteOffset,value < 0?value + 65536:value,littleEndian);
	}
	,setUint16: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
		} else {
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p] = value & 255;
		}
	}
	,setInt32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,value,littleEndian);
	}
	,setUint32: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p++] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >>> 24;
		} else {
			this.buf.a[p++] = value >>> 24;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value & 255;
		}
	}
	,setFloat32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,haxe_io_FPHelper.floatToI32(value),littleEndian);
	}
	,setFloat64: function(byteOffset,value,littleEndian) {
		var i64 = haxe_io_FPHelper.doubleToI64(value);
		if(littleEndian) {
			this.setUint32(byteOffset,i64.low);
			this.setUint32(byteOffset,i64.high);
		} else {
			this.setUint32(byteOffset,i64.high);
			this.setUint32(byteOffset,i64.low);
		}
	}
	,__class__: js_html_compat_DataView
};
var js_html_compat_Uint8Array = function() { };
js_html_compat_Uint8Array.__name__ = ["js","html","compat","Uint8Array"];
js_html_compat_Uint8Array._new = function(arg1,offset,length) {
	var arr;
	if(typeof(arg1) == "number") {
		arr = [];
		var _g = 0;
		while(_g < arg1) {
			var i = _g++;
			arr[i] = 0;
		}
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else if(js_Boot.__instanceof(arg1,js_html_compat_ArrayBuffer)) {
		var buffer = arg1;
		if(offset == null) offset = 0;
		if(length == null) length = buffer.byteLength - offset;
		if(offset == 0) arr = buffer.a; else arr = buffer.a.slice(offset,offset + length);
		arr.byteLength = arr.length;
		arr.byteOffset = offset;
		arr.buffer = buffer;
	} else if((arg1 instanceof Array) && arg1.__enum__ == null) {
		arr = arg1.slice();
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else throw new js__$Boot_HaxeError("TODO " + Std.string(arg1));
	arr.subarray = js_html_compat_Uint8Array._subarray;
	arr.set = js_html_compat_Uint8Array._set;
	return arr;
};
js_html_compat_Uint8Array._set = function(arg,offset) {
	var t = this;
	if(js_Boot.__instanceof(arg.buffer,js_html_compat_ArrayBuffer)) {
		var a = arg;
		if(arg.byteLength + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g1 = 0;
		var _g = arg.byteLength;
		while(_g1 < _g) {
			var i = _g1++;
			t[i + offset] = a[i];
		}
	} else if((arg instanceof Array) && arg.__enum__ == null) {
		var a1 = arg;
		if(a1.length + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g11 = 0;
		var _g2 = a1.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			t[i1 + offset] = a1[i1];
		}
	} else throw new js__$Boot_HaxeError("TODO");
};
js_html_compat_Uint8Array._subarray = function(start,end) {
	var t = this;
	var a = js_html_compat_Uint8Array._new(t.slice(start,end));
	a.byteOffset = start;
	return a;
};
var js_node_Fs = require("fs");
var js_node_Http = require("http");
var js_node_Https = require("https");
var npm_QS = require("qs");
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
thx_Dates.equals = function(a,b) {
	return a.getTime() == b.getTime();
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
	throw new thx_Error("Unable to compare values: " + Std.string(a) + " and " + Std.string(b),null,{ fileName : "Dynamics.hx", lineNumber : 151, className : "thx.Dynamics", methodName : "equals"});
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
var thx_Either = { __ename__ : ["thx","Either"], __constructs__ : ["Left","Right"] };
thx_Either.Left = function(value) { var $x = ["Left",0,value]; $x.__enum__ = thx_Either; $x.toString = $estr; return $x; };
thx_Either.Right = function(value) { var $x = ["Right",1,value]; $x.__enum__ = thx_Either; $x.toString = $estr; return $x; };
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
thx_Maps.mapToObject = function(map) {
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
thx_Objects.objectToMap = function(o) {
	return thx_Arrays.reduce(thx_Objects.tuples(o),function(map,t) {
		var value = t._1;
		map.set(t._0,value);
		return map;
	},new haxe_ds_StringMap());
};
thx_Objects.size = function(o) {
	return Reflect.fields(o).length;
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
var thx_Options = function() { };
thx_Options.__name__ = ["thx","Options"];
thx_Options.equals = function(a,b,eq) {
	switch(a[1]) {
	case 1:
		switch(b[1]) {
		case 1:
			return true;
		default:
			return false;
		}
		break;
	case 0:
		switch(b[1]) {
		case 0:
			var a1 = a[2];
			var b1 = b[2];
			if(null == eq) eq = function(a2,b2) {
				return a2 == b2;
			};
			return eq(a1,b1);
		default:
			return false;
		}
		break;
	}
};
thx_Options.equalsValue = function(a,b,eq) {
	return thx_Options.equals(a,null == b?haxe_ds_Option.None:haxe_ds_Option.Some(b),eq);
};
thx_Options.flatMap = function(option,callback) {
	switch(option[1]) {
	case 1:
		return [];
	case 0:
		var v = option[2];
		return callback(v);
	}
};
thx_Options.map = function(option,callback) {
	switch(option[1]) {
	case 1:
		return haxe_ds_Option.None;
	case 0:
		var v = option[2];
		return haxe_ds_Option.Some(callback(v));
	}
};
thx_Options.toArray = function(option) {
	switch(option[1]) {
	case 1:
		return [];
	case 0:
		var v = option[2];
		return [v];
	}
};
thx_Options.toBool = function(option) {
	switch(option[1]) {
	case 1:
		return false;
	case 0:
		return true;
	}
};
thx_Options.toOption = function(value) {
	if(null == value) return haxe_ds_Option.None; else return haxe_ds_Option.Some(value);
};
thx_Options.toValue = function(option) {
	switch(option[1]) {
	case 1:
		return null;
	case 0:
		var v = option[2];
		return v;
	}
};
var thx__$Result_Result_$Impl_$ = {};
thx__$Result_Result_$Impl_$.__name__ = ["thx","_Result","Result_Impl_"];
thx__$Result_Result_$Impl_$.optionValue = function(this1) {
	switch(this1[1]) {
	case 1:
		var v = this1[2];
		return haxe_ds_Option.Some(v);
	default:
		return haxe_ds_Option.None;
	}
};
thx__$Result_Result_$Impl_$.optionError = function(this1) {
	switch(this1[1]) {
	case 0:
		var v = this1[2];
		return haxe_ds_Option.Some(v);
	default:
		return haxe_ds_Option.None;
	}
};
thx__$Result_Result_$Impl_$.value = function(this1) {
	switch(this1[1]) {
	case 1:
		var v = this1[2];
		return v;
	default:
		return null;
	}
};
thx__$Result_Result_$Impl_$.error = function(this1) {
	switch(this1[1]) {
	case 0:
		var v = this1[2];
		return v;
	default:
		return null;
	}
};
thx__$Result_Result_$Impl_$.get_isSuccess = function(this1) {
	switch(this1[1]) {
	case 1:
		return true;
	default:
		return false;
	}
};
thx__$Result_Result_$Impl_$.get_isFailure = function(this1) {
	switch(this1[1]) {
	case 0:
		return true;
	default:
		return false;
	}
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
var thx_Timer = function() { };
thx_Timer.__name__ = ["thx","Timer"];
thx_Timer.debounce = function(callback,delayms,leading) {
	if(leading == null) leading = false;
	var cancel = thx_Functions.noop;
	var poll = function() {
		cancel();
		cancel = thx_Timer.delay(callback,delayms);
	};
	return function() {
		if(leading) {
			leading = false;
			callback();
		}
		poll();
	};
};
thx_Timer.throttle = function(callback,delayms,leading) {
	if(leading == null) leading = false;
	var waiting = false;
	var poll = function() {
		waiting = true;
		thx_Timer.delay(callback,delayms);
	};
	return function() {
		if(leading) {
			leading = false;
			callback();
			return;
		}
		if(waiting) return;
		poll();
	};
};
thx_Timer.repeat = function(callback,delayms) {
	return (function(f,id) {
		return function() {
			f(id);
		};
	})(thx_Timer.clear,setInterval(callback,delayms));
};
thx_Timer.delay = function(callback,delayms) {
	return (function(f,id) {
		return function() {
			f(id);
		};
	})(thx_Timer.clear,setTimeout(callback,delayms));
};
thx_Timer.frame = function(callback) {
	var cancelled = false;
	var f = thx_Functions.noop;
	var current = performance.now();
	var next;
	f = function() {
		if(cancelled) return;
		next = performance.now();
		callback(next - current);
		current = next;
		requestAnimationFrame(f);
	};
	requestAnimationFrame(f);
	return function() {
		cancelled = true;
	};
};
thx_Timer.nextFrame = function(callback) {
	var id = requestAnimationFrame(callback);
	return function() {
		cancelAnimationFrame(id);
	};
};
thx_Timer.immediate = function(callback) {
	return (function(f,id) {
		return function() {
			f(id);
		};
	})(thx_Timer.clear,setImmediate(callback));
};
thx_Timer.clear = function(id) {
	clearTimeout(id);
	return;
};
thx_Timer.time = function() {
	return performance.now();
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
	return thx_Types.typeToString(Type["typeof"](a)) == thx_Types.typeToString(Type["typeof"](b));
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
thx_Types.typeToString = function(type) {
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
	return thx_Types.typeToString(Type["typeof"](value));
};
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
var thx_promise_Future = function() {
	this.handlers = [];
	this.state = haxe_ds_Option.None;
};
thx_promise_Future.__name__ = ["thx","promise","Future"];
thx_promise_Future.sequence = function(arr) {
	return thx_promise_Future.create(function(callback) {
		var poll;
		var poll1 = null;
		poll1 = function(_) {
			if(arr.length == 0) callback(thx_Nil.nil); else arr.shift().then(poll1);
		};
		poll = poll1;
		poll(null);
	});
};
thx_promise_Future.afterAll = function(arr) {
	return thx_promise_Future.create(function(callback) {
		thx_promise_Future.all(arr).then(function(_) {
			callback(thx_Nil.nil);
		});
	});
};
thx_promise_Future.all = function(arr) {
	return thx_promise_Future.create(function(callback) {
		var results = [];
		var counter = 0;
		thx_Arrays.mapi(arr,function(p,i) {
			p.then(function(value) {
				results[i] = value;
				counter++;
				if(counter == arr.length) callback(results);
			});
		});
	});
};
thx_promise_Future.create = function(handler) {
	var future = new thx_promise_Future();
	handler($bind(future,future.setState));
	return future;
};
thx_promise_Future.flatMap = function(future) {
	return thx_promise_Future.create(function(callback) {
		future.then(function(future1) {
			future1.then(callback);
		});
	});
};
thx_promise_Future.value = function(v) {
	return thx_promise_Future.create(function(callback) {
		callback(v);
	});
};
thx_promise_Future.prototype = {
	handlers: null
	,state: null
	,delay: function(delayms) {
		if(null == delayms) return thx_promise_Future.flatMap(this.map(function(value) {
			return thx_promise_Timer.immediateValue(value);
		})); else return thx_promise_Future.flatMap(this.map(function(value1) {
			return thx_promise_Timer.delayValue(value1,delayms);
		}));
	}
	,hasValue: function() {
		return thx_Options.toBool(this.state);
	}
	,map: function(handler) {
		var _g = this;
		return thx_promise_Future.create(function(callback) {
			_g.then(function(value) {
				callback(handler(value));
			});
		});
	}
	,mapAsync: function(handler) {
		var _g = this;
		return thx_promise_Future.create(function(callback) {
			_g.then(function(result) {
				handler(result,callback);
			});
		});
	}
	,mapPromise: function(handler) {
		var _g = this;
		return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
			_g.then(function(result) {
				thx_promise__$Promise_Promise_$Impl_$.failure(thx_promise__$Promise_Promise_$Impl_$.success(handler(result),resolve),reject);
			});
		});
	}
	,mapFuture: function(handler) {
		return thx_promise_Future.flatMap(this.map(handler));
	}
	,then: function(handler) {
		this.handlers.push(handler);
		this.update();
		return this;
	}
	,toString: function() {
		return "Future";
	}
	,setState: function(newstate) {
		{
			var _g = this.state;
			switch(_g[1]) {
			case 1:
				this.state = haxe_ds_Option.Some(newstate);
				break;
			case 0:
				var r = _g[2];
				throw new thx_Error("future was already \"" + Std.string(r) + "\", can't apply the new state \"" + Std.string(newstate) + "\"",null,{ fileName : "Future.hx", lineNumber : 110, className : "thx.promise.Future", methodName : "setState"});
				break;
			}
		}
		this.update();
		return this;
	}
	,update: function() {
		{
			var _g = this.state;
			switch(_g[1]) {
			case 1:
				break;
			case 0:
				var result = _g[2];
				var index = -1;
				while(++index < this.handlers.length) this.handlers[index](result);
				this.handlers = [];
				break;
			}
		}
	}
	,__class__: thx_promise_Future
};
var thx_promise_Futures = function() { };
thx_promise_Futures.__name__ = ["thx","promise","Futures"];
thx_promise_Futures.join = function(p1,p2) {
	return thx_promise_Future.create(function(callback) {
		var counter = 0;
		var v1 = null;
		var v2 = null;
		var complete = function() {
			if(counter < 2) return;
			callback({ _0 : v1, _1 : v2});
		};
		p1.then(function(v) {
			counter++;
			v1 = v;
			complete();
		});
		p2.then(function(v3) {
			counter++;
			v2 = v3;
			complete();
		});
	});
};
thx_promise_Futures.log = function(future,prefix) {
	if(prefix == null) prefix = "";
	return future.then(function(r) {
		console.log("" + prefix + " VALUE: " + Std.string(r));
	});
};
var thx_promise_FutureTuple6 = function() { };
thx_promise_FutureTuple6.__name__ = ["thx","promise","FutureTuple6"];
thx_promise_FutureTuple6.mapTuple = function(future,callback) {
	return future.map(function(t) {
		return callback(t._0,t._1,t._2,t._3,t._4,t._5);
	});
};
thx_promise_FutureTuple6.mapTupleAsync = function(future,callback) {
	return future.mapAsync(function(t,cb) {
		callback(t._0,t._1,t._2,t._3,t._4,t._5,cb);
		return;
	});
};
thx_promise_FutureTuple6.mapTupleFuture = function(future,callback) {
	return thx_promise_Future.flatMap(future.map(function(t) {
		return callback(t._0,t._1,t._2,t._3,t._4,t._5);
	}));
};
thx_promise_FutureTuple6.tuple = function(future,callback) {
	return future.then(function(t) {
		callback(t._0,t._1,t._2,t._3,t._4,t._5);
	});
};
var thx_promise_FutureTuple5 = function() { };
thx_promise_FutureTuple5.__name__ = ["thx","promise","FutureTuple5"];
thx_promise_FutureTuple5.join = function(p1,p2) {
	return thx_promise_Future.create(function(callback) {
		thx_promise_Futures.join(p1,p2).then(function(t) {
			callback((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3, _4 : this1._4, _5 : t._1};
				return $r;
			}(this)));
		});
	});
};
thx_promise_FutureTuple5.mapTuple = function(future,callback) {
	return future.map(function(t) {
		return callback(t._0,t._1,t._2,t._3,t._4);
	});
};
thx_promise_FutureTuple5.mapTupleAsync = function(future,callback) {
	return future.mapAsync(function(t,cb) {
		callback(t._0,t._1,t._2,t._3,t._4,cb);
		return;
	});
};
thx_promise_FutureTuple5.mapTupleFuture = function(future,callback) {
	return thx_promise_Future.flatMap(future.map(function(t) {
		return callback(t._0,t._1,t._2,t._3,t._4);
	}));
};
thx_promise_FutureTuple5.tuple = function(future,callback) {
	return future.then(function(t) {
		callback(t._0,t._1,t._2,t._3,t._4);
	});
};
var thx_promise_FutureTuple4 = function() { };
thx_promise_FutureTuple4.__name__ = ["thx","promise","FutureTuple4"];
thx_promise_FutureTuple4.join = function(p1,p2) {
	return thx_promise_Future.create(function(callback) {
		thx_promise_Futures.join(p1,p2).then(function(t) {
			callback((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3, _4 : t._1};
				return $r;
			}(this)));
		});
	});
};
thx_promise_FutureTuple4.mapTuple = function(future,callback) {
	return future.map(function(t) {
		return callback(t._0,t._1,t._2,t._3);
	});
};
thx_promise_FutureTuple4.mapTupleAsync = function(future,callback) {
	return future.mapAsync(function(t,cb) {
		callback(t._0,t._1,t._2,t._3,cb);
		return;
	});
};
thx_promise_FutureTuple4.mapTupleFuture = function(future,callback) {
	return thx_promise_Future.flatMap(future.map(function(t) {
		return callback(t._0,t._1,t._2,t._3);
	}));
};
thx_promise_FutureTuple4.tuple = function(future,callback) {
	return future.then(function(t) {
		callback(t._0,t._1,t._2,t._3);
	});
};
var thx_promise_FutureTuple3 = function() { };
thx_promise_FutureTuple3.__name__ = ["thx","promise","FutureTuple3"];
thx_promise_FutureTuple3.join = function(p1,p2) {
	return thx_promise_Future.create(function(callback) {
		thx_promise_Futures.join(p1,p2).then(function(t) {
			callback((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : t._1};
				return $r;
			}(this)));
		});
	});
};
thx_promise_FutureTuple3.mapTuple = function(future,callback) {
	return future.map(function(t) {
		return callback(t._0,t._1,t._2);
	});
};
thx_promise_FutureTuple3.mapTupleAsync = function(future,callback) {
	return future.mapAsync(function(t,cb) {
		callback(t._0,t._1,t._2,cb);
		return;
	});
};
thx_promise_FutureTuple3.mapTupleFuture = function(future,callback) {
	return thx_promise_Future.flatMap(future.map(function(t) {
		return callback(t._0,t._1,t._2);
	}));
};
thx_promise_FutureTuple3.tuple = function(future,callback) {
	return future.then(function(t) {
		callback(t._0,t._1,t._2);
	});
};
var thx_promise_FutureTuple2 = function() { };
thx_promise_FutureTuple2.__name__ = ["thx","promise","FutureTuple2"];
thx_promise_FutureTuple2.join = function(p1,p2) {
	return thx_promise_Future.create(function(callback) {
		thx_promise_Futures.join(p1,p2).then(function(t) {
			callback((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : t._1};
				return $r;
			}(this)));
		});
	});
};
thx_promise_FutureTuple2.mapTuple = function(future,callback) {
	return future.map(function(t) {
		return callback(t._0,t._1);
	});
};
thx_promise_FutureTuple2.mapTupleAsync = function(future,callback) {
	return future.mapAsync(function(t,cb) {
		callback(t._0,t._1,cb);
		return;
	});
};
thx_promise_FutureTuple2.mapTupleFuture = function(future,callback) {
	return thx_promise_Future.flatMap(future.map(function(t) {
		return callback(t._0,t._1);
	}));
};
thx_promise_FutureTuple2.tuple = function(future,callback) {
	return future.then(function(t) {
		callback(t._0,t._1);
	});
};
var thx_promise_FutureNil = function() { };
thx_promise_FutureNil.__name__ = ["thx","promise","FutureNil"];
thx_promise_FutureNil.join = function(p1,p2) {
	return thx_promise_Future.create(function(callback) {
		thx_promise_Futures.join(p1,p2).then(function(t) {
			callback(t._1);
		});
	});
};
thx_promise_FutureNil.nil = function(p) {
	return thx_promise_Future.create(function(callback) {
		p.then(function(_) {
			callback(thx_Nil.nil);
		});
	});
};
var thx_promise__$Promise_Promise_$Impl_$ = {};
thx_promise__$Promise_Promise_$Impl_$.__name__ = ["thx","promise","_Promise","Promise_Impl_"];
thx_promise__$Promise_Promise_$Impl_$.futureToPromise = function(future) {
	return future.map(function(v) {
		return thx_Either.Right(v);
	});
};
thx_promise__$Promise_Promise_$Impl_$.sequence = function(arr) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		var poll;
		var poll1 = null;
		poll1 = function(_) {
			if(arr.length == 0) resolve(thx_promise__$Promise_Promise_$Impl_$.nil); else thx_promise__$Promise_Promise_$Impl_$.mapFailure(thx_promise__$Promise_Promise_$Impl_$.mapSuccess(arr.shift(),poll1),reject);
		};
		poll = poll1;
		poll(null);
	});
};
thx_promise__$Promise_Promise_$Impl_$.afterAll = function(arr) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.either(thx_promise__$Promise_Promise_$Impl_$.all(arr),function(_) {
			resolve(thx_Nil.nil);
		},reject);
	});
};
thx_promise__$Promise_Promise_$Impl_$.all = function(arr) {
	if(arr.length == 0) return thx_promise__$Promise_Promise_$Impl_$.value([]);
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		var results = [];
		var counter = 0;
		var hasError = false;
		thx_Arrays.mapi(arr,function(p,i) {
			thx_promise__$Promise_Promise_$Impl_$.either(p,function(value) {
				if(hasError) return;
				results[i] = value;
				counter++;
				if(counter == arr.length) resolve(results);
			},function(err) {
				if(hasError) return;
				hasError = true;
				reject(err);
			});
		});
	});
};
thx_promise__$Promise_Promise_$Impl_$.create = function(callback) {
	return thx_promise_Future.create(function(cb) {
		callback(function(value) {
			cb(thx_Either.Right(value));
		},function(error) {
			cb(thx_Either.Left(error));
		});
	});
};
thx_promise__$Promise_Promise_$Impl_$.createFulfill = function(callback) {
	return thx_promise_Future.create(callback);
};
thx_promise__$Promise_Promise_$Impl_$.error = function(err) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(_,reject) {
		reject(err);
	});
};
thx_promise__$Promise_Promise_$Impl_$.value = function(v) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,_) {
		resolve(v);
	});
};
thx_promise__$Promise_Promise_$Impl_$.always = function(this1,handler) {
	this1.then(function(_) {
		handler();
	});
};
thx_promise__$Promise_Promise_$Impl_$.either = function(this1,success,failure) {
	this1.then(function(r) {
		switch(r[1]) {
		case 1:
			var value = r[2];
			success(value);
			break;
		case 0:
			var error = r[2];
			failure(error);
			break;
		}
	});
	return this1;
};
thx_promise__$Promise_Promise_$Impl_$.delay = function(this1,delayms) {
	return this1.delay(delayms);
};
thx_promise__$Promise_Promise_$Impl_$.isFailure = function(this1) {
	{
		var _g = this1.state;
		switch(_g[1]) {
		case 1:
			return false;
		case 0:
			switch(_g[2][1]) {
			case 1:
				return false;
			default:
				return true;
			}
			break;
		}
	}
};
thx_promise__$Promise_Promise_$Impl_$.isResolved = function(this1) {
	{
		var _g = this1.state;
		switch(_g[1]) {
		case 1:
			return false;
		case 0:
			switch(_g[2][1]) {
			case 0:
				return false;
			default:
				return true;
			}
			break;
		}
	}
};
thx_promise__$Promise_Promise_$Impl_$.failure = function(this1,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.either(this1,function(_) {
	},failure);
};
thx_promise__$Promise_Promise_$Impl_$.mapAlways = function(this1,handler) {
	return this1.map(function(_) {
		return handler();
	});
};
thx_promise__$Promise_Promise_$Impl_$.mapAlwaysAsync = function(this1,handler) {
	return this1.mapAsync(function(_,cb) {
		handler(cb);
		return;
	});
};
thx_promise__$Promise_Promise_$Impl_$.mapAlwaysFuture = function(this1,handler) {
	return thx_promise_Future.flatMap(this1.map(function(_) {
		return handler();
	}));
};
thx_promise__$Promise_Promise_$Impl_$.mapEither = function(this1,success,failure) {
	return this1.map(function(result) {
		switch(result[1]) {
		case 1:
			var value = result[2];
			return success(value);
		case 0:
			var error = result[2];
			return failure(error);
		}
	});
};
thx_promise__$Promise_Promise_$Impl_$.mapEitherFuture = function(this1,success,failure) {
	return thx_promise_Future.flatMap(this1.map(function(result) {
		switch(result[1]) {
		case 1:
			var value = result[2];
			return success(value);
		case 0:
			var error = result[2];
			return failure(error);
		}
	}));
};
thx_promise__$Promise_Promise_$Impl_$.mapFailure = function(this1,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.mapEither(this1,function(value) {
		return value;
	},failure);
};
thx_promise__$Promise_Promise_$Impl_$.mapFailureFuture = function(this1,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.mapEitherFuture(this1,function(value) {
		return thx_promise_Future.value(value);
	},failure);
};
thx_promise__$Promise_Promise_$Impl_$.mapFailurePromise = function(this1,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.mapEitherFuture(this1,function(value) {
		return thx_promise__$Promise_Promise_$Impl_$.value(value);
	},failure);
};
thx_promise__$Promise_Promise_$Impl_$.mapSuccess = function(this1,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapEitherFuture(this1,function(v) {
		return thx_promise__$Promise_Promise_$Impl_$.value(success(v));
	},function(err) {
		return thx_promise__$Promise_Promise_$Impl_$.error(err);
	});
};
thx_promise__$Promise_Promise_$Impl_$.mapSuccessPromise = function(this1,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapEitherFuture(this1,success,function(err) {
		return thx_promise__$Promise_Promise_$Impl_$.error(err);
	});
};
thx_promise__$Promise_Promise_$Impl_$.success = function(this1,success) {
	return thx_promise__$Promise_Promise_$Impl_$.either(this1,success,function(_) {
	});
};
thx_promise__$Promise_Promise_$Impl_$.throwFailure = function(this1) {
	return thx_promise__$Promise_Promise_$Impl_$.failure(this1,function(err) {
		throw err;
	});
};
thx_promise__$Promise_Promise_$Impl_$.toString = function(this1) {
	return "Promise";
};
var thx_promise_Promises = function() { };
thx_promise_Promises.__name__ = ["thx","promise","Promises"];
thx_promise_Promises.join = function(p1,p2) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		var hasError = false;
		var counter = 0;
		var v1 = null;
		var v2 = null;
		var complete = function() {
			if(counter < 2) return;
			resolve({ _0 : v1, _1 : v2});
		};
		var handleError = function(error) {
			if(hasError) return;
			hasError = true;
			reject(error);
		};
		thx_promise__$Promise_Promise_$Impl_$.either(p1,function(v) {
			if(hasError) return;
			counter++;
			v1 = v;
			complete();
		},handleError);
		thx_promise__$Promise_Promise_$Impl_$.either(p2,function(v3) {
			if(hasError) return;
			counter++;
			v2 = v3;
			complete();
		},handleError);
	});
};
thx_promise_Promises.log = function(promise,prefix) {
	if(prefix == null) prefix = "";
	return thx_promise__$Promise_Promise_$Impl_$.either(promise,function(r) {
		console.log("" + prefix + " SUCCESS: " + Std.string(r));
	},function(e) {
		console.log("" + prefix + " ERROR: " + e.toString());
	});
};
var thx_promise_PromiseTuple6 = function() { };
thx_promise_PromiseTuple6.__name__ = ["thx","promise","PromiseTuple6"];
thx_promise_PromiseTuple6.mapTuplePromise = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccessPromise(promise,function(t) {
		return success(t._0,t._1,t._2,t._3,t._4,t._5);
	});
};
thx_promise_PromiseTuple6.mapTuple = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccess(promise,function(t) {
		return success(t._0,t._1,t._2,t._3,t._4,t._5);
	});
};
thx_promise_PromiseTuple6.tuple = function(promise,success,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.either(promise,function(t) {
		success(t._0,t._1,t._2,t._3,t._4,t._5);
	},null == failure?function(_) {
	}:failure);
};
var thx_promise_PromiseTuple5 = function() { };
thx_promise_PromiseTuple5.__name__ = ["thx","promise","PromiseTuple5"];
thx_promise_PromiseTuple5.join = function(p1,p2) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.either(thx_promise_Promises.join(p1,p2),function(t) {
			resolve((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3, _4 : this1._4, _5 : t._1};
				return $r;
			}(this)));
		},function(e) {
			reject(e);
		});
	});
};
thx_promise_PromiseTuple5.mapTuplePromise = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccessPromise(promise,function(t) {
		return success(t._0,t._1,t._2,t._3,t._4);
	});
};
thx_promise_PromiseTuple5.mapTuple = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccess(promise,function(t) {
		return success(t._0,t._1,t._2,t._3,t._4);
	});
};
thx_promise_PromiseTuple5.tuple = function(promise,success,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.either(promise,function(t) {
		success(t._0,t._1,t._2,t._3,t._4);
	},null == failure?function(_) {
	}:failure);
};
var thx_promise_PromiseTuple4 = function() { };
thx_promise_PromiseTuple4.__name__ = ["thx","promise","PromiseTuple4"];
thx_promise_PromiseTuple4.join = function(p1,p2) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.either(thx_promise_Promises.join(p1,p2),function(t) {
			resolve((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : this1._3, _4 : t._1};
				return $r;
			}(this)));
		},function(e) {
			reject(e);
		});
	});
};
thx_promise_PromiseTuple4.mapTuplePromise = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccessPromise(promise,function(t) {
		return success(t._0,t._1,t._2,t._3);
	});
};
thx_promise_PromiseTuple4.mapTuple = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccess(promise,function(t) {
		return success(t._0,t._1,t._2,t._3);
	});
};
thx_promise_PromiseTuple4.tuple = function(promise,success,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.either(promise,function(t) {
		success(t._0,t._1,t._2,t._3);
	},null == failure?function(_) {
	}:failure);
};
var thx_promise_PromiseTuple3 = function() { };
thx_promise_PromiseTuple3.__name__ = ["thx","promise","PromiseTuple3"];
thx_promise_PromiseTuple3.join = function(p1,p2) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.either(thx_promise_Promises.join(p1,p2),function(t) {
			resolve((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : this1._2, _3 : t._1};
				return $r;
			}(this)));
		},function(e) {
			reject(e);
		});
	});
};
thx_promise_PromiseTuple3.mapTuplePromise = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccessPromise(promise,function(t) {
		return success(t._0,t._1,t._2);
	});
};
thx_promise_PromiseTuple3.mapTuple = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccess(promise,function(t) {
		return success(t._0,t._1,t._2);
	});
};
thx_promise_PromiseTuple3.tuple = function(promise,success,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.either(promise,function(t) {
		success(t._0,t._1,t._2);
	},null == failure?function(_) {
	}:failure);
};
var thx_promise_PromiseTuple2 = function() { };
thx_promise_PromiseTuple2.__name__ = ["thx","promise","PromiseTuple2"];
thx_promise_PromiseTuple2.join = function(p1,p2) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.either(thx_promise_Promises.join(p1,p2),function(t) {
			resolve((function($this) {
				var $r;
				var this1 = t._0;
				$r = { _0 : this1._0, _1 : this1._1, _2 : t._1};
				return $r;
			}(this)));
		},function(e) {
			reject(e);
		});
	});
};
thx_promise_PromiseTuple2.mapTuplePromise = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccessPromise(promise,function(t) {
		return success(t._0,t._1);
	});
};
thx_promise_PromiseTuple2.mapTuple = function(promise,success) {
	return thx_promise__$Promise_Promise_$Impl_$.mapSuccess(promise,function(t) {
		return success(t._0,t._1);
	});
};
thx_promise_PromiseTuple2.tuple = function(promise,success,failure) {
	return thx_promise__$Promise_Promise_$Impl_$.either(promise,function(t) {
		success(t._0,t._1);
	},null == failure?function(_) {
	}:failure);
};
var thx_promise_PromiseNil = function() { };
thx_promise_PromiseNil.__name__ = ["thx","promise","PromiseNil"];
thx_promise_PromiseNil.join = function(p1,p2) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.either(thx_promise_Promises.join(p1,p2),function(t) {
			resolve(t._1);
		},function(e) {
			reject(e);
		});
	});
};
thx_promise_PromiseNil.nil = function(p) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.failure(thx_promise__$Promise_Promise_$Impl_$.success(p,function(_) {
			resolve(thx_Nil.nil);
		}),reject);
	});
};
var thx_promise_PromiseAPlus = function() { };
thx_promise_PromiseAPlus.__name__ = ["thx","promise","PromiseAPlus"];
thx_promise_PromiseAPlus.promise = function(p) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		p.then(resolve,function(e) {
			reject(thx_Error.fromDynamic(e,{ fileName : "Promise.hx", lineNumber : 352, className : "thx.promise.PromiseAPlus", methodName : "promise"}));
		});
	});
};
thx_promise_PromiseAPlus.aPlus = function(p) {
	return new Promise(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.failure(thx_promise__$Promise_Promise_$Impl_$.success(p,resolve),reject);
	});
};
var thx_promise_PromiseAPlusVoid = function() { };
thx_promise_PromiseAPlusVoid.__name__ = ["thx","promise","PromiseAPlusVoid"];
thx_promise_PromiseAPlusVoid.promise = function(p) {
	return thx_promise__$Promise_Promise_$Impl_$.create(function(resolve,reject) {
		p.then(function() {
			resolve(thx_Nil.nil);
		},function(e) {
			reject(thx_Error.fromDynamic(e,{ fileName : "Promise.hx", lineNumber : 364, className : "thx.promise.PromiseAPlusVoid", methodName : "promise"}));
		});
	});
};
thx_promise_PromiseAPlusVoid.aPlus = function(p) {
	return new Promise(function(resolve,reject) {
		thx_promise__$Promise_Promise_$Impl_$.failure(thx_promise__$Promise_Promise_$Impl_$.success(p,function() {
			resolve(thx_Nil.nil);
		}),reject);
	});
};
var thx_promise_Timer = function() { };
thx_promise_Timer.__name__ = ["thx","promise","Timer"];
thx_promise_Timer.delay = function(delayms) {
	return thx_promise_Timer.delayValue(thx_Nil.nil,delayms);
};
thx_promise_Timer.delayValue = function(value,delayms) {
	return thx_promise_Future.create(function(callback) {
		thx_Timer.delay((function(f,a1) {
			return function() {
				f(a1);
			};
		})(callback,value),delayms);
	});
};
thx_promise_Timer.immediate = function() {
	return thx_promise_Timer.immediateValue(thx_Nil.nil);
};
thx_promise_Timer.immediateValue = function(value) {
	return thx_promise_Future.create(function(callback) {
		thx_Timer.immediate((function(f,a1) {
			return function() {
				f(a1);
			};
		})(callback,value));
	});
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
var ArrayBuffer = (Function("return typeof ArrayBuffer != 'undefined' ? ArrayBuffer : null"))() || js_html_compat_ArrayBuffer;
if(ArrayBuffer.prototype.slice == null) ArrayBuffer.prototype.slice = js_html_compat_ArrayBuffer.sliceImpl;
var DataView = (Function("return typeof DataView != 'undefined' ? DataView : null"))() || js_html_compat_DataView;
var Uint8Array = (Function("return typeof Uint8Array != 'undefined' ? Uint8Array : null"))() || js_html_compat_Uint8Array._new;

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
var scope = ("undefined" !== typeof window && window) || ("undefined" !== typeof global && global) || this;
if(!scope.setImmediate) scope.setImmediate = function(callback) {
	scope.setTimeout(callback,0);
};
var lastTime = 0;
var vendors = ["webkit","moz"];
var x = 0;
while(x < vendors.length && !scope.requestAnimationFrame) {
	scope.requestAnimationFrame = scope[vendors[x] + "RequestAnimationFrame"];
	scope.cancelAnimationFrame = scope[vendors[x] + "CancelAnimationFrame"] || scope[vendors[x] + "CancelRequestAnimationFrame"];
	x++;
}
if(!scope.requestAnimationFrame) scope.requestAnimationFrame = function(callback1) {
	var currTime = new Date().getTime();
	var timeToCall = Math.max(0,16 - (currTime - lastTime));
	var id = scope.setTimeout(function() {
		callback1(currTime + timeToCall);
	},timeToCall);
	lastTime = currTime + timeToCall;
	return id;
};
if(!scope.cancelAnimationFrame) scope.cancelAnimationFrame = function(id1) {
	scope.clearTimeout(id1);
};
if(typeof(scope.performance) == "undefined") scope.performance = { };
if(typeof(scope.performance.now) == "undefined") {
	var nowOffset = new Date().getTime();
	if(scope.performance.timing && scope.performance.timing.navigationStart) nowOffset = scope.performance.timing.navigationStart;
	var now = function() {
		return new Date() - nowOffset;
	};
	scope.performance.now = now;
}
DateTools.DAYS_OF_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
Main.textDB = "";
abe_core_filters_DateFilter.TIME_PATTERN = new EReg("$\\d+^","");
abe_core_ArgumentsFilter.globalFilters = (function() {
	var filters = [];
	var bool = new abe_core_filters_BoolFilter();
	var date = new abe_core_filters_DateFilter();
	var $float = new abe_core_filters_FloatFilter();
	var $int = new abe_core_filters_IntFilter();
	var string = new abe_core_filters_StringFilter();
	var object = new abe_core_filters_ObjectFilter();
	filters.push(bool);
	filters.push(date);
	filters.push($float);
	filters.push($int);
	filters.push(string);
	filters.push(object);
	filters.push(new abe_core_filters_ArrayFilter("Bool",",",bool));
	filters.push(new abe_core_filters_ArrayFilter("Date",",",date));
	filters.push(new abe_core_filters_ArrayFilter("Float",",",$float));
	filters.push(new abe_core_filters_ArrayFilter("Int",",",$int));
	filters.push(new abe_core_filters_ArrayFilter("String",",",string));
	filters.push(new abe_core_filters_ArrayFilter("{}","|",object));
	return filters;
})();
haxe_io_FPHelper.i64tmp = (function($this) {
	var $r;
	var x = new haxe__$Int64__$_$_$Int64(0,0);
	$r = x;
	return $r;
}(this));
js_Boot.__toStr = {}.toString;
js_html_compat_Uint8Array.BYTES_PER_ELEMENT = 1;
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
thx_Timer.FRAME_RATE = Math.round(16.666666666666668);
thx_promise__$Promise_Promise_$Impl_$.nil = thx_promise__$Promise_Promise_$Impl_$.value(thx_Nil.nil);
Main.main();
})(typeof console != "undefined" ? console : {log:function(){}});

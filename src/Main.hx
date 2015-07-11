package;

import abe.App;
import express.Middleware;
import express.Response;
import express.Request;
import express.Next;
import haxe.crypto.Sha1;
import haxe.Json;
import haxe.Timer;
import js.Lib;
import thx.Dates.HaxeDateTools;

import js.Node;
import js.node.Fs;
import js.Error;
import js.Node;

import js.node.mongodb.MongoClient;
import js.node.mongodb.MongoDatabase;
import js.node.mongodb.ObjectID;

import express.Express;

using StringTools;

typedef RoomMetric = {
	room: String,
	count: Int,
	locked: Bool
}

class Main {
	public static var tokens: Map<String, String>;
	static var typingTimers: Map<String, Map<String, Timer>>;

	static var textDB: String = '';

	public static var rooms: Rooms;

	public static var userCounts: Map<String, Array<{id: String, timestamp: Date}>> = new Map();

	static var animalWords: Array<String>;
	static var adjectives: Array<String>;

	var MongoClient: MongoClient;
	var mongoUrl = '';
	static var mongodb: MongoDatabase;

	var irc: Dynamic;
	static var ircClient: Dynamic;

	public static var hiddenRooms = [
		'haxe',
		'cfa_teamchat'
	];

	public static var v: Int = 0;

	function new() {
		v = Version.get();
		animalWords = Fs.readFileSync('bin/animals.txt', { encoding: 'utf8' } ).split('\n');
		adjectives = Fs.readFileSync('bin/adjectives.txt', { encoding: 'utf8' }).split('\n');
		_setupMongo();
		_setupIRC();
		rooms = new Rooms();
		typingTimers = new Map();
		tokens = new Map();

		var app = new App();
		app.router.register(new RouteHandler());
		var port = Node.process.env.get('PORT');
		app.http(port != null? Std.parseInt(port) : 9998);

		app.router.serve('/bin', './bin');
		app.router.use(function(req: Request, res: Response, next: Next) {
			var err = new express.Error('not found');
			err.status = 404;
			next.error(err);
		});
		app.error(ErrorHandling.handle);
	}

	function _setupMongo() {
		MongoClient = Lib.require('mongodb').MongoClient;

		mongoUrl = Node.process.env['MONGOLAB_URL'];
		MongoClient.Connect(mongoUrl, function(err, db) {
			if (err != null) {
				trace(err);
			}
			mongodb = db;
			_parseMessages();
		});
	}

	function _setupIRC() {
		irc = Lib.require('irc');
		untyped __js__("var irc = require('irc');");
		ircClient = untyped __js__("new irc.Client('chat.us.freenode.net', 'slickrockio', {
			channels: ['#haxe']
		});");

		ircClient.addListener('message', function(from, to, message){
			_parseIRCMessage(from, to, message);
		});

		ircClient.addListener('error', function(message) {
			Node.console.log('error: ');
			Node.console.log(message);
		});
	}

	function _parseIRCMessage(from: String, to: String, message: String) {
		addMessage(message, from, to.substr(1), true);
	}

	public static function clearTyping(room: String, id: String) {
		if (typingTimers[room] == null) {
			typingTimers[room] = new Map();
		}
		if(typingTimers[room][id] == null) {
			var timer = new Timer(10000);
			timer.run = emptyTyping.bind(room, id);
			typingTimers[room][id] = timer;
		}
		else {
			resetTypingTimer(room, id);
		}
	}

	var thing = 'test';

	public static function resetTypingTimer(room: String, id: String) {
		if (typingTimers[room] == null) {
			typingTimers[room] = new Map();
		}
		typingTimers[room][id].stop();
		var timer = new Timer(10000);
		timer.run = emptyTyping.bind(room, id);
		typingTimers[room][id] = timer;
	}

	public static function emptyTyping(room: String, id: String) {
		rooms[room].typing.remove(id);
	}

	public static function emptyRoom(room: String) {
		rooms[room].messages = [];
		mongodb.collection('messages', function(e, database) {
			if(e == null) {
				database.remove({
					room: room
				});
			}
		});
	}


	//this is not working yet
	public static function deleteMessage(room: String, id: String) {
		if(rooms[room] == null) return;
		for(m in rooms[room].messages) {
			if(m._id == id) {
				rooms[room].messages.remove(m);
				break;
			}
		}
		mongodb.collection('messages', function(e, database) {
			if(e == null) {
				database.remove({
					room: room,
					_id: new ObjectID(id)
				});
			}
		});
	}

	static function _parseMessages() {
		mongodb.collection('roominfo', function(e, database) {
			if(e == null) {
				database.find({}).toArray(function(e, r) {
					if (e != null) {
						trace(e);
						return;
					}
					var roominfo: Array<RoomInfo> = cast r;
					for (r in roominfo) {
						ensureCreated(r._id);
						if (r.users != null) {
							userCounts[r._id] = r.users;
						}
						rooms.get(r._id).lock = r.lock;
						rooms.get(r._id).pw = r.pw;
						rooms.get(r._id).salt = r.salt;
						rooms.get(r._id).theme = r.theme != null? r.theme : 'dark';
						rooms.get(r._id).names = r.names != null? r.names : false;
						rooms.get(r._id).system = r.system != null? r.system : null;
					}
				});
			}
		});
		mongodb.collection('messages', function(e, database) {
			if(e == null) {
				untyped database.find({}).sort( { _id:1 } ).toArray(function(e, r) {
					if (e != null) {
						trace(e);
						return;
					}
					var messages: Array<MessageObject> = cast r;
					for (m in messages) {
						ensureCreated(m.room);
						rooms.get(m.room).messages.push( { text: m.text, id: m.id, _id: m._id.toHexString() } );
					}
				});
			}
		});

		mongodb.collection('tokens', function(e, database) {
			if(e == null) {
				database.find({}).toArray(function(e, r) {
					if (e != null) {
						trace(e);
						return;
					}
					var tokenos: Array<TokenObject> = cast r;
					for (t in tokenos) {
						tokens[t._id] = t.token;
					}
				});
			}
		});
	}

	public static function saveMessage(msg: MessageObject) {
		if (mongodb != null) {
			mongodb.collection('messages', function(e, database) {
				if(e == null) {
					database.insertOne(msg, {}, function(e, r) {
						if (e != null) {
							trace(e);
						}
					});
				}
			});
		}
		else {
			trace('mongo null');
		}
	}

	public static function ensureCreated(room: String) {
		if (!rooms.exists(room)) {
			rooms.set(room, {
				messages: new Array<Message>(),
				lock: null,
				pw: null,
				typing: [],
				theme: 'dark',
				names: false,
				v: v
			});
		}
	}

	public static function roomInfo(roomInfo: RoomInfo) {
		var roomE = rooms[roomInfo._id];

		for(f in Reflect.fields(roomInfo)) {
			var field = Reflect.field(roomInfo, f);
			if(field == null) {
				Reflect.setField(roomInfo, f, Reflect.field(roomE, f));
			}
		}
		mongodb.collection('roominfo', function(e, database) {
			if(e == null) {
				untyped database.save(roomInfo);
			}
		});
	}

	public static function saveToken(token: TokenObject) {
		mongodb.collection('tokens', function(e, database) {
			if(e == null) {
				untyped database.save(token);
			}
		});
	}

	public static function getUserID(): String {
		var rand = new Random(Date.now().getTime());
		var ID: String = '';
		ID += adjectives[rand.int(adjectives.length)];
		var second = adjectives[rand.int(adjectives.length)];
		second = second.charAt(0).toUpperCase() + second.substr(1);
		ID += second;
		var third = animalWords[rand.int(animalWords.length)];
		third = third.charAt(0).toUpperCase() + third.substr(1);
		ID += third;

		return ID;
	}

	public static function addMessage(message: String, id: String, room: String, irc: Bool = false) {
		Main.ensureCreated(room);
		var objectid = new ObjectID();
		Main.rooms.get(room).messages.push( { text: message, id: id,  _id: objectid.toHexString()} );
		Main.saveMessage( { text: message, id: id, room: room, _id: objectid } );

		if(!irc) {
			//ircClient.say('#$room', '<$id> $message');
		}
	}

	public static function hasMongo() {
		return mongodb != null;
	}

	public static function main() {
		new Main();
	}
}

class RouteHandler implements abe.IRoute {

	var maxMessageLoad: Int = 80;

	@:get('/')
	function index() {
		Util.serveHtml('bin/home.html', function(e, d) {
			if(e == null) {
				response.send(d);
			}
		});
	}

	@:get('/top')
	function top() {
		Util.serveHtml('bin/top.html', function(e, d) {
			if(e == null) {
				response.send(d);
			}
		});
	}

	@:get('/:room')
	function chatroom(room: String) {
		room = room.toLowerCase();
		Util.serveHtml('bin/index.html', function(e, d) {
			if (e == null) {
				var withRoom: String = '';
				var startBody = d.indexOf('head') + 6;
				var theme = 'dark';
				if(Main.rooms[room] != null) {
					theme = Main.rooms[room].theme;
				}
				withRoom = d.substring(0, startBody) + '\n\t<script>var room = "$room"; var roomTheme = "$theme";</script>\n' + d.substr(startBody + 1);
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.send(withRoom);
			}
		});
	}

	@:post('/chat/:message/:room/:id/:privateID/:token')
	function sendMessage(message: String, room: String, id: String, privateID: String, token: String) {
		room = room.toLowerCase();
		_sendMessage(response, message, room, null, id, privateID, token);
	}

	@:post('/chat/:message/:room/:password/:id/:privateID/:token')
	function sendMessageWithPass(message: String, room: String, password: String, id: String, privateID: String, token: String) {
		room = room.toLowerCase();
		_sendMessage(response, message, room, password, id, privateID, token);
	}

	var imgBB: EReg = ~/(?:\[img\]|#)(.*?)(?:\[\/img\]|#)/i;

	function _sendMessage(response: Response, message: String, room: String, password: String, id: String, privateID: String, token: String) {
		if (room == 'homepage') {
			if (imgBB.match(message)) {
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.send('failed-image');
				return;
			}
		}
		if(Main.tokens[privateID] == token) {
			Main.ensureCreated(room);

			Main.emptyTyping(room, id);

			var roomE = Main.rooms.get(room);
			if(roomE.lock == null || roomE.lock == Sha1.encode(roomE.salt+password)) {
				Main.addMessage(message, id, room);
				if (Main.userCounts[room] == null) {
					Main.userCounts[room] = [];
				}
				var index = -1;
				for (i in 0...Main.userCounts[room].length) {
					if (Main.userCounts[room][i].id == privateID) {
						index = i;
					}
				}
				if (index == -1) {
					Main.userCounts[room].push({id: privateID, timestamp: Date.now()});
				}
				else {
					Main.userCounts[room][index].timestamp = Date.now();
				}
				Main.roomInfo( { _id: room, lock: roomE.lock, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[room], theme: roomE.theme, names: roomE.names } );
			}
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('success');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/getID')
	function getID() {
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(Main.getUserID());
	}

	@:get('/api/makeRandomRoom')
	function makeRandomRoom() {
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.redirect('http://slickrock.io/${Main.getUserID()}');
	}

	var oneWeek: Int = 1000 * 60 * 60 * 24 * 7;

	@:get('/api/getTopRooms')
	function getTopRooms() {
		var top10: Array<RoomMetric> = [];
		var lowest: Int = 1000000000;
		var lowestIndex: Int = -1;

		var toRemove: Array<{id: String, timestamp: Date}> = [];

		for (r in Main.userCounts.keys()) {
			if(Main.hiddenRooms.indexOf(r) != -1) continue;
			var count = Main.userCounts[r];
			for (u in count) {
				if ((Date.now().getTime() - u.timestamp.getTime()) > oneWeek) {
					toRemove.push(u);
				}
			}
			for (u in toRemove) {
				Main.userCounts[r].remove(u);
			}
			var roomE = Main.rooms[r];
			Main.roomInfo( { _id: r, lock: roomE.lock, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[r], theme: roomE.theme, names: roomE.names } );
			toRemove = [];
			if(top10.length > 0) {
				lowest = top10[0].count;
				lowestIndex = 0;
			}
			for (i in 0...top10.length) {
				var c = top10[i];
				if (c.count <= lowest) {
					lowest = c.count;
					lowestIndex = i;
				}
			}
			if (top10.length < 10) {
				top10.push({room: r, count: count.length, locked: roomE.lock != null});
			}
			else if (count.length > lowest) {
				top10.remove(top10[lowestIndex]);
				top10.push({room: r, count: count.length, locked: roomE.lock != null});
			}
		}

		top10.sort(function(r1: RoomMetric, r2: RoomMetric) {
			if (r1.count > r2.count) {
				return -1;
			}
			if (r1.count < r2.count) {
				return 1;
			}
			return 0;
		});

		response.send(top10);
	}

	@:get('/api/getRandomRoom')
	function getRandomRoom() {
		response.setHeader('Access-Control-Allow-Origin', '*');
		var openRooms = [];
		for (r in Main.rooms.keys()) {
			var room = Main.rooms[r];
			if (room.lock == null && room.messages.length > 0) {
				openRooms.push(r);
			}
		}
		var rand = new Random(Date.now().getTime());
		var room = openRooms[rand.int(openRooms.length)];
		response.redirect('http://slickrock.io/${room}');
	}

	var alphanumeric = '0123456789abcdefghijklmnopqrstuvwxyz';

	@:post('/api/gettoken/:privateID')
	function getToken(privateID: String) {
		var rand = new Random(Date.now().getTime());
		var token: String = '';
		while (token.length <= 6) {
			token += alphanumeric.charAt(rand.int(alphanumeric.length));
		}
		Main.tokens[privateID] = token;
		Main.saveToken( { _id: privateID, token: token } );
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(token);
	}

	@:post('/api/checkvalid/:privateID/:token')
	function checkValid(privateID: String, token: String) {
		var value = 'invalid';
		if (Main.tokens[privateID] == token) {
			value = 'valid';
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(value);
	}

	@:get('/api/typing/:room/:id')
	@:post('/api/typing/:room/:id')
	function typing(room: String, id: String) {
		if (Main.rooms.get(room).typing.indexOf(id) == -1) {
			Main.rooms.get(room).typing.push(id);
			Main.clearTyping(room, id);
		}
		else {
			Main.resetTypingTimer(room, id);
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('needs a response');
	}

	@:post('/api/lock/:room/:privateID/:password/:privatePass')
	function lockRoom(room: String, privateID: String, password: String, privatePass: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if(roomE.pw == null) {
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('unclaimed');
			return;
		}
		else if (roomE.pw == Sha1.encode(roomE.salt + privatePass)) {
			roomE.lock = Sha1.encode(roomE.salt+password);
			Main.roomInfo( { _id: room, lock: roomE.lock, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[room], theme: roomE.theme, names: roomE.names } );
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('locked');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	var letters = 'abcdefghijklmnopqrstuvwxyz';
	function getSalt(): String {
		var rand = new Random(Date.now().getTime());
		return letters.charAt(rand.int(letters.length)) + letters.charAt(rand.int(letters.length));
	}

	@:post('/api/empty/:room/:privatePass')
	function emptyRoom(room: String, privatePass: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if (roomE.pw == Sha1.encode(roomE.salt + privatePass)) {
			Main.emptyRoom(room);
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('emptied');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/deleteMessage/:room/:privatePass/:id')
	function deleteMessage(room: String, privatePass: String, id: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if (roomE.pw == Sha1.encode(roomE.salt + privatePass)) {
			Main.deleteMessage(room, id);
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('deleted');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/unlock/:room/:privateID/:privatePass')
	function unlockRoom(room: String, privateID: String, privatePass: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if(roomE.lock != null) {
			if (roomE.pw == Sha1.encode(roomE.salt+privatePass)) {
				roomE.lock = null;
				Main.roomInfo( { _id: room, lock: null, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[room], theme: roomE.theme, names: roomE.names  } );
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.send('unlocked');
				return;
			}
		}
		else {
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('unlocked');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/claim/:room/:privateID/:privatePass')
	function claimRoom(room: String, privateID: String, privatePass: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if ((roomE.pw == null && roomE.messages.length == 0) || Sha1.encode(roomE.salt + privatePass) == roomE.pw) {
			if(roomE.salt == null) {
				roomE.salt = getSalt();
			}
			roomE.pw = Sha1.encode(roomE.salt + privatePass);
			Main.roomInfo( { _id: room, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[room], names: roomE.names  } );
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('claimed');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/claim/:room/:privateID/:oldAdmin/:newAdmin')
	function reclaimRoom(room: String, privateID: String, oldAdmin: String, newAdmin: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if ((roomE.pw == null && roomE.messages.length == 0) || Sha1.encode(roomE.salt + oldAdmin) == roomE.pw) {
			if(roomE.salt == null) {
				roomE.salt = getSalt();
			}
			roomE.pw = Sha1.encode(roomE.salt + newAdmin);
			Main.roomInfo( { _id: room, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[room], lock: roomE.lock, theme: roomE.theme  } );
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('claimed');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/setTheme/:room/:theme/:privatePass')
	function setRoomTheme(room: String, theme: String, privatePass: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if (Sha1.encode(roomE.salt + privatePass) == roomE.pw) {
			roomE.theme = theme;
			Main.roomInfo( { _id: room, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[room], lock: roomE.lock, theme: roomE.theme  } );
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('themed');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/system/:room/:adminPassword/:systemMessage')
	function setSystemMessage(room: String, adminPassword: String, systemMessage: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if (Sha1.encode(roomE.salt + adminPassword) == roomE.pw) {
			roomE.system = systemMessage;
			Main.roomInfo( { _id: room, pw: roomE.pw, salt: roomE.salt, users: Main.userCounts[room], lock: roomE.lock, theme: roomE.theme, system: systemMessage  } );
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('set');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}

	@:post('/api/:room/:lastID')
	function getMessages(room: String, lastID: Int) {
		room = room.toLowerCase();
		_getMessages(response, room, null, lastID);
	}

	@:post('/api/:room/:password/:lastID')
	function getMessagesWithPass(room: String, password: String, lastID: Int) {
		room = room.toLowerCase();
		_getMessages(response, room, password, lastID);
	}

	@:get('/api/hist/:room/:lastID/:firstID')
	@:post('/api/hist/:room/:lastID/:firstID')
	function getMessagesHist(room: String, lastID: Int, firstID: Int) {
		room = room.toLowerCase();
		_getMessages(response, room, null, lastID, firstID);
	}

	@:post('/api/hist/:room/:password/:lastID/:firstID')
	function getMessagesHistWithPass(room: String, password: String, lastID: Int, firstID: Int) {
		room = room.toLowerCase();
		_getMessages(response, room, password, lastID, firstID);
	}

	function _getMessages(response: Response, room: String, password: String, lastID: Int, ?firstID: Int) {
		if (!Main.hasMongo()) {
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('nomongo');
			return;
		}
		Main.ensureCreated(room);

		var roomE = Main.rooms.get(room);
		if (roomE.lock == null || roomE.lock == Sha1.encode(roomE.salt + password)) {
			var roomE = Main.rooms.get(room);
			var pass = null;
			if (roomE.pw != null) {
				pass = 'true';
			}
			var messages: MessageData = {
				messages: {
					messages: new Array<Message>(),
					lock: null,
					pw: pass,
					typing: roomE.typing,
					names: roomE.names,
					system: roomE.system,
					v: Main.v
				},
				lastID: roomE.messages.length - 1
			};

			var start = 0;
			var end = roomE.messages.length;

			if (firstID != null) {
				start = firstID - maxMessageLoad;
				start = start > 0? start : 0;
				messages.firstID = start;
				end = firstID;
			}
			else {
				start = lastID + 1;
			}

			if (lastID == -1 && messages.lastID > maxMessageLoad) {
				start = messages.lastID - maxMessageLoad;
				messages.firstID = start;
			}

			if (start < roomE.messages.length || firstID != null) {
				for (i in start...end) {
					messages.messages.messages.push(roomE.messages[i]);
				}
			}
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.setHeader('Content-Type', 'application/json');
			response.send(messages);
		}
		else {
			response.setHeader('Access-Control-Allow-Origin', '*');
			if(password != null) {
				response.send('password');
			}
			else {
				response.send('locked');
			}
		}
	}
}

class ErrorHandling {
	public static function handle(err: Error, req: Request, res: Response, next: Next) {
		trace(err);
		Util.serveHtml('bin/404.html', function(e, d) {
			if(e == null) {
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.status(404).send(d);
			}
		});
	}
}

class Util {
	public static function serveHtml(path: String, handler: Error->String->Void) {
		Fs.readFile(path, { encoding: 'utf8' }, handler);
	}
}

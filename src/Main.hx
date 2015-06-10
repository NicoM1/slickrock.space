package;

import abe.App;
import express.Middleware;
import express.Response;
import haxe.crypto.Sha1;
import haxe.Json;
import haxe.Timer;
import js.Lib;
import thx.Dates.HaxeDateTools;

import js.Node;
import js.node.Fs;
import js.Error;
import js.Node;

import express.Express;

using StringTools;

class Main {
	public static var tokens: Map<String, String>;	
	static var typingTimers: Map<String, Map<String, Timer>>;
	
	static var textDB: String = '';
	
	public static var rooms: Rooms;
	
	static var animalWords: Array<String>;
	static var adjectives: Array<String>;
	
	var MongoClient: Dynamic;
	var mongoUrl = '';
	static var mongodb: Dynamic;
		
	function new() {
		animalWords = Fs.readFileSync('bin/animals.txt', { encoding: 'utf8' } ).split('\n');
		adjectives = Fs.readFileSync('bin/adjectives.txt', { encoding: 'utf8' }).split('\n');
		_setupMongo();
		rooms = new Rooms();
		typingTimers = new Map();
		tokens = new Map();
		
		var app = new App();
		app.router.register(new RouteHandler());
		var port = Node.process.env.get('PORT');
		app.http(port != null? Std.parseInt(port) : 9998);
		
		app.router.serve('/bin', './bin');
	}
	
	function _setupMongo() {
		MongoClient = Lib.require('mongodb').MongoClient;
		
		mongoUrl = Node.process.env['MONGOLAB_URL'];
		MongoClient.connect(mongoUrl, function(err, db) {
			if (err != null) {
				trace(err);
			}
			mongodb = db;
			_parseMessages();
		});
	}
	
	function _test(room: String, id: String, message: String) {
		if (!Main.rooms.exists(room)) {
			Main.rooms.set(room, {
				messages: new Array<Message>(),
				lock: null,
				pw: null,
				typing: []
			});
		}
		
		Main.emptyTyping(room, id);
		
		Main.rooms.get(room).messages.push( { text: message, id: id } );
		Main.saveMessage( { text: message, id: id, room: room} );
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
	
	public static function resetTypingTimer(room: String, id: String) {
		if (typingTimers[room] == null) {
			typingTimers[room] = new Map();
		}
		typingTimers[room][id].run = emptyTyping.bind(room, id);
	}
	
	public static function emptyTyping(room: String, id: String) {
		rooms[room].typing.remove(id);
	}
	
	static function _parseMessages() {
		mongodb.collection('roominfo').find().toArray(function(e, r) {
			if (e != null) {
				trace(e);
				return;
			}
			var roominfo: Array<RoomInfo> = cast r;
			for (r in roominfo) {
				if (!rooms.exists(r._id)) {
					rooms.set(r._id, {
						messages: new Array<Message>(),
						lock: null,
						pw: null,
						typing: []
					});
				}
				rooms.get(r._id).lock = r.lock;
				rooms.get(r._id).pw = r.pw;
				rooms.get(r._id).salt = r.salt;
			}
		});
		mongodb.collection('messages').find().sort( { _id:1 } ).toArray(function(e, r) {
			if (e != null) {
				trace(e);
				return;
			}
			var messages: Array<MessageObject> = cast r;
			for (m in messages) {
				if (!rooms.exists(m.room)) {
					rooms.set(m.room, {
						messages: new Array<Message>(),
						lock: null,
						pw: null,
						typing: []
					});
				}
				rooms.get(m.room).messages.push( { text: m.text, id: m.id } );
			}
		});
		mongodb.collection('tokens').find().toArray(function(e, r) {
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
	
	public static function saveMessage(msg: MessageObject) {
		if (mongodb != null) {
			mongodb.collection('messages').insertOne(msg, function(e, r) {
				if (e != null) {
					trace(e);
				}
			});
		}
		else {
			trace('mongo null');
		}
	}
	
	public static function roomInfo(roomInfo: RoomInfo) {
		mongodb.collection('roominfo').save(roomInfo);
	}
	
	public static function saveToken(token: TokenObject) {
		mongodb.collection('tokens').save(token);
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
		_serveHtml('bin/index.html', function(e, d) {
			if (e == null) {
				var withRoom: String = '';
				var startBody = d.indexOf('head') + 6;
				withRoom = d.substring(0, startBody) + '\n\t<script>var room = "base"</script>\n' + d.substr(startBody + 1);
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.send(withRoom);
			}
		});
	}
	
	@:get('/:room')
	function chatroom(room: String) {
		room = room.toLowerCase();
		_serveHtml('bin/index.html', function(e, d) {
			if (e == null) {
				var withRoom: String = '';
				var startBody = d.indexOf('head') + 6;
				withRoom = d.substring(0, startBody) + '\n\t<script>var room = "$room"</script>\n' + d.substr(startBody + 1);
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

	function _sendMessage(response: Response, message: String, room: String, password: String, id: String, privateID: String, token: String) {
		if(Main.tokens[privateID] == token) {
			if (!Main.rooms.exists(room)) {
				Main.rooms.set(room, {
					messages: new Array<Message>(),
					lock: null,
					pw: null,
					typing: []
				});
			}
			
			Main.emptyTyping(room, id);
			
			var roomE = Main.rooms.get(room);
			if(roomE.lock == null || roomE.lock == Sha1.encode(roomE.salt+password)) {
				Main.rooms.get(room).messages.push( { text: message, id: id } );
				Main.saveMessage( { text: message, id: id, room: room} );
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
			Main.roomInfo( { _id: room, lock: roomE.lock, pw: roomE.pw, salt: roomE.salt } );
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
	
	@:post('/api/unlock/:room/:privateID/:privatePass')
	function unlockRoom(room: String, privateID: String, privatePass: String) {
		room = room.toLowerCase();
		var roomE = Main.rooms.get(room);
		if(roomE.lock != null) {
			if (roomE.pw == Sha1.encode(roomE.salt+privatePass)) {
				roomE.lock = null;
				Main.roomInfo( { _id: room, lock: null, pw: roomE.pw, salt: roomE.salt } );
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
			Main.roomInfo( { _id: room, pw: roomE.pw, salt: roomE.salt } );
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('claimed');
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
		if (!Main.rooms.exists(room)) {
			Main.rooms.set(room, {
				messages: new Array<Message>(),
				lock: null,
				pw: null,
				typing: []
			});
		}
		
		var roomE = Main.rooms.get(room);
		if (roomE.lock == null || roomE.lock == Sha1.encode(roomE.salt + password)) {
			var roomE = Main.rooms.get(room);
			var messages: MessageData = {
				messages: {
					messages: new Array<Message>(),
					lock: null,
					pw: null,
					typing: roomE.typing
				},
				lastID: roomE.messages.length - 2
			};
			
			var start = 0;
			var end = roomE.messages.length;
			
			if (firstID != null) {
				start = firstID - maxMessageLoad;
				start = lastID > 0? lastID : 0;
				end = firstID;
			}
			else {
				start = lastID + 1;
			}
			
			if (lastID == -1 && messages.lastID > maxMessageLoad) {
				start = messages.lastID - maxMessageLoad;
				messages.firstID = lastID;
			}

			if (start < roomE.messages.length - 1 || firstID != null) {
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
	
	function _serveHtml(path: String, handler: Error->String->Void) {
		Fs.readFile(path, { encoding: 'utf8' }, handler);
	}
}

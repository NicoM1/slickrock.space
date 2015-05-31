package;

import abe.App;
import express.Middleware;
import express.Response;
import haxe.Json;

import js.Node;
import js.node.Fs;
import js.Error;

import express.Express;

using StringTools;

class Main {

	public static var db: Array<String> = [];
	public static var tokens: Array<Int> = [];
	
	static var textDB: String = '';
	
	public static var rooms: Rooms;
		
	function new() {
		rooms = new Rooms();
		
		var app = new App();
		app.router.register(new RouteHandler());
		var port = Node.process.env.get('PORT');
		app.http(port != null? Std.parseInt(port) : 9998);
		
		app.router.serve('/bin', './bin');
	}
	
	public static function main() {
		new Main();
	}
}

class RouteHandler implements abe.IRoute {
	
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
	function sendMessage(message: String, room: String, id: Int, privateID: Int, token: Int) {
		_sendMessage(response, message, room, null, id, privateID, token);
	}
	
	@:post('/chat/:message/:room/:password/:id/:privateID/:token')
	function sendMessageWithPass(message: String, room: String, password: String, id: Int, privateID: Int, token: Int) {
		_sendMessage(response, message, room, password, id, privateID, token);
	}

	function _sendMessage(response: Response, message: String, room: String, password: String, id: Int, privateID: Int, token: Int) {
		if(Main.tokens[privateID] == token) {
			if (!Main.rooms.exists(room)) {
				Main.rooms.set(room, {
					messages: new Array<Message>(),
					lock: null,
					owner: null
				});
			}
			
			if(Main.rooms.get(room).lock == null || Main.rooms.get(room).lock == password) {
				Main.rooms.get(room).messages.push( { text: message, id: id } );
			}
		}
		
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('maybe it just needs a response');
	}
	
	@:post('/api/gettoken/:privateID') 
	function getToken(privateID: Int) {
		Main.tokens[privateID] = Std.int(Math.random() * 0xFFFFFF);
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(Std.string(Main.tokens[privateID]));
	}

	@:post('/api/checkvalid/:privateID/:token') 
	function checkValid(privateID: Int, token: Int) {
		var value = 'invalid';
		if (Main.tokens[privateID] == token) {
			value = 'valid';
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(value);
	}
	
	@:post('/api/lock/:room/:privateID/:password')
	function lockRoom(room: String, privateID: Int, password: String) {
		var roomE = Main.rooms.get(room);
		if (roomE.owner == privateID ||  (roomE.messages.length == 0 && roomE.lock == null)) {
			roomE.lock = password;
			roomE.owner = privateID;
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.send('locked');
			return;
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send('failed');
	}
	
	@:get('/api/:room/:lastID')
	@:post('/api/:room/:lastID')
	function getMessages(room: String, lastID: Int) {
		_getMessages(response, room, null, lastID);
	}
	
	@:post('/api/:room/:password/:lastID')
	function getMessagesWithPass(room: String, password: String, lastID: Int) {
		_getMessages(response, room, password, lastID);
	}
	
	function _getMessages(response: Response, room: String, password: String, lastID: Int) {
		if (!Main.rooms.exists(room)) {
			Main.rooms.set(room, {
				messages: new Array<Message>(),
				lock: null,
				owner: null
			});
		}
		
		if(Main.rooms.get(room).lock == null || Main.rooms.get(room).lock == password) {
			var messages: MessageData = {
				messages: {
					messages: new Array<Message>(),
					lock: null,
					owner: null
				},
				lastID: Main.rooms.get(room).messages.length - 1
			};
			
			if (lastID < Main.rooms.get(room).messages.length - 1) {
				for (i in (lastID + 1)...Main.rooms.get(room).messages.length) {
					messages.messages.messages.push(Main.rooms.get(room).messages[i]);
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

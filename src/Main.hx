package;

import abe.App;
import express.Middleware;
import haxe.Json;

import js.Node;
import js.node.Fs;
import js.Error;

import express.Express;

using StringTools;

class Main {

	public static var db: Array<String> = [];
	
	static var textDB: String = '';
	
	public static var messages: MessageList = {
		messages: new Array<Message>()
	};
	
	public static var highestUser: Int = 0;
		
	function new() {
		var app = new App();
		app.router.register(new RouteHandler());
		var port = Node.process.env.get('PORT');
		app.http(port != null? Std.parseInt(port) : 9998);
		
		app.router.serve('/', './bin');

		/*Fs.readFile('db/messages.db', { encoding: 'utf8' }, function(err, data) {
			if (err == null) {
				_parseMessages(data);
			}
			else {
				trace(err);
			}
		});*/
	}
	
	function _parseMessages(data: String) {
		messages = cast Json.parse(data);
	}

	public static function main() {
		new Main();
	}
}

class RouteHandler implements abe.IRoute {
	
	@:get('/')
	function index() {
		response.send('Hello World!' );
	}
	
	@:get('/chat/:message')
	function post(message: String) {
		Main.messages.messages.push({text: message, id: -1});
		/*Fs.writeFile('db/messages.db', Json.stringify(Main.messages), { }, function(err) {
			if(err != null) {
				trace(err);
			}
		});*/
		response.redirect(302, '../chat');
	}
	
	@:post('/chat/:message/:id')
	function postWithID(message: String, id: Int) {
		Main.messages.messages.push({text: message, id: id});
		/*Fs.writeFile('db/messages.db', Json.stringify(Main.messages), { }, function(err) {
			if(err != null) {
				trace(err);
			}
		});*/
	}
	
	@:post('/api/getuser/') 
	function getUser() {
		response.send(Std.string(++Main.highestUser));
	}
	
	@:get('/api/:lastID')
	@:post('/api/:lastID')
	function api(lastID: Int) {
		var messages: MessageData = {
			messages: {
				messages: new Array<Message>()
			},
			lastID: Main.messages.messages.length - 1
		};
		
		if (lastID < Main.messages.messages.length - 1) {
			for (i in (lastID + 1)...Main.messages.messages.length) {
				messages.messages.messages.push(Main.messages.messages[i]);
			}
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(messages);
	}
	
	@:get('/chat')
	function chat() {
		_serveHtml('bin/index.html', function(e, d) {
			if (e == null) {
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.send(d);
			}
		});
	}
	
	@:get('/chat/')
	function chat1() {
		_serveHtml('bin/index.html', function(e, d) {
			if (e == null) {
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.send(d);
			}
		});
	}

	var imgBB: EReg = ~/\[img\](.*?)\[\/img\]/i;
	var boldBB: EReg = ~/\[b\](.*?)\[\/b\]/i;
	var italicBB: EReg = ~/\[i\](.*?)\[\/i\]/i;
	
	function _parseMessage(raw: String): String {
		var parsed: String = raw.replace('\n', ' ');
		parsed = parsed.htmlEscape();
		while (imgBB.match(parsed)) {
			var imgPath = imgBB.matched(1);
			var imgTag = '<img src=$imgPath></img>';
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
		return parsed;
	}
	
	function _serveHtml(path: String, handler: Error->String->Void) {
		Fs.readFile(path, { encoding: 'utf8' }, handler);
	}
}

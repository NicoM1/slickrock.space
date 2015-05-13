package;

import abe.App;

import js.Node;
import js.node.Fs;

using StringTools;

class Main {

	public static var db: Array<String> = [];
	
	static var textDB: String = '';
	
	public static var messages: Array<String> = [
		'Chat by adding "/this is my message" to the url and pressing enter.'
	];
		
	function new() {
		var app = new App();
		app.router.register(new RouteHandler());
		var port = Node.process.env.get('PORT');
		app.http(port != null? Std.parseInt(port) : 9998);
		
		Fs.readFile('db/db.db', { encoding: 'utf8' }, function(err, data) {
			if (err == null) {
				_parseDB(data);
			}
			else {
				trace(err);
			}
		});
		Fs.readFile('db/messages.db', { encoding: 'utf8' }, function(err, data) {
			if (err == null) {
				_parseMessages(data);
			}
			else {
				trace(err);
			}
		});
	}
	
	
	function _parseDB(data: String) {
		data.replace('\r\n', '\n');
		textDB = data;
		db = data.split('\n');
	}
	
	function _parseMessages(data: String) {
		data.replace('\r\n', '\n');
		messages = data.split('\n');
	}
	
	public static function saveUser(name: String) {
		textDB += '\n' + name;
		Fs.writeFile('db/db.db', textDB, { }, function(err) {
			if(err != null) {
				trace(err);
			}
		});
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
		Main.messages.push(message);
		Fs.writeFile('db/messages.db', Main.messages.join('\n'), { }, function(err) {
			if(err != null) {
				trace(err);
			}
		});
		response.redirect(302, '../chat');
	}
	
	@:get('/chat')
	function chat() {
		var page = '';
		page += '<script>';
		page += 'window.onload=toBottom;';
		page += 'function toBottom() {	window.scrollTo(0, document.body.scrollHeight); }';
		page += 'function reload() {  if(window.innerHeight + window.scrollY >= document.body.offsetHeight) {window.location.href = window.location.href;} else { setTimeout(function() { reload(); }, 3000); } }';
		page += 'setTimeout(function() { reload(); }, 3000);';
		page += '</script>';
		page += '<body>';
		for (i in 0...Main.messages.length) {
			var message = Main.messages[i];
			message = message.replace('\n', ' ');
			page += '<div>';
			page += message.htmlEscape();
			page += '</div>';
		}
		page += '</body>';
		response.send(page);
	}

	@:get('/user/:id')
	function getUser(id: Int) {
		if (Main.db.length > id) {
			response.send(Main.db[id]);
		}
		else {
			response.send('Error: no user with that ID.');
		}
	}
	
	@:get('/user/create/:name')
	function createUser(name: String) {
		Main.db.push(name);
		response.send(name + ': created.');
		Main.saveUser(Main.db[Main.db.length - 1]);
	}
}

package;

import abe.App;

import js.Node;
import js.node.Fs;

class Main {
	public static var db: Array<String> = [];
	
	static var textDB: String = '';
		
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
	}
	
	
	function _parseDB(data: String) {
		textDB = data;
		db = data.split('\n');
		for (i in 0...db.length) {
			if (db[i].indexOf('\r') != -1) {
				db[i] = db[i].substring(0, db[i].indexOf('\r'));
			}
		}
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
	var messages: Array<String> = [
	];
	
	@:get('/')
	function index() {
		response.send('Hello World!' );
	}
	
	@:get('/chat/:message')
	function post(message: String) {
		messages.push(message);
		response.redirect(302, '../chat');
	}
	
	@:get('/chat')
	function chat() {
		var page = '';
		for (i in 0...messages.length) {
			page += '<div>';
			page += messages[i];
			page += '</div>';
		}
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
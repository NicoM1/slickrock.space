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
	
	public static var messages: Array<String> = [
		'Chat by adding "/this is my message" to the url and pressing enter.'
	];
		
	function new() {
		var app = new App();
		app.router.register(new RouteHandler());
		app.router.serve('/bin/', '/bin/');
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
	
	/*@:get('/chat/:message/:id')
	function post(message: String, id: Int) {
		Main.messages.push(message);
		Fs.writeFile('db/messages.db', Main.messages.join('\n'), { }, function(err) {
			if(err != null) {
				trace(err);
			}
		});
		response.redirect(302, '../chat');
	}*/
	
	@:get('/api/:lastID')
	@:post('/api/:lastID')
	function api(lastID: Int) {
		var messages: MessageData = {
			messages: new Array<String>(),
			lastID: Main.messages.length - 1
		};
		
		if (lastID < Main.messages.length - 1) {
			for (i in (lastID + 1)...Main.messages.length) {
				messages.messages.push(Main.messages[i]);
			}
		}
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(messages);
	}
	
	@:get('/chat')
	function chat() {
		/*var page = '';
		page += '<script>';
		page += 'window.onload=toBottom;';
		page += 'function toBottom() {	window.scrollTo(0, document.body.scrollHeight); }';
		page += 'function reload() {  if(window.innerHeight + window.scrollY >= document.body.offsetHeight) {window.location.href = window.location.href;} else { setTimeout(function() { reload(); }, 3000); } }';
		page += 'setTimeout(function() { reload(); }, 3000);';
		page += '</script>';
		page += '<body>';
		for (i in 0...Main.messages.length) {
			var message = _parseMessage(Main.messages[i]);
			page += '<div>';
			page += message;
			page += '</div>';
		}
		page += '</body>';
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.send(page);*/
		
		_serveHtml('bin/index.html', function(e, d) {
			if (e == null) {
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.send(d);
			}
		});
	}
	
	/*@:get('/bin/:path')
	function bin(path: String) {
		_serveHtml('bin/'+path, function(e, d) {
			if (e == null) {
				switch(path.substr(path.lastIndexOf('.') + 1)) {
					case 'js':
						response.setHeader('content-type', 'application/javascript');
					case 'css':
						response.setHeader('content-type', 'text/css');
						
				}
				response.send(d);
			}
		});
	}*/
	
	/*@:get('/client')
	function client() {
		var page: String = '';
		page += '<script>';
		page += 'var curMessage;';
		page += 'function httpGet(theUrl) {
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", theUrl, false );
					xmlHttp.send( null );
					return xmlHttp.responseText;
				}';
		page += 'function enterpressalert(e, textarea) {
					var code = (e.keyCode ? e.keyCode : e.which);
					if(code == 13) { //Enter keycode
						httpGet(\'https://aqueous-basin-8995.herokuapp.com/chat/\'+curMessage);
					var i = document.getElementsByTagName("textarea")[0].value = ""; 
					}
				}';
		page += 'function inputChanged(event) { curMessage = encodeURIComponent(event.target.value);}';
		page += '</script>';
		page += '<body style="margin:0px;padding:0px;">';
		page += '<iframe src="https://aqueous-basin-8995.herokuapp.com/chat" width=\'100%\' height=\'90%\' style="border:0px;"></iframe>';
		page += '<textarea oninput=\'inputChanged(event)\' onKeyPress="enterpressalert(event, this)" style="width: 100%; height: 10%;">';
		page += '</textarea>';
		page += '</body>';
		response.send(page);
	}*/
	
	@:get('/test')
	function test() { 
		_serveHtml('db/backup.html', function(e, d) {
			if (e == null) {
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
		//
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
	
	function _serveHtml(path: String, handler: Error->String->Void) {
		Fs.readFile(path, { encoding: 'utf8' }, handler);
	}
}

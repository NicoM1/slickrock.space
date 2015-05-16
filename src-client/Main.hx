package;

import haxe.Timer;
import js.Lib;
import js.Browser;
import haxe.Http;
import haxe.Json;

/**
 * ...
 * @author NicoM1
 */

class Main 
{
	var basePath: String = 'https://aqueous-basin-8995.herokuapp.com/api/';
	var lastIndex: Int = 0;
	
	var http: Http;
	
	function new() {
		http = new Http(basePath + lastIndex);
		http.async = true;
		http.onData = _parseMessages;
		http.onError = function(error) { trace(error); }

		_loop();
	}
	
	function _loop() {
		Timer.delay(function() {
			http.url = basePath + lastIndex;
			http.request(true);
			_loop();
		}, 1000);
	}
	
	function _parseMessages(data) {
		var parsed: MessageData = Json.parse(data);
		for (p in parsed.messages) {
			var message = Browser.document.createDivElement();
			message.innerHTML = p;
			Browser.document.body.appendChild(message);
		}
		lastIndex = parsed.lastID;
	}
	
	static function main() {
		new Main();
	}	
}
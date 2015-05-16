package;

import js.Lib;
import haxe.Http;

/**
 * ...
 * @author NicoM1
 */

class Main 
{
	
	static function main() 
	{
		var http: Http = new Http('http://localhost:9998/api/0');
		http.async = true;
		http.onData = function(data) { trace(data); }
		http.onError = function(error) { trace(error); }
		http.request(true);
	}
	
}
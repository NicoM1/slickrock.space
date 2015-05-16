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
		var http: Http = new Http('https://aqueous-basin-8995.herokuapp.com/api/0');
		http.async = true;
		http.onData = function(data) { trace(data); }
		http.onError = function(error) { trace(error); }
		http.request(true);
	}
	
}
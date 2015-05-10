package;

import abe.App;

class Main {
	public static function main() {
		var app = new App();
		app.router.register(new RouteHandler());
		app.http(9998); // running on port 9998
	}
}

class RouteHandler implements abe.IRoute {
	
	var users: Array<String> = [
		'juan',
		'frances'
	];
		
	@:get('/')
	function index() {
		response.send('Hello World!');
	}

	@:get('/user/:id')
	function getUser(id: Int) {
		if (users.length > id) {
			response.send(users[id]);
		}
		else {
			response.send('Error: no user with that ID.');
		}
	}
	
	@:get('/user/create/:id')
	function createUser(id: Int) {
		if (users[id] == null) {
			users[id] = 'NEW USER';
			response.send(users[id] + ': created.');
		}
		else {
			response.send('Error: user with that ID already exists.');
		}
	}
}
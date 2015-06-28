package;

typedef RoomInfo = {
	?lock: String,
	?salt: String,
	?pw: String,
	?users: Array<{timestamp: Date, id: String}>,
	?theme: String,
	_id: String
}

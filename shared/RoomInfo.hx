package;

typedef RoomInfo = {
	?lock: String,
	?salt: String,
	?pw: String,
	?users: Array<{timestamp: Date, id: String}>,
	_id: String
}
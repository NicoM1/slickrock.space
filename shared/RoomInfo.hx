package;

typedef RoomInfo = {
	?lock: String,
	?salt: String,
	?pw: String,
	?users: Array<{timestamp: Date, id: String}>,
	?theme: String,
	?names: Bool,
	?system: String,
	_id: String
}

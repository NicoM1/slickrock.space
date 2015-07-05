package;

typedef MessageList = {
	lock: String,
	?salt: String,
	pw: String,
	?theme: String,
	?names: Bool,
	messages: Array<Message>,
	typing: Array<String>
}

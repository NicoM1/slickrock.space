package;

typedef MessageList = {
	lock: String,
	?salt: String,
	pw: String,
	?theme: String,
	?names: Bool,
	?system: String,
	messages: Array<Message>,
	typing: Array<String>
}

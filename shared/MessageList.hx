package;

typedef MessageList = {
	lock: String,
	?salt: String,
	pw: String,
	?theme: String,
	names: Bool,
	?system: String,
	v: Int,
	messages: Array<Message>,
	typing: Array<String>
}

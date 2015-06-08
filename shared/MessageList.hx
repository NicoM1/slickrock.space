package;

typedef MessageList = {
	lock: String,
	?salt: String,
	pw: String,
	messages: Array<Message>,
	typing: Array<String>
}
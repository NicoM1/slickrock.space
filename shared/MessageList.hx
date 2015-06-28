package;

typedef MessageList = {
	lock: String,
	?salt: String,
	pw: String,
	?theme: String,
	messages: Array<Message>,
	typing: Array<String>
}

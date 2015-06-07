package;

typedef MessageList = {
	lock: String,
	?salt: String,
	owner: String,
	messages: Array<Message>,
	typing: Array<String>
}
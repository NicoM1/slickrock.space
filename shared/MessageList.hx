package;

typedef MessageList = {
	lock: String,
	owner: Int,
	messages: Array<Message>,
	typing: Array<Int>
}
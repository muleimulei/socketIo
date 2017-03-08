
var Chat = function(socket){
	this.socket = socket;
}

Chat.prototype.sendMessage = function(room, text){
	var mes = {
		room: room,
		text: text,
	};
	this.socket.emit('message',mes);
};

Chat.prototype.changeRoom = function(room){
	this.socket.emit('join',{
		newRoom: room,
	});
};

Chat.prototype.processCommand = function(command){
	var words = command.split(' ');
	var command = words[0].substr(1).toLowerCase();
	var message = false;
	switch(command){
		case 'join':
			words.shift();
			var name = words.join('');
			this.changeRoom(name);
			break;
		case 'nick':
			words.shift();
			var name = words.join('');
			this.socket.emit('nameAttempt',name);
			break;
		default:
			message = 'Unrecognized command';
			break;
	}
	return message;
}

var input = document.getElementById('send-message');
var mes = document.getElementById('messages');
var room = document.getElementById('room');
var roomlist = document.getElementById('room-list');
var form = document.getElementById('send-form');

function divEscapedContentElement(mes){
	var d = document.createElement('div');
	d.textContent = mes;
	d.innerText = mes;
	return d;
}



function divSystemContentElement(mes){
	var d = document.createElement('div');
	d.innerHTML = mes;
	return d;
}

function processUserInput(chatApp,socket){
	var message = input.value;
	console.log(message);
	var systemMessage;

	if(message.charAt(0)=='/'){ //如果用户输入的内容以斜杠开头，可将其作为聊天命令
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			mes.appendChild(divSystemContentElement(systemMessage));
		}
	}else{
		chatApp.sendMessage(room.innerText,message);
		mes.appendChild(divEscapedContentElement(message));
		mes.scrollTop = mes.scrollHeight;
	}
	input.value = '';
}
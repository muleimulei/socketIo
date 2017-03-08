
var socketio = require('socket.io')();

var guestNumber =1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var io;


exports.listen = function(server){
	io = socketio.listen(server);
	// io.set('log level',1);
	io.sockets.on('connect',function(socket){
		guestNumber = assignGuestName(socket);
		joinRoom(socket,'Lobby');//用户连接上时把他放入Lobby聊天室
		handleMessageBroadcasting(socket); //处理用户的消息，更名，以及聊天室变更
		handleNameChangeAttempt(socket,nickNames,namesUsed);
		handleRoomJoining(socket);

		socket.on('rooms',function(){//用户发出请求时，向其提供已经被占用的聊天室列表
			socket.emit('rooms',io.sockets.adapter.rooms);
		})
		handleClientDisconnection(socket,nickNames,namesUsed);//定义用户断开连接后的清除逻辑
	});
};

function assignGuestName(socket){
	var name = 'Guest '+guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult',{ //让用户知道他们的昵称
		success: true,
		name: name,
	});
	namesUsed.push(name); //存放已经被占用的昵称
	return guestNumber+1; //增加用来生成昵称的计数器
}

function joinRoom(socket,room){
	socket.join(room); //让用户进入房间
	currentRoom[socket.id] = room; //记录用户当前的房间
	socket.emit('joinResult',{room: room}); //让用户知道自己进入新的房间

	//让房间里的其他用户知道新用户进入了房间
	socket.broadcast.to(room).emit('message',{
		text: nickNames[socket.id] + 'has joined ' +room + '.'
	});

	io.sockets.in(room).clients(function(err,clients){
		console.log(clients);
		if(clients.length>1){
			var userInRoomSummary = 'Users currently in' +room +': ';
			for(var index in clients){
				var userSocketId = clients[index];

				if(userSocketId!=socket.id){
					if(index>0){
						userInRoomSummary += ', ';
					}
					userInRoomSummary +=nickNames[userSocketId];
				}
			}

			userInRoomSummary+='.';
			// console.log('summary'+userInRoomSummary);
			// console.log('user'+currentRoom)
			socket.emit('message',{
				text: userInRoomSummary
			})
		}
	});
}

function handleNameChangeAttempt(socket,nickNames,namesUsed){
	socket.on('nameAttempt',function(name){ //添加nameAttempt
		if(name.indexOf('Guest')==0){ //昵称不能以Guest开头
			socket.emit('nameResult',{
				success : false,
				message: 'Names cannot begin with "Guest" '
			});
		}else{
			if(namesUsed.indexOf(name)==-1){
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);

				namesUsed.push(name);
				nickNames[socket.id]= name;
				delete nickNames[previousNameIndex];

				socket.emit('nameResult',{
					success: true,
					name: name
				});

				socket.to(currentRoom[socket.id]).emit('message',{
					text: previousName + 'is now known as '+ name+ '.'
				});
			}else{
				socket.emit('nameResult',{
					success: true,
					message: 'That name is already in use'
				})
			}
		}
	});
}

function handleMessageBroadcasting(socket){
	socket.on('message',function(data){
		socket.to(currentRoom[socket.id]).emit('message',{
			text: nickNames[socket.id] + ':' +data.text
		});
	});
}

function handleRoomJoining(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id],function(err){
			if(err){
				socket.emit('message',{
					text: '加入失败'
				})
			}
		});
		joinRoom(socket,room.newRoom);
	});

}

function handleClientDisconnection(socket,nickNames,namesused){
	socket.on('disconnect',function(){
		socket.disconnect(true);
		var nameIndex = namesused.indexOf(nickNames[socket.id]);
		delete namesused[nameIndex];
		delete nickNames[socket.id];
	})
}
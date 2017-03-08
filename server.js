
var http  = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

// 发送文件数据及错误响应

function send404(res){
	res.writeHead(404,{'Content-type':'text/plain'});
	res.end('Error 404: resource not found');
}


function sendFile(res,filePath,fileData){
	res.writeHead(200,{'Content-type':mime.lookup(path.basename(filePath))});
	res.end(fileData);
}

// 提供静态文件服务
function serveStatic(res, cache, abspath){
	if(cache[abspath]){//检查文件是否缓存在内存中
		sendFile(res,abspath,cache[abspath]);  //从内存返回文件
	}else{
		fs.exists(abspath,function(exists){
			if(!exists){
				send404(res);
			}else{
				fs.readFile(abspath,function(err,data){
					cache[abspath] = data; //缓存在cache中
					sendFile(res,abspath,data); //从内存读取文件并返回
				});
			}
		});
	}
}

var server = http.createServer(function(req,res){
	var filePath = '';
	if(req.url=='/'){
		filePath = 'public/index.html';
	}else{
		filePath = 'public'+req.url;
	}
	var abspath = './'+filePath;
	serveStatic(res,cache,abspath);
});

var chatServer = require('./lib/chat-server');
server.listen(3000);

chatServer.listen(server);
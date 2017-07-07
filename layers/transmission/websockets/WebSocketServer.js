"use strict"; 
var WebSocketDefault = require('./WebSocketDefault');


class WebSocketServer  extends WebSocketDefault{	
    constructor(port) {
    	super();
        try {
        	var express=require('express');
        	var app = express();
        	var http = require('http').Server(app);
        	this.io = require('socket.io')(http);

            this.io.set('transports', ['websocket']); //NUEVO AÑADIDO 16/12/2016
            this.io.set('close timeout', 60*60*24); // 24h time out
            this.io.set('heartbeats', false);
            this.io.set('heartbeat interval', 999);            
            this.io.set('heartbeat timeout', 99999);
        	
        	app.use(express.static(__dirname + '/web/'));
        	
        	app.get('/', function(req, res){	
        	    res.sendFile(__dirname + '/web/'+Common.Constants.Index);        		  
                });
        	 	
        	this.io.on('connection', (socket)=>{
                this.addSocket(socket);
        		this.communicationsLayer.processConnect(socket.id,1.1);     //ID de mensaje conectar=1.1
                console.log("NEW SOCKET CONNECTED!");
                console.log("Sockets Number -> "+Object.keys(this.sockets).length);                        
        		
        		socket.on('disconnect', (msg)=>{
                    console.log("SOCKET DISCONNECTED!"); 
                    this.communicationsLayer.processDisconnectRequest(socket.id);
        	        this.removeSocket(socket);
        			socket.disconnect();    //TODO ¿es necesario?
                    console.log("Sockets Number -> "+Object.keys(this.sockets).length);
                });
        		 
                socket.on('message', (msg)=>{
        		    this.receive(msg);     				
        		});
        		socket.on('close', (evt)=>{
        		    console.log("Socket.IO close -> "+evt);
        		});  
        		socket.on('error', (evt)=>{
        		    console.log("Socket.IO errror -> "+evt);
        	    });                           
                          
        	});

        	http.listen(port, ()=>{
        	    console.log('listening on *:'+port);
            });        	

        } catch (err){
            console.log("ERRROR: "+err.message);
            console.log("ERRROR STACK: "+err.stack);
//            this.server.close();
            throw err;
        }
    }
 
    processRequest(message){
        this.communicationsLayer.processRequest(message);    	
    }   
    processResponse(message){
        this.communicationsLayer.processResponse(message);
    }     

}

module.exports = WebSocketServer;
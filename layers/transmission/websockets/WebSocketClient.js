"use strict"; 
var WebSocketDefault = require('./WebSocketDefault');

class WebSocketClient  extends WebSocketDefault{	
        constructor(ip,port) {
            super();            

            let connectionOptions =  {
                "upgrade" : false,
                'forceNew':true,
                'allowUpgrades':false,
                'pingInterval': 45000,
                'pingTimeOut': 45000,

                "force new connection" : true,
                "reconnection": true,
                "reconnectionDelay": 2000,                  //starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
                "reconnectionDelayMax" : 60000,             //1 minute maximum delay between connections
                "reconnectionAttempts": "Infinity",         //to prevent dead clients, having the user to having to manually reconnect after a server restart.
                "timeout" : 10000,                           //before connect_error and connect_timeout are emitted.
                "transports" : ["websocket"]                //forces the transport to be only websocket. Server needs to be setup as well/
            }

            //var socket =io.connect("http://192.168.1.2:3000",{'force new connection': true, transports: ['websocket'], upgrade: false});
            //var socket =io.connect("http://192.168.0.103:3000",connectionOptions);           
            //var socket =io.connect("http://ec2-52-208-138-132.eu-west-1.compute.amazonaws.com:3000",connectionOptions);
            //this.monitorSocket =io.connect("http://192.168.1.11:3000",connectionOptions);
            this.monitorSocket =io.connect("http://"+ip+":"+port,connectionOptions);

            this.monitorSocket.on('message', (msg)=>{
                this.receive(msg);
            }); 

        //ESTO LO HE AÑADIDO LUEGO 17-12-2016
            this.monitorSocket.on('disconnect', function(msg){
                alert("SOCKET DISCONNECTED!"+msg); 
                alert(JSON.stringify(msg)); 
            });
                 
            this.monitorSocket.on('close', function(evt){
                alert("Socket.IO close -> "+evt);
            });  
            this.monitorSocket.on('error', function(evt){
                alert("Socket.IO errror -> "+evt);
            })       
                //ESTO LO HE AÑADIDO LUEGO 17-12-2016
            this.monitorSocket.on('open', ()=>{
                 alert("OPEN");
            });                  

            this.monitorSocket.id=0; //ID del monitor es 0
            
                //COMENTARIOS           
        }
 
        processRequest(message){           
            if (message.getError()) this.processError(message.getError());

            this.communicationsLayer.processRequest(message); 
        }

        processResponse(message){
            if (message.getError()) this.processError(message.getError());
            
            this.communicationsLayer.processResponse(message); 
        }   
        initialize(communicationsLayer){
            super.initialize(communicationsLayer);
            this.addSocket(this.monitorSocket);
        }  

}

module.exports = WebSocketClient;
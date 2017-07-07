"use strict"; 

class WebSocketDefault  {	
    constructor() {
        this.communicationsLayer =  null; //SE DEBE UTILIZAR EL SET    
        this.sockets = {};  //Mapa de los sockets conectados.          
    }

    initialize(communicationsLayer){
    	this.setCommunicationsLayer(communicationsLayer);
    }      
    
    setCommunicationsLayer(communicationsLayer){
        this.communicationsLayer=communicationsLayer;    	
    }    

     
    sendTo(message,socket){        
        if (message.getType()==Common.Constants.MessageTypes.SOLUTION_FOUND)console.log("ENVIAMOS "+JSON.stringify(message),true)
        var messageString = JSON.stringify(message);   
        //console.log("MENSAJE ENVIADO: "+messageString);
        socket.emit('message', messageString); 	
    }      

    send(message){
        var socket = this.sockets[message.getDestinyId()];
        console.log("send(message){"+message.getDestinyId());
        if (socket){
            this.sendTo(message,socket);            
        } else { //Si ya no existe se elimina de las listas.
            console.log("Node Disconnected: "+message.getDestinyId())
            this.communicationsLayer.removeNode(message.getDestinyId());
            this.removeSocketById(message.getDestinyId());
        }
    } 
 
    receive(message){
        console.log("MENSAJE RECIBIDO= "+message);
        message=JSON.parse(message);
        message=Common.Elements.Message.fromJSON(message);     
        if (message.getId()<0){ //Si el ID es menor que cero entonces son respuestas.
            this.processResponse(message);
        }else {  //Si no son peticiones.          
            this.processRequest(message);             
        }  
    }    
    
    processRequest(){
    	throw new Error("Abstract Method.");
    }
    processResponse(){
    	throw new Error("Abstract Method.");
    }     
    processError(message){
        console.log("Transmission Errror received from: "+message.getSourceId());
        console.log("ERRROR: "+message.getError().message);
        console.log("ERRROR STACK: "+message.getError().stack);        
    }    


    addSocket(socket){
		if (socket){
            console.log("SOCKET AÑADIDO -> ID: "+socket.id);
			this.sockets[socket.id]=socket;   
            this.communicationsLayer.addNode(socket.id);
			return socket.id; 
		} else {
			throw new Error("socket isNullOrUndefined");
		}    	
    } 


    removeSocketById(id){
        this.communicationsLayer.removeNode(id);
        delete this.sockets[id]; 
        console.log("ID SOCKET ELIMINADO -> "+id);   	    	
    }
    
    removeSocket(socket){ 	    	
        this.removeSocketById(socket.id);
    }    

}

module.exports = WebSocketDefault;
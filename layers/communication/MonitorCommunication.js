"use strict"; 
var Communications = require('./Communications.js');

class MonitorCommunication extends Communications  {	
    constructor() {
    	super();
        this.setMyId(0);//NODO DEL MONITOR ES 0
    }
    initialize(appLayer,transmissionsLayer) {
        this.setApplicationLayer(appLayer);
        this.setTransmissionsLayer(transmissionsLayer);    	
    }
    
    processRequest(message){
        if (message.getError()){ //ERROR no es null o undefined      
            this.processError(message.getError());
        } else {
            this.applicationLayer.processRequest(message); 
        }                	
    }   
    processResponse(message){            
        if (message.getError()){ //ERROR no es null o undefined      
            this.processError(message.getError());
        } else {
            this.applicationLayer.processResponse(message);         
        }
        try {
            this.removeMessageWaitingResponse(message);              
        }catch(e){
            console.log(e.message);
            console.log(e.stack);
        }  	
    }    
    
    processConnect(idNode,idMessage){ 
        let node = this.addNode(idNode);
        let message = new Common.Elements.Message(Common.Constants.MessageTypes.CONNECT, "-"+idMessage, this.getMyId(), idNode, null,null, new Date().getTime()); //RESPONDEMOS CON LA ID DEL NUEVO NODO  
        this.transmissionsLayer.send(message);
        this.applicationLayer.processConnect(idNode);
    }

    processDisconnectRequest(idNode){
        this.applicationLayer.processDisconnectRequest(idNode);
        this.removeNode(idNode);
    }   
}


module.exports = MonitorCommunication;
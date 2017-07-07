"use strict"; 
var Communications = require('./Communications.js');


class SlaveCommunication extends Communications  {	
    constructor() {
    	super();
    	this.monitorId=0;
    }

    
    initialize(specificAlgorithm, transmissionsLayer){
        this.setApplicationLayer(specificAlgorithm);
        this.setTransmissionsLayer(transmissionsLayer);
    }    

    reset(){
        this.nodes[this.monitorId].clearMessagesWaitingResponse(); 
    }

    processRequest(message){
        var felipe=message;
        if (message.getError()){ //ERROR no es null o undefined      
            this.processError(message.getError());
        } else {
            this.applicationLayer.processRequest(message.getType(),message.getData(),(response)=>{
                var message = new Common.Elements.Message(felipe.getType(),"-"+felipe.getId(), this.getMyId(), felipe.getSourceId(), null,response, new Date().getTime());
                this.transmissionsLayer.send(message);                 
            }); 
        }     


        this.applicationLayer.processRequest(message);       	
    }
    
    processResponse(message){        
        switch(message.getType()) {
        case Common.Constants.MessageTypes.CONNECT:
            this.processConnectResponse(message);
            break;   	         
        default:
            //NOTHING TO DO
        } 

        this.applicationLayer.processResponse(message);
    }

    processConnectResponse(message){
        let idNode=message.getSourceId();
        let data=message.getData();
        let destinyId=message.getDestinyId();
        if (data){ //dataAlgorithm
            this.getApplicationLayer().processStart(data,()=>{});
        }
        var node = this.addNode(this.monitorId);
        node.setConnected(true);
        //Asignamos myId
        this.setMyId(destinyId);
    }     

 
    start(data){
        if (this.getMyId()!=null){
            var node = this.getFreeNode(); //COMO EL ÚNICO NODO QUE TIENE ES EL MONITOR PUES ES EL QUE VA A COGER SIEMPRE  
            var messageId = node.getNextMessageId();
            var message = new Common.Elements.Message(Common.Constants.MessageTypes.START, messageId, this.getMyId(),node.getId(),null,data, new Date().getTime());
            node.addMessageWaitingResponse(message);
            this.getTransmissionsLayer().send(message);            
        } else {
            //OUTPUT
            throw "ERROR: No existe conexión."
        }    	
    }
    
    stop(){
        if (this.getMyId()!=null){
            var node = this.getFreeNode(); //COMO EL ÚNICO NODO QUE TIENE ES EL MONITOR PUES ES EL QUE VA A COGER SIEMPRE  
            var messageId = node.getNextMessageId();
            var message = new Common.Elements.Message(Common.Constants.MessageTypes.STOP, messageId, this.getMyId(),node.getId(),null,null, new Date().getTime());
            this.getTransmissionsLayer().send(message);            
        } else {
            //OUTPUT
            throw "ERROR: No existe conexión."
        }    	
    }    
    

}




module.exports = SlaveCommunication;
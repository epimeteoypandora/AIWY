'use strict';
var EventEmitter = require('events');
var fs = require('fs'); 

class MonitorApplication{
    constructor() {}
    initialize(communications){

        this.communicationLayer=communications;
        
        this.nodesApp={};
        
        this.maxTime=500000;
        this.startTime=0;
        this.running=false;  
        this.dataAlgorithm=null;     
        
        this.problemsSolved=0;
    }
    
    processRequest(message){
        let data=message.data;
        let type=message.type;        
        switch(type) {    
            case Common.Constants.MessageTypes.START:
                this.processStart(message);
                break;      
            case Common.Constants.MessageTypes.STOP:
                if (this.running){
                    this.end(message);
                }
                break;    
            case Common.Constants.MessageTypes.READY:
                this.cheackReadyNodes(message);
                break;     
            case Common.Constants.MessageTypes.REPLACEMENTS:
                if (this.running){
                    this.sendToSubscribers(message);
                } else {
                    //TODO -> ENVIAR MENSAJE STOP
                }
                break;   
            case Common.Constants.MessageTypes.SOLUTION_FOUND:
                if (this.running)this.end(message);
                //No necesito reenviarlo porque antes reenvío el individuo para que así lo coja y acaben también.
                //Lo que puedo hacer es enviar un stop después de 10 segundos y luego un start tras otros 10
               // this.communicationLayer.sendToAll(Common.Constants.MessageTypes.SOL_FOUND,data);
               break;  

            default:
                console.log("!!!!!!!!!!!!!!!!!!!! SE HA RECIBIDO UN MENSAJE DESCONOCIDO "+JSON.stringify(message));
                console.log(" DEBERIA SER = "+Common.Constants.MessageTypes.SOLUTION_FOUND)
            //NOTHING TO DO
               // throw "ERROR: El método recibido no existe.";
        }        
    }

    sendToSubscribers(message){
        // let origin=message.getSourceId();
        // let keys =Object.keys(this.nodesApp);
        // let position = keys.indexOf(origin);
        // let next1=position+1;
        // if (next1>keys.length)next1=0;
        // let next2=next1+1;
        // if (next2>keys.length)next2=0;        
        // if (next1!=origin)this.communicationLayer.sendTo(Common.Constants.MessageTypes.REPLACEMENTS,message.data,keys[next1]);
        // if (next2!=origin)this.communicationLayer.sendTo(Common.Constants.MessageTypes.REPLACEMENTS,message.data,keys[next2]);


        for (let key in this.nodesApp){
            if (key!=message.getSourceId()){ //Enviamos a todos menos al origen.
                if (this.nodesApp[key].ready){
                    this.communicationLayer.sendTo(Common.Constants.MessageTypes.REPLACEMENTS,message.data,key);
                }
            }
        }        
    }

    cheackReadyNodes(message){
        //PONEMOS READY EL NODO QUE ENVÍA EL MENSAJE
        //COMPROBAMOS QUE TODOS ESTÁN READY Y SI ES ASÍ ENVÍO MENSAJE START
        let nodeApp=this.nodesApp[message.getSourceId()];
        nodeApp.ready=true;
        // let allReady=true;
        // for (let key in this.nodesApp){
        //     if (this.nodesApp[key].ready!=true)allReady=false;
        // }
        // if (allReady)this.communicationLayer.sendToAll(Common.Constants.MessageTypes.START,null);
    }


    processResponse(message){
        let data=message.data;
        let type=message.type;        
        switch(type) {    
            case Common.Constants.MessageTypes.NEXT_STEP:       
                this.processTaskResult(data);
                break;  
            case Common.Constants.MessageTypes.SHOW_SOLUTION:                  
            case Common.Constants.MessageTypes.START:       
                //NOTHING
                break;                  
            default:
                throw "ERROR: El método recibido no existe.";
        }          
    }

    // processConnect(idNode,callback){
    //     this.nodesApp[idNode]={ready:false};
    //     callback(this.dataAlgorithm);
    // }

    processConnect(idNode){
        this.nodesApp[idNode]={ready:false};

        if (this.running)this.communicationLayer.sendTo(Common.Constants.MessageTypes.CONFIG,this.dataAlgorithm,idNode); 
    }

    
    processDisconnectRequest(idNode){
        delete this.nodesApp[idNode]; 
    }

    
    end(message){   
        console.log("##################################end(message){   ")     ;
        
        //TODO    
        this.running=false;
        for (let key in this.nodesApp){
            this.nodesApp[key].ready=false;
        }
        let endTime = new Date().getTime();
        let totalTime=this.startTime-endTime;
        
        let data=message.data;

        data["ID_SOLVED"]=this.problemsSolved;
        data["ID_SLAVE"]=message.getSourceId();
        //data["timeMonitor"]=totalTime;

            // var s = {};
            // s["id"]=this.problemsSolved;
            // s["fitness"]=solution.getFitness();
            // s["time"]=totalTime;   
            // s["step"]=finalStep; 
            // var idSlaves=Object.keys(this.communicationLayer.nodes);
            // s["nSlaves"]=idSlaves.length;
            // s["idSlaves"]=idSlaves;

            
            this.dataAlgorithm=null;
            this.problemsSolved++; 


            console.log("DATA = "+JSON.stringify(message.data))     ;


          //  if (Common.Constants.FromFile){ //Si se está realizando un TEST, se recargan los datos para seguir.
                console.log("##################Common.Constants.FromFile")
                loadArrayJSONFromFile("problemResults.txt",(jsonProblem)=>{   
                    console.log("##################loadArrayJSONFromFile")
                    console.log("jsonProblem="+JSON.stringify(jsonProblem))
                    console.log("ANTES "+jsonProblem.length);
                    jsonProblem.push(data);
                    console.log("DESPUES "+jsonProblem.length);  
                    saveArrayJSONToFile(jsonProblem,"problemResults.txt",()=>{
                       setTimeout(()=>{             
                           this.processStart();
                       },10000);                                                       
                    });
                });                             
          //  }   
    }
    
    processStart(){
        //let data=message.data;
        console.log("processStart(data){")
        this.dataAlgorithm={};
        //Si no está ejecutándose reenvía el mensaje de empezar a todos los nodos.
        if (!this.running){
            //returnData.dataAlgorithm=data;
            this.dataAlgorithm={nodes:this.nodesApp,topology:"RING_ONE",interval:100};
            this.startTime = new Date().getTime();
            this.running=true; 
            //this.dataAlgorithm=data;


        // this.neighbors=data.neighbors;
        // this.tipology=data.tipology;
        // this.interval=data.interval;
        // this.position=data.position; 

            //return this.dataAlgorithm;                    
            this.communicationLayer.sendToAll(Common.Constants.MessageTypes.CONFIG,this.dataAlgorithm);       
        }else {
            //return null;
        }
    }


    getDataAlgorithm(){
        return this.dataAlgorithm;        
    }

    getCommunicationLayer(){
       return this.communicationLayer;        
    }

}

module.exports = MonitorApplication;




function loadArrayJSONFromFile(file,callback){
        var self=this;
         
        fs.readFile( "./"+file,'utf8',  (err, json)=> {
            console.log("CONTENIDO -> "+json+"")
            if (err) {
              throw err; 
            }
            try {
               json=JSON.parse(json);  
            } catch (e){
                json=[];
            }
            
            callback(json);
        });    
}

function saveArrayJSONToFile(json,file,callback){
    fs.open("./"+file, "wx", function (err, fd) {
        fs.writeFile("./"+file,JSON.stringify(json), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
            callback();
        }); 
    });     
}

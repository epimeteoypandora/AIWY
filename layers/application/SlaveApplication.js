'use strict';

class SlaveApplication{
    constructor() {}
    initialize(communications){
        this.communicationLayer=communications;
        this.monitorId=0;
        this.algorithm=null;    
        this.running=false;
        this.nodes=null;
        this.tipology=null;
        this.position=null;
        this.interval=0;

        this.lastSent=null;

        this.intervalIterations=0;

        this.startTime=null;
        this.endTime=null;
    }
   
    processRequest(message){
        let data=message.data;
        let type=message.type;
        switch(type) {    
            case Common.Constants.MessageTypes.CONFIG:
                this.communicationLayer.reset(); //TODO -> Ver que hace esto
                this.startConfig(data);
                break;   
            // case Common.Constants.MessageTypes.START:
            //     console.log(JSON.stringify(data));
            //     this.startTime = new Date().getTime();
            //     this.running=true;
            //     this.webStart(data);   
            //     this.run();
            //     break;   
            case Common.Constants.MessageTypes.REPLACEMENTS:
                this.doReplacements(data);
                break;                 

            default:
                //NOTHING TO DO
        }          
    }


    processResponse(message){
        //NOTHING TO DO
    } 

    doReplacements(data){
        console.log("Replacements to do -> "+data.replacements.length); 
        for (let i=0;i<data.replacements.length;i++){
            let indiv = Common.Elements.Individual.fromJSON(data.replacements[i]);  
            this.algorithm.replaceWorst(indiv);
        }       
    }
   

    startConfig(data){
        //TODO -> data puede contener los parámetros del problema
        console.log("START CONFIG",true)
        console.log(JSON.stringify(data));
            let counter=0;
            for (let key in data.nodes){
                if(key==this.communicationLayer.getMyId()){
                    this.position=counter;
                    break;
                }
                counter++;
            }
            //this.position=18; //TODO -> eliminar esto


            console.log("MY POSITION="+this.position,true);
            this.interval = data.interval;
            this.intervalIterations=0;
            console.log("MY INTERVAL="+this.interval,true);

        if (this.running){
            console.log("SOLUTION FOUND IN ANOTHER SLAVE!",true);
            this.end();
        }

        this.loadCVRPProblemFromFile(Common.Constants.FileName,()=>{
                this.startTime = new Date().getTime();
                this.endTime = null;
                this.running=true;
                this.webStart(data);   
                this.run();                

                // //ENVIAR READY
                 this.communicationLayer.sendTo(Common.Constants.MessageTypes.READY,null,this.monitorId);                
        });
    }


    run(){
        if (this.running){      
            
            //setImmediate(    ()=>{
                let son = this.algorithm.run();
                this.algorithm.replaceWorst(son);
                if (this.intervalIterations>=this.interval){
                    let individualToSend=this.algorithm.getPopulation().getBestIndividual(); //Se puede coger uno aleatorio.
                    //if (JSON.stringify(bestIndividual)!=JSON.stringify(this.lastSent)){
                    if (individualToSend.sent!=true){
                        individualToSend.sent=true;                            
                        this.communicationLayer.sendTo(Common.Constants.MessageTypes.REPLACEMENTS,{replacements:[individualToSend]},this.monitorId);
                        this.lastSent=individualToSend;
                    }  else {
                        //  console.log("!!!!!!! INDIVIDUO YA ENVIADO !!!!!!!!");                        
                        // individualToSend=this.algorithm.getPopulation().getRandomIndividual();
                        // if (individualToSend.sent!=true){
                        //     individualToSend.sent=true;                            
                        //     this.communicationLayer.sendTo(Common.Constants.MessageTypes.REPLACEMENTS,{replacements:[individualToSend]},this.monitorId);
                        //     this.lastSent=individualToSend;
                        // }                        
                    }                          
                    //}                              
                    this.intervalIterations=0;
                }else {
                    this.intervalIterations++;
                } 


            if (!this.algorithm.hasFinished()){        
                setImmediate(()=>this.run());         
            }else {             
                console.log("<<<<<FINNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN<<<<<<",true)
                    //DEBUGGGGGGGGG //TODO
                    console.log(this.algorithm.getPopulation().getBestIndividual().getFitness()+">="+this.algorithm.problem.targetFitness,true);
                    console.log("STEP="+this.algorithm.step,true);
                    console.log("MAX STEPS="+this.algorithm.maxSteps,true);
                    //
                console.log("SOLUTION="+this.algorithm.getPopulation().getBestIndividual(),true);
                console.log("STEP="+this.algorithm.step,true)



                this.endTime = new Date().getTime(); 
                let totalTime=this.endTime-this.startTime;
                console.log("START TIME ="+this.startTime,true);
                console.log("END TIME ="+this.endTime,true)
                console.log("TIME="+(totalTime),true);
                let sol={};
                sol.SOL=this.algorithm.getPopulation().getBestIndividual();
                sol.TIME=totalTime;
                sol.STEPS=this.algorithm.step;
                sol.SEED=Common.Maths.LAST_SEED+this.position;
                
                console.log("VAMOS A ENVIAR LA SOLUCIÓN "+JSON.stringify(sol),true)
                this.communicationLayer.sendTo(Common.Constants.MessageTypes.SOLUTION_FOUND,sol,this.monitorId);

                this.end();

            }
        }
    }

    end(){
        this.running=false;
        running=false;//WEB
                let totalTime=this.endTime-this.startTime;
                console.log("TIME="+(totalTime),true);
                this.startTime=null;
    }



    startCVRPFromFile(){
        Common.setAlgorithm(Common.Constants.AlgorithmTypes.CVRP); //TODO NECESITO EL ALGORITMO DISTRIBUIDO
     
        var data = {};
        data[Common.Constants.ParameterTypes.ALGORITHM_TYPE] = Common.Constants.AlgorithmTypes.CVRP_LOCAL_DATA;    
        this.communicationLayer.start(data);        
    }

    loadCVRPProblemFromFile(file,callback){ 
//        $.getJSON( "dataProblem2.txt", function( jsonProblem ) {
         var startTimeLoading = new Date().getTime();

        $.getJSON(file, ( jsonProblem ) =>{     
            
//            var seed = Common.Maths.createSeed(141650939);
//            Math.random=seed;    

            //Common.Maths.LAST_SEED=Math.floor(Math.random() * Common.Maths.SEEDS.length);
            var seed = Common.Maths.createSeed(Common.Maths.SEEDS[Common.Maths.LAST_SEED+this.position]);//Se coge semilla según posición, cada uno una semilla.
            console.log("semilla utilizada="+Common.Maths.SEEDS[Common.Maths.LAST_SEED+this.position]);
            Math.random=seed;     
            Common.Maths.LAST_SEED=Common.Maths.LAST_SEED+1;
            if (Common.Maths.LAST_SEED>=Common.Maths.SEEDS.length)Common.Maths.LAST_SEED=0;
            
            
            Common.setAlgorithm(Common.Constants.AlgorithmTypes.CVRP);

            var problem = Common.Elements.ProblemCVRP.fromJSON(jsonProblem.problem);
            //problem.targetFitness=-650;
            //problem.targetFitness=-12000;
            problem.targetFitness=-3950;                         
            console.log("CUSTOMERS "+problem.customersArray.length,true);
            
            var nTrucks = jsonProblem.nTrucks;
            console.log("N TRUCKS="+nTrucks,true);
//            console.log("###"+JSON.stringify(nTrucks))


            var crossProb = jsonProblem.crossProb;
//            console.log("###"+JSON.stringify(crossProb))
            
            var mutateProb = jsonProblem.mutateProb;
//            console.log("###"+JSON.stringify(mutateProb))
            
            var LSProb = jsonProblem.LSProb;
//            console.log("###"+JSON.stringify(LSProb))            
            
//            var maxSteps = jsonProblem.maxSteps;
            var maxSteps = 999999999;             
//            console.log("###"+JSON.stringify(maxSteps))            
            
            var populationOnlyForSize = Common.Elements.Population.fromJSON(jsonProblem.population);          
//            console.log("###"+JSON.stringify(popSize))            
            
            this.algorithm = new Common.Elements.Algorithm(problem, crossProb,mutateProb,LSProb, maxSteps);
           //this.algorithm.load(population); //POblación diferente en cada isla.


           let popSize=50;
           //let chromLength=totalElements+nTrucks-1;
           let chromLength=problem.customersArray.length+nTrucks-1;
           this.algorithm.initialize(popSize, chromLength);
           console.log("POPULATION "+this.algorithm.population);
            var finalTimeLoading= new Date().getTime()
            console.log("Problem loaded in "+(finalTimeLoading-startTimeLoading)+"miliseconds")
            console.log("this.algorithm="+this.algorithm);
            console.log("Ready!")
            if (callback) callback();
        });     
     
    }
   

    webShowSolution(data){
        running=false;
        if (startedProblem){
            startedProblem=false;
            saveSolutionsInList(data);
            $('.show_solution_menu').show();
            $('.create_problem_menu').hide();
            $.mobile.pageContainer.pagecontainer("change", "#map_page", null);
            for (var i=0;i<markers.length;i++){
                markers[i].setDraggable(false);
            }
            setTimeout(function(){ showMarkersSolution(); },500);              
        }    
    }
    webStart(data){
        running=true;
        if (waitingStart){
              startedProblem=true;
              waitingStart=false;
        } else if (startedProblem){
              $('#messages').prepend($('<li>').text("Work in progress was cancelled by other user. A new Problem is starting."));
              startedProblem=false; //Se cancela el antiguo trabajo                  
        }        
    }


}


module.exports = SlaveApplication;
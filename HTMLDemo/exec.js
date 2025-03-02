const {minimizeSolution, game_state, makeLevel, nextMove} = require('./simulation')
const {initAgent, iterSolve, currentNodes} = require("./mcts_AGENT");

//read in command line arguments
// const args = process.argv.slice(2)
// var kekeAgent = (args.length > 0 ? args[0] : 'default');
// var levelSetName = (args.length > 1 ? args[1] : 'demo_levels');
// var levelNum = (args.length > 2 ? args[2] : 1);

var TIMEOUT = 10.0;			//10s
var MAX_ITER = 10000;

//get node.js imports
// var kekejs = require('../agents/' + kekeAgent + '_AGENT')
// var jsonjs = require('./json_io')
// var simjs = require('./simulation')





// RUN THE KEKE SOLVER ON A LEVEL
function run_keke(decode_map, iterations){
	//setup state
	makeLevel(decode_map);
	let gp = game_state;

	//setup solver
	initAgent(gp);

	// console.log("Solving...");

	const start = Date.now();		//start timer

	//solve for # iterations
	let i=0;
	let solution = [];
	for(i=0;i<iterations;i++){
		//check if timed out
		if(timedOut(start)){break;}

		//try to find solution
		solution = iterSolve(gp);

		// solution found
		if (solution.length > 0){
			if(timedOut(start)){break;}		//does't count if timed out

			//cutoff timer
			let end = Date.now();
			let timeExec = (end-start)/1000;

			//check validity of solution; repeat if invalid
			let result = validSolution(solution,decode_map);
			if(!result['win']){continue;}

			//winning solution -> return good solution
			// console.log(`-- SOLUTION FOUND IN ${i} / ${iterations} ITERATIONS | ${timeExec}s --`);
			// console.log({"s":minimizeSolution(solution),"i":i, "t":timeExec,'w':true});
			return {"s":minimizeSolution(solution),"i":i, "t":timeExec,'w':true, 'end_rule_objs':result['end_rule_objs']};
		}
	}

	//cutoff timer
	let end = Date.now();
	let timeExec = (end-start)/1000;

	let REASON = (i == iterations ? `MAXED ITERATIONS (${iterations})` : `TIMED OUT (${TIMEOUT})s`)

	// console.log(`-- NO SOLUTION FOUND: ${REASON}--`);
	let closest_sol = (solution.length > 0 ? solution : currentNodes[0].actionHistory);
	return {"s":minimizeSolution(closest_sol),"i":i, "t":timeExec,'w':false};
	
}

// CHECK IF THE EXECUTION TIMED OUT
function timedOut(s){
	let maybe_end = Date.now();
	if((maybe_end - s)/1000 > TIMEOUT){
		return true;
	}
	return false;
}

// CHECK IF THE SOLUTION RETURNED IS VALID AND WINNABLE
function validSolution(sol, init_map){
	makeLevel(init_map);
	let state = game_state;

	//console.log("after KEKE (" + sol[i] + "): \n" + simjs.doubleMap2Str(new_gs.obj_map, new_gs.back_map));

	for(let i=0;i<sol.length;i++){
		//iterate overgame state
		let res = nextMove(sol[i],state);
		state = res['next_state'];
		didwin = res['won'];

		//console.log("after KEKE (" + sol[i] + "): \n" + simjs.doubleMap2Str(state.obj_map, state.back_map));

		//winning solution reached
		if(didwin){
			return {win: true, end_rule_objs: state.rule_objs};
		}

	}

	//no win state reached
	return {win: false, end_rule_objs: null};
}








// SOLVE A SINGLE LEVEL FROM A LEVEL SET FOR A SET NUMBER OF ITERATIONS
function executeLevel(ls,ln,iter,agent='default'){
	//reimport keke based on agent
	kekejs = require('../agents/' + agent + '_AGENT')


	let lvlSet = jsonjs.getLevelSet(ls);
	let lvl = jsonjs.getLevel(lvlSet,ln);
	console.log(` -- LEVEL [ ${ln} ] FROM LEVEL SET [ ${ls} ] FOR [ ${iter} ] ITERATIONS --`)

	//solve level
	let r = run_keke(lvl.ascii,iter);
	let solution = r.s;
	let iterCt = r.i;
	let timeExec = r.t;
	let win = r.w;


	//export to JSON if solution found
	jsonjs.exportReport(agent + "_REPORT.json", ls, ln, iterCt, timeExec,solution,win);
	return {"id":ln, "iterations":iterCt, "time":timeExec, "solution":solution, 'ascii_map':lvl.ascii, 'won_level':win};

}

// SOLVE ALL LEVELS IN A LEVEL SET FOR A SET NUMBER OF ITERATIONS
function executeLevelSet(ls,iter,agent='default'){
	//reimport keke based on agent
	kekejs = require('../agents/' + agent + '_AGENT')

	let lvlSet = jsonjs.getLevelSet(ls);

	console.log(`-- SOLVING [ ${lvlSet.length} ] LEVELS FROM LEVEL SET [ ${ls} ] FOR [ ${iter} ] ITERATIONS --`);


	let report = [];
	for(let l=0;l<lvlSet.length;l++){
		let lvl = lvlSet[l];
		console.log(` LEVEL [ ${lvl.id} ] `)

		//solve level
		let r = run_keke(lvl.ascii,iter);
		let solution = r.s;
		let iterCt = r.i;
		let timeExec = r.t;
		let win = r.w;

		
		//export to JSON if solution found
		jsonjs.exportReport(agent + "_REPORT.json", ls, lvl.id, iterCt, timeExec,solution,win);
		report.push({"id":lvl.id, "iterations":iterCt, "time":timeExec, "solution":solution, "won_level":win});
	}
	return report;
}






function test(){
	//executeLevel(levelSetName,levelNum,5000)
	executeLevelSet(levelSetName,MAX_ITER,kekeAgent);
}

//test();


exports.run_keke = run_keke;
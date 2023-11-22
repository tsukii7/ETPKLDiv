class MAPElite{
    constructor(population=2, random_num=500, iterations=10000, w=0.5, noise=0, mutation=1){
        this.population = population;
        this.iterations = iterations;
        this.random_num = random_num;
        this.w = w;
        this.noise = noise;
        this.mutation = mutation;
        this.archive = {};
        this.n_evals = 0;
        this.max_fitness = -Infinity;
    }

    random_init(num=this.random_num){

    }

    run(){
        let etpkldiv = new ETPKLDiv();
        etpkldiv.initializePatternDictionary(inputData.map, tp_size,
            {"x": warp_x, "y": warp_y},
            {"left": border_left, "right": border_right, "top": border_top, "bot": border_bot});
        etpkldiv.initializeGeneration(10, 10, pop_size);

        this.random_init();
        for (let i = 0; i < this.iterations; i++) {
            let to_evaluate = [];
            to_evaluate += this.mutate();
            this.evaluate(to_evaluate);
            this.update_archive(to_evaluate);
        }


    }

}

function main(){
    let map = new MAPElite();
    map.run();

}
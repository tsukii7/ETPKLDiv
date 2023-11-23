const {addBorder, decodeMap, getAdditionFitness} = require('./evaluation')
const {newState, isNoun} = require('./simulation')
const {ETPKLDiv} = require('./ETPKLDiv')

// mutation ways
const mutation_ways = {
  'ETPKLDiv': 0,
  'RANDOM': 1,
}

class MAPElite {
  constructor(random_num = 500,
              mutate_num = 500,
              evaluations = 10000,
              w = 0.5,
              noise = 0,
              mut_times = 1,
              save_period = 500) {
    this.evaluations = evaluations;
    this.random_num = random_num;
    this.mutate_num = mutate_num;
    this.w = w;
    this.noise = noise;
    this.mut_times = mut_times;
    this.save_period = save_period;
    // archive cell 中的chromosomes按照fitness降序排列
    this.archive = {};
    this.n_evals = 0;
    this.max_fitness = -Infinity;
    this.mean_fitness = -Infinity;
    this.qd_score = -Infinity;
  }

  solve_map(map) {
    return {'start': [], 'end': [], 'solution': ''}
  }

  /* JS中进行位运算时视为32bit
   * 32bit中，前16bit为初始状态，后16bit为末尾状态，目前 x y 均只用了后8bit
   * 0x0000000A_AAAAAAAA_0000000B_BBBBBBBB, A是初始状态，B是末尾状态
   * 该方法返回其中一半，即 16bit，后 9bit 为数据
   * 9bit: 9_8765_4321
   * 1: X-IS-X      2: X-IS-Y       3: X-IS-PUSH    4: X-IS-MOVE
   * 5: X-IS-STOP   6: X-IS-KILL    7: X-IS-SINK    8: X-IS-[PAIR]
   * 9: X,Y-IS-YOU
   */
  ruleObjs_to_behaviorCharacteristic(rule_objs) {
    let X_IS_X = false, X_IS_Y = false, X_IS_PUSH = false,
      X_IS_MOVE = false, X_IS_STOP = false, X_IS_KILL = false,
      X_IS_SINK = false, X_IS_PAIR = false, X_Y_IS_YOU = false;
    let has_HOT = false, has_MELT = false, count_YOU = 0, list_YOU = []
    const times = rule_objs.length / 3
    for (let i = 0; i < times; i++) {
      const left_word = rule_objs[i * 3] // must be noun
      const right_word = rule_objs[i * 3 + 2] // may be noun or adjective
      if (left_word.name === right_word.name) X_IS_X = true
      if (isNoun(left_word) && isNoun(right_word) && left_word.name !== right_word.name) X_IS_Y = true
      if (right_word.name === 'push') X_IS_PUSH = true
      if (right_word.name === 'move') X_IS_MOVE = true
      if (right_word.name === 'stop') X_IS_STOP = true
      if (right_word.name === 'kill') X_IS_KILL = true
      if (right_word.name === 'sink') X_IS_SINK = true
      if (right_word.name === 'hot') has_HOT = true
      if (right_word.name === 'melt') has_MELT = true
      if (right_word.name === 'you' && !list_YOU.includes(left_word.name)) {
        count_YOU++
        list_YOU.push(left_word.name)
      }
    }
    X_IS_PAIR = has_HOT && has_MELT
    X_Y_IS_YOU = count_YOU > 1

    let behaviorCharacteristic = 0
    if (X_IS_X) behaviorCharacteristic |= 1 << 0
    if (X_IS_Y) behaviorCharacteristic |= 1 << 1
    if (X_IS_PUSH) behaviorCharacteristic |= 1 << 2
    if (X_IS_MOVE) behaviorCharacteristic |= 1 << 3
    if (X_IS_STOP) behaviorCharacteristic |= 1 << 4
    if (X_IS_KILL) behaviorCharacteristic |= 1 << 5
    if (X_IS_SINK) behaviorCharacteristic |= 1 << 6
    if (X_IS_PAIR) behaviorCharacteristic |= 1 << 7
    if (X_Y_IS_YOU) behaviorCharacteristic |= 1 << 8

    return behaviorCharacteristic
  }

  evaluate(es, to_evaluate) {
    es._computeDivergenceFintess(to_evaluate, this.w);
  }

  update_archive(chromosomes) {
    for (let i = 0; i < chromosomes.length; i++) {
      const chromosome = chromosomes[i];
      if (chromosome._solution.length === 0)
        continue
      const rule_objs_start = chromosome._rule_objs_start
      const rule_objs_end = chromosome._rule_objs_end
      const behaviorCharacteristic_start = this.ruleObjs_to_behaviorCharacteristic(rule_objs_start)
      const behaviorCharacteristic_end = this.ruleObjs_to_behaviorCharacteristic(rule_objs_end)
      const behaviorCharacteristic = behaviorCharacteristic_start << 16 | behaviorCharacteristic_end

      if (behaviorCharacteristic in this.archive) {
        const old_chromosomes = this.archive[behaviorCharacteristic]
        if (chromosome._fitness > old_chromosomes._fitness) {
          this.archive[behaviorCharacteristic] = chromosome
        }
      } else {
        this.archive[behaviorCharacteristic] = chromosome
      }
    }
  }

  mutate(es) {
    es._chromosomes.sort(() => Math.random() - 0.5);

    let new_chromosomes = [];
    for (let i = 0; i < this.mutate_num; i++) {
      let c = es._chromosomes[i].mutate(es._tp_size, this.mut_times, es._borders);
      new_chromosomes.push(c);
    }
    return new_chromosomes;
  }


  run() {
    let etpkldiv = new ETPKLDiv();
    let inputData = [];

    etpkldiv.initializePatternDictionary(this.maps, 3,
      {"x": false, "y": false},
      {"left": false, "right": false, "top": false, "bot": false});
    etpkldiv.initializeGeneration(10, 10, this.random_num, mutation_ways['RANDOM']);
    let n_evals = this.random_num;

    while (n_evals < this.evaluations) {
      let to_evaluate = [];
      to_evaluate = this.mutate(etpkldiv._es);
      n_evals += to_evaluate.length;
      etpkldiv._es._chromosomes = etpkldiv._es._chromosomes.concat(to_evaluate);
      this.evaluate(etpkldiv._es, to_evaluate);
      this.update_archive(to_evaluate);
      if (n_evals % this.save_period === 0) {
        let fitList = Object.values(this.archive).map(x => x._fitness);
        let maxFitness = Math.max(...fitList);
        let meanFit = fitList.reduce((acc, val) => acc + val, 0) / fitList.length;
        let qdScore = fitList.reduce((acc, val) => acc + val, 0);
        console.log(`[${n_evals}/${this.evaluations}] # of Chromosomes: ${etpkldiv._es._chromosomes.length} # of Cell: ${fitList.length} Max Fitness: ${maxFitness} Mean Fitness: ${meanFit} QD Score: ${qdScore}`);
      }
    }
  }
}

function loadMapData() {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    fs.readFile('data/baba.txt', 'utf8', function (err, dataStr) {
      if (err) {
        reject(err);
      } else {
        let maps = [];
        let map = dataStr.split("\r\n\r\n\r\n");
        for (let m of map) {
          let lines = m.split("\r\n");
          if (lines.length > 0) {
            maps.push([]);
            for (let l of lines) {
              l = l.trim();
              if (l.length > 0) {
                maps[maps.length - 1].push([]);
                for (let c of l) {
                  maps[maps.length - 1][(maps[maps.length - 1]).length - 1].push(c.charCodeAt(0) - 'A'.charCodeAt(0));
                }
              }
            }
          }
        }
        resolve(maps);
      }
    });
  });
}


function main() {
  let elite = new MAPElite(50,50,1000,0.5,0,1,50);
  loadMapData().then(maps => {
    elite.maps = maps;
    elite.run();
    console.log("Evaluation finished.")
  }).catch(error => {
    console.error(error);
  });

}

main();

exports.mutation_ways = mutation_ways;
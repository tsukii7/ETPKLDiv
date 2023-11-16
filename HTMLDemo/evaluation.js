

const decode_key = {
    'B': " ",  // empty
    // 'B': ".",  // empty
    'C': "b",  // baba_phys
    'D': "B",  // baba_word
    'E': "1",  // is_word
    'F': "2",  // you_word
    'G': "3",  // win_word
    'H': "s",  // skull_phys
    'I': "S",  // skull_word
    'J': "f",  // flag_phys
    'K': "F",  // flag_word
    'L': "o",  // floor_phys
    'M': "O",  // floor_word
    'N': "a",  // grass_phys
    'O': "A",  // grass_word
    'P': "4",  // kill_word
    'Q': "l",  // lava_phys
    'R': "L",  // lava_word
    'S': "5",  // push_word
    'T': "r",  // rock_phys
    'U': "R",  // rock_word
    'V': "6",  // stop_word
    'W': "w",  // wall_phys
    'X': "W",  // wall_word
    'Y': "7",  // move_word
    'Z': "8",  // hot_word
    '[': "9",  // melt_word
    '\\': "k",  // keke_phys
    ']': "K",  // keke_word
    '^': "g",  // goop_phys
    '_': "G",  // goop_word
    '`': "0",  // sink_word
    'a': "v",  // love_phys
    'b': "V"   // love_word
}

function deepCopyChar2DArray(arr) {
    return arr.map(row => row.slice());
}

function addBorder(matrix) {
    // 获取原始数组的行数和列数
    let rows = matrix.length;
    let cols = matrix[0].length;

    // 创建一个新数组，并用'_'字符填充
    let newMatrix = new Array(rows + 2).fill('_').map(() => new Array(cols + 2).fill('_'));

    // 将原始数组的数据复制到新数组的中心
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            newMatrix[i + 1][j + 1] = matrix[i][j];
        }
    }

    return newMatrix;
}

function getAdditionFitness(map_array){
    let decode_map = deepCopyChar2DArray(map_array);
    for (let i = 0; i < map_array.length; i++) {
        for (let j = 0; j < map_array[i].length; j++) {
            decode_map[i][j] = decode_key[String.fromCharCode(decode_map[i][j]+65)];
            if (decode_map[i][j] == undefined){
                debugger
            }
        }
    }
    let init_state = newState(addBorder(decode_map));

    let objsSet = {}, wordsSet = {};
    let objTotal = 0, wordTotal = 0;
    let nounSet = ['baba', 'skull', 'flag', 'floor', 'grass', 'lava', 'rock', 'wall', 'keke', 'goop', 'love']

    for (const objName in init_state.sort_phys) {
        if (Object.hasOwnProperty.call(init_state.sort_phys, objName)) {
            let objects = init_state.sort_phys[objName];
            objsSet[objName] = objects.length;
            objTotal += objects.length;
        }
    }

    for (let i = 0; i < init_state.words?.length; i++) {
        let wordName = init_state.words[i]?.name;
        if (nounSet.includes(wordName)){
            wordsSet[wordName] = wordName in wordsSet ? wordsSet[wordName] + 1 : 1;
            wordTotal += 1;
        }
    }

    let objCnt = 0, wordCnt = 0;
    for (let i = 0; i < nounSet.length; i++) {
        if ((nounSet[i] in objsSet) && !(nounSet[i] in wordsSet)){
            objCnt += objsSet[nounSet[i]];
        }
        else if (!(nounSet[i] in objsSet) && (nounSet[i] in wordsSet)){
            wordCnt += wordsSet[nounSet[i]];
        }
    }

    const u = (objTotal === 0? 0 : 0.85 * objCnt / objTotal) + (wordTotal === 0 ? 0 : 0.15 * wordCnt / wordTotal);
    const p = check_win(init_state);
    let spaceCount = init_state.orig_map.reduce((count, row) => count + row.filter(cell => cell === " ").length, 0);
    const s = spaceCount / ((init_state.orig_map.length-2) * (init_state.orig_map[0].length-2));
    const rules_reward = 0.2 * init_state.rules.length
    const obj_reward = 0.1 * objTotal

    // const addFitness = -1 * (u + p + 0.1 * s);
    const addFitness = -1 * (u + 10 * p + 0.1 * s) + rules_reward + obj_reward;
    // const addFitness = -10 * (u + 10 * p + 0.1 * s);
    return addFitness;
}

function check_win(state) {
    const has_players = state.players.length > 0;
    const has_win_word = state.words.some(word => word.name === 'win')

    if(has_win_word && has_players)
        return 0
    else
        return 1
}

// module.exports = {
//     getNewFitness: getNewFitness
// }
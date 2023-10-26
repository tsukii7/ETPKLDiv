

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

function getNewFitness(map_array){
    let decode_map = deepCopyChar2DArray(map_array);
    for (let i = 0; i < map_array.length; i++) {
        for (let j = 0; j < map_array[i].length; j++) {
            decode_map[i][j] = decode_key[String.fromCharCode(decode_map[i][j]+65)];
        }
    }
    debugger
    let init_state = newState(addBorder(decode_map));

}

// module.exports = {
//     getNewFitness: getNewFitness
// }
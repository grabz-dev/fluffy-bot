/**
 * Check if all values from one array exist uniquely in another array. The passed in arrays will be mutated
 * The function will 
 * @param {any[]} arrFrom Array to match the values
 * @param {any[]} arrIn Array containing all of the values
 */
function arrayValuesMatchUniquely(arrFrom, arrIn) {
    for(let i = 0; i < arrFrom.length; i++) {
        let index = arrIn.indexOf(arrFrom[i])
        if(index > -1) {
            arrIn.splice(index, 1);
            arrFrom.splice(i, 1)
            i--;
        }
    }

    if(arrFrom.length === 0) return true;
    return false;
}

export default {
    arrayValuesMatchUniquely
}
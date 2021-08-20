// Simplification of https://gist.github.com/mir4ef/c172583bdb968951d9e57fb50d44c3f7

/**
 * @description Method to check if an item is an object. Date and Function are considered
 * an object, so if you need to exclude those, please update the method accordingly.
 * @param item - The item that needs to be checked
 * @return {Boolean} Whether or not @item is an object
 */
export const isObject = (item: any): boolean => {
  return item === Object(item) && !Array.isArray(item)
}

/**
 * @description Method to perform a deep merge of objects
 * @param {Object} target - The targeted object that needs to be merged with the supplied @sources
 * @param {Array<Object>} sources - The source(s) that will be used to update the @target object
 * @return {Object} The final merged object
 */
export function deepMerge<T>(target: T, elm: T): T {
  const result = { ...target }

  for (const key in elm) {
    if (isObject(elm[key])) {
      result[key] = deepMerge(result[key], elm[key])
    } else {
      result[key] = elm[key]
    }
  }

  return result
}

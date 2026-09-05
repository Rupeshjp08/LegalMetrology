/**
 * Joins a list of class names, ignoring falsy values.
 * @param  {...(string | false | null | undefined)} args
 * @returns {string} A clean, space-separated class name string.
 */
export function classNames(...args) {
  return args.filter(Boolean).join(' ').trim()
}
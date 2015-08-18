
// https://github.com/substack/path-browserify

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
let splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/
function splitPath(filename) {
	return splitPathRe.exec(filename).slice(1)
}

export default function basename(path, ext) {
	let f = splitPath(path)[2]
	// TODO: make this comparison case-insensitive on windows?
	if (ext && f.substr(-1 * ext.length) === ext) {
		f = f.substr(0, f.length - ext.length)
	}
	return f
}

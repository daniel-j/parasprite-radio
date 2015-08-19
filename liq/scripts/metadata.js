var taglib = require('taglib')

taglib.read(process.argv[2], function (err, tag, audioProperties) {
	if (err) {
		console.error(err)
		return
	}
	var output = {}
	if (tag.title)
		output.title = tag.title
	if (tag.artist)
		output.artist = tag.artist
	if (tag.comment)
		output.comment = tag.comment
	if (tag.year > 0)
		output.year = ''+tag.year
	if (tag.genre)
		output.genre = tag.genre

	console.log(JSON.stringify(output))
})

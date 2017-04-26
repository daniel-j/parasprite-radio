'use strict'
// http://stackoverflow.com/a/19708150
function replaceURLWithHTMLLinks (text) {
  let re = /(\(.*?)?\b((?:https?|ftp|file):\/\/[-a-z0-9+&@#/%?=~_()|!:,.;]*[-a-z0-9+&@#/%=~_()|])/ig
  return text.replace(re, function (match, lParens, url) {
    let rParens = ''
    lParens = lParens || ''

    // Try to strip the same number of right parens from url
    // as there are left parens.  Here, lParenCounter must be
    // a RegExp object.  You cannot use a literal
    //     while (/\(/g.exec(lParens)) { ... }
    // because an object is needed to store the lastIndex state.
    let lParenCounter = /\(/g
    while (lParenCounter.exec(lParens)) {
      let m
      // We want m[1] to be greedy, unless a period precedes the
      // right parenthesis.  These tests cannot be simplified as
      //     /(.*)(\.?\).*)/.exec(url)
      // because if (.*) is greedy then \.? never gets a chance.
      if ((m = /(.*)(\.\).*)/.exec(url) ||
          /(.*)(\).*)/.exec(url))) {
        url = m[1]
        rParens = m[2] + rParens
      }
    }
    return lParens + '<a href="' + url + '" target="_blank">' + url + '</a>' + rParens
  })
}

export default replaceURLWithHTMLLinks

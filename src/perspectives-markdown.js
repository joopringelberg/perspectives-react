module.exports = function (md) {

  // The tokenize function to add.
  function tokenize(state, silent) {
    const start = state.pos;
    const marker = state.src.charCodeAt(start);

    if (silent) {
      return false;
    }

    if (marker !== 0x5B /* [ */ || state.src.charCodeAt(start + 1) !== 0x5B /* [ */) {
      return false;
    }

    const match = state.src.slice(start).match(/\[\[.*?\]\]/);
    if (!match) {
      return false;
    }

    const matchStr = match[0];
    const innerPerspectivesExpr = matchStr.slice(2, -2);

    if (!isPerspectivesSyntax( innerPerspectivesExpr )) {
      return false;
    }

    state.pos += matchStr.length;

    const token = state.push('perspectives', '', 0);
    token.content = innerPerspectivesExpr
    token.markup = matchStr;
    token.map = [start, state.pos];

    return true;
  }

  // Insert the tokenizer into markdown-it.
  md.inline.ruler.before('emphasis', 'perspectives', tokenize);

  // Add a renderer function.
  md.renderer.rules.perspectives = function(tokens, idx) {
    // Render appropriate content for each of the extensions.
    return render(tokens[idx].content);
  };
};


function render (s)
{
  let matchResult;
  matchResult = s.match(linkRegEx)
  if (matchResult) {
    const roleIdentifier = matchResult[1];
    const readableText = matchResult[2];
    return `<a href="#" onclick="$perspectives_entry_point_for_markdown$.opencontext(event, '${roleIdentifier}')">${readableText}</a>`
  }

  matchResult = s.match(actionRegEx);
  if (matchResult) {
    const action = matchResult[1];
    const readableText = matchResult[2];
    return `<button type="button" class="btn btn-primary btn-sm" onclick="$perspectives_entry_point_for_markdown$.runaction(event, '${action}', '__contextid__', '__myroletype__')">${readableText}</Button>`
  }

}

// [[link: <roleIdentifier>|Leesbare link tekst]]
const linkRegEx = /link:\s*([^|]+)\s*\|\s*(.+)/;
// [[action: <action name>| leesbare actie tekst ]]
const actionRegEx = /action:\s*(.+)\s*\|\s*(.+)/;
// [[expression: <expression> ]]

// Check whether the string represents valid Perspectives extension syntax.
function isPerspectivesSyntax(s)
{
  let correct = false;
  if (s.match(linkRegEx)) {
    correct = true;
  }
  if (s.match(actionRegEx)) {
    correct = true;
  }
  return correct;
}
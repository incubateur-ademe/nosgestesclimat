const fs = require('fs');
import { parse } from 'yaml'

// Select properties inside an object.
// See https://dev.to/nas5w/how-to-select-or-omit-properties-from-an-object-in-javascript-3ina
function pick(obj, ...props) {
  return props.reduce(function (result, prop) {
    result[prop] = obj[prop];
    return result;
  }, {});
}

function yamlToJson(filePath) {
  return parse(fs.readFileSync(filePath, 'utf8'));
}

function extractRule(ruleName, rules) {
  return pick(rules, ruleName);
}

export {
    extractRule,
    yamlToJson
}

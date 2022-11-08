/*
 * Here defines the constraint GET method. (ASTM compliant)
 */

const utils = require("../cif-utils");
const { getConstraint } = require("./dbo-methods");
const { parseCIFResponseToASTMConstraints } = require("../cif-parsers");

let responseBody = "Not Found";
let statusCode = 404; // Or 204 returns 'no content' and overrides response message

module.exports.main = async (id) => {
  const { error, data, message } = await getConstraint(id);
  const responseHeaders = utils.corsHeaders("OPTIONS,GET");

  // Parse raw CIF response into ASTM compliant constraint format
  parsedData = parseCIFResponseToASTMConstraints(data);

  if (error) {
    return utils.responseError(500, message, responseHeaders);
  } else if (!data) {
    return utils.responseError(statusCode, message, responseHeaders); // No data
  } else {
    data['message'] = message; // Add message to response
    return utils.responseSuccess(200, parsedData, responseHeaders); // Sends back parsed data (reduced ASTM format)
  }
};
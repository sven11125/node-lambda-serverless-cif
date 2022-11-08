/*
 * Here defines the constraint scan method.
 */

const utils = require("../cif-utils");
const { scanConstraints } = require("./dbo-methods");

let responseBody = "Not Found";
let statusCode = 404; // Or 204 returns 'no content' and overrides response message

module.exports.main = async () => {
  const { error, data, message } = await scanConstraints();
  const responseHeaders = utils.corsHeaders("OPTIONS,POST");
  
  if (error) {
    return utils.responseError(500, message, responseHeaders);
  } else if (!data) {
    return utils.responseError(statusCode, message, responseHeaders); // No data
  } else {
    return utils.responseSuccess(200, data, responseHeaders);
  }
};

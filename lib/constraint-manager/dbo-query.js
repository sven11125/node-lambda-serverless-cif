/*
 * Here defines the constraint query method. Same funciton as the get method.
 */

const utils = require("../cif-utils");
const { queryConstraints } = require("./dbo-commons");

let responseBody = "Not Found";
let statusCode = 404; // Or 204 returns 'no content' and overrides response message

module.exports.main = async (id) => {
  const { error, data, message } = await queryConstraints(id);
  const responseHeaders = utils.corsHeaders("OPTIONS,GET");

  if (error) {
    return utils.responseError(500, message, responseHeaders);
  } else if (!data) {
    return utils.responseError(statusCode, message, responseHeaders); // No data
  } else {
    return utils.responseSuccess(200, data, responseHeaders);
  }
};

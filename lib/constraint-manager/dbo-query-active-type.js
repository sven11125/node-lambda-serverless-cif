/*
 * Here defines the constraint query method.
 * This method queries active constraints based on time and type. 
 */

const utils = require("../cif-utils");
const { queryActiveConstraintsByType } = require("./dbo-commons");

let responseBody = "Not Found";
let statusCode = 404; // Or 204 returns 'no content' and overrides response message

module.exports.main = async (constraint_type, time_start) => {
  // Ensures we have an integer representation of time_start
  const { error, data, message } = await queryActiveConstraintsByType(constraint_type, parseInt(time_start));
  const responseHeaders = utils.corsHeaders("OPTIONS,GET");

  if (error) {
    return utils.responseError(500, message, responseHeaders);
  } else if (!data) {
    return utils.responseError(statusCode, message, responseHeaders); // No data
  } else {
    return utils.responseSuccess(200, data, responseHeaders);
  }
};

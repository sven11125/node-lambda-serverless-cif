/*
 * This module contrains the key HTTP handlers for outgoing responses.
 */

const util = require('util');

module.exports.corsHeaders = (httpMethods = "OPTIONS,POST,GET,DELETE") => {
  return {
    "Content-Type": "application/json",
    "X-Custom-Header": "NovaCIF",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": httpMethods,
  };
};

module.exports.responseSuccess = (statusCode, data, corsHeaders) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(data),
    headers: corsHeaders
  };
};

module.exports.responseError = (statusCode, errorMessage, corsHeaders) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: errorMessage,
      state: "Rejected"
    }),
    headers: corsHeaders
  };
};

/**
 * Console log fully the content of the input data
 * @param {*} name = Name of the data for reference purpose
 * @param {*} data = Data to be logged
 */
module.exports.pprint = (data, name = 'Out:') => {
  return console.log(name, util.inspect(data, { showHidden: false, depth: null }));
}

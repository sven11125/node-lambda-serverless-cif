"use strict";
const AWS = require("aws-sdk");
const utils = require("../../cif-utils");

AWS.config.update({ region: "ap-southeast-1" });

// const ddb = new AWS.DynamoDB({ apiVersion: "2012-10-18" });
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

let responseBody = "Bad request!";
let statusCode = 400;

module.exports.main = async (operationData) => {
  const time_created = new Date().getTime();
  const { operation_id, extents, old_version, state, uss_base_url } = operationData;
  const responseHeaders = utils.corsHeaders("OPTIONS,POST");

  const params = {
    TableName: "FIMSOperations",
    Item: {
      operation_id: operation_id, // Primary key
      time_created: new Date(time_created).toISOString(),
      extents: extents,
      old_version: old_version,
      state: state,
      uss_base_url: uss_base_url,
    },
  };

  const data = await documentClient.put(params).promise();
  responseBody = JSON.stringify(params.Item);
  statusCode = 200;
  return utils.responseSuccess(statusCode, responseBody, responseHeaders);
};

/*
API POST:
{
    "operation_id":"operation_id",
    "extents":{"extents":"extents"},
    "old_version":"old_version",
    "state":"state",
    "uss_base_url":"uss_base_url"
}

Output format of a Lambda function for proxy integration:
{
    "isBase64Encoded": true|false,
    "statusCode": httpStatusCode,
    "headers": { "headerName": "headerValue", ... },
    "multiValueHeaders": { "headerName": ["headerValue", "headerValue2", ...], ... },
    "body": "..."
}
*/

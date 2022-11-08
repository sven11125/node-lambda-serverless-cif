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

module.exports.main = async (id) => {
  const params = {
    TableName: "FIMSConstraints",
    Key: {
      constraint_id: id,
    },
  };

  const data = await documentClient.get(params).promise();
  responseBody = data.Item;
  statusCode = 200;
  return utils.responseSuccess(statusCode, responseBody);
};

// "use strict";
// const utils = require("../cif-utils");
// const { getConstraint } = require("../constraint-http-methods");

// let responseBody = "Bad request!";
// let statusCode = 400;

// module.exports.main = async (id) => {
//   responseBody = await getConstraint(id);
//   statusCode = 200;
//   return utils.responseSuccess(statusCode, responseBody);
// };

/*
Output format of a Lambda function for proxy integration:
{
    "isBase64Encoded": true|false,
    "statusCode": httpStatusCode,
    "headers": { "headerName": "headerValue", ... },
    "multiValueHeaders": { "headerName": ["headerValue", "headerValue2", ...], ... },
    "body": "..."
}
*/

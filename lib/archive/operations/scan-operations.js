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

module.exports.main = async () => {
  try {
    const params = {
      TableName: "FIMSOperations",
      ProjectionExpression: "#id, time_created, extents",
      ExpressionAttributeNames: {
        "#id": "operation_id",
      }
    };

    const scan_result = await documentClient.scan(params, onScan).promise();

    function onScan(err, data) {
      if (err) {
        console.error(
          "Unable to scan the table. Error JSON:",
          JSON.stringify(err, null, 2)
        );
      } else {

        // Continue scanning if we have more entries
        // Because scan can only retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
          // console.log("Scanning for more...");
          params.ExclusiveStartKey = data.LastEvaluatedKey;
          documentClient.scan(params, onScan); // Recursive
        }
      }
    }

    // Return scanned data
    console.log(scan_result.Items);
    responseBody = JSON.stringify(scan_result.Items);
    statusCode = 200;
  } catch (err) {
    responseBody = `Unable to query operations!`;
    statusCode = 403;
  }

  const responseHeaders = utils.corsHeaders("OPTIONS,POST");
  return utils.responseSuccess(statusCode, responseBody, responseHeaders);
};

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

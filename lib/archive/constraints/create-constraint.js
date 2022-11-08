"use strict";
const AWS = require("aws-sdk");
const utils = require("../../cif-utils");
const { v4: uuidv4 } = require("uuid");
const {
  testConstraint,
  validateNewConstraint,
} = require("../../constraint-manager/c-validator");

AWS.config.update({ region: "ap-southeast-1" });

// const ddb = new AWS.DynamoDB({ apiVersion: "2012-10-18" });
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

let responseMessage = "";
let responseBody = "Bad request!";
let statusCode = 400;

module.exports.main = async (constraintData) => {
  const time_created = new Date().getTime();
  const {
    constraint_id,
    extents,
    old_version,
    state,
    uss_base_url,
  } = constraintData;

  const params = {
    TableName: "FIMSConstraints",
    Item: {
      constraint_id: uuidv4(), // Primary key generated as a new UUID
      time_created: new Date(time_created).toISOString(),
      extents: extents,
      old_version: old_version,
      state: "APPROVED",
      uss_base_url: uss_base_url,
    },
  };

  // Validate constraint
  // console.log('testConstraint:', testConstraint);
  // console.log('validateNewConstraint:', validateNewConstraint(testConstraint));

  // const validateNewConstraintVerdict = await validateNewConstraint(testConstraint);
  const validateNewConstraintVerdict = await validateNewConstraint(
    constraintData
  );

  const responseHeaders = utils.corsHeaders("OPTIONS,POST");

  if (validateNewConstraintVerdict.validity === false) {
    responseMessage =
      "Submitted constraint is conflicting with existing entities. Please resubmit.";
    statusCode = 409;
    return utils.responseError(statusCode, responseMessage, responseHeaders);
  } else if (
    validateNewConstraintVerdict.validity === true &&
    validateNewConstraintVerdict.overlap_type === "temporal-only"
  ) {
    const data = await documentClient.put(params).promise();
    responseMessage = "Submitted constraint is approved. Spatial passed."; // Temporal overlap only
    responseBody = params.Item;
    responseBody["message"] = responseMessage;
    statusCode = 201;
    return utils.responseSuccess(statusCode, responseBody, responseHeaders);
  } else if (
    validateNewConstraintVerdict.validity === true &&
    validateNewConstraintVerdict.overlap_type === "no-overlap"
  ) {
    const data = await documentClient.put(params).promise();
    responseMessage =
      "Submitted constraint is approved. Spatial passed. Temporal passed.";
    responseBody = params.Item;
    responseBody["message"] = responseMessage;
    statusCode = 201;
    return utils.responseSuccess(statusCode, responseBody, responseHeaders);
  }
};

/*
API POST:
{
    "constraint_id":"constraint_id",
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

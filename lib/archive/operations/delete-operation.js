"use strict";
const AWS = require("aws-sdk");
const utils = require("../../cif-utils");

AWS.config.update({ region: "ap-southeast-1" });

// const ddb = new AWS.DynamoDB({ apiVersion: "2012-10-18" });
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

// let responseBody = "Bad request!";
// let statusCode = 400;

const checkOperationExistsInDatabase = async (id) => {
  const params = {
    TableName: "FIMSOperations",
    Key: {
      operation_id: id,
    }
  }

  try{
    let result = await documentClient.get(params).promise();
    if ('Item' in result) {
      return [null, result.Item]
    }
    return [null, null]
  }
  catch(err){
    return [err, null]
  }
}

const deleteOperationFromDatabase = async (id) => {
  var params = {
    TableName: "FIMSOperations",
    Key: {
      operation_id: id,
    }
  }

  try{
    const response = await documentClient.delete(params).promise();
    return [null, response]
  }
  catch(err){
    return [err, null]
  }
}

module.exports.main = async (id) => {
  const responseHeaders = utils.corsHeaders("OPTIONS,GET,DELETE");

  // Check if operation exists in the database
  const [operationErr, operationData] = await checkOperationExistsInDatabase(id)
  if (operationErr) {
    utils.responseError(500, "Error occured while reading operation data!", responseHeaders)
  }

  // Check if there is operation data
  if (!operationData) {
    return utils.responseError(400, "Operation specified can not be found!", responseHeaders)
  }

  // Delete operation from the database
  const [deleteDataErr, deleteResponse] = await deleteOperationFromDatabase(id)
  if (deleteDataErr) {
    console.log("Error occured while deleting the operation from the database!")
  }

  return utils.responseSuccess(200, {
    "operation_deleted" : {
      "operation_id" :  id
    }
  })
};


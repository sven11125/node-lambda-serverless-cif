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

const checkConstraintExistsInDatabase = async (id) => {
  const params = {
    TableName: "FIMSConstraints",
    Key: {
      constraint_id: id,
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

const deleteConstraintFromDatabase = async (id) => {
  var params = {
    TableName: "FIMSConstraints",
    Key: {
      constraint_id: id,
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
  // Check if constraint exists in the database
  const [constraintErr, constraintData] = await checkConstraintExistsInDatabase(id)
  if (constraintErr) {
    utils.responseError(500, "Error occured while reading constraint data!")
  }

  // Check if there is constraint data
  if (!constraintData) {
    return utils.responseError(400, "Constraint specified can not be found!")
  }

  // Delete constraint from the database
  const [deleteDataErr, deleteResponse] = await deleteConstraintFromDatabase(id)
  if (deleteDataErr) {
    console.log("Error occured while deleting the constraint from the database!")
  }

  return utils.responseSuccess(200, {
    "constraint_deleted" : {
      "constraint_id" :  id
    }
  })
};


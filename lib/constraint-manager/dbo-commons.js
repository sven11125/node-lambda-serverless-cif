/*
 * This module extends dbo-methods.js to prevent circular dependency
 * This module is reserved for query methods
 */

var AWS = require("aws-sdk");

AWS.config.update({
  region: "ap-southeast-1",
});

const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

// ------------------------------------------------------------------------------------------------------------------------------

/** Parse documentClient response in a meaningful manner */
module.exports.clientResponse = function clientResponse(
  error = false,
  data = null,
  message = null
) {
  return {
    error: error, // T/F
    data: data,
    message: message,
  };
};

/** Valid constraint types */
module.exports.validConstraintTypes = ['STC', 'LTC', 'UVR', 'Geozone']

/** Check if constraint has constraint_type key */
module.exports.hasConstraintType = (constraint) => {
  try {
    if ('constraint_type' in constraint) {
      // Only if constraint_type is a valid string
      if (module.exports.validConstraintTypes.includes(constraint.constraint_type)) {
        return true;
      }
      return false;
    } 
    return false;
  } catch (error) {
    return null;
  }
 }

/** Check if constraint is of type STC */
module.exports.checkConstraintTypeSTC = (constraint_type) => {
  try {
    if (constraint_type === 'STC' ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return null;
  }
 }

//  console.log(module.exports.hasConstraintType({'constraint_type': 'LTC'}));
//  console.log(module.exports.checkConstraintTypeSTC('STC'));

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * This method queries the main table.
 * Query constraint by its unique ID, similar to the GET method as primary key is unique.
 * See: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
 */
module.exports.queryConstraints = async (id) => {
  const params = {
    TableName: "FIMSConstraints",
    KeyConditionExpression: "#id = :uid",
    ExpressionAttributeNames: {
      "#id": "constraint_id",
    },
    ExpressionAttributeValues: {
      ":uid": id,
    },
  };

  try {
    const response = await documentClient.query(params).promise();
    if ("Items" in response && response.Items.length != 0) {
      return module.exports.clientResponse(
        false,
        response.Items,
        `Constraint ${id} retrieved.`
      );
    }
    return module.exports.clientResponse(
      false,
      null,
      `Constraint ${id} does not exist.`
    ); // No data
  } catch (err) {
    return module.exports.clientResponse(
      true,
      null,
      "Failed to query constraints."
    );
  }
};

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * This method queries the global secondary index table.
 * Query constraints by checking state = 'Accepted' and time_end of existing constraints >= time_start
 * of the submitted constraint, this ensures only the active constraints are returned.
 * Filter is then applied to return all constraints that do not match the ID of the submitted constraint.
 */
module.exports.queryActiveConstraintsExceptID = async (
  state_index,
  constraint_id_target, // Return constraints with ID not equal to this
  time_start_target
) => {
  const params = {
    TableName: "FIMSConstraints",
    IndexName: "StateIndex",
    KeyConditionExpression:
      "#status = :status_value AND time_end >= :time_start_value",
    FilterExpression: "constraint_id <> :constraint_id_target",
    ExpressionAttributeNames: {
      "#status": "state",
    },
    ExpressionAttributeValues: {
      ":status_value": state_index,
      ":time_start_value": time_start_target,
      ":constraint_id_target": constraint_id_target,
    },
  };

  try {
    const response = await documentClient.query(params).promise();
    if ("Items" in response && response.Items.length != 0) {
      return module.exports.clientResponse(
        false,
        response.Items,
        // `Constraints matching query conditions are retrieved.`
        `Active constraints are retrieved successfully.`
      );
    }
    // `Query conditions are not met, no constraints are retrieved.`
    return module.exports.clientResponse(
      false,
      null,
      `No active constraints can be retrieved.`
    ); // No data
  } catch (err) {
    return module.exports.clientResponse(
      true,
      null,
      "Failed to query active constraints."
    );
  }
};

// // Local test to resolve queryActiveConstraintsExceptID()
// const queryActiveConstraintsExceptIDTest = async () => {
//   const {
//     error,
//     data,
//     message,
//   } = await module.exports.queryActiveConstraintsExceptID(
//     "Accepted",
//     "010314e0-4899-46e9-84c4-82bccbf3ed8f",
//     1587443184
//   );
//   // const results = await scanConstraints(1);
//   // console.log(results.error, results.data, results.message);

//   if (error) {
//     console.log(error, data, message);
//   } else if (!error && !data) {
//     console.log(error, data, message);
//   } else {
//     console.log(error, data, message);
//   }
// };

// queryActiveConstraintsExceptIDTest();

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * Like queryActiveConstraintsExceptID() except we query against the TypeIndex
 */
module.exports.queryActiveConstraintsByTypeExceptID = async (
  type_index,
  constraint_id_target, // Return constraints with ID not equal to this
  time_start_target
) => {
  const params = {
    TableName: "FIMSConstraints",
    IndexName: "TypeIndex",
    KeyConditionExpression:
      "#c_type = :type_value AND time_end >= :time_start_value",
    FilterExpression: "constraint_id <> :constraint_id_target",
    ExpressionAttributeNames: {
      "#c_type": "constraint_type",
    },
    ExpressionAttributeValues: {
      ":type_value": type_index,
      ":time_start_value": time_start_target,
      ":constraint_id_target": constraint_id_target,
    },
  };

  try {
    const response = await documentClient.query(params).promise();
    if ("Items" in response && response.Items.length != 0) {
      return module.exports.clientResponse(
        false,
        response.Items,
        // `Constraints matching query conditions are retrieved.`
        `Active constraints are retrieved successfully.`
      );
    }
    // `Query conditions are not met, no constraints are retrieved.`
    return module.exports.clientResponse(
      false,
      null,
      `No active constraints can be retrieved.`
    ); // No data
  } catch (err) {
    return module.exports.clientResponse(
      true,
      null,
      "Failed to query active constraints."
    );
  }
};

// // Local test to resolve queryActiveConstraintsExceptID()
// const queryActiveConstraintsByTypeExceptIDTest = async () => {
//   const {
//     error,
//     data,
//     message,
//   } = await module.exports.queryActiveConstraintsByTypeExceptID(
//     "STC",
//     "422ad20b-444f-4c22-9fe5-146a19130381",
//     1587443184
//   );
//   // const results = await scanConstraints(1);
//   // console.log(results.error, results.data, results.message);

//   if (error) {
//     console.log(error, data, message);
//   } else if (!error && !data) {
//     console.log(error, data, message);
//   } else {
//     console.log(error, data, message);
//   }
// };

// queryActiveConstraintsByTypeExceptIDTest();

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * This method queries the 'StateIndex' global secondary index table.
 * Query constraints by checking state = 'Accepted' and time_end of existing constraints >= time_start
 * of new constraint, this ensures only the active constraints are returned.
 */
module.exports.queryActiveConstraints = async (
  state_index,
  time_start_target
) => {
  const params = {
    TableName: "FIMSConstraints",
    IndexName: "StateIndex",
    KeyConditionExpression:
      "#status = :status_value AND time_end >= :time_start_value",
    ExpressionAttributeNames: {
      "#status": "state",
    },
    ExpressionAttributeValues: {
      ":status_value": state_index,
      ":time_start_value": time_start_target,
    },
  };

  try {
    const response = await documentClient.query(params).promise();
    if ("Items" in response && response.Items.length != 0) {
      return module.exports.clientResponse(
        false,
        response.Items,
        // `Constraints matching query conditions are retrieved.`
        `Active constraints are retrieved successfully.`
      );
    }
    // `Query conditions are not met, no constraints are retrieved.`
    return module.exports.clientResponse(
      false,
      null,
      `No active constraints can be retrieved.`
    ); // No data
  } catch (err) {
    return module.exports.clientResponse(
      true,
      null,
      "Failed to query active constraints."
    );
  }
};

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * This method queries the 'TypeIndex' global secondary index table.
 * Query constraints by checking constraint_type = 'STC' or 'LTC' and time_end of existing constraints >= time_start
 * of new constraint, this ensures only the active constraints are returned.
 */
module.exports.queryActiveConstraintsByType = async (
  type_index,
  time_start_target
) => {
  const params = {
    TableName: "FIMSConstraints",
    IndexName: "TypeIndex",
    KeyConditionExpression:
      "#c_type = :type_value AND time_end >= :time_start_value",
    ExpressionAttributeNames: {
      "#c_type": "constraint_type",
    },
    ExpressionAttributeValues: {
      ":type_value": type_index,
      ":time_start_value": time_start_target,
    },
  };

  try {
    const response = await documentClient.query(params).promise();

    // // Doesn't work when deployed because there is a data limit on Lambda
    // // Reduce payload size in function response, return only 'extents'
    // let reducedResponseItems = []
    // for (let i = 0; i < response.Items.length; i++) {
    //   reducedResponseItems.push(
    //     {
    //       constraint_id: response.Items[i]['constraint_id']
    //     }
    //   )
    // }

    if ("Items" in response && response.Items.length != 0) {
      return module.exports.clientResponse(
        false,
        response.Items, // reducedResponseItems
        // `Constraints matching query conditions are retrieved.`
        `Active constraints of type ${type_index} are retrieved successfully.`
      );
    }
    // `Query conditions are not met, no constraints are retrieved.`
    return module.exports.clientResponse(
      false,
      null,
      `No active constraints of type ${type_index} can be retrieved.`
    ); // No data
  } catch (err) {
    return module.exports.clientResponse(
      true,
      null,
    //  `Failed to query active constraints of type ${type_index}.` // err // Return err for debugging only
     err
    );
  }
};

// // Local test to resolve queryActiveConstraintsByType()
// var { deleteConstraint } = require("./dbo-methods");
// const queryActiveConstraintsByTypeTest = async () => {
//   const {
//     error,
//     data,
//     message,
//   } = await module.exports.queryActiveConstraintsByType(
//     "LTC",
//     0 // Basically covers all times
//   );

//   if (error) {
//     console.log(error, data, message);
//   } else if (!error && !data) {
//     console.log(error, data, message);
//   } else {
//     console.log(error, data, message);
//   }

//   // try {
//   //   // Clear out a list of constraints from the DB
//   //   for (let j = 0; j < data.length/2; j++) {
//   //     console.log('j:', j);
//   //     console.log('Deleted:', data[j]['constraint_id']);
//   //     const res = await deleteConstraint(data[j]['constraint_id']);
//   //   }
//   // } catch (error) {
//   //   return error;
//   // }
// };

// queryActiveConstraintsByTypeTest();

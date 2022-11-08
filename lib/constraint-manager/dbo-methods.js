/*
 * This module contrains the key HTTP methods used in the Constraint Manager.
 */

var AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { validateNewConstraint } = require("./c-validator");
const { convertZulu2Unix } = require("./c-algos");
const { clientResponse } = require("./dbo-commons");

AWS.config.update({
  region: "ap-southeast-1",
});

const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

// ------------------------------------------------------------------------------------------------------------------------------

/** Get constraint by unique ID, returns unique constraint */
module.exports.getConstraint = async (id) => {
  const params = {
    TableName: "FIMSConstraints",
    Key: {
      constraint_id: id,
    },
  };

  try {
    const response = await documentClient.get(params).promise();
    if ("Item" in response) {
      return clientResponse(
        false,
        response.Item,
        `Constraint ${id} retrieved.`
      );
    }
    return clientResponse(false, null, `Constraint ${id} does not exist.`); // No data
  } catch (err) {
    return clientResponse(true, null, `Failed to get constraint ${id}.`);
  }
};

// ------------------------------------------------------------------------------------------------------------------------------

/** Delete constraint by ID */
module.exports.deleteConstraint = async (id) => {
  const params = {
    TableName: "FIMSConstraints",
    Key: {
      constraint_id: id,
    },
  };

  try {
    const response = await documentClient.delete(params).promise();
    return clientResponse(false, response, `Constraint ${id} deleted.`);
  } catch (err) {
    return clientResponse(true, null, `Failed to delete constraint ${id}.`);
  }
};

// ------------------------------------------------------------------------------------------------------------------------------

// /*
//  * Scan constraints 
//  * Note: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html
//  */
// module.exports.scanConstraints = async () => {
//   const params = {
//     TableName: "FIMSConstraints",
//     ProjectionExpression: "#id, extents, old_version, uss_base_url, #status, time_created, time_start, time_end, constraint_type",
//     ExpressionAttributeNames: {
//       "#id": "constraint_id",
//       "#status": "state",
//     },
//   };

//   try {
//     const response = await documentClient.scan(params, onScan).promise();
//     function onScan(err, data) {
//       if (err) {
//       } else {
//         // Continue scanning if we have more entries
//         // Because scan can only retrieve a maximum of 1MB of data
//         if (typeof data.LastEvaluatedKey != "undefined") {
//           params.ExclusiveStartKey = data.LastEvaluatedKey;
//           documentClient.scan(params, onScan); // Recursive
//         }
//       }
//     }

//     if ("Items" in response && response.Items.length != 0) {
//       console.log(response.Items);
//       return clientResponse(false, response.Items, "Constraints retrieved.");
//     }
//     return clientResponse(false, null, "Constraints are not available."); // No data
//   } catch (err) {
//     console.log('Scan error:', err);
//     return clientResponse(true, null, "Failed to retrieve constraints.");
//   }
// };

// Test scan ConstraintsID table only
module.exports.scanConstraints = async () => {
  const params = {
    TableName: "FIMSConstraintsID",
    ProjectionExpression: "#id, uss_base_url, time_created, time_start, time_end",
    ExpressionAttributeNames: {
      "#id": "constraint_id",
    },
  };

  try {
    const response = await documentClient.scan(params, onScan).promise();
    function onScan(err, data) {
      if (err) {
      } else {
        // Continue scanning if we have more entries
        // Because scan can only retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
          params.ExclusiveStartKey = data.LastEvaluatedKey;
          documentClient.scan(params, onScan); // Recursive
        }
      }
    }

    if ("Items" in response && response.Items.length != 0) {
      // console.log(response.Items);
      return clientResponse(false, response.Items, "Constraints retrieved.");
    }
    return clientResponse(false, null, "Constraints are not available."); // No data
  } catch (err) {
      // console.log('Scan error:', err);
      return clientResponse(true, null, "Failed to retrieve constraints.");
  }
};

// const testScan = async () => {
//   await module.exports.scanConstraints();
// }; testScan();

// ------------------------------------------------------------------------------------------------------------------------------

// /* 
//  * Post constraint ID, to accommodate big queries
//  * Called when a new constraint is created
//  */
// createConstraintID = async (constraint_id, time_start, time_end, uss_base_url) => {
//   const time_created = new Date().getTime();
//   const params = {
//     TableName: "FIMSConstraintsID",
//     Item: {
//       constraint_id: constraint_id, // Primary key generated as a new UUID
//       time_created: new Date(time_created).toISOString(),
//       time_start: time_start, 
//       time_end: time_end,
//       uss_base_url: uss_base_url
//     },
//   };

//   // No validation
//   const data = await documentClient.put(params).promise();
//     return clientResponse(
//       false,
//       params.Item,
//       `A new constraint ${new_id} is successfully created.`
//     );
// };

// ------------------------------------------------------------------------------------------------------------------------------

/* 
 * Post constraint with unique ID generated
 * Param 'extents' is in ASTM format and is required for the constraint validator
 * Param 'conflict_validation' toggles the check for spatial and temporal overlap between constraints, defaults to true
 */
module.exports.createConstraint = async (extents, state = "Accepted", uss_base_url, constraint_type, conflict_validation=true) => {
  const time_created = new Date().getTime();
  const new_id = uuidv4();
  const timeStart = convertZulu2Unix(extents[0]['time_start']['value']);
  const timeEnd = convertZulu2Unix(extents[0]['time_end']['value']);
  const timeCreated = new Date(time_created).toISOString();
  const params = {
    TableName: "FIMSConstraints",
    Item: {
      constraint_id: new_id, // Primary key generated as a new UUID
      time_created: timeCreated,
      extents: extents,
      time_start: timeStart, 
      time_end: timeEnd,
      // Ignores old_version supplied in request body
      old_version: 1, // New constraint always starts at version 0 + 1, this is enforced by the standards (min 1)
      state: state,
      uss_base_url: uss_base_url,
      constraint_type, constraint_type
    },
  };
  const paramsReduced = {
    TableName: "FIMSConstraintsID",
    Item: {
      constraint_id: new_id,
      time_created: timeCreated,
      time_start: timeStart, 
      time_end: timeEnd,
      uss_base_url: uss_base_url
    },
  };

  // If conflict validation is true, true for UVRs but false for Geozones
  if (conflict_validation) {

    // Conflict validation
    const { validity, overlap_type } = await validateNewConstraint(extents, null);
  
    if (validity === false) {
      return clientResponse(
        true,
        null,
        "Failed to create because submitted constraint conflicts with existing entities, please resubmit."
      );
    } else if (validity === true && overlap_type === "temporal-overlap") {
      const response = await documentClient.put(params).promise();
      const responseReduced = await documentClient.put(paramsReduced).promise(); // Stored reduced dataset
      return clientResponse(
        false,
        params.Item,
        `Submitted constraint is conflict-free, a new constraint ${new_id} is successfully created.` // Spatial passed. Temporal failed.
      ); // Temporal overlap only
    } else if (validity === true && overlap_type === "no-overlap") {
      const data = await documentClient.put(params).promise();
      const responseReduced = await documentClient.put(paramsReduced).promise(); // Stored reduced dataset
      return clientResponse(
        false,
        params.Item,
        `Submitted constraint is conflict-free, a new constraint ${new_id} is successfully created.` // Spatial passed. Temporal passed.
      );
    }
    
  } else {

    // No validation
    const data = await documentClient.put(params).promise();
    const responseReduced = await documentClient.put(paramsReduced).promise(); // Stored reduced dataset
      return clientResponse(
        false,
        params.Item,
        `A new constraint ${new_id} is successfully created. Conflict detection is offline.`
      );

  }

};

// ------------------------------------------------------------------------------------------------------------------------------

/** Update constraint by unique ID */
module.exports.updateConstraint = async (id, extents, state = "Accepted", old_version, uss_base_url, constraint_type, conflict_validation=true) => {
  const time_updated = new Date().getTime();
  const timeStart = convertZulu2Unix(extents[0]['time_start']['value']);
  const timeEnd = convertZulu2Unix(extents[0]['time_end']['value']);
  const timeUpdated = new Date(time_updated).toISOString();
  const params = {
    TableName: "FIMSConstraints",
    Item: {
      constraint_id: id, // Primary key generated as a new UUID
      time_created: timeUpdated,
      extents: extents,
      time_start: timeStart, 
      time_end: timeEnd,
      old_version: old_version + 1, // Increment version by 1 on update
      state: state,
      uss_base_url: uss_base_url,
      constraint_type, constraint_type
    },
  };
  const paramsReduced = {
    TableName: "FIMSConstraintsID",
    Item: {
      constraint_id: id,
      time_created: timeUpdated,
      time_start: timeStart, 
      time_end: timeEnd,
      uss_base_url: uss_base_url
    },
  };

  // If conflict validation is true, true for UVRs but false for Geozones
  if (conflict_validation) {

    // Conflict validation
    const { validity, overlap_type } = await validateNewConstraint(extents, id);

    if (validity === false) {
      return clientResponse(
        true,
        null,
        "Update failed because submitted constraint conflicts with existing entities, please resubmit."
      );
    } else if (validity === true && overlap_type === "temporal-overlap") {
      const response = await documentClient.put(params).promise();
      const responseReduced = await documentClient.put(paramsReduced).promise(); // Stored reduced dataset
      return clientResponse(
        false,
        params.Item,
        `Successfully updated constraint ${id}.`
      ); // Temporal overlap only
    } else if (validity === true && overlap_type === "no-overlap") {
      const data = await documentClient.put(params).promise();
      const responseReduced = await documentClient.put(paramsReduced).promise(); // Stored reduced dataset
      return clientResponse(
        false,
        params.Item,
        `Successfully updated constraint ${id}.`
      );
    }
  
  } else {

    // No validation
    const data = await documentClient.put(params).promise();
    const responseReduced = await documentClient.put(paramsReduced).promise(); // Stored reduced dataset
      return clientResponse(
        false,
        params.Item,
        `Constraint ${id} is successfully updated. Conflict detection is offline.`
      );
  }

};

// ------------------------------------------------------------------------------------------------------------------------------

/** Update CIF table by adding DSS response as a new column, used in create and update only */
module.exports.addDSSResponseToCIFTable = async (id, DSSResponse) => {
  const params = {
    TableName: "FIMSConstraints",
    Key: {
      constraint_id: id
    },
    UpdateExpression: "SET dss_response = :response",
    ExpressionAttributeValues:{
      ":response": DSSResponse
    },
    ReturnValues:"UPDATED_NEW" // Return only the updated attributes 
  };

  const return_values = await documentClient.update(params).promise();
  return clientResponse(
    false, // No error
    return_values,
    `Successfully added DSS response data to constraint ${id}.`
  );
};

// ------------------------------------------------------------------------------------------------------------------------------

/** Update CIF table by adding message as a new column, used in create and update only */
module.exports.addMessageToCIFTable = async (id, message) => {
  const params = {
    TableName: "FIMSConstraints",
    Key: {
      constraint_id: id
    },
    UpdateExpression: "SET cif_message = :response",
    ExpressionAttributeValues:{
      ":response": message
    },
    ReturnValues:"UPDATED_NEW" // Return only the updated attributes 
  };

  const return_values = await documentClient.update(params).promise();
  return clientResponse(
    false, // No error
    return_values,
    `Successfully added message to constraint ${id}.`
  );
};


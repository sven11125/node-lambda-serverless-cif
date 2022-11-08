/*
 * This module contrains the logic used to check for sptial-temporal overlaps
 * between the submitted constraint and the exisiting constraints from the
 * CIF database.
 */

const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const { convertZulu2Unix, datetimeRangeOverlaps, polygonOverlaps } = require("./c-algos");
const { 
  clientResponse, queryActiveConstraints, queryActiveConstraintsExceptID,
  queryActiveConstraintsByType, queryActiveConstraintsByTypeExceptID
} = require("./dbo-commons");

const AWS = require("aws-sdk");

AWS.config.update({
  region: "ap-southeast-1",
});

// const ddb = new AWS.DynamoDB({ apiVersion: "2012-10-18" });
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

/* 
 * Check if time_start is before time_end
 */
module.exports.validateTimeHorizon = function (time_start, time_end) {
  try {
    // Reference
    const constraint_start_time = convertZulu2Unix(time_start);
    const constraint_end_time = convertZulu2Unix(time_end);

    // Condition 1: Constraints start at least 10 mins into the future
    if ( constraint_start_time <= constraint_end_time ) {
      return clientResponse(
        false, // Validated
        null, // Data
        `Proposed constraint time horizon is valid.` 
      );
    } else {
      return clientResponse(
        true, // Error
        null, // Data
        `Proposed constraint time horizon is invalid, time_start must be defined prior to time_end.` 
      );
    }
  } catch (error) {
    return clientResponse(
      true, 
      null, 
      'Time horizon validation failed for some reason.' // Must not be null
    );
  }
}

/* 
 * Check the time horizon of the short-term constraints are valid IAW ASTM time requirements:
 *  - Constraints must be made available at least 10 minutes prior to their effective time.
 *  - Constraints can be made available up to 56 days before their effective time.
 *  - Proposed constraint adheres to the minimum effective time buffer of 5 minutes.
 *  - Proposed constraint adheres to the minimum duration of 5 minutes.
 *  - Proposed constraint adheres to the maximum duration of 24 hours.
 */
module.exports.validateSTCTimeHorizon = function (time_start, time_end, reference_time) {
  try {
    // Reference
    const current_time = reference_time;
    const constraint_start_time = convertZulu2Unix(time_start);
    const constraint_end_time = convertZulu2Unix(time_end);
    const time_horizon = constraint_end_time - constraint_start_time;

    // // Condition 1: Constraints start at least 10 mins into the future --- This rule has been manually disabled to support the MS5 trial (TODO)
    // if ( constraint_start_time >= current_time + 600 ) {
      // Condition 2: Constraints start at most 56 days into the future 
      if ( constraint_start_time <= current_time + 56*86400 ) {
        // Condition 4: Constraints at least 5 mins long 
        if ( time_horizon >= 300 ) { 
          // Condition 5: Constraints at most 24 hours long 
          if ( time_horizon <= 86400 ) { 
              return clientResponse(
              false, // Validated
              null, // Data
              `Proposed constraint adheres to ASTM requirements, well done!` 
            );
          }
          return clientResponse(
            true, // Error
            null, // Data
            `Proposed constraint must adhere to the maximum duration of 24 hours.` 
          );
        }
        return clientResponse(
          true, // Error
          null, // Data
          `Proposed constraint must adhere to the minimum duration of 5 minutes.` 
        );
      }
      return clientResponse(
        true, // Error
        null, // Data
        `Proposed constraint can only be made available up to 56 days before its effective time.` 
      );
    // }
    // return clientResponse(
    //   true, // Error 
    //   null, // Data
    //   `Proposed constraint must be made available at least 10 minutes prior to its effective time.` 
    // );
  } catch (error) {
    return clientResponse(
      true, 
      null, 
      'ASTM time horizon validation failed for some reason.' // Must not be null
    );
  }
}

/* 
 * Check if the old_version of the submitted constraint matches that in the 
 * database for the constraint with the same constraint_id.
 */
module.exports.checkConstraintVersion = function (submittedConstraintVersion, existingConstraintVersion) {
  try {
    // Compare two version numbers and their types
    if (submittedConstraintVersion === existingConstraintVersion) {
      return clientResponse(
        false, // Error
        null, // Data
        `Constraint version ${submittedConstraintVersion} is valid.` // Message
      );
    } 
    return clientResponse(
      true, 
      null, 
      `Constraint version ${submittedConstraintVersion} does not match the current version ${existingConstraintVersion}, please resubmit.` 
    );
  } catch (error) {
    return clientResponse(
      true, 
      null, 
      'Invalid version number.' // Must not be null
    );
  }
}

/** Returns true if there is a single time overlap between newConstraintExtents and scannedConstraints */
function isThereTemporalOverlap(newConstraintExtents, scannedConstraints) {
  // For each exisiting constraint, check for time overlap with the new constraint
  for (i = 0; i < scannedConstraints.length; i++) {
    if (
      datetimeRangeOverlaps(
        scannedConstraints[i].extents[0].time_start.value,
        scannedConstraints[i].extents[0].time_end.value,
        newConstraintExtents[0].time_start.value,
        newConstraintExtents[0].time_end.value
      )
    ) {
      return true;
      // break;
    } else if (i == scannedConstraints.length - 1) {
      return false; // End of loop, ensures the entire set has been checked
    }
  }
}

/** Returns true if there is a single geometric overlap between newConstraintExtents and scannedConstraints */
function isThereSpatialOverlap(newConstraintExtents, scannedConstraints) {
  // For each exisiting constraint, check for spatial overlap with the new constraint
  for (i = 0; i < scannedConstraints.length; i++) {
    if (
      polygonOverlaps(
        // Note the brackets to resolve "Error: Each LinearRing of a Polygon must have 4 or more Positions."
        [scannedConstraints[i].extents[0].volume.outline_polygon.coordinates[0]], // [0] -> Single LinearRing format
        [newConstraintExtents[0].volume.outline_polygon.coordinates[0]]
      )
    ) {
      return true;
      // break;
    } else if (i == scannedConstraints.length - 1) {
      return false; // End of loop, ensures the entire set has been checked
    }
  }
}

/*
 * Main validator, works with createConstraint() and updateConstraint() POST methods
 * Returns false if there is not overlap in both space and time, this is 
 * the condition needed to submit new constraint.
 */
module.exports.validateNewConstraint = async function validateNewConstraint(
  newConstraintExtents, newConstraintID = null
) {
  // // Inefficient scan, replaced with selective query
  // const params = {
  //   TableName: "FIMSConstraints",
  //   ProjectionExpression: "#id, time_created, extents",
  //   ExpressionAttributeNames: {
  //     "#id": "constraint_id",
  //   },
  // };

  // // Scan and retrieve all constraints from database
  // const constriantCollection = await documentClient
  //   .scan(params, onScan)
  //   .promise();

  // function onScan(err, data) {
  //   if (err) {
  //     console.error(
  //       "Unable to scan the table. Error JSON:",
  //       JSON.stringify(err, null, 2)
  //     );
  //   } else {
  //     // Continue scanning if we have more entries
  //     // Because scan can only retrieve a maximum of 1MB of data
  //     if (typeof data.LastEvaluatedKey != "undefined") {
  //       // console.log("Scanning for more...");
  //       params.ExclusiveStartKey = data.LastEvaluatedKey;
  //       documentClient.scan(params, onScan); // Recursive
  //     }
  //   }
  // }

  // const scannedConstraints = constriantCollection.Items; // Note .Items

  // Query for existing constraints instead of scan
  // try {
    // Prepare collection by querying for all active constraints
    // console.log('newConstraint:', newConstraintExtents);
    // const updated_time_start = convertZulu2Unix(newConstraintExtents[0]['time_start']['value']);
    // const constriantCollection = (await queryActiveConstraints('Accepted', updated_time_start)).data;

    // // Bypass temporal-spatial validity check as queryActiveConstraints() yeild no results
    // if (constriantCollection == null) {
    //   return { validity: true, overlap_type: 'no-active-conflicts' };
    // }
  // } catch (err) {
  //   // Failed to fetch active constraints
  //   console.log('Error in c-validator:', err);
  //   return { validity: null, overlap_type: err };
  // }

  // Properties of the input constraint
  const self_constraint_id = newConstraintID
  const self_time_start = convertZulu2Unix(newConstraintExtents[0]['time_start']['value']);
  let constriantCollection = null;

  // Selective query
  if (self_constraint_id == null) {
    // Constraint ID not specified
    // This is a new constraint, emmitted from createConstraint() method
    // constriantCollection = (await queryActiveConstraints('Accepted', self_time_start)).data; // Null if no data

    // TODO: Query against active constraints of type 'STC' only 
    // Therefore constraint collision check between UVRs and UVRs only
    // No collision check between UVRs and Geozones OR Geozones and Geozones
    constriantCollection = (await queryActiveConstraintsByType('STC', self_time_start)).data; // Null if no data
  } else { 
    // Constraint ID is specified 
    // This is an existing constraint, emmitted from updateConstraint() method
    // constriantCollection = (await queryActiveConstraintsExceptID('Accepted', self_constraint_id, self_time_start)).data;
    
    // TODO: Query against active constraints of type 'STC' only 
    // Therefore constraint collision check between UVRs and UVRs only
    // No collision check between UVRs and Geozones OR Geozones and Geozones
    constriantCollection = (await queryActiveConstraintsByTypeExceptID('STC', self_constraint_id, self_time_start)).data;
  }
  
  // Bypass temporal-spatial validity check as no active constraints are returned by query
  // Thus, there are no overlaps as submitted constraint is the only entity present
  if (constriantCollection == null) {
    // Bypass temporal-spatial validity check as query yields no results
    return { validity: true, overlap_type: 'no-overlap' };
  }
  
  /** Everything above are logics for determining whether the incoming constraint is to be created or updated */
  /** Everything below are logics for the constraint temporal-spatial validity check */

  const scannedConstraints = constriantCollection; // Note no .Items, as this has been embeded already

  // Check for temporal overlap first
  const isThereTemporalOverlapVerdict = await isThereTemporalOverlap(
    newConstraintExtents,
    scannedConstraints
  );

  // Do only if there is an overlap in time
  // Updated conflict checker logic, more efficient nested loops
  if (isThereTemporalOverlapVerdict) {
    // For each exisiting constraint, check for spatial overlap with the new constraint
    const isThereSpatialOverlapVerdict = await isThereSpatialOverlap(
      newConstraintExtents,
      scannedConstraints
    );

    // Overlap in space as well?
    if (isThereSpatialOverlapVerdict) {
      // Overlap in space and time -> FAIL
      return { validity: false, overlap_type: "spatial-temporal-overlap" };
    }
    // Overlap in time only -> PASS
    return { validity: true, overlap_type: "temporal-overlap" };
  } else {
    // No temporal and spatial overalap -> PASS
    return { validity: true, overlap_type: "no-overlap" };
  }
};

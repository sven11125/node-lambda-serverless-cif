/*
 * Here defines the constraint update method.
 * Update method must first check if constraint ID already exisits in database.
 * For STC, additional validation requried for this type of constraint.
 */

const moment = require("moment");
const utils = require("../cif-utils");
const { getConstraint, updateConstraint, addDSSResponseToCIFTable, addMessageToCIFTable } = require("./dbo-methods");
const { checkConstraintVersion, validateTimeHorizon, validateSTCTimeHorizon } = require("./c-validator");
const { parseConstraintUSSToDSS } = require("../dss-integration/dss-parsers");
const { putConstraintIntoDSS } = require("../dss-integration/dss-handlers");
const { hasConstraintType } = require("./dbo-commons");
const { onDSSResponseNotifyUSS } = require("../notifications/cnotif-emitter");
const { parseCIFConstraintToDSSConstraint } = require("../cif-parsers");

let responseMessage = "";
let responseBody = "Not Found";
let statusCode = 404; // Or 204 returns 'no content' and overrides response message

module.exports.main = async (constraintData) => {
  const { constraint_id, extents, old_version, state, uss_base_url } = constraintData;
  const responseHeaders = utils.corsHeaders("OPTIONS,POST");

  // ASTM time validation
  const { error: errorTimeHorizon, data: dataTimeHorizon, message: messageTimeHorizon } = validateTimeHorizon(
    extents[0]['time_start']['value'], // Use bracket notation to avoid variable being undefined because magic
    extents[0]['time_end']['value']
  );
  if (errorTimeHorizon) {
    return utils.responseError(400, messageTimeHorizon, responseHeaders); // Valid timeline
  }
  const { error: errorSTCTimeHorizon, data: dataSTCTimeHorizon, message: messageSTCTimeHorizon } = validateSTCTimeHorizon(
    extents[0]['time_start']['value'], // Use bracket notation to avoid variable being undefined because magic
    extents[0]['time_end']['value'],
    moment().unix()
  );
  if (errorSTCTimeHorizon) {
    return utils.responseError(400, messageSTCTimeHorizon, responseHeaders);
  }

  // // Check type of constraint
  // let constraint_type = 'STC'; // Default type is short-term constraint
  // if (hasConstraintType(constraintData) == true) {
  //   // If constraint_type is supplied
  //   constraint_type = constraintData.constraint_type; // LTC or STC, STC is selected if anything else is provided
  // }
  // Enforce type of constraint
  const constraint_type = 'STC';

  // Check if constraint exists in the database by ID, if not, return failed update
  const { error: errorGet, data: dataGet, message: messageGet } = await getConstraint(constraint_id);
  if (errorGet) {
    return utils.responseError(500, messageGet, responseHeaders);
  } else if (dataGet) {
    // Check if old_version is valid and in sync
    const { error: errorVersion, data: dataVersion, message: messageVersion } = checkConstraintVersion(old_version, dataGet.old_version);
    if (errorVersion) {
      return utils.responseError(400, messageVersion, responseHeaders); // Invalid old_version supplied
    }
  } else if (!dataGet) {
    return utils.responseError(statusCode, `Constraint ${constraint_id} does not exist, update failed.`, responseHeaders); // ID not found
  }

  // If getConstraint() is passed
  const { error: errorUpdate, data: dataUpdate, message: messageUpdate } = await updateConstraint(constraint_id, extents, 'Accepted', old_version, uss_base_url, constraint_type);
  if (errorUpdate) {
    return utils.responseError(200, messageUpdate, responseHeaders);
  } else {

    /** DSS integration for PUT, same workflow as in dbo-create.js */

    // Parse constraint (output from createConstraint) into DSS format, then post to DSS
    const [errorParsed, constraintDataDSSFormat] = parseConstraintUSSToDSS(dataUpdate); // Strips the ID from the constraint
    const [errorPutDSS, responsePutDSS] = await putConstraintIntoDSS(constraintDataDSSFormat);
    if (errorPutDSS) { 
      // If for some reason putConstraintIntoDSS() fails, we would still return success because
      // createConstraint() is passed as we created a constraint in the CIF but not the DSS,
      // we return a special error message to identify this.
      constraintDataDSSFormat['message'] = `Submitted constraint successfully updated in the CIF but failed to update in the DSS for some reason. DSS error: (${errorPutDSS})`;
      constraintDataDSSFormat['dss_response'] = responsePutDSS;
      await addDSSResponseToCIFTable(constraintDataDSSFormat.constraint_id, responsePutDSS); // Capture DSS error in CIF database
      return utils.responseSuccess(201, constraintDataDSSFormat, responseHeaders);
    }

    // Push notification to relevant subscribers provided in the DSS response
    const DSSConstraint = parseCIFConstraintToDSSConstraint(dataUpdate, responsePutDSS);
    const [notificationErr, notificationMsg] = await onDSSResponseNotifyUSS(constraintDataDSSFormat.constraint_id, DSSConstraint, responsePutDSS); 
    // console.log('responsePutDSS:', util.inspect(responsePutDSS, {showHidden: false, depth: null}));
    // console.log('notificationErr, notificationMsg:', notificationErr, util.inspect(notificationMsg, {showHidden: false, depth: null}));
    if (notificationErr) {
      dataUpdate['message'] = `Submitted constraint successfully updated in the CIF and DSS, but push notification failed for some reason. Error: (${notificationMsg})`;
      return utils.responseSuccess(201, dataUpdate, responseHeaders);
    }

    // Success
    dataUpdate['astm_validation'] = messageSTCTimeHorizon;
    dataUpdate['message'] = messageUpdate; // Add message to response
    dataUpdate['dss_response'] = responsePutDSS;
    await addDSSResponseToCIFTable(dataUpdate.constraint_id, responsePutDSS);
    // await addMessageToCIFTable(dataUpdate.constraint_id, messageUpdate);
    return utils.responseSuccess(201, dataUpdate, responseHeaders);
  }
};

// // Local test
// const constraint_data = {
//   "constraint_id": "422ad20b-444f-4c22-9fe5-146a19130381",
//   "extents": [{
//     "time_end": {
//       "format": "RFC3339",
//       "value": "2020-11-21T17:26:24Z"
//     },
//     "time_start": {
//       "format": "RFC3339",
//       "value": "2020-11-21T16:49:24Z"
//     },
//     "volume": {
//       "altitude_lower": {
//         "reference": "W84",
//         "units": "M",
//         "value": 0
//       },
//       "altitude_upper": {
//         "reference": "W84",
//         "units": "M",
//         "value": 100
//       },
//       "outline_polygon": {
//         "coordinates": [
//           [
//             [103.85495497971431, 1.2886965146831955],
//             [103.85349357666604, 1.2828751821136281],
//             [103.85529602112451, 1.2804725240958277],
//             [103.85495497971431, 1.2886965146831955]
//           ]
//         ],
//         "type": "Polygon"
//       }
//     }
//   }],
//   "old_version": 1,
//   "uss_base_url": "https://test.net"
// }

// module.exports.main(constraint_data);
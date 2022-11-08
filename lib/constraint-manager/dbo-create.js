/*
 * Here defines the constraint create method.
 * For STC, additional validation requried for this type of constraint.
 */

const moment = require("moment");
const utils = require("../cif-utils");
const util = require('util');
const { v4: uuidv4 } = require("uuid");
const { createConstraint, addDSSResponseToCIFTable, addMessageToCIFTable } = require("./dbo-methods");
const { parseConstraintUSSToDSS } = require("../dss-integration/dss-parsers");
const { putConstraintIntoDSS } = require("../dss-integration/dss-handlers");
const { hasConstraintType } = require("./dbo-commons");
const { validateTimeHorizon, validateSTCTimeHorizon } = require("./c-validator");
const { onDSSResponseNotifyUSS } = require("../notifications/cnotif-emitter");
const { parseCIFConstraintToDSSConstraint } = require("../cif-parsers");

module.exports.main = async (constraintData) => {
  // // Check type of constraint
  // let constraint_type = 'STC'; // Default type is short-term constraint
  // if (hasConstraintType(constraintData) == true) {
  //   // If constraint_type is supplied
  //   constraint_type = constraintData.constraint_type; // LTC or STC, STC is selected if anything else is provided
  // }
  // Enforce type of constraint
  const constraint_type = 'STC';

  // Only care about the extents, since this is a new constraint definition
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

  // Create a new constraint with conflict validation
  const { error, data, message } = await createConstraint(extents, 'Accepted', uss_base_url, constraint_type);
  
  // console.log( 'Break 1:', error, data, message );

  if (error) {
    return utils.responseError(200, message, responseHeaders);
  } else {
    
    /** DSS integration for PUT */

    // Parse constraint (output from createConstraint) into DSS format, then post to DSS
    const [errorParsed, constraintDataDSSFormat] = parseConstraintUSSToDSS(data); // Strips the ID from the constraint
    const [errorPutDSS, responsePutDSS] = await putConstraintIntoDSS(constraintDataDSSFormat);
    if (errorPutDSS) { 
      // If for some reason putConstraintIntoDSS() fails, we would still return success because
      // createConstraint() is passed as we created a constraint in the CIF but not the DSS,
      // we return a special error message to identify this.
      constraintDataDSSFormat['message'] = `Submitted constraint successfully created in the CIF but failed to create in the DSS for some reason. DSS error: (${errorPutDSS})`;
      constraintDataDSSFormat['dss_response'] = responsePutDSS;
      await addDSSResponseToCIFTable(constraintDataDSSFormat.constraint_id, responsePutDSS); // Capture DSS error in CIF database
      return utils.responseSuccess(201, constraintDataDSSFormat, responseHeaders);
    }

    // console.log( 'Break 2:', error, data, message );
    
    // Push notification to relevant subscribers provided in the DSS response
    const DSSConstraint = parseCIFConstraintToDSSConstraint(data, responsePutDSS);
    const [notificationErr, notificationMsg] = await onDSSResponseNotifyUSS(constraintDataDSSFormat.constraint_id, DSSConstraint, responsePutDSS); 
    // console.log('responsePutDSS:', util.inspect(responsePutDSS, {showHidden: false, depth: null}));
    // console.log('notificationErr, notificationMsg:', notificationErr, util.inspect(notificationMsg, {showHidden: false, depth: null}));
    if (notificationErr) {
      data['message'] = `Submitted constraint successfully created in the CIF and DSS, but push notification failed for some reason. Error: (${notificationMsg})`;
      return utils.responseSuccess(201, data, responseHeaders);
    }

    // TODO: Need to test notification with DSS subscription

    // Success
    data['message'] = message; // Add message to response
    data['dss_response'] = responsePutDSS;
    data['astm_validation'] = messageSTCTimeHorizon;
    await addDSSResponseToCIFTable(data.constraint_id, responsePutDSS);
    // await addMessageToCIFTable(data.constraint_id, message);

    // console.log( 'Break 3:', error, data, message );
    
    return utils.responseSuccess(201, data, responseHeaders);
  }
};

/*
API POST:
{
    "constraint_id":"constraint_id",
    "extents":[{"extents":"extents"}],
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

// // Local test

// // Make sure the time horizon is valid
// const testData = {
//   "extents": [
//     {
//       "time_end": {
//         "format": "RFC3339",
//         "value": "2020-11-20T17:26:24Z"
//       },
//       "time_start": {
//         "format": "RFC3339",
//         "value": "2020-11-20T16:49:24Z"
//       },
//       "volume": {
//         "altitude_lower": {
//           "reference": "W84",
//           "units": "M",
//           "value": 0
//         },
//         "altitude_upper": {
//           "reference": "W84",
//           "units": "M",
//           "value": 100
//         },
//         "outline_polygon": {
//           "coordinates": [
//             [
//               [103.85495497971431, 1.2886965146831955],
//               [103.85349357666604, 1.2828751821136281],
//               [103.85529602112451, 1.2804725240958277],
//               [103.85495497971431, 1.2886965146831955]
//             ]
//           ],
//           "type": "Polygon"
//         }
//       }
//     }
//   ],
//   "old_version": 0,
//   "uss_base_url": "https://fims.novautm.net"
// }

// const runTest = async () => {
//   await module.exports.main(testData);
// }; runTest();

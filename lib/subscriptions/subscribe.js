/*
 * This module subscribes to a volume within the DSS using PUT /dss/v1/subscriptions/{subscriptionid}
 * Subscription notifications are only triggered by (and contain full information of) changes to, creation of, or deletion of, Entities referenced by or stored in the DSS.
 * They do not involve any data transfer (such as remote ID telemetry updates) apart from Entity information.
 */

const axios = require("axios");
const utils = require("../cif-utils");
const { v4: uuidv4 } = require("uuid");
const { getDSSAuthToken } = require("../dss-integration/dss-handlers");
const { parseVolumeUSSToDSS } = require("../dss-integration/dss-parsers");

// const dss_url = "http://54.169.8.110:8082/dss/v1"; // Updated 28 July 2020
const dss_url = "http://novauss.com/dss/v1"; // Updated 26 October 2020

/*
 * Prepares JSON body for putSubscriptionIntoDSS()
 * No schema validation
 */
const preparePutSubscriptionPayload = (requestBody) => {
  try {
    const {
      extents,
      old_version,
      uss_base_url,
      notify_for_operations,
      notify_for_constraints,
    } = requestBody;
    const { volume: Volume3D, time_start, time_end } = extents;
    const [parserError, DSSVolume3D] = parseVolumeUSSToDSS(Volume3D); // Convert to old DSS format, lng/lat not LonLatPair
    const parsedRequestBody = {
      extents: {
        volume: DSSVolume3D,
        time_start: time_start,
        time_end: time_end,
      },
      old_version: old_version,
      uss_base_url: uss_base_url,
      notify_for_operations: Boolean(notify_for_operations),
      notify_for_constraints: Boolean(notify_for_constraints),
    };
    return [false, parsedRequestBody];
  } catch (err) {
    return [true, null]; // Any error caught when parsing will trigger this
  }
};

/*
 * Put to create constraint reference in DSS
 * Default scope is "nova/utm.constraint_management"
 */
module.exports.putSubscriptionIntoDSS = async (
  requestBody, // The bit within 'extents'
  client_scope = "utm.strategic_coordination"
) => {
  const responseHeaders = utils.corsHeaders("OPTIONS,PUT"); // CORS
  try {
    // Check authorization
    [auth_error, auth_token] = await getDSSAuthToken(client_scope);
  } catch (error) {
    // console.log("error", error.stack);
    return utils.responseError(
      401,
      // error.stack,
      "Bearer access token was not provided in Authorization header, token could not be decoded, or token was invalid.",
      responseHeaders
    );
  }

  // Parse CIF input
  const subID = uuidv4(); // New UUID
  const request_url = `${dss_url}/subscriptions/${subID}`;
  [parserErr, parsedRequestBody] = preparePutSubscriptionPayload(requestBody);
  // console.log('parsedRequestBody:', parsedRequestBody);
  if (parserErr) {
    return utils.responseError(
      400,
      "Subscription failed, the request attempted to mutate the Subscription in a disallowed way.",
      responseHeaders
    );
  }
  const request_params = {
    method: "put",
    headers: {
      Authorization: `Bearer ${auth_token}`,
    },
    url: request_url,
    data: parsedRequestBody, // DSS format
  };

  // // Dummy GET test
  // const dummyID = "c0eb7a6d-22e3-45a4-adf1-7b162bbf5e7c";
  // const dummy_params = {
  //   method: "get",
  //   headers: {
  //     Authorization: `Bearer ${auth_token}`,
  //   },
  //   url: `${dss_url}/constraint_references/${dummyID}`,
  // };
  // try {
  //   const response = await axios(dummy_params);
  //   console.log('response.data', response.data)
  //   // return [null, response.data];
  //   return utils.responseSuccess(200, response.data, responseHeaders)
  // } catch (error) {
  //   // return [error, error['response']['data']];
  //   return utils.responseError(500, error.stack, responseHeaders);
  // }

  // Submit to DSS
  try {
    const response = await axios(request_params);
    console.log("response.data", response.data);
    return utils.responseSuccess(200, response.data, responseHeaders); // Success
  } catch (error) {
    console.log("error", error.response.data);
    return utils.responseError(
      500,
      // error.stack,
      "Subscription failed, subscription area is too large.", 
      responseHeaders
    );
  }
};

// BUG: For some reason server crashes...
// {
//   "message": "Error: Request failed with status code 400\n    at createError (/var/task/node_modules/axios/lib/core/createError.js:16:15)\n    at settle (/var/task/node_modules/axios/lib/core/settle.js:17:12)\n    at IncomingMessage.handleStreamEnd (/var/task/node_modules/axios/lib/adapters/http.js:236:11)\n    at IncomingMessage.emit (events.js:327:22)\n    at IncomingMessage.EventEmitter.emit (domain.js:482:12)\n    at endReadableNT (_stream_readable.js:1221:12)\n    at processTicksAndRejections (internal/process/task_queues.js:84:21)",
//   "state": "Rejected"
// }
// Bug solved: Too large of a request area crashes the DSS...

// ------------------------------------------------------------------------------------------------------------------------------

// // Test session
// const testSubPayload = {
//   extents: {
//     time_end: {
//       format: "RFC3339",
//       value: "2020-11-17T08:40:24Z",
//     },
//     time_start: {
//       format: "RFC3339",
//       value: "2020-11-17T05:55:24Z",
//     },
//     volume: {
//       altitude_lower: {
//         reference: "W84",
//         units: "M",
//         value: 0,
//       },
//       altitude_upper: {
//         reference: "W84",
//         units: "M",
//         value: 100,
//       },
//       outline_polygon: {
//         coordinates: [
//           // [
//           //   [103.59, 1.13],
//           //   [104.07, 1.13],
//           //   [104.07, 1.47],
//           //   [103.59, 1.47],
//           //   [103.59, 1.13], // To large of an area crashes the DSS
//           // ],
//           [
//             [103.84313131960306, 1.2884812239473575],
//             [103.83284296993344, 1.2574632207548007],
//             [103.90566519493661, 1.2222661763030516],
//             [103.93508344477397, 1.2889633660872732],
//             [103.84313131960306, 1.2884812239473575], // Smaller area
//           ],
//         ],
//         type: "Polygon",
//       },
//     },
//   },
//   old_version: 0,
//   uss_base_url: "https://fims.novautm.net",
//   notify_for_operations: "true",
//   notify_for_constraints: "true",
// };

// const util = require('util');
// const transformedBody = preparePutSubscriptionPayload(testSubPayload);
// console.log(util.inspect(transformedBody, {showHidden: false, depth: null}));

// module.exports.putSubscriptionIntoDSS(testSubPayload);

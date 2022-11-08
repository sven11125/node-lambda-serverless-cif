/*
 * This module contains HTTP methods used to communicate with the DSS.
 * This module uses Axios to make promised-based HTTP requests.
 */

const axios = require("axios");

// const dss_url = "http://52.77.228.18:8082/dss/v1"; // Old build with scope "nova/utm.constraint_management"
// const dss_url = "http://54.169.8.110:8082/dss/v1"; // Updated 28 July 2020
const dss_url = "http://novauss.com/dss/v1"; // Updated 26 October 2020
const uss_url = "https://auth.novauss.com";

/*
 * Post to retrieve authentication token for DSS comms
 * Default scope is "sp/read"
 */
module.exports.getDSSAuthToken = async (client_scope = "sp/read") => {
  const client_id = "1hlc4etfl7fp8tv11r11rclij3";
  const client_secret = "186q0pmsemja3f179064v1becs0jca73h4hriku5tslf251he305";
  const auth_url = `${uss_url}/oauth2/token?grant_type=client_credentials&scope=${client_scope}&client_id=${client_id}&client_secret=${client_secret}&audience=${client_id}`;
  const requestParams = {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    url: auth_url,
  };
  try {
    const response = await axios(requestParams);
    return [null, response.data.access_token]; // Return [error, data]
  } catch (error) {
    return [error, error['response']['data']];
  }
};

// ------------------------------------------------------------------------------------------------------------------------------

// Note: We can pass the response error directly here because these HTTP methods are not CIF-user facing
// All DSS responses are handled at the CIF backend, see the dbo methods

/*
 * Put to create constraint reference in DSS
 * Default scope is "nova/utm.constraint_management"
 */
module.exports.putConstraintIntoDSS = async (
  Constraint,
  client_scope = "utm.constraint_management"
) => {
  try {
    [auth_error, auth_token] = await module.exports.getDSSAuthToken(
      client_scope
    );
  } catch (error) {
    return [error, null];
  }
  const request_url = `${dss_url}/constraint_references/${Constraint.constraint_id}`;
  const request_params = {
    method: "put",
    headers: {
      Authorization: `Bearer ${auth_token}`,
    },
    url: request_url,
    data: Constraint,
  };
  try {
    const response = await axios(request_params);
    // console.log('response.data', response.data);
    return [null, response.data];
  } catch (error) {
    // console.log('error', error);
    return [error, error['response']['data']];
  }
};

/*
 * Get constraint reference from DSS
 * Default scope is "nova/utm.constraint_management"
 */
module.exports.getConstraintFromDSS = async (
  constraint_id,
  client_scope = "utm.constraint_management"
) => {
  try {
    [auth_error, auth_token] = await module.exports.getDSSAuthToken(
      client_scope
    );
  } catch (error) {
    return [error, null];
  }
  const request_url = `${dss_url}/constraint_references/${constraint_id}`;
  const request_params = {
    method: "get",
    headers: {
      Authorization: `Bearer ${auth_token}`,
    },
    url: request_url,
  };
  try {
    const response = await axios(request_params);
    console.log('response.data', response.data)
    return [null, response.data];
  } catch (error) {
    return [error, error['response']['data']];
  }
};

// module.exports.getConstraintFromDSS("cb0a6bd3-8b6b-493d-8612-834f4d69d97e");

/*
 * Delete constraint reference from DSS
 * Default scope is "nova/utm.constraint_management"
 */
module.exports.deleteConstraintFromDSS = async (
  constraint_id,
  client_scope = "utm.constraint_management"
) => {
  try {
    [auth_error, auth_token] = await module.exports.getDSSAuthToken(
      client_scope
    );
  } catch (error) {
    return [error, null];
  }
  const request_url = `${dss_url}/constraint_references/${constraint_id}`;
  const request_params = {
    method: "delete",
    headers: {
      Authorization: `Bearer ${auth_token}`,
    },
    url: request_url,
  };
  try {
    const response = await axios(request_params);
    return [null, response.data];
  } catch (error) {
    return [error, error['response']['data']];
  }
};

/*
 * Query an area from DSS for all constraints, i.e. identify operators by "uss_base_url" and "id"
 * Default scope is "nova/utm.constraint_management"
 */
module.exports.queryAreaInDSS = async (
  AreaOfInterest,
  client_scope = "utm.constraint_management"
) => {
  try {
    [auth_error, auth_token] = await module.exports.getDSSAuthToken(
      client_scope
    );
  } catch (error) {
    return [error, null];
  }
  const request_url = `${dss_url}/constraint_references/query`;
  const request_params = {
    method: "post",
    headers: {
      Authorization: `Bearer ${auth_token}`,
    },
    url: request_url,
    data: AreaOfInterest,
  };
  try {
    const response = await axios(request_params);
    return [null, response.data];
  } catch (error) {
    return [error, error['response']['data']];
  }
};

// ------------------------------------------------------------------------------------------------------------------------------

/** Local testing */

// // HTTP request test
// const test_constraint_uss_format = {
//   // id: "facbb791-48cb-4116-905f-5765c14a9d32",
//   constraint_id: "facbb791-48cb-4116-905f-5765c14a9d20", // CIF format
//   extents: [{
//     time_end: {
//       format: "RFC3339",
//       value: "2021-06-21T04:26:24Z",
//     },
//     time_start: {
//       format: "RFC3339",
//       value: "2021-06-20T04:26:24Z",
//     },
//     volume: {
//       altitude_lower: {
//         reference: "W84", // Updated W84 to W84
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
//           [
//             [103.85495497971431, 1.2886965146831955],
//             [103.85349357666604, 1.2828751821136282],
//             [103.85529602112452, 1.2804725240958277],
//             [103.85495497971431, 1.2886965146831955],
//           ],
//         ],
//         type: "Polygon",
//       },
//     },
//   }],
//   old_version: 0,
//   state: "Accepted",
//   uss_base_url: "https://novauss.com/utm/constraints",
// };

// const test_constraint_dss_format = {
//   extents: [
//     {
//       volume: {
//         outline_polygon: {
//           vertices: [
//             {
//               lat: 1.2646,
//               lng: 103.8377,
//             },
//             {
//               lat: 1.28246,
//               lng: 103.8377,
//             },
//             {
//               lat: 1.28246,
//               lng: 103.8746,
//             },
//             {
//               lat: 1.2646,
//               lng: 103.8746,
//             },
//           ],
//         },
//         altitude_lower: {
//           value: 10.5,
//           reference: "W84",
//           units: "M",
//         },
//         altitude_upper: {
//           value: 19.5,
//           reference: "W84",
//           units: "M",
//         },
//       },
//       time_start: {
//         value: "2020-07-26T06:24:43Z",
//         format: "RFC3339",
//       },
//       time_end: {
//         value: "2020-07-27T06:24:43Z",
//         format: "RFC3339",
//       },
//     },
//   ],
//   old_version: 2,
//   state: "Accepted",
//   uss_base_url: "https://novauss.com/utm/constraints",
//   constraint_id: "cb0a6bd3-8b6b-493d-8612-834f4d69d97e",
// };

// const { parseConstraintUSSToDSS } = require("./dss-parsers");
// const test_constraint = parseConstraintUSSToDSS(test_constraint_uss_format)[1];
// console.log(test_constraint);
// const runTest = async () => {
//   // [error, response] = await module.exports.getDSSAuthToken();
//   [error, response] = await module.exports.putConstraintIntoDSS(
//     test_constraint
//   );
//   // [error, response] = await module.exports.getConstraintFromDSS(test_constraint.constraint_id);
//   // [error, response] = await module.exports.deleteConstraintFromDSS(test_constraint.constraint_id);
//   console.log(response);
// };
// runTest();

//

// // Query area test
// area_of_interest = {
//   area_of_interest: {
//     volume: {
//       outline_polygon: {
//         vertices: [
//           {
//             lat: 1.2646,
//             lng: 103.8377,
//           },
//           {
//             lat: 1.28246,
//             lng: 103.8377,
//           },
//           {
//             lat: 1.28246,
//             lng: 103.8746,
//           },
//           {
//             lat: 1.2646,
//             lng: 103.8746,
//           },
//         ],
//       },
//       altitude_lower: {
//         value: 10.5,
//         reference: "W84",
//         units: "M",
//       },
//       altitude_upper: {
//         value: 19.5,
//         reference: "W84",
//         units: "M",
//       },
//     },
//     time_start: {
//       value: "2020-07-26T06:24:43Z",
//       format: "RFC3339",
//     },
//     time_end: {
//       value: "2020-07-28T06:24:43Z",
//       format: "RFC3339",
//     },
//   },
// };

// const runQuery = async () => {
//   [error, response] = await module.exports.queryAreaInDSS(area_of_interest);
//   console.log(error, response);
// };
// runQuery();

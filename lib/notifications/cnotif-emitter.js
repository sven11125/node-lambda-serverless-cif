/*
 * This module handles the subscriptions contained in a DSS response
 * For each subscriber in the response, a notification must be sent to inform that subscriber of a new constraint
 * This emits a notification to inform external USSs, not to be confused with cnotif-handler.js (which does the opposite)
 */

const { workaroundForOneSky35 } = require('./workaround');
const { pprint } = require('../cif-utils');

const util = require('util');
const axios = require("axios");
const uss_auth_url = "https://auth.novauss.com" // "https://auth.fims.novautm.net";
const uss_url = "https://fims.novautm.net";

// TODO: Need to change authentication process to cater for the USS given in the notification

// UPDATE: Using Nova USS auth server to authentication for interUSS endpoints like notification (POST) and subscription (PUT)

/*
 * Post to notify, need to specify USS
 * Here the client credentials are from the CIF
 * Default scope is "cif/constraints.write"
 */
module.exports.getUSSAuthToken = async (
  client_scope
) => {
  // const client_id = "8bl6r16aemr238c18v16l2g86"; // Assumes AGI_Client_UTM_Access to access
  // const client_secret = "4am17fl9h3dt51t5e0maabl6qr3o2dfiufdk470huuevkte5qgc";
  
  const client_id = "3fob1lmd5ahq1fok0ht0nl62qc"; // Assumes AGI_Client_UTM_Access to access
  const client_secret = "5orkq410cdbdhhvqbp2ndhl8bgisua7i4i71emtbk3cta2ghg83";

  const auth_url = `${uss_auth_url}/oauth2/token?grant_type=client_credentials&scope=${client_scope}&client_id=${client_id}&client_secret=${client_secret}&audience=${client_id}`;
  const requestParams = {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    url: auth_url,
  };
  try {
    const response = await axios(requestParams);
    // console.log(response.data.access_token);
    return [null, response.data.access_token]; // Return [error, data]
  } catch (error) {
    console.log('Error in getUSSAuthToken():', error);
    return [error, error["response"]["data"]];
  }
};

// module.exports.getUSSAuthToken("utm.constraint_management");

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * POST method, for notifying the subscribing USS via HTTP POST
 */
const postNotificationToUSS = async (
  uss_url,
  json_data,
  client_scope = "utm.constraint_consumption" // interUSS 0.3.5
) => {
  try {
    [auth_error, auth_token] = await module.exports.getUSSAuthToken(
      client_scope
    );
    // console.log('auth_token:', auth_token);
  } catch (error) {
    // console.log('auth_token error:', error);
    return [error, null];
  }
  const request_url = `${uss_url}/uss/v1/constraints`; // Push notification to this USS

  // Check for URL, apply workaround if OneSky
  const request_params = {
    method: "post",
    headers: {
      Authorization: `Bearer ${auth_token}`,
    },
    url: request_url,
    data: uss_url.includes('onesky') ? workaroundForOneSky35(json_data) : json_data, // Expect v0.3.5 format
  };

  pprint(request_params, 'Payload from postNotificationToUSS():');

  try {
    const response = await axios(request_params)
      .then(result => { // 204 if success, so no data given for this endpoint
        console.log("Reponse status code of postNotificationToUSS():", result.status);
        // console.log("Reponse of postNotificationToUSS():", result);
        return [null, result.status];
      }).catch(err => {
        console.log('Error when making request in postNotificationToUSS():', err);
      });
  } catch (error) {
    console.log('Error in postNotificationToUSS():', util.inspect(error.response.data, {showHidden: false, depth: null}));
    return [error, error];
  }
};

// // Test OneSky post notification integration

// // const testData38 = {
// //   constraint_id: "c2b61083-4003-442a-b261-83e296cbea7b",
// //   constraint: {
// //     reference: {
// //       id: "c2b61083-4003-442a-b261-83e296cbea7b",
// //       owner: "1hlc4etfl7fp8tv11r11rclij3",
// //       version: 1,
// //       time_start: { format: "RFC3339", value: "2020-08-06T13:49:24Z" },
// //       time_end: { format: "RFC3339", value: "2020-08-06T14:26:24Z" },
// //       uss_base_url: "https://fims.novautm.net",
// //     },
// //     details: {
// //       volumes: [
// //         {
// //           volume: {
// //             altitude_lower: { reference: "W84", units: "M", value: 0 },
// //             altitude_upper: { reference: "W84", units: "M", value: 100 },
// //             outline_polygon: {
// //               coordinates: [
// //                 [
// //                   [103.85495497971431, 1.2886965146831955],
// //                   [103.85349357666604, 1.2828751821136282],
// //                   [103.85529602112452, 1.2804725240958277],
// //                   [103.85495497971431, 1.2886965146831955],
// //                 ],
// //               ],
// //               type: "Polygon",
// //             },
// //           },
// //           time_start: { format: "RFC3339", value: "2020-08-06T13:49:24Z" },
// //           time_end: { format: "RFC3339", value: "2020-08-06T14:26:24Z" },
// //         },
// //       ],
// //       type: "STC",
// //     },
// //   },
// //   subscriptions: [
// //     {
// //       notification_index: 10,
// //       subscription_id: "551a037a-faeb-498c-bb04-bf371e1b36f6",
// //     },
// //     {
// //       notification_index: 10,
// //       subscription_id: "8e0961c6-949d-4be6-9065-6b174e1c68c6",
// //     },
// //   ],
// // };

// const testData35 = {
//   "constraint_id": "9ffcab4c-6808-4213-8d97-0f35a372e96e",
//   "constraint": {
//       "reference": {
//           "id": "9ffcab4c-6808-4213-8d97-0f35a372e96e",
//           "owner": "3fob1lmd5ahq1fok0ht0nl62qc",
//           "version": 1,
//           "ovn": "r8JPGVJo2poZVrmCy+Am66W0DHxDO3ZijL25/oc9m0I=",
//           "time_start": {
//               "value": "2021-02-18T10:00:00.000Z",
//               "format": "RFC3339"
//           },
//           "time_end": {
//               "value": "2021-11-18T12:00:00.000Z",
//               "format": "RFC3339"
//           },
//           "uss_base_url": "https://app.oneskyasia.com/api/inbound"
//       },
//       "details": {
//           "volumes": [
//               {
//                   "volume": {
//                       "outline_polygon": {
//                           "vertices": [
//                               {
//                                   "lng": 7.48128101342947,
//                                   "lat": 46.97284246488468
//                               },
//                               {
//                                   "lng": 7.480866938192458,
//                                   "lat": 46.9719292103624
//                               },
//                               {
//                                   "lng": 7.4818790743561365,
//                                   "lat": 46.97151981302649
//                               },
//                               {
//                                   "lng": 7.482753232367149,
//                                   "lat": 46.97233858020792
//                               },
//                               {
//                                   "lng": 7.482339197852878,
//                                   "lat": 46.973125878166975
//                               },
//                               {
//                                 "lng": 7.48128101342947,
//                                 "lat": 46.97284246488468
//                               }
//                           ]
//                       },
//                       "altitude_lower": {
//                           "value": 0.0,
//                           "reference": "W84",
//                           "units": "M"
//                       },
//                       "altitude_upper": {
//                           "value": 6000.0,
//                           "reference": "W84",
//                           "units": "M"
//                       }
//                   },
//                   "time_start": {
//                       "value": "2021-02-18T10:00:00.000Z",
//                       "format": "RFC3339"
//                   },
//                   "time_end": {
//                       "value": "2021-11-18T12:00:00.000Z",
//                       "format": "RFC3339"
//                   }
//               }
//           ],
//           "type": "PUBLIC_SAFETY"
//       }
//   },
//   "subscriptions": [
//       {
//           "subscription_id": "47895400-bfad-4923-b531-b4c0fa62f078",
//           "notification_index": 3
//       }
//   ]
// }

// postNotificationToUSS("https://app.oneskyasia.com/api/inbound", testData35);
// // postNotificationToUSS("https://fims.novautm.net", testData35);

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * Handles DSS response and notify USS for each subscriber
 * Loop through all subscribers and POST constraint to {uss_base_url}/uss/v1/constraints
 * Assume constraint_id is inside Constraint object
 */
module.exports.onDSSResponseNotifyUSS = async (
  ConstraintID,
  DSSConstraint, // DSSConstraint format, so a conversion from CIFConstraint is needed
  DSSResponse, // Assume there is an array of subscribers in this object
  isDeleteNotification = false // If true, then this notificaiton is a delete notificaiotn, NOT an update or a create
) => {
  try {
    let notificationPayload = {};
    console.log('DSS response in onDSSResponseNotifyUSS():', util.inspect(DSSResponse, {showHidden: false, depth: null}));

    // Check if there are subscribers in the DSS response
    if (
      DSSResponse["subscribers"] != undefined &&
      DSSResponse["subscribers"].length > 0
    ) {
      // Loop through each subscriber, and then push notification for each subscriber
      await DSSResponse["subscribers"].forEach((subscriber, index) => {
        subscriptions = subscriber.subscriptions;
        // Prepare notification payload for each subscriber
        if (isDeleteNotification) { // If delete is true
          notificationPayload = {
            constraint_id: ConstraintID, // Full information about the Constraint that has changed. If this field is omitted, the Constraint was deleted.
            subscriptions: subscriptions,
          }
        } else {
          notificationPayload = {
            constraint_id: ConstraintID,
            constraint: DSSConstraint,
            subscriptions: subscriptions, 
          }
        }
        console.log('Loop in onDSSResponseNotifyUSS():', index);
        console.log('Subscriber to be notified in onDSSResponseNotifyUSS():', util.inspect(subscriber, {showHidden: false, depth: null}));
        console.log('notificationPayload in onDSSResponseNotifyUSS():', util.inspect(notificationPayload, {showHidden: false, depth: null}));
        postNotificationToUSS(
          subscriber.uss_base_url,
          notificationPayload
        ); // Notify via POST
        // console.log('There are subs!')
      });
    } else {
      // No subscribers, then do nothing, no notification to be emitted
      // console.log('There are no subs!')
    }
    return [false, null]; // Just for reference
  } catch (err) {
    console.log('Error in onDSSResponseNotifyUSS():', util.inspect(err, {showHidden: false, depth: null}));
    return [true, err];
  }
};

// ------------------------------------------------------------------------------------------------------------------------------

/** Test notification */

// // This is what a response 'subscribers' tag looks like [Case 1]
// const testDSSResponseSubs = {
//   subscribers: [
//     {
//       subscriptions: [
//         {
//           subscription_id: "12345",
//           notification_index: 1,
//         },
//       ],
//       uss_base_url: "https://fims.novautm.net",
//     },
//   ],
// };

// // No subs given in DSS response [Case 2]
// const testDSSResponseNoSubs = {
//   constraint_reference: {
//     id: "16c3d7dc-ff74-486a-868f-2be8f0dbbc79",
//     ovn: "oLwYOqSrj57doqhu7sHE4Et0h7/kNYgblf+DTCCnOUQ=",
//     owner: "1hlc4etfl7fp8tv11r11rclij3",
//     time_end: {
//       format: "RFC3339",
//       value: "2020-08-03T13:00:00Z",
//     },
//     time_start: {
//       format: "RFC3339",
//       value: "2020-08-03T12:00:00Z",
//     },
//     uss_base_url: "https://fims.novautm.net",
//     version: 1,
//   },
//   subscribers: [],
// };

// const testDSSResponseFull = {
//   constraint_reference: {
//     id: "0120d261-7b04-497d-a913-cfa448ce3d98",
//     ovn: "dW1zMnizzCVukVx0KRKQBUUwLBHn59bZnX1XU8GyBjw=",
//     owner: "1hlc4etfl7fp8tv11r11rclij3",
//     time_end: {
//       format: "RFC3339",
//       value: "2020-08-06T17:26:24Z",
//     },
//     time_start: {
//       format: "RFC3339",
//       value: "2020-08-06T16:38:24Z",
//     },
//     uss_base_url: "https://fims.novautm.net",
//     version: 1,
//   },
//   subscribers: [
//     {
//       subscriptions: [
//         {
//           notification_index: 2,
//           subscription_id: "551a037a-faeb-498c-bb04-bf371e1b36f6",
//         },
//       ],
//       uss_base_url: "https://fims.novautm.net",
//     },
//   ],
// };

// const testConstraint = {
//   // ASTM format
//   reference: {
//     id: "7d37307f-92f2-4f07-8a26-eb3fcac3636g",
//     owner: "1hlc4etfl7fp8tv11r11rclij3",
//     version: 3,
//     ovn: "ovn", // New
//     time_start: {
//       format: "RFC3339",
//       value: "2020-07-17T12:00:00Z",
//     },
//     time_end: {
//       format: "RFC3339",
//       value: "2020-07-17T13:00:00Z",
//     },
//     uss_base_url: "https://fims.novautm.net", // New
//   },
//   details: {
//     volumes: [
//       // Called 'extents' when we PUT constraint to DSS
//       {
//         volume: {
//           altitude_upper: {
//             reference: "WGS84",
//             value: 100,
//             units: "M",
//           },
//           altitude_lower: {
//             reference: "WGS84",
//             value: 0,
//             units: "M",
//           },
//           outline_polygon: {
//             coordinates: [
//               [
//                 [103.85495497971431, 1.2886965146831955],
//                 [103.85349357666604, 1.2828751821136281],
//                 [103.85529602112451, 1.2804725240958277],
//                 [103.85495497971431, 1.2886965146831955],
//               ],
//             ],
//             type: "Polygon",
//           },
//         },
//         time_start: {
//           format: "RFC3339",
//           value: "2020-07-17T12:00:00Z",
//         },
//         time_end: {
//           format: "RFC3339",
//           value: "2020-07-17T13:00:00Z",
//         },
//       },
//     ],
//     type: "STC",
//     state: "Accepted",
//   },
// };

// const res = module.exports.onDSSResponseNotifyUSS(
//   testConstraint.reference.id,
//   testConstraint,
//   testDSSResponseFull // testDSSResponseNoSubs to check for no subs
// );

// console.log(res);

/**
 * Workaround for OneSky, removes the last vertex from outline_polygon so first and last vertex are not repeated 
 * v0.3.5: https://raw.githubusercontent.com/astm-utm/Protocol/implementation_2020q2/utm.yaml
 */

const _ = require('lodash');

/**
 * Removes the last vertext from coordinates.
 * @param {*} notification - Request to be posted to another USS.
 */
module.exports.workaroundForOneSky38 = (notification) => {
    let parsedData = _.cloneDeep(notification);
    // console.log(parsedData.constraint.details.volumes[0].volume.outline_polygon.coordinates);
    parsedData.constraint.details.volumes[0].volume.outline_polygon.coordinates[0].pop();
    // console.log(parsedData.constraint.details.volumes[0].volume.outline_polygon.coordinates);
    return parsedData;
}

// // Test
// const testData = {
//   constraint_id: "c2b61083-4003-442a-b261-83e296cbea7b",
//   constraint: {
//     reference: {
//       id: "c2b61083-4003-442a-b261-83e296cbea7b",
//       owner: "1hlc4etfl7fp8tv11r11rclij3",
//       version: 1,
//       time_start: { format: "RFC3339", value: "2020-08-06T13:49:24Z" },
//       time_end: { format: "RFC3339", value: "2020-08-06T14:26:24Z" },
//       uss_base_url: "https://fims.novautm.net",
//     },
//     details: {
//       volumes: [
//         {
//           volume: {
//             altitude_lower: { reference: "W84", units: "M", value: 0 },
//             altitude_upper: { reference: "W84", units: "M", value: 100 },
//             outline_polygon: {
//               coordinates: [
//                 [
//                   [103.85495497971431, 1.2886965146831955],
//                   [103.85349357666604, 1.2828751821136282],
//                   [103.85529602112452, 1.2804725240958277],
//                   [103.85495497971431, 1.2886965146831955],
//                 ],
//               ],
//               type: "Polygon",
//             },
//           },
//           time_start: { format: "RFC3339", value: "2020-08-06T13:49:24Z" },
//           time_end: { format: "RFC3339", value: "2020-08-06T14:26:24Z" },
//         },
//       ],
//       type: "STC",
//     },
//   },
//   subscriptions: [
//     {
//       notification_index: 10,
//       subscription_id: "551a037a-faeb-498c-bb04-bf371e1b36f6",
//     },
//     {
//       notification_index: 10,
//       subscription_id: "8e0961c6-949d-4be6-9065-6b174e1c68c6",
//     },
//   ],
// };

// module.exports.workaroundForOneSky38(testData);

/**
 * Removes the last vertext from coordinates.
 * @param {*} notification - Request to be posted to another USS.
 */
module.exports.workaroundForOneSky35 = (notification) => {
    let parsedData = _.cloneDeep(notification);
    const keys = Object.keys(parsedData);

    // Type of constraint notification is defined by whether if 'constraint' field exists
    // If exists, this is a notification due to POST
    // If not, this is a notification due to DELETE
    // So, here we check for this field before applying the workaround
    if (!keys.includes('constraint')) {
        // Do nothing
        console.log('Do nothing');
        return parsedData;
    } else {
        // Do workaround
        console.log('Do workaround');

        // console.log(parsedData.constraint.details.volumes[0].volume.outline_polygon.vertices);
        parsedData.constraint.details.volumes[0].volume.outline_polygon.vertices.pop();
        // console.log(parsedData.constraint.details.volumes[0].volume.outline_polygon.vertices);
        return parsedData;
    }
}

//

// const testData = {
//     "constraint_id": "9ffcab4c-6808-4213-8d97-0f35a372e96e",
//     "constraint": {
//         "reference": {
//             "id": "9ffcab4c-6808-4213-8d97-0f35a372e96e",
//             "owner": "3fob1lmd5ahq1fok0ht0nl62qc",
//             "version": 1,
//             "ovn": "r8JPGVJo2poZVrmCy+Am66W0DHxDO3ZijL25/oc9m0I=",
//             "time_start": {
//                 "value": "2020-11-23T08:14:00.000Z",
//                 "format": "RFC3339"
//             },
//             "time_end": {
//                 "value": "2020-11-24T08:14:00.000Z",
//                 "format": "RFC3339"
//             },
//             "uss_base_url": "https://caas.onesky.xyz"
//         },
//         "details": {
//             "volumes": [
//                 {
//                     "volume": {
//                         "outline_polygon": {
//                             "vertices": [
//                                 {
//                                     "lng": 7.48128101342947,
//                                     "lat": 46.97284246488468
//                                 },
//                                 {
//                                     "lng": 7.480866938192458,
//                                     "lat": 46.9719292103624
//                                 },
//                                 {
//                                     "lng": 7.4818790743561365,
//                                     "lat": 46.97151981302649
//                                 },
//                                 {
//                                     "lng": 7.482753232367149,
//                                     "lat": 46.97233858020792
//                                 },
//                                 {
//                                     "lng": 7.482339197852878,
//                                     "lat": 46.973125878166975
//                                 }
//                             ]
//                         },
//                         "altitude_lower": {
//                             "value": 0.0,
//                             "reference": "W84",
//                             "units": "M"
//                         },
//                         "altitude_upper": {
//                             "value": 6000.0,
//                             "reference": "W84",
//                             "units": "M"
//                         }
//                     },
//                     "time_start": {
//                         "value": "2020-11-24T09:14:00.000Z",
//                         "format": "RFC3339"
//                     },
//                     "time_end": {
//                         "value": "2020-11-25T08:14:00.000Z",
//                         "format": "RFC3339"
//                     }
//                 }
//             ],
//             "type": "PUBLIC_SAFETY"
//         }
//     },
//     "subscriptions": [
//         {
//             "subscription_id": "47895400-bfad-4923-b531-b4c0fa62f078",
//             "notification_index": 3
//         }
//     ]
//   }
  
//   module.exports.workaroundForOneSky35(testData);
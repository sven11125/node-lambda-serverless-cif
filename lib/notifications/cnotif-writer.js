/*
 * This module writes (saves) constraint/operation notifications to the database
 */

var AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { convertZulu2Unix } = require("../constraint-manager/c-algos");
const { clientResponse } = require("../constraint-manager/dbo-commons");

AWS.config.update({
  region: "ap-southeast-1",
});

const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * Post constraint notification with constraint_id from notification to DB
 */
module.exports.saveConstraintNotification = async (constraintNotification) => {
  const time_created = new Date().getTime();
  const new_id = uuidv4();
  const { constraint_id, constraint, subscriptions } = constraintNotification;
  const params = {
    TableName: "FIMSConstraintsNotifications",
    Item: {
      constraint_id: constraint_id, // GSI primary key
      notification_id: new_id, // Primary key
      time_created: new Date(time_created).toISOString(),
      constraint: constraint,
      subscriptions: subscriptions,
    },
  };

  // Write data to table
  const data = await documentClient.put(params).promise();
  return clientResponse(
    false,
    params.Item,
    `Notification for constraint ${constraint_id} has been saved successfully.`
  );
};

// ------------------------------------------------------------------------------------------------------------------------------

/** Test write notification to DB */ 

// const testConstraintNotification = {
//   constraint_id: "facbb791-48cb-4116-905f-5765c14a9d21",
//   constraint: {
//     reference: {
//       id: "7d37307f-92f2-4f07-8a26-eb3fcac3636c",
//       owner: "1hlc4etfl7fp8tv11r11rclij3",
//       version: 3,
//       ovn: "ovn", // New
//       time_start: {
//         format: "RFC3339",
//         value: "2020-07-17T12:00:00Z",
//       },
//       time_end: {
//         format: "RFC3339",
//         value: "2020-07-17T13:00:00Z",
//       },
//       uss_base_url: "https://fims.novautm.net", // New
//     },
//     details: {
//       volumes: [
//         // Called 'extents' when we PUT constraint to DSS
//         {
//           volume: {
//             altitude_upper: {
//               reference: "WGS84",
//               value: 100,
//               units: "M",
//             },
//             altitude_lower: {
//               reference: "WGS84",
//               value: 0,
//               units: "M",
//             },
//             outline_polygon: {
//               coordinates: [
//                 [
//                   [103.85495497971431, 1.2886965146831955],
//                   [103.85349357666604, 1.2828751821136281],
//                   [103.85529602112451, 1.2804725240958277],
//                   [103.85495497971431, 1.2886965146831955],
//                 ],
//               ],
//               type: "Polygon",
//             },
//           },
//           time_start: {
//             format: "RFC3339",
//             value: "2020-07-17T12:00:00Z",
//           },
//           time_end: {
//             format: "RFC3339",
//             value: "2020-07-17T13:00:00Z",
//           },
//         },
//       ],
//       type: "STC",
//       state: "Accepted",
//     },
//   },
//   subscriptions: [
//     {
//       subscription_id: "12345",
//       notification_index: 1,
//     },
//   ],
// };

// const res = module.exports.saveConstraintNotification(
//   testConstraintNotification
// );

// ------------------------------------------------------------------------------------------------------------------------------

/*
 * Post operation notification with operation_id from notification to DB
 */
module.exports.saveOperationNotification = async (operationNotification) => {
  const time_created = new Date().getTime();
  const new_id = uuidv4();
  const { operation_id, operation, subscriptions } = operationNotification;
  const params = {
    TableName: "FIMSOperationsNotifications",
    Item: {
      operation_id: operation_id, // GSI primary key
      notification_id: new_id, // Primary key
      time_created: new Date(time_created).toISOString(),
      operation: operation,
      subscriptions: subscriptions,
    },
  };

  // Write data to table
  const data = await documentClient.put(params).promise();
  return clientResponse(
    false,
    params.Item,
    `Notification for operation ${operation_id} has been saved successfully.`
  );
};

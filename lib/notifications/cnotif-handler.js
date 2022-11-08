/*
 * Here defines the constraint/operation notification POST method. (ASTM compliant)
 * This recieves constraint/operation notification from external USSs and handles them 
 * This module depends on cnotif-emitter.js
 */

const utils = require("../cif-utils");
const { saveConstraintNotification, saveOperationNotification } = require("./cnotif-writer");

module.exports.notifyConstraint = async (notificationContent) => {
  const responseHeaders = utils.corsHeaders("OPTIONS,POST");

  try {
    // Collect data from notification
    const { constraint_id, constraint, subscriptions } = notificationContent;

    // TODO: Do something with the recieved notification, for now, we will just save it to DB
    
    // Save notification to database with time_received
    await saveConstraintNotification(notificationContent);

    if (!notificationContent) {
      return utils.responseError(
        400, // This actually never gets triggered since the input JSON parser already catches this error
        "One or more parameters were missing or invalid",  
        responseHeaders
      ); // No data
    } else {
      const parsedResponse = {
        message:
          "New or updated Constraint information received successfully", // No data returned if status code is 204
      };
      return utils.responseSuccess(204, parsedResponse, responseHeaders); // Success, 204 -> No Content per ASTM
    }
  } catch (error) {
    // console.log(error);
    return utils.responseError(
      500,
      // JSON.stringify(error),
      "An internal error has occured",
      responseHeaders
    );
  }
};

//

// const testContent = {
//   "constraint_id": "constraint_id",
//   "constraint": "constraint",
//   "subscriptions": [
//     {
//       "subscription_id": "12345",
//       "notification_index": 1
//     }
//   ],
//   "uss_base_url": "https://novauss.com"
// };

// const res = module.exports.notifyConstraint(testContent);
// console.log(res);

// ------------------------------------------------------------------------------------------------------------------------------

module.exports.notifyOperation = async (notificationContent) => {
  const responseHeaders = utils.corsHeaders("OPTIONS,POST");

  try {
    // Collect data from notification
    const { operation_id, operation, subscriptions } = notificationContent;

    // TODO: Do something with the recieved notification, for now, we will just save it to DB
    
    // Save notification to database with time_received
    await saveOperationNotification(notificationContent);

    if (!notificationContent) {
      return utils.responseError(
        400, // This actually never gets triggered since the input JSON parser already catches this error
        "One or more parameters were missing or invalid",  
        responseHeaders
      ); // No data
    } else {
      const parsedResponse = {
        message:
          "New or updated Operation information received successfully", // No data returned if status code is 204
      };
      return utils.responseSuccess(204, parsedResponse, responseHeaders); // Success, 204 -> No Content per ASTM
    }
  } catch (error) {
    // console.log(error);
    return utils.responseError(
      500,
      // JSON.stringify(error),
      "An internal error has occured",
      responseHeaders
    );
  }
};


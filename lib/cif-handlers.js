/*
 * This module contains the key HTTP handlers for incoming requests.
 */

// Refer to https://www.npmjs.com/package/jsonschema
const jsonSchemaValidator = require("jsonschema").Validator;
const { ConstraintSchemas } = require("./cif-schemas");
const utils = require("./cif-utils");
const errorState = "Rejected";

// Handles error if path parameter (i.e. /{id}) is missing from route
module.exports.pathParamError = (param) => {
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: `Parameter {${param}} is missing from route, please resubmit.`,
      state: errorState,
    }),
    headers: utils.corsHeaders("OPTIONS,GET,DELETE"),
  };
};

// Body cannot be parsed as JSON
module.exports.bodyParseError = {
  statusCode: 400,
  body: JSON.stringify({
    message:
      "Body of request cannot be parsed as JSON, please resubmit the request in JSON format.",
    state: errorState,
  }),
  headers: utils.corsHeaders("OPTIONS,POST"),
};

module.exports.genericError = (errorMessage) => {
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: errorMessage,
      state: errorState,
    }),
    headers: utils.corsHeaders("OPTIONS,POST"),
  };
} 

// Check request body is in JSON format
module.exports.checkBodyCanBeParsed = (event) => {
  try {
    return JSON.parse(event.body);
  } catch (err) {
    return;
  }
};

// Input constraint does not match schema
module.exports.constraintSchemaError = (schemaErrorLog) => {
  // if (schemaErrorLog != null && schemaErrorLog.log != undefined) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      message:
        "Constraint definition does not match known interUSS schemas, please resubmit constraint in the correct format.",
      error_log: schemaErrorLog.log,
      error_count: schemaErrorLog.count,
      state: errorState,
    }),
    headers: utils.corsHeaders("OPTIONS,POST"),
  };
  // }
};

// Check request body is in valid ASTM format
// If format_strict, the constraint_id must be supplied with the request
module.exports.checkConstraintFormatIsValid = (constraint, format_strict = false) => {
  try {
    // Check if input constraint is valid
    let isConstraintFormatValid = new jsonSchemaValidator();
    let validationVerdict = null;
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.TimeSchema,
      "/Time"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.AltitudeSchema,
      "/Altitude"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.PolygonSchema,
      "/Polygon"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.Volume3DSchema,
      "/Volume3D"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.Volume4DSchema,
      "/Volume4D"
    );
    if (format_strict) {
      validationVerdict = isConstraintFormatValid.validate(
        constraint, // Constraint reference
        ConstraintSchemas.ConstraintCIFStrictSchema // Strict
      );
    } else {
      validationVerdict = isConstraintFormatValid.validate(
        constraint, // Constraint reference
        ConstraintSchemas.ConstraintCIFSchema
      );
    }

    // If there is an error in the schema
    if (validationVerdict.errors != 0) {
      let errorStack = [];
      validationVerdict.errors.forEach((value, index) => {
        errorStack.push(value.stack);
      });
      return [
        false,
        {
          // False -> Invalid constraint format
          log: errorStack,
          count: errorStack.length,
        },
      ];
    } else {
      return [true, null]; // True -> Valid constraint format
    }
  } catch (err) {
    return [null, null];
  }
};

// // Check request body is in valid ASTM format
// module.exports.checkNotifyConstraintFormatIsValid = (notification) => {
//   try {
//     // Check if input constraint is valid
//     let isConstraintFormatValid = new jsonSchemaValidator();
//     let validationVerdict = null;
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.TimeSchema,
//       "/Time"
//     );
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.AltitudeSchema,
//       "/Altitude"
//     );
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.PolygonSchema,
//       "/Polygon"
//     );
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.Volume3DSchema,
//       "/Volume3D"
//     );
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.Volume4DSchema,
//       "/Volume4D"
//     );
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.ASTMConstraintReferenceSchema,
//       "/ASTMConstraintReference"
//     );
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.ASTMConstraintDetailsSchema,
//       "/ASTMConstraintDetails"
//     );
//     isConstraintFormatValid.addSchema(
//       ConstraintSchemas.ASTMConstraint,
//       "/ASTMConstraint"
//     );
//     validationVerdict = isConstraintFormatValid.validate(
//       notification, // Recieved notification
//       ConstraintSchemas.NotificationConstraintSchema
//     );

//     // If there is an error in the schema
//     if (validationVerdict.errors != 0) {
//       let errorStack = [];
//       validationVerdict.errors.forEach((value, index) => {
//         errorStack.push(value.stack);
//       });
//       return [
//         false,
//         {
//           // False -> Invalid constraint format
//           log: errorStack,
//           count: errorStack.length,
//         },
//       ];
//     } else {
//       return [true, null]; // True -> Valid constraint format
//     }
//   } catch (err) {
//     return [null, null];
//   }
// };

// Duplicated from above block
// Updated schema to match interUSS 0.3.5
// Check request body is in valid ASTM format
module.exports.checkNotifyConstraintFormatIsValid = (notification) => {
  try {
    // Check if input constraint is valid
    let isConstraintFormatValid = new jsonSchemaValidator();
    let validationVerdict = null;
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.TimeSchema,
      "/Time"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.AltitudeSchema,
      "/Altitude"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.PolygonSchema035,
      "/Polygon035"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.Volume3DSchema035,
      "/Volume3D035"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.Volume4DSchema035,
      "/Volume4D035"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.ASTMConstraintReferenceSchema,
      "/ASTMConstraintReference"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.ASTMConstraintDetailsSchema035,
      "/ASTMConstraintDetails035"
    );
    isConstraintFormatValid.addSchema(
      ConstraintSchemas.ASTMConstraint035,
      "/ASTMConstraint035"
    );
    validationVerdict = isConstraintFormatValid.validate(
      notification, // Recieved notification
      ConstraintSchemas.NotificationConstraintSchema035
    );

    // If there is an error in the schema
    if (validationVerdict.errors != 0) {
      let errorStack = [];
      validationVerdict.errors.forEach((value, index) => {
        errorStack.push(value.stack);
      });
      return [
        false,
        {
          // False -> Invalid constraint format
          log: errorStack,
          count: errorStack.length,
        },
      ];
    } else {
      return [true, null]; // True -> Valid constraint format
    }
  } catch (err) {
    return [null, null];
    // return err;
  }
};

// // Test checkNotifyConstraintFormatIsValid()
// const mockNotification = {
//   "constraint_id": "71853f13-9d92-4e8d-b920-5201169c659a",
//   "constraint": {
//       "reference": {
//           "id": "71853f13-9d92-4e8d-b920-5201169c659a",
//           "owner": "1hlc4etfl7fp8tv11r11rclij3",
//           "version": 1,
//           "ovn": "lGS/WYMtR8GqPoEeH0ucD9lkLPBPpeu/NhcpRBN5vxw=",
//           "time_start": {
//               "format": "RFC3339",
//               "value": "2021-11-23T07:23:22Z"
//           },
//           "time_end": {
//               "format": "RFC3339",
//               "value": "2021-11-23T08:13:22Z"
//           },
//           "uss_base_url": "https://fims.novautm.net"
//       },
//       "details": {
//           "volumes": [
//               {
//                   "volume": {
//                       "altitude_upper": {
//                           "reference": "W84",
//                           "value": 100,
//                           "units": "M"
//                       },
//                       "altitude_lower": {
//                           "reference": "W84",
//                           "value": 0,
//                           "units": "M"
//                       },
//                       "outline_polygon": {
//                           "vertices": [
//                               {
//                                   "lat": 1.2428167287341354,
//                                   "lng": 103.83500576019287
//                               },
//                               {
//                                   "lat": 1.2365954603742304,
//                                   "lng": 103.83343935012817
//                               },
//                               {
//                                   "lat": 1.2355657317889492,
//                                   "lng": 103.8408637046814
//                               },
//                               {
//                                   "lat": 1.2428167287341354,
//                                   "lng": 103.83500576019287
//                               }
//                           ]
//                       }
//                   },
//                   "time_start": {
//                       "format": "RFC3339",
//                       "value": "2021-11-23T07:23:22Z"
//                   },
//                   "time_end": {
//                       "format": "RFC3339",
//                       "value": "2021-11-23T08:13:22Z"
//                   }
//               }
//           ],
//           "type": "STC",
//           "state": "Accepted"
//       }
//   },
//   "subscriptions": [
//       {
//           "notification_index": 1,
//           "subscription_id": "282c196e-c707-41d2-a94d-b03cf39127c9"
//       }
//   ]
// }

// console.log(
//   module.exports.checkNotifyConstraintFormatIsValid(mockNotification)
// );

// ------------------------------------------------------------------------------------------------------------------------------

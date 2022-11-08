/*
 * Constraint schmea as defined in interUSS documentation:
 * https://app.swaggerhub.com/apis/astm-uas-protocols/utm-api_uss_dss_and_uss_uss/0.3.4
 *
 * Refer to https://www.npmjs.com/package/jsonschema for JSON schema validator
 * See the test session below for an example of how this works
 * Docs: https://github.com/tdegrunt/jsonschema/blob/HEAD/examples/all.js
 */

/*
 * Constraint schemas, also contains notification schema
 */
module.exports.ConstraintSchemas = {
  TimeSchema: {
    id: "/Time",
    type: "object",
    properties: {
      value: { type: "string", minLength: 20 }, // RFC3339
      format: { type: "string" },
    },
    required: ["value", "format"],
  },
  AltitudeSchema: {
    id: "/Altitude",
    type: "object",
    properties: {
      reference: { type: "string" },
      units: { type: "string" },
      value: {
        type: "number",
        minimum: 0,
      },
    },
    required: ["value", "units", "reference"],
  },
  PolygonSchema: {
    id: "/Polygon",
    type: "object",
    properties: {
      type: { type: "string", pattern: "Polygon" },
      coordinates: {
        type: "array",
        items: {
          type: "array",
          items: {
            type: "array",
            minItems: 2,
            maxItems: 2, // LonLatPair, array of 2
          },
          minItems: 4, // Need at least 4 vertices to define a closed polygon
        },
        minItems: 1,
        maxItems: 1, // The number of polygons allowed is 1 implying no interior rings
      }, // Array of array of arrays per GeoJSON polygon format (also used in interUSS standards)
    },
    required: ["type", "coordinates"],
  },
  // interUSS 0.3.5 schema for polygon
  PolygonSchema035: {
    id: "/Polygon035",
    type: "object",
    properties: {
      // type: { type: "string", pattern: "Polygon" }, // Not needed for 0.3.5 apprently
      vertices: {
        type: "array",
        items: {
          type: "object",
          properties: {
            lng: { type: "number", minimum: -180, maximum: 180 },
            lat: { type: "number", minimum: -90, maximum: 90 },
          }
        },
        minItems: 3, // At least 3 points
      }, // Array of array of arrays per GeoJSON polygon format (also used in interUSS standards)
    },
    required: ["vertices"],
  },
  Volume3DSchema: {
    id: "/Volume3D",
    type: "object",
    properties: {
      altitude_lower: { $ref: "/Altitude" },
      altitude_upper: { $ref: "/Altitude" },
      outline_polygon: { $ref: "/Polygon" },
    },
    required: ["altitude_lower", "altitude_upper", "outline_polygon"],
  },
  // interUSS 0.3.5 schema for volume
  Volume3DSchema035: {
    id: "/Volume3D035",
    type: "object",
    properties: {
      altitude_lower: { $ref: "/Altitude" },
      altitude_upper: { $ref: "/Altitude" },
      outline_polygon: { $ref: "/Polygon035" },
    },
    required: ["altitude_lower", "altitude_upper", "outline_polygon"],
  },
  Volume4DSchema: {
    id: "/Volume4D",
    type: "object",
    properties: {
      time_end: { $ref: "/Time" },
      time_start: { $ref: "/Time" },
      volume: { $ref: "/Volume3D" },
    },
    required: ["time_end", "time_start", "volume"],
  },
  // interUSS 0.3.5 schema
  Volume4DSchema035: {
    id: "/Volume4D035",
    type: "object",
    properties: {
      time_end: { $ref: "/Time" },
      time_start: { $ref: "/Time" },
      volume: { $ref: "/Volume3D035" },
    },
    required: ["time_end", "time_start", "volume"],
  },
  ConstraintCIFSchema: {
    // CIF constraint schema, slightly different to ASTM constraint schema
    // For create new constraint
    id: "/ConstraintCIF",
    type: "object",
    properties: {
      constraint_id: { type: "string" },
      time_created: { type: "string" },
      extents: {
        // Format [{ Volume4D }]
        type: "array",
        items: {
          $ref: "/Volume4D",
        },
        minItems: 1,
        maxItems: 1, // Array of 1, a single Volume4D
      },
      // extents: { $ref: "/Volume4D" },
      state: { type: "string" },
      old_version: { type: "integer", minimum: 0 },
      state: { type: "string" },
      uss_base_url: { type: "string" },
      constraint_type: { type: "string" }, // STC or LTC
    },
    required: ["extents", "old_version", "uss_base_url"],
  },
  // interUSS 0.3.5 schema
  ConstraintCIFSchema035: {
    // CIF constraint schema, slightly different to ASTM constraint schema
    // For create new constraint
    id: "/ConstraintCIF035",
    type: "object",
    properties: {
      constraint_id: { type: "string" },
      time_created: { type: "string" },
      extents: {
        // Format [{ Volume4D }]
        type: "array",
        items: {
          $ref: "/Volume4D035",
        },
        minItems: 1,
        maxItems: 1, // Array of 1, a single Volume4D
      },
      // extents: { $ref: "/Volume4D" },
      state: { type: "string" },
      old_version: { type: "integer", minimum: 0 },
      state: { type: "string" },
      uss_base_url: { type: "string" },
      constraint_type: { type: "string" }, // STC or LTC
    },
    required: ["extents", "old_version", "uss_base_url"],
  },
  ConstraintCIFStrictSchema: {
    // CIF constraint schema, slightly different to ASTM constraint schema
    // For update existing constraint
    id: "/ConstraintCIFStrict",
    type: "object",
    properties: {
      constraint_id: { type: "string" },
      time_created: { type: "string" },
      extents: {
        type: "array",
        items: {
          $ref: "/Volume4D",
        },
        minItems: 1,
        maxItems: 1, // Array of 1, a single Volume4D
      },
      // extents: { $ref: "/Volume4D" },
      state: { type: "string" },
      old_version: { type: "integer", minimum: 0 },
      state: { type: "string" },
      uss_base_url: { type: "string" },
      // constraint_type: { type: "string" }, // STC or LTC // Not required in body, enforced within HTTP method
    },
    // required: ["constraint_id", "constraint_type", "extents", "old_version", "uss_base_url"],
    required: ["constraint_id", "extents", "old_version", "uss_base_url"],
  },
  ASTMConstraintReferenceSchema: {
    // ASTM compliant, ConstraintReference schema -> V0.3.4
    // For create new constraint
    id: "/ASTMConstraintReference",
    type: "object",
    properties: {
      id: { type: "string" },
      owner: { type: "string" },
      version: { type: "integer", minimum: 1 },
      ovn: { type: "string" }, // Optional
      time_end: { $ref: "/Time" },
      time_start: { $ref: "/Time" },
      uss_base_url: { type: "string" },
      time_created: { type: "string" },
    },
    required: [
      "id",
      "owner",
      "version",
      "time_end",
      "time_start",
      "uss_base_url",
    ],
  },
  ASTMConstraintDetailsSchema: {
    // ASTM compliant, ConstraintDetails schema -> V0.3.4
    id: "/ASTMConstraintDetails",
    type: "object",
    properties: {
      volumes: {
        type: "array",
        items: {
          $ref: "/Volume4D",
        },
        minItems: 1,
      },
      type: { type: "string" },
    },
    required: ["volumes"],
  },
  // interUSS 0.3.5 schema
  ASTMConstraintDetailsSchema035: {
    // ASTM compliant, ConstraintDetails schema -> V0.3.4
    id: "/ASTMConstraintDetails035",
    type: "object",
    properties: {
      volumes: {
        type: "array",
        items: {
          $ref: "/Volume4D035",
        },
        minItems: 1,
      },
      type: { type: "string" },
    },
    required: ["volumes"],
  },
  ASTMConstraint: {
    // ASTM Constraint, combination of ConstraintReference and ConstraintDetails
    id: "/ASTMConstraint",
    type: "object",
    properties: {
      reference: { $ref: "/ASTMConstraintReference" },
      details: { $ref: "/ASTMConstraintDetails" },
    },
    required: ["reference", "details"],
  },
  //interUSS 0.3.5 schema
  ASTMConstraint035: {
    // ASTM Constraint, combination of ConstraintReference and ConstraintDetails
    id: "/ASTMConstraint035",
    type: "object",
    properties: {
      reference: { $ref: "/ASTMConstraintReference" },
      details: { $ref: "/ASTMConstraintDetails035" },
    },
    required: ["reference", "details"],
  },
  NotificationConstraintSchema: {
    // For validing POST /uss/v1/constraints content
    id: "/ConstraintNotification",
    type: "object",
    properties: {
      constraint_id: { type: "string" },
      constraint: { $ref: "/ASTMConstraint" }, // ASTM Constraint
      time_created: { type: "string" },
      subscriptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            subscription_id: { type: "string" },
            notification_index: { type: "number" },
          },
          required: ["subscription_id", "notification_index"],
        },
        minItems: 1,
      },
    },
    required: ["constraint_id", "constraint", "subscriptions"],
  },
  // interUSS 0.3.5 schema
  NotificationConstraintSchema035: {
    // For validing POST /uss/v1/constraints content
    id: "/ConstraintNotification035",
    type: "object",
    properties: {
      constraint_id: { type: "string" },
      constraint: { $ref: "/ASTMConstraint035" }, // ASTM Constraint
      time_created: { type: "string" },
      subscriptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            subscription_id: { type: "string" },
            notification_index: { type: "number" },
          },
          required: ["subscription_id", "notification_index"],
        },
        minItems: 1,
      },
    },
    required: ["constraint_id", "constraint", "subscriptions"],
  },
};

// console.log(module.exports.ConstraintSchemas);

// ------------------------------------------------------------------------------------------------------------------------------

/** Local testing */

// // New ASTM compliant constraint for testing
// const testConstraint = {
//   reference: {
//     id: "7d37307f-92f2-4f07-8a26-eb3fcac3636c",
//     owner: "1hlc4etfl7fp8tv11r11rclij3",
//     version: 3,
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

// const testNotificationConstraint = {
//   constraint_id: "7d37307f-92f2-4f07-8a26-eb3fcac3636c",
//   constraint: testConstraint,
//   subscriptions: [{ subscription_id: "abc", notification_index: 1 }],
// };

// // https://www.npmjs.com/package/jsonschema
// const jsonSchemaValidator = require("jsonschema").Validator;

// // Validate constraint
// let isConstraintFormatValid = new jsonSchemaValidator();
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.TimeSchema,
//   "/Time"
// );
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.AltitudeSchema,
//   "/Altitude"
// );
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.PolygonSchema,
//   "/Polygon"
// );
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.Volume3DSchema,
//   "/Volume3D"
// );
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.Volume4DSchema,
//   "/Volume4D"
// );
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.ASTMConstraintReferenceSchema,
//   "/ASTMConstraintReference"
// );
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.ASTMConstraintDetailsSchema,
//   "/ASTMConstraintDetails"
// );
// isConstraintFormatValid.addSchema(
//   module.exports.ConstraintSchemas.ASTMConstraint,
//   "/ASTMConstraint"
// );
// const verdict = isConstraintFormatValid.validate(
//   testNotificationConstraint,
//   module.exports.ConstraintSchemas.NotificationConstraintSchema
// );
// // console.log(verdict);
// // console.log(verdict.errors);

// // Store a list of errors from validator, readable
// let stack_of_errors = [];
// if (verdict.errors != 0) {
//   verdict.errors.forEach((value, index) => {
//     stack_of_errors.push(value.stack);
//     console.log(index, value.stack);
//   });
// }
// error_object = {
//   logs: stack_of_errors,
//   errors: stack_of_errors.length,
// };
// console.log(error_object);
// console.log("Is errors empty?", stack_of_errors.length == 0);

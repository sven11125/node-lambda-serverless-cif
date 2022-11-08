/*
 * This module contains the generic parsers for handling different CIF data structures.
 * Useful for converting between CIF and DSS formats
 */

const util = require('util');
const { parseVolumeUSSToDSS } = require('./dss-integration/dss-parsers');

// // Parse raw response from CIF into ASTM response format
// // Response schema from DSS docs GET /uss/v1/constraints/{entityuuid}
// module.exports.parseCIFResponseToASTMConstraints = (CIFResponse) => {
//   try {
//     return {
//       constraint: {
//         reference: {
//           id: CIFResponse["dss_response"]["constraint_reference"]["id"],
//           owner: CIFResponse["dss_response"]["constraint_reference"]["owner"],
//           version:
//             CIFResponse["dss_response"]["constraint_reference"]["version"],
//           ovn:
//             CIFResponse["dss_response"]["constraint_reference"]["ovn"], // Generated from DSS
//           time_start:
//             CIFResponse["dss_response"]["constraint_reference"]["time_start"],
//           time_end:
//             CIFResponse["dss_response"]["constraint_reference"]["time_end"],
//           uss_base_url:
//             CIFResponse["dss_response"]["constraint_reference"]["uss_base_url"],
//         },
//         details: {
//           volumes: [
//             {
//               volume: CIFResponse["extents"][0]["volume"],
//               time_start: CIFResponse["extents"][0]["time_start"],
//               time_end: CIFResponse["extents"][0]["time_end"],
//             },
//           ],
//           type: CIFResponse["constraint_type"],
//           state: CIFResponse["state"],
//         },
//       },
//     };
//   } catch (err) {
//     return null;
//   }
// };

// Above block is the format of interUSS 0.3.8
// Changed the polygon definition to interUSS 0.3.5, on 24 Nov 2020
// This method is only used in dbo-get.js, so it is safe to update it
module.exports.parseCIFResponseToASTMConstraints = (CIFResponse) => {
  try {
    return {
      constraint: {
        reference: {
          id: CIFResponse["dss_response"]["constraint_reference"]["id"],
          owner: CIFResponse["dss_response"]["constraint_reference"]["owner"],
          version:
            CIFResponse["dss_response"]["constraint_reference"]["version"],
          ovn:
            CIFResponse["dss_response"]["constraint_reference"]["ovn"], // Generated from DSS
          time_start:
            CIFResponse["dss_response"]["constraint_reference"]["time_start"],
          time_end:
            CIFResponse["dss_response"]["constraint_reference"]["time_end"],
          uss_base_url:
            CIFResponse["dss_response"]["constraint_reference"]["uss_base_url"],
        },
        details: {
          volumes: [
            {
              volume: parseVolumeUSSToDSS(CIFResponse["extents"][0]["volume"])[1], // Converts volume to 0.3.5, [1] = data
              time_start: CIFResponse["extents"][0]["time_start"],
              time_end: CIFResponse["extents"][0]["time_end"],
            },
          ],
          type: CIFResponse["constraint_type"],
          state: CIFResponse["state"],
        },
      },
    };
  } catch (err) {
    return null;
  }
};

// const get_cif_response = {
//   "uss_base_url": "https://fims.novautm.net",
//   "dss_response": {
//     "constraint_reference": {
//       "owner": "1hlc4etfl7fp8tv11r11rclij3",
//       "uss_base_url": "https://fims.novautm.net",
//       "time_start": {
//         "format": "RFC3339",
//         "value": "2020-07-17T15:00:00Z"
//       },
//       "ovn": "ZpKr0gva4eHl49UVKimyjoD9gjjLW3yA9+vzZM0cKDc=",
//       "id": "3a776e2d-7766-404b-b2c5-2efb05f1ba75",
//       "time_end": {
//         "format": "RFC3339",
//         "value": "2020-07-17T16:00:00Z"
//       },
//       "version": 1
//     },
//     "subscribers": []
//   },
//   "constraint_id": "3a776e2d-7766-404b-b2c5-2efb05f1ba75",
//   "time_created": "2020-07-17T05:15:26.470Z",
//   "extents": [
//     {
//       "volume": {
//         "altitude_upper": {
//           "reference": "W84",
//           "value": 100,
//           "units": "M"
//         },
//         "altitude_lower": {
//           "reference": "W84",
//           "value": 0,
//           "units": "M"
//         },
//         "outline_polygon": {
//           "coordinates": [
//             [
//               [
//                 103.86304770565488,
//                 1.2703878587604294
//               ],
//               [
//                 103.86498803221463,
//                 1.2676749849218822
//               ],
//               [
//                 103.86802252788738,
//                 1.2699794693320143
//               ],
//               [
//                 103.86589254534692,
//                 1.272502731550901
//               ],
//               [
//                 103.86304770565488,
//                 1.2703878587604294
//               ]
//             ]
//           ],
//           "type": "Polygon"
//         }
//       },
//       "time_start": {
//         "format": "RFC3339",
//         "value": "2020-07-17T15:00:00Z"
//       },
//       "time_end": {
//         "format": "RFC3339",
//         "value": "2020-07-17T16:00:00Z"
//       }
//     }
//   ],
//   "old_version": 1,
//   "constraint_type": "STC",
//   "time_start": 1594998000,
//   "time_end": 1595001600,
//   "state": "Accepted",
//   "message": "Constraint 3a776e2d-7766-404b-b2c5-2efb05f1ba75 retrieved."
// }

// const res = module.exports.parseCIFResponseToASTMConstraints(get_cif_response);
// console.log(res);

// ------------------------------------------------------------------------------------------------------------------------------

// // Parse CIF constraint format to ASTM constraint format
// // Recall 'DSSConstraint' is made up of 'DSSConstraintReference' and 'DSSConstraintDetails'
// // Basically the same as parseCIFResponseToASTMConstraints() except we have two input parameters
// module.exports.parseCIFConstraintToDSSConstraint = (
//   CIFConstraintResponse,
//   DSSConstraintResponse // Response from a PUT constraint to the DSS
// ) => {
//   try {
//     return {
//       reference: {
//         id: DSSConstraintResponse["constraint_reference"]["id"],
//         owner: DSSConstraintResponse["constraint_reference"]["owner"],
//         version: DSSConstraintResponse["constraint_reference"]["version"],
//         ovn: DSSConstraintResponse["constraint_reference"]["ovn"], // Generated from DSS
//         time_start: DSSConstraintResponse["constraint_reference"]["time_start"],
//         time_end: DSSConstraintResponse["constraint_reference"]["time_end"],
//         uss_base_url:
//           DSSConstraintResponse["constraint_reference"]["uss_base_url"],
//       },
//       details: {
//         volumes: [
//           {
//             volume: CIFConstraintResponse["extents"][0]["volume"],
//             time_start: CIFConstraintResponse["extents"][0]["time_start"],
//             time_end: CIFConstraintResponse["extents"][0]["time_end"],
//           },
//         ],
//         type: CIFConstraintResponse["constraint_type"],
//       },
//     };
//   } catch (err) {
//     return null;
//   }
// };

// Above block is the format of interUSS 0.3.8
// Changed the polygon definition to interUSS 0.3.5, on 24 Nov 2020
// This is used for submitting notifications to other USS via POST using 0.3.5 schema
// Need to change JSON schema validation as well if this is used (actually, let's just remove validation for interUSS POST, quickest method without breaking everything)
module.exports.parseCIFConstraintToDSSConstraint = (
  CIFConstraintResponse,
  DSSConstraintResponse // Response from a PUT constraint to the DSS
) => {
  try {
    return {
      reference: {
        id: DSSConstraintResponse["constraint_reference"]["id"],
        owner: DSSConstraintResponse["constraint_reference"]["owner"],
        version: DSSConstraintResponse["constraint_reference"]["version"],
        ovn: DSSConstraintResponse["constraint_reference"]["ovn"], // Generated from DSS
        time_start: DSSConstraintResponse["constraint_reference"]["time_start"],
        time_end: DSSConstraintResponse["constraint_reference"]["time_end"],
        uss_base_url:
          DSSConstraintResponse["constraint_reference"]["uss_base_url"],
      },
      details: {
        volumes: [
          {
            volume: parseVolumeUSSToDSS(CIFConstraintResponse["extents"][0]["volume"])[1], // Converts volume to 0.3.5, [1] = data
            time_start: CIFConstraintResponse["extents"][0]["time_start"],
            time_end: CIFConstraintResponse["extents"][0]["time_end"],
          },
        ],
        type: CIFConstraintResponse["constraint_type"],
      },
    };
  } catch (err) {
    return null;
  }
};

// // Test

// const CIFdata = {
//   extents: [
//     {
//       time_end: {
//         format: "RFC3339",
//         value: "2020-08-06T18:26:24Z",
//       },
//       time_start: {
//         format: "RFC3339",
//         value: "2020-08-06T17:27:24Z",
//       },
//       volume: {
//         altitude_lower: {
//           reference: "W84",
//           units: "M",
//           value: 0,
//         },
//         altitude_upper: {
//           reference: "W84",
//           units: "M",
//           value: 100,
//         },
//         outline_polygon: {
//           coordinates: [
//             [
//               [103.85495497971431, 1.2886965146831955],
//               [103.85349357666604, 1.2828751821136281],
//               [103.85529602112451, 1.2804725240958277],
//               [103.85495497971431, 1.2886965146831955],
//             ],
//           ],
//           type: "Polygon",
//         },
//       },
//     },
//   ],
//   old_version: 0,
//   uss_base_url: "https://fims.novautm.net",
// };

// const DSSdata = {
//   constraint_reference: {
//     id: "fdcec036-c075-4357-ae9f-85e4dc47e79c",
//     ovn: "IEXsDCDtN9wiz4XtNYjXoGM7CcdarPFAe/iNrZSsqb4=",
//     owner: "1hlc4etfl7fp8tv11r11rclij3",
//     time_end: {
//       format: "RFC3339",
//       value: "2020-08-06T18:26:24Z",
//     },
//     time_start: {
//       format: "RFC3339",
//       value: "2020-08-06T17:27:24Z",
//     },
//     uss_base_url: "https://fims.novautm.net",
//     version: 1,
//   },
//   subscribers: [],
// };

// const res = module.exports.parseCIFConstraintToDSSConstraint(CIFdata, DSSdata);
// console.log(util.inspect(res, {showHidden: false, depth: null}));

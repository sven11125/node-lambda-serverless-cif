/*
 * HTTP request body parsers for DSS comms.
 */

const util = require('util');

/** Transform "outline_polygon" from interUSS format to DSS format */
const parsePolygonUSSToDSS = (outline_polygon) => {
  try {
    if (outline_polygon.type === "Polygon") {
      let dss_vertices = [];
      const uss_vertices = outline_polygon.coordinates[0];
      uss_vertices.forEach((LonLatPair) => {
        dss_vertices.push({
          lat: LonLatPair[1],
          lng: LonLatPair[0],
        });
      });
      return [null, {vertices: dss_vertices}]; // Format [error, data]
    }
    return [null, null];
  } catch (error) {
    return [error, null];
  }
};

// // Test parsePolygonUSSToDSS()
// const outline_polygon_test = {
//   coordinates: [
//     [
//       [103.85495497971431, 1.2886965146831955],
//       [103.85349357666604, 1.2828751821136281],
//       [103.85529602112451, 1.2804725240958277],
//       [103.85495497971431, 1.2886965146831955],
//     ],
//   ],
//   type: "Polygon",
// };

// const [errorParsed, dataParsed] = parsePolygonUSSToDSS(outline_polygon_test);
// console.log(errorParsed, dataParsed);

/** Like above, converts volume from 0.3.8 to 0.3.5 */
const parseVolumeUSSToDSS = (volume) => {
  try {
    if (volume.outline_polygon.type === "Polygon") {
      let dss_vertices = [];
      const uss_vertices = volume.outline_polygon.coordinates[0];
      uss_vertices.forEach((LonLatPair) => {
        dss_vertices.push({
          lat: LonLatPair[1],
          lng: LonLatPair[0],
        });
      });
      converted_volume = JSON.parse(JSON.stringify(volume));
      converted_volume.outline_polygon['vertices'] = dss_vertices;
      delete converted_volume.outline_polygon['coordinates'];
      return [null, {vertices: converted_volume}]; // Format [error, data]
    }
    return [null, null];
  } catch (error) {
    return [error, null];
  }
};

// // Test parseVolumeUSSToDSS()
// const volumeTest = {
//   "altitude_lower": {
//     "reference": "W84",
//     "units": "M",
//     "value": 0
//   },
//   "altitude_upper": {
//     "reference": "W84",
//     "units": "M",
//     "value": 120
//   },
//   "outline_polygon": {
//     "coordinates": [
//       [
//         [103.85495497971431, 1.2886965146831955],
//         [103.85349357666604, 1.2828751821136281],
//         [103.85529602112451, 1.2804725240958277],
//         [103.85495497971431, 1.2886965146831955],
//       ],
//     ],
//     "type": "Polygon",
//   }
// }

// const [errorParsed, dataParsed] = parseVolumeUSSToDSS(volumeTest);
// console.log(errorParsed, util.inspect(dataParsed, {showHidden: false, depth: null}));

module.exports = {
  parsePolygonUSSToDSS,
  parseVolumeUSSToDSS
}

// ------------------------------------------------------------------------------------------------------------------------------

/** Transform constraint from interUSS format to DSS format, note no validation on input */
module.exports.parseConstraintUSSToDSS = (Constraint) => {
  try {
    if (Constraint.extents[0].volume.outline_polygon.type === "Polygon") {
      // let ConstraintParsed = {
      //   ...Constraint // Shallow copy
      // };
      let ConstraintParsed = JSON.parse(JSON.stringify(Constraint)); // Deep copy
      // Rewrite polygon format, then return
      ConstraintParsed.extents[0].volume.outline_polygon = parsePolygonUSSToDSS(
        Constraint.extents[0].volume.outline_polygon
      )[1] // Get the data component
      // Required to sync with DSS old_version number 0 -> 1 (CIF res) -> 0 -> 1 (DSS res)
      // We submit the results from CIF to DSS, so the request for the DSS must be a version behind
      ConstraintParsed.old_version = ConstraintParsed.old_version - 1; 
      return [null, ConstraintParsed]; // Format [error, data]
    }
    return [null, null];
  } catch (error) {
    return [error, null];
  }
};

// // Test parseConstraintUSSToDSS()
// const constraint_test = {
//   "constraint_id": "facbb791-48cb-4116-905f-5765c14a9d33",
//   "extents": [{
//     "time_end": {
//       "format": "RFC3339",
//       "value": "2021-05-21T04:26:24Z"
//     },
//     "time_start": {
//       "format": "RFC3339",
//       "value": "2021-05-20T04:26:24Z"
//     },
//     "volume": {
//       "altitude_lower": {
//         "reference": "W84",
//         "units": "M",
//         "value": 0
//       },
//       "altitude_upper": {
//         "reference": "W84",
//         "units": "M",
//         "value": 100
//       },
//       "outline_polygon": {
//         "coordinates": [
//           [
//             [
//               103.85495497971431,
//               1.2886965146831955
//             ],
//             [
//               103.85349357666604,
//               1.2828751821136282
//             ],
//             [
//               103.85529602112452,
//               1.2804725240958277
//             ],
//             [
//               103.85495497971431,
//               1.2886965146831955
//             ]
//           ]
//         ],
//         "type": "Polygon"
//       }
//     }
//   }],
//   "old_version": 1,
//   "state": "Accepted",
//   "uss_base_url": ""
// }

// const [errorParsed, dataParsed] = module.exports.parseConstraintUSSToDSS(constraint_test);
// // console.log(errorParsed, dataParsed);
// console.log(dataParsed.extents[0].volume.outline_polygon);

// ------------------------------------------------------------------------------------------------------------------------------

/** Transform volume from interUSS format to DSS format, note no validation on input */
module.exports.parseVolumeUSSToDSS = (Volume) => {
  try {
    if (Volume.outline_polygon.type === "Polygon") {
      let VolumeParsed = JSON.parse(JSON.stringify(Volume)); // Deep copy
      // Rewrite polygon format, then return
      VolumeParsed.outline_polygon = parsePolygonUSSToDSS(
        VolumeParsed.outline_polygon
      )[1] // Get the data component
      return [null, VolumeParsed]; // Format [error, data]
    }
    return [null, null];
  } catch (error) {
    return [error, null];
  }
};

// // Test

// const testExtents = {
//   "altitude_lower": {
//     "reference": "WGS84",
//     "units": "M",
//     "value": 0
//   },
//   "altitude_upper": {
//     "reference": "WGS84",
//     "units": "M",
//     "value": 100
//   },
//   "outline_polygon": {
//     "coordinates": [
//       [
//         [103.85495497971431, 1.2886965146831955],
//         [103.85349357666604, 1.2828751821136281],
//         [103.85529602112451, 1.2804725240958277],
//         [103.85495497971431, 1.2886965146831955]
//       ]
//     ],
//     "type": "Polygon"
//   }
// };

// const util = require('util');
// const res = module.exports.parseVolumeUSSToDSS(testExtents);
// console.log(util.inspect(res, {showHidden: false, depth: null}));
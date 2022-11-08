/*
 * This module contrains the key external methods used in the Constraint Manager.
 */

let moment = require("moment"); // npm install moment
let turf = require("@turf/turf"); // npm install @turf/turf

/** Converts Zulu datetime to Unix timestamp, i.e. convertZulu2Unix("2020-06-21T04:26:24Z"); */
module.exports.convertZulu2Unix = (zulu_time_string) => {
  return moment(zulu_time_string).unix();
}

/** Converts Unix timestamp to Zulu datetime, i.e. convertUnix2Zulu(1594627586); -> "2020-07-13T08:06:26Z" */
module.exports.convertUnix2Zulu = (unix_timestamp) => {
  return moment.unix(unix_timestamp).utc().format()
}

/** Returns true if datetime range overlaps within the time_tolerance in seconds */
module.exports.datetimeRangeOverlaps = (
  A_start, // Time 1
  A_end,
  B_start, // Time 2
  B_end,
  time_tolerance = 0 // Buffer
) => {
  // Checks time overlap down to the milliseconds with .utc(), or down to seconds with .unix()
  // Note, time_tolerance is given in seconds, so we must use .unix() to match precision
  a_start = moment(A_start).unix();
  a_end = moment(A_end).unix();
  b_start = moment(B_start).unix() - time_tolerance;
  b_end = moment(B_end).unix() + time_tolerance;
  if (a_start <= b_start && b_start <= a_end) return true; // b starts inside a, inclusive
  if (a_start <= b_end && b_end <= a_end) return true; // b ends inside a, inclusive
  if (b_start < a_start && a_end < b_end) return true; // a is inside b
  return false;
};

/*
 * Takes two polygons and finds their intersection
 * If they share a border, returns the intersecting border as a polygon
 * If they don't intersect, returns undefined
 */
module.exports.polygonOverlaps = (Poly1, Poly2) => {
  // A polygon is made up of an array of 2D coordinates
  let poly1 = turf.polygon(Poly1);
  let poly2 = turf.polygon(Poly2);
  intersection = turf.intersect(poly1, poly2);
  if (intersection) {
    // return intersection.geometry.coordinates;
    return true;
  } else {
    return false; // No overlap
  }
};

/*
 * This module checks incoming JWT using public key
 */

const utils = require('../miscellaneous/utils') // No CORS
const jwt = require('jsonwebtoken');
const fs = require('fs')

let CACHED_PUBLIC_KEY

const readPublicKey = () => {
  try{
      if(!CACHED_PUBLIC_KEY) CACHED_PUBLIC_KEY = fs.readFileSync('public.pem');
      return null
  }
  catch(err){
      return err
  }
}

/**
 * Check if encoded scope is in list of approved scopes
 * Note only one scope from the list of approved scopes is needed in the scope string to pass test
 * @param {*} scopeString -> Scope string, scopes separated by '+'
 * @param {*} requiredScopes -> Array of approved scopes 
 */
const scopeInScopes = (scopeString, requiredScopes) => {
  // Parse scope string into array of scopes from incoming auth header
  const scopes = scopeString.split("+")
  // console.log('Incoming', scopes)
  // console.log('Approved', requiredScopes)
  // Check if incoming scopeString contains any of the scope from requiredScopes
  if (
    scopes.some(r => requiredScopes.indexOf(r) >= 0)
  ) {
    // Returns true if one of the scope in requiredScopes is contained in scopeString
    return true
  } else {
    // Returns error if check fails
    return false
    // return utils.responseError(403, `Token with scope \'${scopeString}\' is not within the list of authorized scopes requied to access this service`)
  }
}

// console.log(readPublicKey());
// console.log(CACHED_PUBLIC_KEY);

module.exports.main = async (authorizationHeader, requiredScopes) => {
  
  if(typeof(authorizationHeader) !== "string") {
    return utils.responseError(401, 'Requested header format is invalid')
  }
  
  // Check if Bearer keyword is present (this is optional)
  const headerSplit = authorizationHeader.split(' ')
  if(headerSplit.length > 1){
    if(headerSplit[0] !== "Bearer") return utils.responseError(401, 'Requested header format is invalid')
    authorizationHeader = headerSplit[1]
  }
  
  const token = authorizationHeader
  const tokenSections = (token || '').split('.');
  if (tokenSections.length < 2) return utils.responseError(401, 'Requested token is invalid')

  let header
  try{
    const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
    header = JSON.parse(headerJSON)
  }catch(err){
    return utils.responseError(401, 'Requested token is invalid')
  }

  // Read PEM file (cache it)
  const readErr = readPublicKey()
  if(readErr) {
    console.warn(readErr)
    return utils.responseError(500, 'Internal server error')
  }

  let claim
  try{
    claim = await jwt.verify(token, CACHED_PUBLIC_KEY);
  } 
  catch(err){
    if(err.message) return utils.responseError(401, err.message)
    return utils.responseError(401, 'Requested token is invalid')
  }

  const { exp, scope, iss} = claim

  const currentSeconds = Math.floor( (new Date()).valueOf() / 1000);
  if (currentSeconds > exp) {
    return utils.responseError(401, 'Request token has expired')
  }
  if (iss !== 'https://auth.novauss.com') { // TODO: DONT HARD CODE
      return utils.responseError(401, 'Token issuer is invalid')
  }

  // // Check if scope is in list of scopes
  // const scopes = scope.split("+")
  // if(!scopes.includes(requiredScopes)){
  //   return utils.responseError(403, 'Token is missing the required scope')
  // }

  // Check if scope is in list of scopes
  if(!scopeInScopes(scope, requiredScopes)){
    return utils.responseError(403, `Token with scope \'${scope}\' is not within the list of authorized scopes requied to access this service`)
  }

  return null

}

// // Test parsing of multiple scopes 
// console.log(
//   scopeInScopes(
//       'utm.constraint_ingestion+utm.constraint_management+utm.constraint_consumption', 
//       ['utm.constraint_ingestion', 'utm.constraint_consumption']
//     )
//   );

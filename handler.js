"use strict";
const moment = require("moment");

const verifyToken = require('./lib/auth/verifyToken').main;
const getOperation = require("./lib/archive/operations/get-operation").main;
const createOperation = require("./lib/archive/operations/create-operation").main;
const deleteOperation = require("./lib/archive/operations/delete-operation").main;
const scanOperations = require("./lib/archive/operations/scan-operations").main;

const getConstraint = require("./lib/constraint-manager/dbo-get").main;
const notifyConstraint = require("./lib/notifications/cnotif-handler").notifyConstraint;
const notifyOperation = require("./lib/notifications/cnotif-handler").notifyOperation;
const queryConstraints = require("./lib/constraint-manager/dbo-query").main;
const queryActiveConstraints = require("./lib/constraint-manager/dbo-query-active").main;
const queryActiveConstraintsByType = require("./lib/constraint-manager/dbo-query-active-type").main;
const createConstraint = require("./lib/constraint-manager/dbo-create").main;
const updateConstraint = require("./lib/constraint-manager/dbo-update").main;
const createConstraintGeozone = require("./lib/constraint-manager/dbo-create-gz").main;
const updateConstraintGeozone = require("./lib/constraint-manager/dbo-update-gz").main;
const deleteConstraint = require("./lib/constraint-manager/dbo-delete").main;
const scanConstraints = require("./lib/constraint-manager/dbo-scan").main;

const subscribeFromDSS = require("./lib/subscriptions/subscribe").putSubscriptionIntoDSS;


const {
  pathParamError,
  bodyParseError,
  genericError,
  checkBodyCanBeParsed,
  constraintSchemaError,
  checkConstraintFormatIsValid,
  checkNotifyConstraintFormatIsValid
} = require("./lib/cif-handlers");


const createOperationHandler = async (event, context, callback) => {
  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  return callback(null, await createOperation(bodyData));
};

const getOperationHandler = async (event, context, callback) => {
  if (event.pathParameters != null) {
    return callback(null, await getOperation(event.pathParameters.id));
  } else {
    return callback(null, pathParamError('id'));
  }
};

const deleteOperationHandler = async (event, context, callback) => {
  if (event.pathParameters != null) {
    return callback(null, await deleteOperation(event.pathParameters.id));
  } else {
    return callback(null, pathParamError('id'));
  }
};

const scanOperationsHandler = async (event, context, callback) => {
  return callback(null, await scanOperations());
};

const uvrCreateConstraintHandler = async (event, context, callback) => {
  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  const [validateBodyData, validateBodyDataLog] = checkConstraintFormatIsValid(bodyData, false);
  if (validateBodyData) {
    return callback(null, await createConstraint(bodyData));
  }
  return callback(null, constraintSchemaError(validateBodyDataLog));
};
const uvrUpdateConstraintHandler = async (event, context, callback) => {
  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  const [validateBodyData, validateBodyDataLog] = checkConstraintFormatIsValid(bodyData, true);
  if (validateBodyData) {
    return callback(null, await updateConstraint(bodyData));
  }
  return callback(null, constraintSchemaError(validateBodyDataLog));
};
const gzCreateConstraintHandler = async (event, context, callback) => {
  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  const [validateBodyData, validateBodyDataLog] = checkConstraintFormatIsValid(bodyData, false);
  if (validateBodyData) {
    return callback(null, await createConstraintGeozone(bodyData));
  }
  return callback(null, constraintSchemaError(validateBodyDataLog));
};
const gzUpdateConstraintHandler = async (event, context, callback) => {
  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  const [validateBodyData, validateBodyDataLog] = checkConstraintFormatIsValid(bodyData, true);
  if (validateBodyData) {
    return callback(null, await updateConstraintGeozone(bodyData));
  }
  return callback(null, constraintSchemaError(validateBodyDataLog));
};
const getConstraintHandler = async (event, context, callback) => {
  const verifyError = await verifyToken(event.headers.Authorization, ["utm.strategic_coordination", "utm.constraint_consumption", "utm.constraint_ingestion"]) // Contains interUSS 0.3.5 and 0.3.8, interUSS 0.3.8 is utm.constraint_ingestion
  if (verifyError) return callback(null, verifyError)

  if (event.pathParameters != null) {
    return callback(null, await getConstraint(event.pathParameters.id));
  } else {
    return callback(null, pathParamError('id'));
  }
};
const notifyConstraintHandler = async (event, context, callback) => {
  const verifyError = await verifyToken(event.headers.Authorization, ["utm.strategic_coordination", "utm.constraint_consumption", "utm.constraint_management"]) // Contains interUSS 0.3.5 and 0.3.8, interUSS 0.3.8 is utm.constraint_management
  if (verifyError) return callback(null, verifyError)

  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  const validateBodyData = true;
  if (validateBodyData) {
    return callback(null, await notifyConstraint(bodyData));
  }
  return callback(null, genericError("No validation available..."));
};
const notifyOperationHandler = async (event, context, callback) => {
  const verifyError = await verifyToken(event.headers.Authorization, ["utm.strategic_coordination", "utm.constraint_consumption", "utm.constraint_ingestion"]) // Contains interUSS 0.3.5 and 0.3.8, where interUSS 0.3.8 is utm.constraint_ingestion
  if (verifyError) return callback(null, verifyError)

  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  return callback(null, await notifyOperation(bodyData));
};
const queryConstraintsHandler = async (event, context, callback) => {
  if (event.pathParameters != null) {
    return callback(null, await queryConstraints(event.pathParameters.id));
  } else {
    return callback(null, pathParamError('id'));
  }
};
const queryActiveConstraintsHandler = async (event, context, callback) => {
  if (event.pathParameters != null) {
    return callback(null, await queryActiveConstraints('Accepted', event.pathParameters.time));
  } else {
    return callback(null, pathParamError('time'));
  }
};
const queryActiveConstraintsByTypeHandler = async (event, context, callback) => {
  if (event.pathParameters != null) {
    const current_time = moment().unix();
    return callback(null, await queryActiveConstraintsByType(event.pathParameters.constraint_type, current_time));
  } else {
    return callback(null, pathParamError('constraint_type'));
  }
};
const deleteConstraintHandler = async (event, context, callback) => {
  if (event.pathParameters != null) {
    return callback(null, await deleteConstraint(event.pathParameters.id));
  } else {
    return callback(null, pathParamError('id'));
  }
};
const scanConstraintsHandler = async (event, context, callback) => {
  return callback(null, await scanConstraints());
};

const subscribeFromDSSHandler = async (event, context, callback) => {
  const bodyData = checkBodyCanBeParsed(event);
  if (!bodyData) {
    return callback(null, bodyParseError);
  }
  return callback(null, await subscribeFromDSS(bodyData));
};


const operationsHandlers = {
  "POST": createOperationHandler,
  "GET": getOperationHandler,
  "DELETE": deleteOperationHandler,
};
const scanOperationsHandlers = {
  "POST": scanOperationsHandler
};

const getConstraintsHandlers = {
  "GET": getConstraintHandler
};
const notifyConstraintsHandlers = {
  "POST": notifyConstraintHandler
};
const notifyOperationsHandlers = {
  "POST": notifyOperationHandler
};
const uvrConstraintsHandlers = {
  "POST": uvrCreateConstraintHandler
};
const uvrUpdateConstraintHandlers = {
  "POST": uvrUpdateConstraintHandler
};
const gzConstraintsHandlers = {
  "POST": gzCreateConstraintHandler
};
const gzUpdateConstraintHandlers = {
  "POST": gzUpdateConstraintHandler
};
const deleteConstraintHandlers = {
  "DELETE": deleteConstraintHandler
};
const scanConstraintsHandlers = {
  "POST": scanConstraintsHandler
};
const queryConstraintsHandlers = {
  "GET": queryConstraintsHandler
};
const queryActiveConstraintsHandlers = {
  "GET": queryActiveConstraintsHandler
};
const queryActiveConstraintsByTypeHandlers = {
  "GET": queryActiveConstraintsByTypeHandler
};

const subscribeFromDSSHandlers = {
  "PUT": subscribeFromDSSHandler
};



const getHandlers = (resourcePath) => {
  // Opeartions
  if (resourcePath === "/operations") return operationsHandlers;
  if (resourcePath === "/operations/query/global") return scanOperationsHandlers;
  if (resourcePath === "/operations/{id}") return operationsHandlers;
  // Constraints
  if (resourcePath === "/uss/v1/constraints/{id}") return getConstraintsHandlers; // ASTM compliant
  if (resourcePath === "/uss/v1/constraints") return notifyConstraintsHandlers;   // ASTM compliant
  if (resourcePath === "/uss/v1/operations") return notifyOperationsHandlers;     // ASTM compliant
  if (resourcePath === "/uss/v1/subscriptions") return subscribeFromDSSHandlers;  // ASTM compliant
  if (resourcePath === "/constraints/create/uvr") return uvrConstraintsHandlers;
  if (resourcePath === "/constraints/update/uvr") return uvrUpdateConstraintHandlers;
  if (resourcePath === "/constraints/create/gz") return gzConstraintsHandlers;
  if (resourcePath === "/constraints/update/gz") return gzUpdateConstraintHandlers;
  if (resourcePath === "/constraints/query/global") return scanConstraintsHandlers;
  if (resourcePath === "/constraints/query/{id}") return queryConstraintsHandlers;
  if (resourcePath === "/constraints/query/active/{time}") return queryActiveConstraintsHandlers;
  if (resourcePath === "/constraints/query/type/{constraint_type}") return queryActiveConstraintsByTypeHandlers;
  if (resourcePath === "/constraints/remove/{id}") return deleteConstraintHandlers;
  return {};
};


exports.handler = async (event, context, callback) => {

  if (!event.headers || !("Authorization" in event.headers)) {
    return callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authorization header is missing from the request' })
    })
  }

  const handlers = getHandlers(event['path']);
  const httpMethod = event['httpMethod'];

  if (httpMethod in handlers) {
    return await handlers[httpMethod](event, context, callback);
  }

  const response = {
    statusCode: 405,
    body: JSON.stringify({ message: `Invalid HTTP Method ${event['httpMethod']} call to resource ${event['path']}` }),
  };

  callback(null, response);
};
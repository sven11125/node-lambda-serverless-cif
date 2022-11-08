/*
 * Here defines the constraint delete method.
 */

const utils = require("../cif-utils");
const { getConstraint, deleteConstraint } = require("./dbo-methods");
const { deleteConstraintFromDSS } = require("../dss-integration/dss-handlers");
const { onDSSResponseNotifyUSS } = require("../notifications/cnotif-emitter");
const { parseCIFConstraintToDSSConstraint } = require("../cif-parsers");

let responseBody = "Not Found";
let statusCode = 404;

module.exports.main = async (id) => {
  const responseHeaders = utils.corsHeaders("OPTIONS,DELETE");

  // Check if constraint exists in the database
  const { error, data, message } = await getConstraint(id);
  if (error) {
    return utils.responseError(404, message, responseHeaders);
  } else if (!data) {
    return utils.responseError(statusCode, `Constraint ${id} not found.`, responseHeaders); // ID not found
  }

  // Delete constraint from the database
  const deleteConstraintResults = await deleteConstraint(id);
  if (deleteConstraintResults.error) {
    return utils.responseError(404, deleteConstraintResults.message, responseHeaders);
  } else {

    /** DSS integration for DELETE */

    // Parse constraint (output from createConstraint) into DSS format, then post to DSS
    const [errorDeleteFromDSS, responseDeleteFromDSS] = await deleteConstraintFromDSS(id);
    if (errorDeleteFromDSS) { 
      // If for some reason putConstraintIntoDSS() fails, we would still return success because
      // createConstraint() is passed as we created a constraint in the CIF but not the DSS,
      // we return a special error message to identify this.
      const custom_dss_error_message = `Constraint ${id} successfully deleted in the CIF but failed to delete in the DSS for some reason. DSS error: (${errorDeleteFromDSS})`;
      return utils.responseSuccess(200, {
        message: custom_dss_error_message,
        dss_response: responseDeleteFromDSS
      }, responseHeaders);
    }

    // Push notification to relevant subscribers provided in the DSS response
    const DSSConstraint = parseCIFConstraintToDSSConstraint(data, responseDeleteFromDSS);
    const [notificationErr, notificationMsg] = await onDSSResponseNotifyUSS(id, DSSConstraint, responseDeleteFromDSS, isDeleteNotification=true); 
    if (notificationErr) {
      data['message'] = `Constraint successfully deleted in the CIF and DSS, but push notification failed for some reason. Error: (${notificationMsg})`;
      return utils.responseSuccess(201, data, responseHeaders);
    }
    
    return utils.responseSuccess(200, {
      message: deleteConstraintResults.message,
      dss_response: responseDeleteFromDSS
    }, responseHeaders);
  }
};

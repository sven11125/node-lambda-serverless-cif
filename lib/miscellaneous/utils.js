const responseSuccess = (statusCode, data) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(data)
    }
}
  
const responseError = (statusCode, message) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify({
          message: message
        })
    }
}

module.exports = {
    responseSuccess,
    responseError
}
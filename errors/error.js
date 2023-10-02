class CustomAPIError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.status = statusCode
    }
}

const customError = (msg, code) => {
    return new CustomAPIError(msg, code)
}

export { customError, CustomAPIError }

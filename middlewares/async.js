import { CustomAPIError } from "../errors/error.js"

function Async(fn) {
    return async (...params) => {
        try {
            console.log('Async', ...params)
            await fn(...params)
        } catch (error) {
            console.log('error', error)
            if (error instanceof CustomAPIError) {
                return { status: error.status, message: error.message }
            }
            return { status: 500, message: 'Something went wrong, please try again' }
        }
    }
}

function Coord(fn) {
    return async () => {
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(fn);
            } else console.log('navigator geolocation is not supported!')
        } catch (error) {
            return { status: 500, message: 'Something went wrong, please try again' }
        }
    }

}

export { Async, Coord }
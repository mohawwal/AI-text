const app = require('./app')
const dotenv = require('dotenv')

dotenv.config()

const server = app.listen(process.env.PORT, () => {
    console.log(`server running in PORT ${process.env.PORT} in ${process.env.NODE_ENV}`)
})


//handle unhandled promise Rejection
process.on("unhandledRejection", err => {
    console.log(`Error: ${err.message}`)
    console.log('Shutting Down The Server Due To Unhandled Promise Rejection')
    server.close(() => {
        process.exit(1)
    })
})
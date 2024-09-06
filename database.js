const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("Atlas Database Connected Successfully")
}).catch(err => console.log("Something Went wrong,plese check!!!"))


module.exports = mongoose;
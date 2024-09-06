const mongoose = require("mongoose");
const {Schema} = mongoose;

const todoSchema = new Schema({
  description: {
    type: String,
    required: true,
  },
  datetime: {
    type: Date,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" ,
    required:true,
  },
  completed: {
    type: Boolean,
    default: false,
  }
});

const Todo = mongoose.model("Todo", todoSchema);
module.exports = Todo;

const express = require("express");
const bcrypt = require("bcrypt")
const { validateUser, UserModel, validateLogin, genToken } = require("../models/userModel");
const { auth , authAdmin} = require("../middlewares/auth");
const { OrderModel } = require("../models/orderModel");
const router = express.Router();


router.get("/", (req,res) => {
  res.json({msg:"Users work"})
})


// get users List for admin only
router.get("/usersList", authAdmin,async(req, res) => {
  let perPage = req.query.perPage || 20;
  let page = req.query.page >= 1 ? req.query.page - 1 : 0;
  try {
    let data = await UserModel.find({}, { password: 0 })
    .limit(perPage)
    .skip(page * perPage)
    res.json(data);
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
})


// Checks if the user has an appropriate token
router.get("/checkUserToken", auth , async(req,res) => {
  res.json({status:"ok",msg:"token is good",tokenData:req.tokenData})
})


//get Info About current user
router.get("/myInfo", auth,async(req,res) => {
  try{
    let data = await UserModel.findOne({_id:req.tokenData._id},{password:0})
    res.json(data);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})


// can change the role of user to admin or user , must be admin in this endpoint
router.patch("/changeRole/:userId/:role", authAdmin, async (req, res) => {
  let userId = req.params.userId;
  let role = req.params.role;
  try {
    // 61deb997098a0b2d4971d7ed = obama = super admin
    if (userId != req.tokenData._id && userId!="61deb997098a0b2d4971d7ed") {
      let data = await UserModel.updateOne({ _id: userId }, { role: role })
      res.json(data);
    }
    else{
      res.status(401).json({err:"You cant change your self"});
    }
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
})



// add new user
router.post("/" , async(req,res) => {
  let validBody = validateUser(req.body);
  if(validBody.error){
    return res.status(400).json(validBody.error.details);
  }
  try{
    let user = new UserModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "*****";
    return res.status(201).json(user);
  }
  catch(err){
    if(err.code == 11000){
      return res.status(400).json({code:11000,err:"Email already in system"})
    }
    console.log(err);
    return res.status(500).json(err);
  }
})

// login
router.post("/login" , async(req,res) => {
  let validBody = validateLogin(req.body);
  if(validBody.error){
    return res.status(400).json(validBody.error.details);
  }
  try{
    let user = await UserModel.findOne({email:req.body.email})
    if(!user){
      return res.status(401).json({err:"User not found!"});
    }
    let validPass = await bcrypt.compare(req.body.password, user.password)
    if(!validPass){ 
      return res.status(401).json({err:"User or password is wrong"});
    }
    res.json({token:genToken(user._id, user.role)});
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

// Deleting a user and his orders
router.delete("/:idDelete", authAdmin , async(req,res) => {
  try{
    let idDelete = req.params.idDelete 
    let dataOrderDel = await OrderModel.deleteMany({user_id:idDelete})
    let dataUserDel = await UserModel.deleteOne({_id:idDelete});  
    res.json({dataUserDel,dataOrderDel});
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})


module.exports = router;
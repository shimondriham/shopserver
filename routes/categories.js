const express = require("express");
const {random} = require("lodash");
const { authAdmin } = require("../middlewares/auth");
const { validateCategory, CategoryModel } = require("../models/categoryModel");
const {  ProductModel } = require("../models/productModel");
const router = express.Router();


//get all categorys
router.get("/", async(req,res) => {
  let perPage = req.query.perPage || 20;
  let page = req.query.page >= 1 ? req.query.page - 1 : 0;
  try{ 
    let data = await CategoryModel.find({})
    .limit(perPage)
    .skip(page * perPage)
    res.json(data);
  }
  catch(err){
    console.log(err)
    res.status(500).json(err)
  }
})


//get 1 category
router.get("/single/:url_name", async(req,res) => {
  try{
    let data = await CategoryModel.findOne({url_name:req.params.url_name})
    res.json(data);
  }
  catch(err){
    console.log(err)
    res.status(500).json(err)
  } 
})


//add new category
router.post("/", authAdmin , async(req,res) => {
  let validBody = validateCategory(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try{
    let category = new CategoryModel(req.body);
    category.short_id = await genShortId(); 
    await category.save();
    res.status(201).json(category);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})


//Update category 
router.put("/:idEdit", authAdmin , async(req,res) => {
  let validBody = validateCategory(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try{
    let idEdit = req.params.idEdit
    let data = await CategoryModel.updateOne({_id:idEdit},req.body)
    res.json(data);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

//Delete category 
router.delete("/:idDelete", authAdmin , async(req,res) => {
  try{
    let idDelete = req.params.idDelete 
    let dataProducts = await ProductModel.deleteMany({cat_short_id:idDelete})
    let dataCategory = await CategoryModel.deleteOne({short_id:idDelete});  
    res.json({dataProducts,dataCategory});
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})


// short ID for category
const genShortId = async() => {
  let flag = true; 
  let rnd;
  while(flag){
    rnd = random(0,999999)
    try{
      let data = await CategoryModel.findOne({short_id:rnd})
      if(!data){
        flag = false;
      }
    }
    catch(err){
      console.log(err);
      flag = false;
      return res.status(500).json(err);
    }
  }
  return rnd;
}


module.exports = router;
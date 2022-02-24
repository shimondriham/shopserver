const express = require("express");
const router = express.Router();

router.get("/", (req,res) => {
  res.json({msg:"shop project Work "})
})

module.exports = router;
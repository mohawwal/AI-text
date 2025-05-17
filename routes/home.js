const express = require('express');
const router = express.Router();
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');


router.get('/home', catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Let's do this"
    });

    throw new ErrorHandler('Something went wrong', 500);
}));


module.exports = router;
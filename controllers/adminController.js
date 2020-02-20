const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Admin = require('../models/admin');
const AdminService = require('../services/adminService');

exports.signUp = async(function(req,res,next){
	try{
		const adminLogin = await
		const adminSignups = await(AdminService.adminSignup(req.body));
		if(adminSignups){
			return res.json({status:200,message:'Success'});
		}
		else{
			return res.json({status:500,message:'Error occuured'});
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err});
	}
})

exports.login = async(function(req,res,next){
	try{
		const adminLogin = await
		const adminAppLogin = await(AdminService.adminlogins(req.body));
		if(adminAppLogin.length !=0){
			return res.json({status:200,message:'Logged in successfully'});
		}
		else{
			return res.json({status:500,message:'Invalid Credentials'});
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err});
	}
})
const config = require('../config');
const bcrypt = require('bcrypt');
const Admin = require('../models/admin');


exports.adminSignup = function(body){
	var {username,password} = body;
	var adminDetails = new Admin;
	adminDetails.username = username;
	adminDetails.password = password;
	adminDetails.save();
	return adminDetails;
}

exports.adminlogins = function(adminData){
	return Admin.find({$and:[{username:adminData.username},{password:adminData.password}]});
}
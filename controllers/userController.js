const User = require('../models/users');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const userService = require('../services/userService');
const topicService = require('../services/topicService');
const Events = require('../models/events');
const speakeasy = require("speakeasy");
const config = require('../config');
const fs = require('fs');
var Cryptr = require('cryptr');
var cryptr = new Cryptr('myTotalySecretKey');
const ejs = require('ejs');
const mail = require('../services/mail');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const uploadFile = require('../middlewares/uploadFile');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var _ = require('lodash');
const moment = require('moment');
const Async = require('async');
const Feeds = require('../models/feeds');
const ObjectID = require('mongodb').ObjectID;
const Follow = require('../models/follow');
const Paper = require('../models/paperUpload');
const Question = require('../models/questionUpload');
const Bookmark = require('../models/bookmark');
const Recommend = require('../models/recommend');
const Notification = require('../models/notification');

exports.checksocialId = async(function(req, res, next) {
    const userdetail = await (userService.findOneSocialId(req.body));

    if (userdetail.length == 1) {
        return res.json({ status: 400, message: "User already exists. Please login" });
    } else if (userdetail.length == 0) {
        return res.json({ status: 200, message: "Please register with us" });
    } else {
        return res.json({ status: 500, message: "Something went wrong" });
    }
});
exports.socialLogin = async(function(req, res, next) {

    console.log(req.body);
    const userdetail = await (userService.findOneSocialId(req.body));
    if (userdetail.length == 1) {
        var userId = userdetail[0]._id;
        var userfirstname = userdetail[0].firstname;
        return res.json({ status: 200, userId: userId, userfirstname: userfirstname });

    } else if (userdetail.length == 0) {
        return res.json({ status: 401, message: "Sorry we couldn't find you.Please register" });
    } else {
        return res.json({ status: 500, message: "Something went wrong" });
    }
});
exports.socialRegistration = async(function(req, res, next) {
    console.log("req.body", req.body);
    const datafind = await (userService.findOneAndUpdateSocialId(req.body));
    console.log("datafind---", datafind);
    if (datafind.upserted) {
        const userdata = await (userService.findOneUser(req.body.email));
        console.log("userdata---", userdata);

        console.log("datafind------update-@", datafind);
        this.userId = userdata._id;
        this.firstname = userdata.firstname;

        return res.json({ status: 200, message: 'Success', userId: this.userId, firstname: this.firstname });

    } else {
        res.send({ status: 500, message: "Something went wrong" });
    }
});
exports.signup = async(function(req, res, next) {
    const { email } = req.body;
    try {
        const userexist = await (userService.findUser(email))
        if (userexist.length == 0) {
            var otp = getRandomCode(4);
            // insert user
            const userSaved = await (userService.insertUser(req.body, otp))

            if (userSaved) {
                var userId = userSaved._id;
                var userFirstname = userSaved.firstname;
                var userLastname = userSaved.lastname;
                // create a token
                var token = jwt.sign({ user: userSaved.email }, config.secret);
                var html = fs.readFileSync('../knowledgehub/views/otp.ejs', 'utf8');
                var render = ejs.render(html, { 'otp': otp, userFirstname: userFirstname });
                var input = {
                    to: userSaved.email,
                    from: '"Abbaqus" <team@abbaqus.com>',
                    subject: 'Your OTP for Abbaqus Profile Verification',
                    message: render
                };
                mail.sendMail(input, function(error, response) {
                    if (error) {
                        console.log('error', error);
                    } else {
                        res.json({ status: 200, token: token, userId: userId, userFirstname: userFirstname, userLastname: userLastname });
                    }
                });
            }
        } else {
            res.json({ status: 500, message: 'User with email already exist' });
        }
    } catch (error) {
        return res.send(error);
    }
})

exports.insertTopics = async(function(req, res, next) {
    const { topics } = req.body;
    let topic = topics.split(",");
    const topicinserted = await (
        topic.forEach(function(element) {
            topicService.insertTopics(element)
        })
    )
    return res.json({ status: 200, msg: topicinserted });
})

exports.mapTopicstosubtopics = async(function(req, res, next) {
    const { topic_id, subtopic } = req.body;
    const mapTopic = await (topicService.maptopics(topic_id, subtopic))
    return res.json({ status: 200, msg: mapTopic });
})

exports.getTopics = async(function(req, res, next) {
    var discplineId = req.params.id;
    const getAlltopics = await (topicService.getAlltopics(discplineId));
    if (getAlltopics) {
        return res.send(getAlltopics);
    } else {
        return res.json({ status: 500, message: 'Error occured while fetching topics' });
    }
})

exports.login = async(function(req, res, next) {
    const { email_id, login_password } = req.body;
    const access = await (userService.findOneUser(email_id));
    console.log(access);
    
    if (access) {
        if (access.otpVerified) {
            var token = jwt.sign({ user: access.email }, config.secret);
            var checkPasswordmatch = await (userService.checkloginPassword(login_password, access.password))
            if (checkPasswordmatch) {
                if (access.maindiscpline.length != 0) {
                    if (access.topics.length != 0) {
                        if (access.subtopics.length != 0) {
                            res.send({ status: 200, token: token, userfirstname: access.firstname, userlastname: access.lastname, userId: access._id, email: access.email });
                        } else {
                            res.send({ status: 100, message: 'Please select subtopics', maindiscpline: access.maindiscpline, topics: access.topics, userId: access._id });
                        }
                    } else {
                        res.send({ status: 300, message: 'Please select topics', maindiscpline: access.maindiscpline, userId: access._id });
                    }
                } else {
                    res.send({ status: 600, message: 'Please select main discpline', userId: access._id, userfirstname: access.firstname, userlastname: access.lastname });
                }
            } else {
                res.send({ status: 500, message: 'Incorrect password' });
            }
        } else {
            return res.json({ status: 400, message: 'User has not verified Email_id' })
        }
    } else {
        res.send({ status: 201, message: 'user not found' })
    }
});

exports.verifyOtp = async(function(req, res, next) {
    const { email, otp } = req.body;

    let access = await (userService.findOneUser(email));
    if (access) {
        if (otp == access.otp) {
            const updateUserdetails = await (userService.updateIsOtpVerified(email))
            if (updateUserdetails) {
                res.json({ status: 200 });
                var userFirstname = access.firstname;
                var welcomehtml = fs.readFileSync('../knowledgehub/views/welcome.ejs', 'utf8');
                var welcomerender = ejs.render(welcomehtml, { userFirstname: userFirstname });
                var welcomeinput = {
                    to: access.email,
                    from: '"Abbaqus" <team@abbaqus.com>',
                    subject: 'Welcome to Abbaqus',
                    message: welcomerender
                }
                mail.sendMail(welcomeinput, function(err, response) {
                    console.log("err", err)
                })
                const updateGraph = await (userService.addUserIdtoGraph(access.graph, access._id))
            } else {
                return res.json({ status: 500, message: 'Error occured while updating user otp status' })
            }

        } else {
            res.json({ status: 500, message: 'OTP not matching' });
        }
    } else {
        res.send({ status: 201, message: 'User not found' })
    }
})

exports.verifyEmail = async(function(req, res, next) {
    try {
        var email = req.body.email;
        const checkUserExist = await (userService.findOneUser(email))
        if (checkUserExist.length != 0) {
            var userFirstname = checkUserExist.firstname;
            if (checkUserExist.otpVerified == false) {
                var otp = getRandomCode(4);
                const updateUser = await (userService.userUpdateOtp(checkUserExist._id, otp))
                if (updateUser) {
                    var html = fs.readFileSync('../knowledgehub/views/otp.ejs', 'utf8');
                    var render = ejs.render(html, { 'otp': otp, userFirstname: userFirstname });
                    var input = {
                        to: checkUserExist.email,
                        from: '"Abbaqus" <team@abbaqus.com>',
                        subject: 'Your OTP for Abacus profile verification',
                        message: render
                    };
                    mail.sendMail(input, function(err, response) {
                        res.json({ status: 200, message: 'Otp sent to your email_id' });
                    });
                } else {
                    return res.json({ status: 500, message: 'Error occured while updating user' })
                }
            } else {
                return res.json({ status: 500, message: 'Email already verified' })
            }
        } else {
            return res.json({ status: 500, message: 'Email id does not exist' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.allUsers = async(function(req, res, next) {
    const getAllUsers = await (userService.getallUsers())
    if (getAllUsers.length == 0) {
        res.send({ status: 201, message: 'Users not found' })
    } else {
        return res.send(getAllUsers);
    }
})

exports.resendOtp = async(function(req, res, next) {
    const { email } = req.body;
    var otp = getRandomCode(4);
    const userFound = await (userService.findOneUser(email));
    var userId = userFound._id;
    var emailId = userFound.email;
    var firstname = userFound.firstname;
    var role = userFound.role;
    if (userFound) {
        const userUpateOtp = await (userService.userUpdateOtp(userId, otp));
        if (userUpateOtp) {

            var html = fs.readFileSync('../knowledgehub/views/resendotp.ejs', 'utf8');
            var render = ejs.render(html, { 'otp': otp, firstname: firstname });
            var input = {
                to: emailId,
                from: '"Abbaqus" <team@abbaqus.com>',
                subject: 'Resend OTP',
                message: render
            };

            mail.sendMail(input, function(err, response) {
                return res.json({ status: 200, message: 'Otp sent successfully' });
            });
        } else {
            return res.json({ status: 500, message: 'Error occured while updating otp' })
        }
    } else {
        return res.json({ status: 500, message: 'User does not exist' })
    }
})

exports.forgotPassword = async(function(req, res, next) {
    var email = req.body.email;
    const findUser = await (userService.findOneUser(email));
    var encryptedString = cryptr.encrypt(email);
    if (findUser) {
        var email = findUser.email;
        var firstname = findUser.firstname;
        var role = findUser.role;
        var html = fs.readFileSync('../knowledgehub/views/forgotPassword.ejs', 'utf8');
        var render = ejs.render(html, { 'link': encryptedString, firstname: firstname });
        var input = {
            to: email,
            from: '"Abbaqus" <team@abbaqus.com>',
            subject: 'New Password Request for Abbaqus',
            message: render
        };

        mail.sendMail(input, function(err, response) {
            return res.json({ status: 200, message: 'Success' });
        });
    } else {
        return res.json({ status: 500, message: 'User not found' });
    }
})

exports.changePassword = async(function(req, res, next) {
    try {
        var userId = req.body.userId;
        const checkUserExists = await (userService.checkUser(userId))
        if (checkUserExists.length != 0) {
            const matchPasswords = await (userService.checkPassword(req.body.oldpassword, checkUserExists.password))
            if (matchPasswords === true) {
                const updatePassword = await (userService.changeUserPassword(req.body))
                if (updatePassword) {
                    return res.json({ status: 200, message: 'Password changed successfully' })
                } else {
                    return res.json({ status: 500, message: 'Error occured while updating password' })
                }
            } else {
                return res.json({ status: 500, message: 'Password do not match' })
            }
        } else {
            return res.json({ status: 500, message: "User does not exist" })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.resetpassword = async(function(req, res, next) {
    var email = cryptr.decrypt(req.body.email);
    var password = req.body.password;
    const userFind = await (userService.findOneUser(email));
    if (userFind) {
        const updatePassword = await (userService.updatePassword(email, password));
        if (updatePassword) {
            return res.json({ status: 200, message: 'Password updated successfully' });
        } else {
            return res.json({ status: 500, message: 'Error occured' })
        }
    } else {
        return res.json({ status: 500, message: 'User does not exist' })
    }
})

exports.getUsers = async(function(req, res, next) {
    var userId = req.body.profileuserId;
    var loggeduserId = req.body.loggeduserId;
    try {
        const userExist = await (userService.userFind(userId));
        if (userExist.length != 0) {
            const fetchuserFollowed = await (userService.followedUsersDetail(loggeduserId))
            if (userId === loggeduserId) {
                var newData = userExist.map(el => {
                    if (ObjectID(el._id).equals(ObjectID(userId)))
                        return Object.assign({}, el, { isfollowed: true })
                    return el
                });
                return res.json({ status: 200, message: 'Success', result: newData })
            } else {
                if (fetchuserFollowed.length != 0) {
                    var followedId = fetchuserFollowed.map(function(follow) {
                        return ({ _id: follow.following })
                    })
                    const matchfollowed = await (matchFollowinginusers(userExist, followedId));
                    return res.json({ status: 200, message: 'Success', result: matchfollowed })
                } else {
                    return res.json({ status: 200, message: 'Success', result: userExist })
                }
            }
        } else {
            return res.json({ status: 500, message: 'User does not exist' });
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err });
    }
})

// old api for calenders
exports.calenderEvents = async(function(req, res, next) {
        try {
            var userId = req.body.userId;
            const userExist = await (userService.userFinding(userId));
            if (userExist) {
                const events = await (userService.events(userExist));
                if (events) {
                    return res.json({ status: 200, message: 'Success', result: events });
                } else {
                    return res.json({ status: 200, message: 'No events for the user' });
                }
            } else {
                return res.json({ status: 500, message: 'User does not exist' });
            }
        } catch (err) {
            return res.json({ status: 500, message: 'Error occured', err: err });
        }
    })
    // end

exports.addTopics = async(function(req, res, next) {
    try {
        var userId = req.body.userId;
        const userExist = await (userService.userFind(userId));

        if (userExist) {
            const insertTopics = await (userService.inserTopics(req.body));
            if (insertTopics) {
                return res.json({ status: 200, message: 'Success' });
            } else {
                return res.json({ status: 500, message: 'Unable to add topics and subtopics' })
            }
        } else {
            return res.json({ status: 500, message: 'User does not exist' });
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured' })
    }
})

exports.eventsDetailsbyDate = async(function(req, res, next) {
    try {
        var eventId = req.body.EventId;
        const eventExist = await (userService.eventExist(eventId));
        if (eventExist) {
            return res.json({ status: 200, message: 'Success', result: eventExist })
        } else {
            return res.json({ status: 500, message: 'Event does not exist' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})


// users recommended users based on topics
exports.recommendedUsers = async(function(req, res, next) {
        try {
            var userId = req.body.userId;
            const checkUser = await (userService.checkUser(userId));
            if (checkUser) {
                const userbasedTopics = await (userService.userbasedTopics(checkUser.topics, userId));
                // console.log("topiv",checkUser.topics)
                if (userbasedTopics) {
                    const topicsMatch = await (checkMatches(userbasedTopics, checkUser.topics));
                    if (topicsMatch) {
                        const topicssort = await (countTopics(topicsMatch));
                        // console.log("topicssort:",topicssort.length);
                        if (topicssort) {
                            const followingUsers = await (userService.followedUsersData(userId));
                            if (followingUsers.length != 0) {
                                var followingUserdataId = followingUsers.map(function(followed) {
                                    return followed.following._id.toString();
                                });

                                var removedup = topicssort.filter(function(elem) {
                                    return followingUserdataId.indexOf(elem._id.toString()) == -1;
                                });

                                var resultFinalRecom = removedup.slice(0, 8);
                                // console.log("resultFinalRecom",resultFinalRecom.length)
                                if (removedup != 0) {
                                    return res.json({ status: 200, message: 'Success', result: resultFinalRecom, topics: checkUser.topics });
                                } else {
                                    const fetchAllUsers = await (userService.userFindall(userId))
                                    if (fetchAllUsers.length != 0) {
                                        const followingUsers = await (userService.followedUsersData(userId));
                                        if (followingUsers.length != 0) {
                                            var followingUserdataId = followingUsers.map(function(followed) {
                                                return followed.following._id.toString();
                                            });

                                            var removedup = fetchAllUsers.filter(function(elem) {
                                                return followingUserdataId.indexOf(elem._id.toString()) == -1;
                                            });

                                            var resultFinalRecom = removedup.slice(0, 8);
                                            // console.log("resultFinalRecom",resultFinalRecom.length)
                                            if (removedup != 0) {
                                                return res.json({ status: 200, message: 'Success', result: resultFinalRecom });
                                            } else {
                                                return res.json({ status: 200, message: 'No users recommended to user' })
                                            }
                                        } else {
                                            var resultFinalRecom = fetchAllUsers.slice(0, 8);
                                            return res.json({ status: 200, message: 'Success', result: resultFinalRecom });
                                        }
                                    } else {
                                        return res.json({ status: 400, message: 'Failure' })
                                    }
                                    // return res.json({status:200,message:'No users recommended to user'})
                                }
                            } else {
                                var resultFinalRecom = topicssort.slice(0, 8);
                                return res.json({ status: 200, message: 'Success', result: resultFinalRecom });
                            }
                        } else {
                            return res.json({ status: 500, message: 'Not able to sort topics' });
                        }
                    } else {
                        return res.json({ status: 500, message: 'Topics do not match' })
                    }
                } else {
                    const fetchAllUsers = await (userService.userFindall(userId))
                    if (fetchAllUsers.length != 0) {
                        const followingUsers = await (userService.followedUsersData(userId));
                        if (followingUsers.length != 0) {
                            var followingUserdataId = followingUsers.map(function(followed) {
                                return followed.following._id.toString();
                            });

                            var removedup = fetchAllUsers.filter(function(elem) {
                                return followingUserdataId.indexOf(elem._id.toString()) == -1;
                            });

                            var resultFinalRecom = removedup.slice(0, 8);
                            // console.log("resultFinalRecom",resultFinalRecom.length)
                            if (removedup != 0) {
                                return res.json({ status: 200, message: 'Success', result: resultFinalRecom });
                            } else {
                                const fetchAllUsers = await (userService.userFindall(userId))
                                if (fetchAllUsers.length != 0) {
                                    const followingUsers = await (userService.followedUsersData(userId));
                                    if (followingUsers.length != 0) {
                                        var followingUserdataId = followingUsers.map(function(followed) {
                                            return followed.following._id.toString();
                                        });

                                        var removedup = fetchAllUsers.filter(function(elem) {
                                            return followingUserdataId.indexOf(elem._id.toString()) == -1;
                                        });

                                        var resultFinalRecom = removedup.slice(0, 8);
                                        // console.log("resultFinalRecom",resultFinalRecom.length)
                                        if (removedup != 0) {
                                            return res.json({ status: 200, message: 'Success', result: resultFinalRecom });
                                        } else {
                                            return res.json({ status: 200, message: 'No users recommended to user' })
                                        }
                                    } else {
                                        var resultFinalRecom = fetchAllUsers.slice(0, 8);
                                        return res.json({ status: 200, message: 'Success', result: resultFinalRecom });
                                    }
                                } else {
                                    return res.json({ status: 400, message: 'Failure' })
                                }
                            }
                        } else {
                            var resultFinalRecom = fetchAllUsers.slice(0, 8);
                            return res.json({ status: 200, message: 'Success', result: resultFinalRecom });
                        }
                    } else {
                        return res.json({ status: 400, message: 'Failure' })
                    }
                }
            } else {
                return res.json({ status: 500, message: 'User does not exist' })
            }
        } catch (err) {
            // console.log("err",err)
            return res.json({ status: 500, message: 'Error occured', err: err })
        }
    })
    //end

// users recommendations based on topics
exports.allRecommendedUsers = async(function(req, res, next) {
        try {
            var userId = req.body.userId;
            const checkUser = await (userService.checkUser(userId));
            if (checkUser) {
                const userbasedTopics = await (userService.userbasedTopicsAll(checkUser.topics, userId));
                if (userbasedTopics) {
                    const topicsMatch = await (checkMatches(userbasedTopics, checkUser.topics));
                    if (topicsMatch) {
                        const topicssort = await (countTopics(topicsMatch));
                        if (topicssort) {
                            const followingUsers = await (userService.followedUsersData(userId));
                            if (followingUsers.length != 0) {
                                var followingUserdataId = followingUsers.map(function(followed) {
                                    return followed.following._id.toString();
                                });
                                var removedup = topicssort.filter(function(elem) {
                                    return followingUserdataId.indexOf(elem._id.toString()) == -1;
                                });
                                if (removedup != 0) {
                                    return res.json({ status: 200, message: 'Success', result: removedup });
                                } else {
                                    const fetchAllUsers = await (userService.userFindall(userId))
                                    if (fetchAllUsers.length != 0) {
                                        const followingUsers = await (userService.followedUsersData(userId));
                                        if (followingUsers.length != 0) {
                                            var followingUserdataId = followingUsers.map(function(followed) {
                                                return followed.following._id.toString();
                                            });

                                            var removedup = fetchAllUsers.filter(function(elem) {
                                                return followingUserdataId.indexOf(elem._id.toString()) == -1;
                                            });
                                            if (removedup != 0) {
                                                return res.json({ status: 200, message: 'Success', result: removedup });
                                            } else {
                                                return res.json({ status: 200, message: 'No users recommended to user' })
                                            }
                                        } else {
                                            return res.json({ status: 200, message: 'Success', result: fetchAllUsers });
                                        }
                                    } else {
                                        return res.json({ status: 400, message: 'Failure' })
                                    }
                                }
                            } else {
                                return res.json({ status: 200, message: 'Success', result: topicssort });
                            }
                        } else {
                            return res.json({ status: 500, message: 'Not able to sort topics' });
                        }
                    } else {
                        return res.json({ status: 500, message: 'Topics do not match' })
                    }
                } else {
                    const fetchAllUsers = await (userService.userFindall(userId))
                    if (fetchAllUsers.length != 0) {
                        const followingUsers = await (userService.followedUsersData(userId));
                        if (followingUsers.length != 0) {
                            var followingUserdataId = followingUsers.map(function(followed) {
                                return followed.following._id.toString();
                            });

                            var removedup = fetchAllUsers.filter(function(elem) {
                                return followingUserdataId.indexOf(elem._id.toString()) == -1;
                            });
                            if (removedup != 0) {
                                return res.json({ status: 200, message: 'Success', result: removedup });
                            } else {
                                return res.json({ status: 200, message: 'No users recommended to user' })
                            }
                        } else {
                            return res.json({ status: 200, message: 'Success', result: fetchAllUsers });
                        }
                    } else {
                        return res.json({ status: 400, message: 'Failure' })
                    }
                }
            } else {
                return res.json({ status: 500, message: 'User does not exist' })
            }
        } catch (err) {
            return res.json({ status: 500, message: 'Error occured', err: err })
        }
    })
    //end

//api for  user edit profile
exports.editProfile = function(req, res, next) {
        var imageUploaded = req.files.profileImg;
        var userId = req.body.userId;
        var mydate = req.body.dob;
        var Dob = new Date(mydate);
        if (imageUploaded != null || imageUploaded != undefined) {
            uploadFile.uploadToS3(req.files.profileImg)
                .then((resp) => {
                    urlImage = resp
                    var uploadpdfFile = urlImage;
                    User.find({ _id: userId })
                        .then((resp) => {
                            var firstname = req.body.firstname;
                            var lastname = req.body.lastname
                            var fullname = firstname + ' ' + lastname;
                            User.findOneAndUpdate({ _id: userId }, { $set: { firstname: req.body.firstname, profileImg: uploadpdfFile, lastname: req.body.lastname, location: req.body.location, role: req.body.role, organization: req.body.organization, designation: req.body.designation, industry: req.body.industry, university: req.body.university, degree: req.body.degree, other: req.body.other, email: req.body.email, dob: Dob } }, { new: true })
                                .then((resp) => {
                                    Notification.update({ sender: userId }, { $set: { message: fullname } })
                                        .then((updated) => {
                                            return res.json({ status: 200, message: "Updated successfully" });
                                        })
                                        .catch(err => {
                                            return res.json({ status: 500, message: "Error occured while updating user", err: err })
                                        })
                                })
                                .catch(err => {
                                    return res.json({ status: 500, message: "Error occured while updating user", err: err })
                                })
                        })
                        .catch(err => {
                            return res.json({ status: 500, Message: 'User does not exist' })
                        })
                })
                .catch(err => {
                    return res.json({ status: 500, message: "Error occured while uploading image" });
                })
        } else {
            User.find({ _id: userId })
                .then((resp) => {
                    var firstname = req.body.firstname;
                    var lastname = req.body.lastname
                    var fullname = firstname + ' ' + lastname;
                    User.findOneAndUpdate({ _id: userId }, { $set: { firstname: req.body.firstname, lastname: req.body.lastname, location: req.body.location, role: req.body.role, organization: req.body.organization, designation: req.body.designation, industry: req.body.industry, university: req.body.university, degree: req.body.degree, other: req.body.other, email: req.body.email, dob: Dob } }, { new: true })
                        .then((resp) => {
                            Notification.update({ sender: userId }, { $set: { message: fullname } })
                                .then((updated) => {
                                    return res.json({ status: 200, message: "Updated successfully" });
                                })
                                .catch(err => {
                                    return res.json({ status: 500, message: "Error occured while updating user", err: err })
                                })
                        })
                        .catch(err => {
                            return res.json({ status: 500, message: "Error occured while updating user", err: err })
                        })
                })
                .catch(err => {
                    return res.json({ status: 500, Message: 'User does not exist', err: err })
                })
        }
    }
    // end

//normal search
exports.search = async(function(req, res, next) {
        try {
            var resultsSearch = [];
            const searchTextUser = await (userService.searchTextUser(req.body));
            const searchfeeds = await (userService.searchFeeds(req.body))
            const searchQuestions = await (userService.searchQuestion(req.body))
            const searchPapers = await (userService.searchPaper(req.body));
            var searchResult = resultsSearch.concat({ users: searchTextUser }, { feeds: searchfeeds }, { question: searchQuestions }, { papers: searchPapers });
            if (searchResult.length != 0) {
                return res.json({ status: 200, message: 'Success', result: searchResult })
            } else {
                return res.json({ status: 500, message: 'Nothing to show' })
            }
        } catch (err) {
            return res.json({ status: 500, message: 'Error occured', err: err })
        }
    })
    // end

exports.recommendedFeedsUser = async(function(req, res, next) {
    try {
        var userId = req.body.userId;
        const feedsRecommended = await (userService.feedsRecommendedbyAdmired(userId));
        if (feedsRecommended) {
            return res.json({ status: 200, message: 'Success', result: feedsRecommended })
        } else {
            return res.json({ status: 500, message: 'No feeds to show', })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.recommendedPaperUser = async(function(req, res, next) {
    try {
        var userId = req.body.userId;
        const paperRecommended = await (userService.papersRecommended(userId));
        if (paperRecommended) {
            return res.json({ status: 200, message: 'Success', result: paperRecommended })
        } else {
            return res.json({ status: 500, message: 'No feeds to show', })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.recommendedQuestionUser = async(function(req, res, next) {
    try {
        var userId = req.body.userId;
        const questionsRecommended = await (userService.questionsRecommended(userId));
        if (questionsRecommended) {
            return res.json({ status: 200, message: 'Success', result: questionsRecommended })
        } else {
            return res.json({ status: 500, message: 'No feeds to show', })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.recommendedCount = async(function(req, res, next) {
    try {
        var feedsId = req.body.feedsId;
        const checkFeeds = await (userService.FeedExists(feedsId));
        if (checkFeeds) {
            const feedsRecommended = await (userService.feedsRecommendedCount(feedsId))
            if (feedsRecommended) {
                return res.json({ status: 200, message: 'Recommended users', result: feedsRecommended })
            } else {
                return res.json({ status: 500, message: 'This article is not yet recommended by anyone' })
            }
        } else {
            return res.json({ status: 500, message: 'Article does not exist' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err });
    }
})

exports.editTopics = async(function(req, res, next) {
    try {
        var userId = req.body.userId;
        const checkUserExists = await (userService.checkUser(userId))
        if (checkUserExists) {
            const removeTopics = await (userService.removetopic(checkUserExists.topics, userId))
            if (removeTopics) {
                const addTopics = await (userService.addTopic(req.body, userId))
                if (addTopics) {
                    res.json({ status: 200, message: 'Topics edited successfully' })
                    const matchedSubtopics = await (userService.matchedSubtopics(req.body, checkUserExists.subtopics))
                    if (matchedSubtopics.length != 0) {
                        const deleteSubtopics = await (userService.deleteallSubtopic(userId))
                        if (deleteSubtopics) {
                            const updateSubtopics = await (userService.updateSubtopics(userId, matchedSubtopics))
                            if (updateSubtopics) {
                                console.log("subtopics updated successfully")
                            } else {
                                console.log("unable to update subtopics")
                            }
                        } else {
                            console.log("unable to delete subtopics")
                        }
                    } else {
                        console.log("unable to delete subtopics")
                    }
                } else {
                    return res.json({ status: 500, message: 'Unable to add topics' })
                }
            } else {
                return res.json({ status: 500, message: 'Unable to remove topics' })
            }
        } else {
            return res.json({ status: 500, message: 'User does not exists' })
        }
    } catch (err) {
        // console.log("err",err)
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

//api for my recommended paper question feeds
exports.myrecommends = async(function(req, res, next) {
        try {
            var userId = req.body.profileuserId;
            var page = req.body.page;
            var pagesize = req.body.pagesize;
            var viewedRecommended = req.body.loggeduserId;
            const UserRecommendedAll = await (userService.allrecommendsUser(userId, page, pagesize))
            if (UserRecommendedAll.length != 0) {
                const checkUserrecommended = await (userService.userrecommends(viewedRecommended))
                var userrecommendedId = checkUserrecommended.map(function(recommededId) {
                    return ({ _id: recommededId.recommended });
                })
                if (userrecommendedId.length != 0) {
                    const matchRecommeded = await (matchrecommendedall(UserRecommendedAll, userrecommendedId))
                    const checkBookmarked = await (userService.bookmarks(userId));
                    if (checkBookmarked.length != 0) {
                        const mathbookmarkedData = await (matchbookmarkedall(matchRecommeded, checkBookmarked))
                        return res.json({ status: 200, message: 'Success', result: mathbookmarkedData })
                    } else {
                        return res.json({ status: 200, message: 'Success', result: matchRecommeded })
                    }
                } else {
                    const checkBookmarked = await (userService.bookmarks(userId));
                    if (checkBookmarked.length != 0) {
                        const mathbookmarkedData = await (matchbookmarkedall(UserRecommendedAll, checkBookmarked))
                        return res.json({ status: 200, message: 'Success', result: mathbookmarkedData })
                    } else {
                        return res.json({ status: 200, message: 'Success', result: UserRecommendedAll })
                    }
                }
            } else {
                return res.json({ status: 500, message: 'There are no user recommendation' })
            }
        } catch (err) {
            // console.log(err)
            return res.json({ status: 500, message: 'Error occured', err: err });
        }
    })
    // end

//user uploadiMage api
exports.uploadImage = function(req, res, next) {
        var imageUploaded = req.files.profileImg;
        var userId = req.body.userId;
        if (imageUploaded != null || imageUploaded != undefined) {
            uploadFile.uploadToS3(req.files.profileImg)
                .then((resp) => {
                    urlImage = resp
                    var uploadpdfFile = urlImage;
                    User.find({ _id: userId })
                        .then((resp) => {
                            User.update({ _id: userId }, { $set: { profileImg: uploadpdfFile } })
                                .then((resp) => {
                                    return res.json({ status: 200, message: "Updated successfully" });
                                })
                                .catch(err => {
                                    return res.json({ status: 500, message: "Error occured while updating user" })
                                })
                        })
                        .catch(err => {
                            return res.json({ status: 500, Message: 'User does not exist' })
                        })
                })
                .catch(err => {
                    return res.json({ status: 500, message: "Error occured while uploading image" });
                })
        } else {
            return res.json({ status: 500, message: 'Please upload image' })
        }
    }
    //sorting by topics for recommended user
function checkMatches(userbasedTopics, selectedtopics) {
    var lengthArray = userbasedTopics.length;
    for (var i = 0; i < lengthArray; i++) {
        var count = 0;
        for (var j = 0; j < userbasedTopics[i].topics.length; j++) {
            for (var k = 0; k < selectedtopics.length; k++) {
                if (String(userbasedTopics[i].topics[j]) == String(selectedtopics[k])) {
                    count = count + 1;
                    userbasedTopics[i].count = count;
                }
            }
        }
    }
    return userbasedTopics;
}

function countTopics(users) {
    var sorttopics = users.sort(function(a, b) {
        return b.count - a.count;
    });
    return sorttopics;
}

// api for all  
exports.all = function(req, res, next) {
        let userId = req.body.userId;
        var from = req.body.from;
        var size = req.body.size;
        var page = req.body.page;
        var topicsname = [];
        Async.series([
                function(callback) {
                    User.find({ _id: userId })
                        .populate('topics')
                        .exec(function(err, userfound) {
                            if (err) {
                                callback(err)
                            } else {
                                // console.log("userfound",userfound)
                                if (userfound.length > 0) {
                                    var topics = userfound.map(function(user) {
                                        user.topics.map(function(topix) {
                                            topicsname.push(topix.topic_name);
                                        })
                                    });
                                    // console.log("topics",topicsname)
                                    var userTopics = topicsname.map(v => v.toLowerCase());
                                    // console.log("topics:",userTopics);
                                    Feeds.esSearch({
                                            from: from,
                                            size: size,

                                            query: {
                                                "terms": {
                                                    "content": userTopics
                                                }
                                            },
                                            sort: { "createdAt": { "order": "desc" } }
                                        },
                                        function(err, found) {
                                            if (err) {
                                                callback(err)
                                            } else {
                                                var ResultsFinal = found.hits.hits;
                                                var finalResults = newsArticleSimplified(ResultsFinal);
                                                Recommend.find({ $and: [{ userId: userId }, { recommendType: 'feeds' }] })
                                                    .exec(function(err, recommendedfeeds) {
                                                        if (err) {
                                                            callback(err)
                                                        } else {
                                                            if (recommendedfeeds.length != 0) {
                                                                var feedsId = recommendedfeeds.map(function(feeds) {
                                                                    return ({ _id: feeds.recommended });
                                                                })
                                                                var matchfeeds = feedsRecommended(finalResults, feedsId);
                                                                Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "feeds" }] })
                                                                    .exec(function(err, bookmarkedfound) {
                                                                        if (err) {
                                                                            callback(err)
                                                                        } else {
                                                                            if (bookmarkedfound.length != 0) {
                                                                                var bookmarkedId = bookmarkedfound.map(function(feed) {
                                                                                    return ({ _id: feed.feedsId })
                                                                                })
                                                                                var matchbookmarks = feedsBookmarked(matchfeeds, bookmarkedId)
                                                                                callback(null, matchbookmarks)
                                                                            } else {
                                                                                callback(null, matchfeeds)
                                                                            }
                                                                        }
                                                                    })
                                                            } else {
                                                                Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "feeds" }] })
                                                                    .exec(function(err, bookmarkedfound) {
                                                                        if (err) {
                                                                            callback(err)
                                                                        } else {
                                                                            if (bookmarkedfound.length != 0) {
                                                                                var bookmarkedId = bookmarkedfound.map(function(feed) {
                                                                                    return ({ _id: feed.feedsId })
                                                                                })
                                                                                var matchbookmarks = feedsBookmarked(finalResults, bookmarkedId)
                                                                                callback(null, matchbookmarks)
                                                                            } else {
                                                                                callback(null, finalResults)
                                                                            }
                                                                        }
                                                                    })
                                                            }
                                                        }
                                                    })
                                            }
                                        })
                                } else {
                                    // console.log("usernotfound");
                                    callback(null)
                                }

                            }
                        })
                },
                function(callback) {
                    Follow.find({ userId: userId })
                        .exec(function(err, following) {
                            if (err) {
                                callback(err)
                            } else {
                                if (following.length > 0) {
                                    // console.log("results",results);
                                    var resultsIdFollowers = following.map(function(user) {
                                            return user.following
                                        })
                                        // console.log("resultsIdFollowers",resultsIdFollowers)
                                    var userTopicsName = topicsname.map(v => v.toLowerCase());
                                    if (from <= 0) {
                                        Paper.esSearch({

                                                query: {
                                                    bool: {
                                                        "must": {
                                                            "bool": { "should": [{ terms: { "userId._id": resultsIdFollowers } }, { terms: { "topics.topic_name": userTopicsName } }] }
                                                        }
                                                    }
                                                },
                                                sort: {
                                                    "createdAt": {
                                                        "order": "desc"
                                                    }
                                                }
                                            }, {
                                                from: from,
                                                size: size,
                                            },
                                            function(err, resultPapers) {
                                                if (err) {
                                                    callback(err)
                                                } else {
                                                    var resultFoundPapers = resultPapers.hits.hits;
                                                    var paperfound = newsArticleSimplified(resultFoundPapers);
                                                    // console.log("paperfoundasdhashdasguvjvvajsb",resultFoundPapers)
                                                    Recommend.find({ $and: [{ userId: userId }, { recommendType: 'paperupload' }] })
                                                        .exec(function(err, recommendedpapers) {
                                                            if (err) {
                                                                callback(err)
                                                            } else {
                                                                if (recommendedpapers.length != 0) {
                                                                    var paperId = recommendedpapers.map(function(papers) {
                                                                        return ({ _id: papers.recommended });
                                                                    })
                                                                    var matchpapers = papersRecommended(paperfound, paperId);
                                                                    Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "paper" }] })
                                                                        .exec(function(err, bookmarkedfound) {
                                                                            if (err) {
                                                                                callback(err)
                                                                            } else {
                                                                                if (bookmarkedfound.length != 0) {
                                                                                    var bookmarkedId = bookmarkedfound.map(function(paper) {
                                                                                        return ({ _id: paper.paperId })
                                                                                    })
                                                                                    var matchbookmarks = paperBookmarked(matchpapers, bookmarkedId)
                                                                                    callback(null, matchbookmarks)
                                                                                } else {
                                                                                    callback(null, matchpapers)
                                                                                }
                                                                            }
                                                                        })
                                                                } else {
                                                                    Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "paper" }] })
                                                                        .exec(function(err, bookmarkedfound) {
                                                                            if (err) {
                                                                                callback(err)
                                                                            } else {
                                                                                if (bookmarkedfound.length != 0) {
                                                                                    var bookmarkedId = bookmarkedfound.map(function(paper) {
                                                                                        return ({ _id: paper.paperId })
                                                                                    })
                                                                                    var matchbookmarks = paperBookmarked(paperfound, bookmarkedId)
                                                                                    callback(null, matchbookmarks)
                                                                                } else {
                                                                                    callback(null, paperfound)
                                                                                }
                                                                            }
                                                                        })
                                                                }
                                                            }
                                                        })
                                                }
                                            })
                                    } else {
                                        Paper.esSearch({

                                                query: {
                                                    bool: {
                                                        "must": {
                                                            "bool": { "should": [{ terms: { "userId._id": resultsIdFollowers } }, { terms: { "topics.topic_name": userTopicsName } }] }
                                                        }
                                                    }
                                                },
                                                sort: {
                                                    "createdAt": {
                                                        "order": "desc"
                                                    }
                                                }
                                            }, {
                                                from: ((from * size) + 1),
                                                size: size,
                                            },
                                            function(err, resultPapers) {
                                                if (err) {
                                                    callback(err)
                                                } else {
                                                    var resultFoundPapers = resultPapers.hits.hits;
                                                    var paperfound = newsArticleSimplified(resultFoundPapers);
                                                    // console.log("paperfoundasdhashdasguvjvvajsb",resultFoundPapers)
                                                    Recommend.find({ $and: [{ userId: userId }, { recommendType: 'paperupload' }] })
                                                        .exec(function(err, recommendedpapers) {
                                                            if (err) {
                                                                callback(err)
                                                            } else {
                                                                if (recommendedpapers.length != 0) {
                                                                    var paperId = recommendedpapers.map(function(papers) {
                                                                        return ({ _id: papers.recommended });
                                                                    })
                                                                    var matchpapers = papersRecommended(paperfound, paperId);
                                                                    Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "paper" }] })
                                                                        .exec(function(err, bookmarkedfound) {
                                                                            if (err) {
                                                                                callback(err)
                                                                            } else {
                                                                                if (bookmarkedfound.length != 0) {
                                                                                    var bookmarkedId = bookmarkedfound.map(function(paper) {
                                                                                        return ({ _id: paper.paperId })
                                                                                    })
                                                                                    var matchbookmarks = paperBookmarked(matchpapers, bookmarkedId)
                                                                                    callback(null, matchbookmarks)
                                                                                } else {
                                                                                    callback(null, matchpapers)
                                                                                }
                                                                            }
                                                                        })
                                                                } else {
                                                                    Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "paper" }] })
                                                                        .exec(function(err, bookmarkedfound) {
                                                                            if (err) {
                                                                                callback(err)
                                                                            } else {
                                                                                if (bookmarkedfound.length != 0) {
                                                                                    var bookmarkedId = bookmarkedfound.map(function(paper) {
                                                                                        return ({ _id: paper.paperId })
                                                                                    })
                                                                                    var matchbookmarks = paperBookmarked(paperfound, bookmarkedId)
                                                                                    callback(null, matchbookmarks)
                                                                                } else {
                                                                                    callback(null, paperfound)
                                                                                }
                                                                            }
                                                                        })
                                                                }
                                                            }
                                                        })
                                                }
                                            })
                                    }
                                } else {
                                    var userTopicsName = topicsname.map(v => v.toLowerCase());
                                    Paper.esSearch({
                                            from: from,
                                            size: size,
                                            query: {
                                                bool: {
                                                    "must": {
                                                        "bool": { "should": [{ terms: { "topics.topic_name": userTopicsName } }] }
                                                    }
                                                }
                                            },
                                            sort: {
                                                "createdAt": {
                                                    "order": "desc"
                                                }
                                            }
                                        },
                                        function(err, resultPapers) {
                                            if (err) {
                                                callback(err)
                                            } else {
                                                var resultFoundPapers = resultPapers.hits.hits;
                                                var paperfound = newsArticleSimplified(resultFoundPapers);
                                                Recommend.find({ $and: [{ userId: userId }, { recommendType: 'paperupload' }] })
                                                    .exec(function(err, recommendedpapers) {
                                                        if (err) {
                                                            callback(err)
                                                        } else {
                                                            if (recommendedpapers.length != 0) {
                                                                var paperId = recommendedpapers.map(function(papers) {
                                                                    return ({ _id: papers.recommended });
                                                                })
                                                                var matchpapers = papersRecommended(paperfound, paperId);
                                                                Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "paper" }] })
                                                                    .exec(function(err, bookmarkedfound) {
                                                                        if (err) {
                                                                            callback(err)
                                                                        } else {
                                                                            if (bookmarkedfound.length != 0) {
                                                                                var bookmarkedId = bookmarkedfound.map(function(paper) {
                                                                                    return ({ _id: paper.paperId })
                                                                                })
                                                                                var matchbookmarks = paperBookmarked(matchpapers, bookmarkedId)
                                                                                callback(null, matchbookmarks)
                                                                            } else {
                                                                                callback(null, matchpapers)
                                                                            }
                                                                        }
                                                                    })
                                                            } else {
                                                                Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "paper" }] })
                                                                    .exec(function(err, bookmarkedfound) {
                                                                        if (err) {
                                                                            callback(err)
                                                                        } else {
                                                                            if (bookmarkedfound.length != 0) {
                                                                                var bookmarkedId = bookmarkedfound.map(function(paper) {
                                                                                    return ({ _id: paper.paperId })
                                                                                })
                                                                                var matchbookmarks = paperBookmarked(paperfound, bookmarkedId)
                                                                                callback(null, matchbookmarks)
                                                                            } else {
                                                                                callback(null, paperfound)
                                                                            }
                                                                        }
                                                                    })
                                                            }
                                                        }
                                                    })
                                            }
                                        })
                                }
                            }
                        })
                },
                function(callback) {
                    Follow.find({ userId: userId })
                        .exec(function(err, results) {
                            if (err) {
                                callback(err)
                            } else {
                                if (results.length > 0) {
                                    var resultsId = results.map(function(user) {
                                        return user.following
                                    })
                                    Question.find({ userId: { $in: resultsId } })
                                        .sort({ createdAt: -1 })
                                        .skip(page * size)
                                        .limit(size)
                                        .populate('userId', '_id firstname lastname profileImg designation role organization')
                                        .populate('recommended', 'profileImg')
                                        .populate({ path: 'answer', populate: { path: 'userId', select: '_id firstname lastname designation dob profileImg role organization' } })
                                        .exec(function(err, questionfound) {
                                            if (err) {
                                                callback(err)
                                            } else {
                                                // console.log("questionfound",questionfound)
                                                Recommend.find({ $and: [{ userId: userId }, { recommendType: 'questions' }] })
                                                    .exec(function(err, questionrecom) {
                                                        if (err) {
                                                            callback(err)
                                                        } else {
                                                            // console.log("questrecom",questionrecom)
                                                            if (questionrecom.length != 0) {
                                                                var questionId = questionrecom.map(function(question) {
                                                                    return question.recommended
                                                                })
                                                                var matchQuestion = questionRecommended(questionfound, questionId)
                                                                callback(null, matchQuestion)
                                                            } else {
                                                                callback(null, questionfound)
                                                            }
                                                        }
                                                    })
                                            }
                                        })

                                } else {
                                    // console.log("no followers");
                                    callback(null, [])
                                }
                            }
                        })
                }
            ],
            function(err, result) {
                if (err) {
                    res.send({ status: 400, err: err });
                } else {
                    var flattened = result.reduce((accumulator, currentValue) => accumulator.concat(currentValue), []);
                    var dateSortedresults = sortResultsBydate(flattened);
                    res.send({ status: 200, message: 'Success', result: dateSortedresults });
                }
            })
    }
    // end all


exports.addmaindiscpline = async(function(req, res, next) {
    try {
        const addDiscpline = await (userService.addMaindiscpline(req.body))
        if (addDiscpline) {
            return res.json({ status: 200, message: 'Added successfully' })
        } else {
            return res.json({ status: 500, message: 'Unable to add main discpline' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.updateTopics = async(function(req, res, next) {
    try {
        var disciplineId = req.body.disciplineId;
        const updatediscipline = await (topicService.updateTopics(disciplineId));
        if (updatediscipline) {
            return res.json({ status: 200, message: 'Success' });
        } else {
            return res.json({ status: 500, message: 'Failure' });
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Failure' });
    }
})

exports.fetchDiscplines = async(function(req, res, next) {
    try {
        const fetchdiscpline = await (userService.fetchallDiscpline())
        if (fetchdiscpline) {
            return res.json({ status: 200, message: 'Success', result: fetchdiscpline })
        } else {
            return res.json({ status: 500, message: 'No main discpline to show' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.mapDiscpline = async(function(req, res, next) {
    try {
        var discplineId = req.body.discplineId;
        var userId = req.body.userId;
        if (typeof discplineId != 'undefined' && discplineId !== '') {
            const checkDiscplineIdalreadyexist = await (userService.checkDiscplineIdalreadyexist(discplineId, userId))
            if (checkDiscplineIdalreadyexist) {
                const removeExisting = await (userService.removemainDiscpline(userId))
                if (removeExisting) {
                    const addDiscplineUser = await (userService.adduserDiscpline(discplineId, userId))
                    if (addDiscplineUser) {
                        return res.json({ status: 200, message: 'Successfully added main discpline' })
                    } else {
                        return res.json({ status: 500, message: 'Error occured while selecting main discpline' })
                    }
                } else {
                    return res.json({ status: 400, message: 'Error occured while deleting existing main discpline' })
                }
            } else {
                const addDiscplineUser = await (userService.adduserDiscpline(discplineId, userId))
                if (addDiscplineUser) {
                    return res.json({ status: 200, message: 'Successfully added main discpline' })
                } else {
                    return res.json({ status: 500, message: 'Error occured while selecting main discpline' })
                }
            }
        } else {
            return res.json({ status: 500, message: 'Please select a Discpline' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.addDesignation = async(function(req, res, next) {
    try {
        const designation = await (topicService.addingDesignation(req.body))
        if (designation) {
            return res.json({ status: 200, message: 'Success' })
        } else {
            return res.json({ status: 500, message: 'Error occured while adding desgination' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.fetchDesgination = async(function(req, res, next) {
    try {
        const fetchdesignation = await (topicService.allDesignations())
        if (fetchdesignation) {
            return res.json({ status: 200, message: 'Success', result: fetchdesignation })
        } else {
            return res.json({ status: 500, message: 'Error occured while adding desgination' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

// exports.addOrganization=async(function(req,res,next){
// 	try{
// 		const oranizations = await(topicService.addingOrganization(req.body))
// 		if(oranizations){
// 			return res.json({status:200,message:'Success'})
// 		}
// 		else{
// 			return res.json({status:500,message:'Error occured while adding desgination'})
// 		}
// 	}
// 	catch(err){
// 		return res.json({status:500,message:'Error occured',err:err})
// 	}
// })

exports.fetchOrgnizations = async(function(req, res, next) {
    try {
        const fetchOrgnization = await (topicService.allOrganization())
        if (fetchOrgnization) {
            return res.json({ status: 200, message: 'Success', result: fetchOrgnization })
        } else {
            return res.json({ status: 500, message: 'Error occured while adding desgination' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.userDetails = async(function(req, res, next) {
    try {
        var userId = req.body.userId;
        const fetchUserDetails = await (userService.userChecking(userId))
        if (fetchUserDetails.length != 0) {
            return res.json({ status: 200, message: 'Success', result: fetchUserDetails })
        } else {
            return res.json({ status: 500, message: 'User does not exist' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

function getRandomCode(length, characters = '0123456789') {
    var rtn = '';
    for (var i = 0; i < length; i++) {
        rtn += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return rtn;
}

function newsArticleSimplified(feeds) {
    var newfeeds = feeds.map(function(item) {
        var obj = item._source;
        for (var o in item) {
            if (o != "_source") obj[o] = item[o];
        }
        return obj;
    })
    return newfeeds;
}

function feedsRecommended(resultsfeeds, feedsId) {
    feedsId.forEach((item) => {
        var array1Obj = resultsfeeds.find(({ _id }) => ObjectID(item._id).equals(ObjectID(_id)));;
        if (array1Obj) {
            array1Obj.isrecommended = true;
        }
    })
    return resultsfeeds;
}

function feedsBookmarked(resultFeeds, feedsId) {
    feedsId.forEach((item) => {
        var array1Obj = resultFeeds.find(({ _id }) => ObjectID(item._id).equals(ObjectID(_id)));;
        if (array1Obj) {
            array1Obj.isbookmarked = true;
        }
    })
    return resultFeeds;
}

function papersRecommended(resultpapers, paperId) {
    paperId.forEach((item) => {
        var array1Obj = resultpapers.find(({ _id }) => ObjectID(item._id).equals(ObjectID(_id)));;
        if (array1Obj) {
            array1Obj.isrecommended = true;
        }
    })
    return resultpapers;
}

function paperBookmarked(resultpapers, paperId) {
    paperId.forEach((item) => {
        var array1Obj = resultpapers.find(({ _id }) => ObjectID(item._id).equals(ObjectID(_id)));;
        if (array1Obj) {
            array1Obj.isbookmarked = true;
        }
    })
    return resultpapers;
}

function questionRecommended(resultquestion, questionId) {
    questionId.forEach((item) => {
        var array1Obj = resultquestion.find(({ _id }) => ObjectID(item._id).equals(ObjectID(_id)));;
        if (array1Obj) {
            array1Obj.isrecommended = true;
        }
    })
    return resultquestion;
}

function sortResultsBydate(result) {
    var sortedResult = result.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return sortedResult;
}

function matchrecommendedall(resultall, allrecommeded) {
    allrecommeded.forEach((item) => {
        var matchedobj = resultall.find(({ recommended }) => ObjectID(item._id).equals(ObjectID(recommended._id)));
        if (matchedobj) {
            // console.log("my",matchedobj._id.isrecommended)
            matchedobj.recommended.isrecommended = true;
        }
    })
    return resultall;
}

function matchbookmarkedall(resultall, allrecommeded) {
    allrecommeded.forEach((item) => {
        var matchedobj = resultall.find(({ recommended }) => ObjectID(item._id).equals(ObjectID(recommended._id)));
        if (matchedobj) {
            // console.log("my",matchedobj._id.isrecommended)
            matchedobj.recommended.isbookmarked = true;
        }
    })
    return resultall;
}


function matchFollowinginusers(users, followedId) {
    followedId.forEach((item) => {
        var matchedobj = users.find(({ _id }) => ObjectID(item._id).equals(ObjectID(_id)));
        if (matchedobj) {
            matchedobj.isfollowed = true;
        }
    })
    return users;
}


//delete user in all tables 
exports.deleteUserinAll = async(function(req, res, next) {
        try {
            var userId = req.body.userId;
            const checkUserExist = await (userService.userPresent(userId))
            if (checkUserExist) {
                const removeUserInpaperViews = await (userService.removeviewsPapers(userId))
                if (removeUserInpaperViews) {
                    const removeUserInpaperDownload = await (userService.removedownloadsPapers(userId))
                    if (removeUserInpaperDownload) {
                        const removeUserInquestionviews = await (userService.removeQuestionViews(userId))
                        if (removeUserInquestionviews) {
                            const removeUserFeedsView = await (userService.removeFeedsView(userId))
                            if (removeUserFeedsView) {
                                const removeUserInNotificationsender = await (userService.removeUsernotificationSender(userId))
                                if (removeUserInNotificationsender) {
                                    const removeUserInnotificationReciever = await (userService.removeUsernotificationReciever(userId))
                                    if (removeUserInnotificationReciever) {
                                        const removeUserInanswer = await (userService.removeUserAnswer(userId))
                                        if (removeUserInanswer) {
                                            const removeUserBookmarks = await (userService.removeuserbookmarks(userId))
                                            if (removeUserBookmarks) {
                                                const removeUserrecommended = await (userService.removeUserRecommend(userId))
                                                if (removeUserrecommended) {
                                                    const removeUserAdmired = await (userService.removeUserAdmired(userId))
                                                    if (removeUserAdmired) {
                                                        const removeUserAdmiring = await (userService.removeUserAdmiring(userId))
                                                        if (removeUserAdmiring) {
                                                            const removeUserInGraph = await (userService.removeUserGraph(checkUserExist.graph))
                                                            if (removeUserInGraph) {
                                                                const removeUser = await (userService.removeUserInUser(userId))
                                                                if (removeUser) {
                                                                    return res.json({ status: 200, message: 'success' })
                                                                } else {
                                                                    return res.json({ status: 400, message: 'Failure' })
                                                                }
                                                            } else {
                                                                console.log("Error occured while deleting user Graph")
                                                            }
                                                        } else {
                                                            console.log("Error occured while deleting user admiring")
                                                        }
                                                    } else {
                                                        console.log("Error occured while deleting user admired")
                                                    }
                                                } else {
                                                    console.log("Error occured while deleting user recommended")
                                                }
                                            } else {
                                                console.log("Error occured while deleting user bookmarks")
                                            }
                                        } else {
                                            console.log("error occured while deleting user answer")
                                        }
                                    } else {
                                        console.log("error occured while deleting user reciever id")
                                    }
                                } else {
                                    console.log("error occured while deleting sender notification id")
                                }
                            } else {
                                console.log("error occured while deleting feeds views")
                            }
                        } else {
                            console.log("error occured while deleting question views")
                        }
                    } else {
                        console.log("error occured while deleting paper downloads")
                    }
                } else {
                    console.log("error occured while deleting paper views")
                }
            } else {
                return res.json({ status: 500, message: 'User does not exist' })
            }
        } catch (err) {
            console.log("err", err)
            return res.json({ status: 500, message: 'Error occured' })
        }
    })
    // end
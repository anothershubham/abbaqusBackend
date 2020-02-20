const Blogs = require('../models/blogs');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const blogsService = require('../services/blogsService');


exports.setBlog = async(function(req, res, next) {
    const createBlog = await (blogsService.setBlog(req.body));
    if (createBlog.length != 0) {
        res.json({ status: 200, message: "Blog created successfully" });
    } else {
        res.send({ status: 500, message: "Failure" })
    }
});


exports.allBlogs = async(function(req, res, next) {
    const fetchBlogs = await (blogsService.fetchAllBlogs());
    if (fetchBlogs.length != 0) {
        res.json({ status: 200, message: "Success", result: fetchBlogs });
    } else {
        res.json({ status: 500, message: "Failure" });
    }
})


exports.updateBlogs = async(function(req, res, next) {
    const { blogId } = req.body;
    console.log(req.body);
    try {
        const blogExistings = await (blogsService.blogExist(blogId));
        if (blogExistings) {
            const updateBlogs = await (blogsService.updateBlogs(req.body));
            if (updateBlogs) {
                res.json({ status: 200, message: "Success" });
            } else {
                res.json({ status: 500, message: "Failure" });
            }
        } else {
            res.json({ status: 500, message: "Blog does not Exist" });
        }

    } catch (error) {
        return res.send(error);
    }
})

exports.deleteBlogs = async(function(req, res, next) {
    const { blogId } = req.body;
    try {
        const checkBlogexist = await (blogsService.blogExist(blogId));
        if (checkBlogexist) {
            const deleteBlog = await (blogsService.blogDelete(blogId));
            if (deleteBlog) {
                res.json({ status: 200, message: "Success" });
            } else {
                res.json({ status: 500, message: "Failure" });
            }
        } else {
            res.json({ status: 500, message: "Blog does not exist" });
        }

    } catch (error) {
        return res.send(error);
    }
})
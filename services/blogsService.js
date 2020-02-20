const Blogs = require('../models/blogs');


exports.setBlog = function(body) {
    const { blogTitle, blogContent } = body;
    const createBlogs = new Blogs;
    createBlogs.blogTitle = blogTitle;
    createBlogs.blogContent = blogContent;
    createBlogs.save();
    return createBlogs;
}

exports.fetchAllBlogs = function() {
    return Blogs.find({}).sort({ createdAt: -1 });
}

exports.updateBlogs = function(updateData) {
    console.log(updateData, "update");
    return Blogs.findOneAndUpdate({ _id: updateData.blogId }, {
        $set: {
            blogTitle: updateData.blogTitle,
            blogContent: updateData.blogContent
        }
    });
}

exports.blogExist = function(blogId) {
    return Blogs.findOne({ _id: blogId });
}

exports.blogDelete = function(blogId) {
    return Blogs.remove({ _id: blogId });
}
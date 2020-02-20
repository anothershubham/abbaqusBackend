module.exports=function(app)
{

	require('./user')(app)
	require('./main')(app)
	require('./feeds')(app)
	require('./subtopic')(app)
	require('./designation')(app)
	require('./paperUpload')(app)
	require('./bookmark')(app)
	require('./questionUpload')(app)
	require('./follow')(app)
	require('./answer')(app)
	require('./feedSource')(app)
	require('./citation')(app)
	require('./viewsdownloads')(app)
	require('./admin')(app)

}
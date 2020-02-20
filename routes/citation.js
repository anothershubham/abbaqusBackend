const express     = require('express');
const app         = express();
const router = express.Router();

const citationController = require('../controllers/citationController');

router.get('/getCitation', citationController.getCitation);
router.post('/updateGraphData', citationController.updateGraphData);
router.get('/userGraphData/:id', citationController.userGraphData);
router.post('/graphDataCron', citationController.graphDataCron);
router.get('/getGraphDataById/:id', citationController.getGraphDataById);
router.get('/nullGraphData', citationController.nullGraphData);
//router.get('/deleteFun', citationController.deleteFun);
router.post('/deletesnapshot',citationController.deleteall)
// router.post('/graphCalculate',citationController.graphCaluateCron)
router.post('/publicationImapact',citationController.impactPublication)
router.post('/viewsDownloadUpdate',citationController.viewsDownloadUpdate)
router.post('/topCitations',citationController.topCitationPapers)
router.post('/citationsUpdate',citationController.citationUpdateCron)
router.post('/topFiveCitation',citationController.fetchTopCitedPaper)
module.exports = router; 
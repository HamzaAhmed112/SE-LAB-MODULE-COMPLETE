const express = require('express')
const router = express.Router()
const app = express()
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies


//controller  functions
const {
    enterPrescription,
    viewTests,
    viewInvoice,
   inprogressssample,
   prescriptiondetail,
   totalcostbyid,
   insertinvoice
} = require("../controllers/lab")


//routes 
router.route('/').get(enterPrescription)
router.route('/prescriptions/view').get(viewTests)
router.route('/invoices/view').get(viewInvoice)

//backened route 
router.route('/inprogressample').get(inprogressssample)
router.route('/prescription/:id').get(prescriptiondetail)
router.route('/cost/:id').get(totalcostbyid)
router.route('/invoice/:amount/:prescriptionid/:collectiontime').post(insertinvoice)




//app.listen(3000)
module.exports = router
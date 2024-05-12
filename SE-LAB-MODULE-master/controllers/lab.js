const path = require('path')
const executeQuery = require('../functions/executeQuery')
const sql = require('mssql');

const enterPrescription = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'Prescription_login.html'));
}

const viewTests = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'View_tests.html'));
}

const viewInvoice = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'Invoice.html'));
}



const totalcostbyid= async (req, res) => {
    const _id = req.params.id
    const query = "SELECT dbo.GetTotalTestCost" + "(" + _id + ") AS TotalCost;"

    try {
        executeQuery(query)
            .then(rows => {

                res.send(rows)

            })
            .catch(error => {
                // Handle any errors
                console.error('Error executing query:', error);
                res.send(error).status(400)
            });
    }
    catch (e) {
        res.send(e).status(500)
    }
};



const insertinvoice = async (req, res) => {

    const query = "DECLARE @InsertedTestID INT; "+
    "EXEC  InsertInvoiceAndTestOrder " + req.params.amount + ","+ req.params.prescriptionid +"," +req.params.collectiontime+","+"@InsertedTestID OUTPUT;"
    +"SELECT 'Test ID:', @InsertedTestID AS TestID;";
    console.log(query)
    try {
        executeQuery(query)
            .then(rows => {


                res.send(rows)
                console.log(rows)

               // to redirect to html page after success 
               // res.redirect('/html')

            })
            .catch(error => {

                console.error('Error executing query:', error);
                res.send(error).status(400)
            });
    }
    catch (e) {
        res.send(e).status(500)
    }
};


const prescriptiondetail= async (req, res) => {
    const _id = req.params.id;
    const query = "SELECT * FROM GetPrescriptionDetails(" + _id + ");";
    console.log(query);
    
    try {
        executeQuery(query)
            .then(rows => {
                // Initialize an empty object to store grouped data
                const groupedData = {};
                
                // Iterate through the rows
                rows.forEach(row => {
                    const key = `${row.PatientName}-${row.PrescriptionDate}-${row.DoctorName}`;
                    
                    // If the key doesn't exist in groupedData, create it
                    if (!groupedData[key]) {
                        groupedData[key] = {
                            PatientName: row.PatientName,
                            PrescriptionDate: row.PrescriptionDate,
                            DoctorName: row.DoctorName,
                            Tests: [] // Array to store tests
                        };
                    }
                    
                    // Add test details to the Tests array
                    groupedData[key].Tests.push({
                        TestName: row.TestName,
                        TestCost: row.TestCost
                    });
                });

                // Convert groupedData object into an array of values
                const result = Object.values(groupedData);

                res.send(result);
            })
            .catch(error => {
                console.error('Error executing query:', error);
                res.send(error).status(400);
            });
    } catch (e) {
        console.error('Error:', e);
        res.send(e).status(500);
    }
};



 const inprogressssample = async (req, res) => {
  
    const query = "SELECT SampleID, Testname FROM dbo.GetSamplesInProgress();";
    console.log(query);
    
    try {
        executeQuery(query)
            .then(rows => {
                res.send(rows).status(200)
               
           
            })
            .catch(error => {
                console.error('Error executing query:', error);
                res.send(error).status(400);
            });
    } catch (e) {
        console.error('Error:', e);
        res.send(e).status(500);
    }
};









module.exports = {
    enterPrescription,
    viewTests,
    viewInvoice,
    inprogressssample,
    prescriptiondetail,
    totalcostbyid,
    insertinvoice
 
}
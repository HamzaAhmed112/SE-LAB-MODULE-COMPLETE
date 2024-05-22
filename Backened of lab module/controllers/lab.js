const path = require('path')
const executeQuery = require('../functions/executeQuery')
const sql = require('mssql');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
console.log(process.env.API_KEY)

// async function run() {
//   // For text-only input, use the gemini-pro model
//   const model = genAI.getGenerativeModel({ model: "gemini-pro"});

//   const prompt = "urine glouses test value 5 write in very short what is it good or bad if it bad write very short what precaution should I use to get rid of it"

//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   const text = response.text();
//   console.log(text);
// }

// run();










const enterPrescription = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'Prescription_login.html'));
}

const viewTests = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'View_tests.html'));
}

const viewInvoice = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'Invoice.html'));
}





const totalcostbyid = async (req, res) => {
    const _id = req.params.id
    const query = "SELECT dbo.GetTotalTestCost" + "(" + _id + ") AS TotalCost;"

    try {
        executeQuery(query)
            .then(rows => {
                console.log(rows[0].TotalCost)
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



const formatDate = (date) => {
    const pad = (number, length = 2) => {
        return number.toString().padStart(length, '0');
    };

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds(), 3);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};




const insertinvoice = async (req, res) => {
    const prescriptionId = req.params.id;
    const now = new Date();
    const collectionTime = formatDate(now);

    try {
        // First, check if the prescription is present
        const checkPrescriptionPresenceQuery = `
            SELECT *
            FROM dbo.CheckPrescriptionPresence(${prescriptionId});
        `;

        const prescriptionStatusRows = await executeQuery(checkPrescriptionPresenceQuery);

        if (prescriptionStatusRows[0].PrescriptionStatus === 'Not Found') {
            res.status(400).send('Prescription not found.');
            return;
        }

        // Check if the invoice is already generated
        const checkInvoiceStatusQuery = `
            SELECT *
            FROM dbo.CheckInvoiceStatus(${prescriptionId});
        `;

        const invoiceStatusRows = await executeQuery(checkInvoiceStatusQuery);

        if (invoiceStatusRows[0].InvoiceStatus === 'Found') {
            res.status(400).send('Invoice is already generated.');
            return;
        }

        // If not found, proceed to get the total cost and insert the invoice
        const totalCostQuery = `SELECT dbo.GetTotalTestCost(${prescriptionId}) AS TotalCost;`;
        const totalCostRows = await executeQuery(totalCostQuery);

        const amount = totalCostRows[0].TotalCost;
        console.log(totalCostRows[0].TotalCost);
        console.log(totalCostRows);

        const insertInvoiceQuery = `
            DECLARE @InsertedTestID INT;
            EXEC InsertInvoiceAndTestOrder ${amount}, ${prescriptionId}, '${collectionTime}', @InsertedTestID OUTPUT;
            SELECT 'Test ID:', @InsertedTestID AS TestID;
        `;

        console.log(insertInvoiceQuery);

        const insertInvoiceRows = await executeQuery(insertInvoiceQuery);

        res.status(200).send(insertInvoiceRows);
        console.log(insertInvoiceRows);

        // Optionally redirect to an HTML page after success
        // res.redirect('/html');
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send(error);
    }
};




const prescriptiondetail = async (req, res) => {
    const _id = req.params.id;
    const query = `SELECT * FROM GetPrescriptionDetails(${_id});`;
    console.log(query);

    try {
        const rows = await executeQuery(query);

        if (rows.length === 0 || (rows[0].PatientName && rows[0].PatientName === 'No ID found')) {
            console.log('No data found for the provided ID');
            res.status(404).send('No data found for the provided ID');
        } else {
            // Initialize an empty object to store grouped data
            const groupedData = {};

            // Iterate through the rows
            rows.forEach(row => {
                const key = `${row.PatientName}-${row.PrescriptionDate}-${row.DoctorName}-${row.PrescriptionID}`;

                // If the key doesn't exist in groupedData, create it
                if (!groupedData[key]) {
                    groupedData[key] = {
                        PatientName: row.PatientName,
                        PrescriptionDate: row.PrescriptionDate,
                        DoctorName: row.DoctorName,
                        PrescriptionID: row.PrescriptionID,
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

            res.status(200).send(result);
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Internal Server Error');
    }
};




const inprogressssample = async (req, res) => {

    const query = "SELECT * FROM dbo.GetSamplesInProgress();";
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



const inpendingsample = async (req, res) => {

    const query = "SELECT * FROM dbo.GetSamplesInPending();";
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




const incompeleteresult = async (req, res) => {

    const query = "SELECT * FROM dbo.GetNullFieldResults();";
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



const TestFieldsBySampleIDAndTestName = async (req, res) => {
    const query = "SELECT * FROM dbo.GetTestFieldsBySampleIDAndTestName(" + req.params.sampleid + "," + req.params.testname + ");";
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
}



const inserttestresult = async (req, res) => {
    try {
        // Log the received body
        console.log('Received body:', req.body);

        // Parse the object array from request body
        const objects = req.body;

        // Check if objects is an array
        if (!Array.isArray(objects)) {
            throw new Error("Invalid input: expected an array of objects");
        }

        // Function to execute the query
        const executeUpdateQuery = async (sampleid, fieldid, value, testname) => {
            const query = `EXEC UpdateLabResultWithTimestamp @SampleID=${sampleid}, @FieldID=${fieldid}, @NewValue=${value},@TestName='${testname}';`;
            console.log(query);
            return executeQuery(query);
        };

        // Loop through the objects and execute the queries
        const results = [];
        for (const obj of objects) {
            const { sampleid, fieldid, value, testname } = obj;
            if (sampleid && fieldid && value && testname) {
                try {
                    const result = await executeUpdateQuery(sampleid, fieldid, value, testname);
                    results.push(result);
                    console.log(result);
                } catch (error) {
                    console.error('Error executing query for:', obj, error);
                    results.push({ error: `Error for sampleid: ${sampleid}, fieldid: ${fieldid}, value: ${value},testname:${testname}` });
                }
            } else {
                console.error('Invalid object:', obj);
                results.push({ error: 'Invalid object', object: obj });
            }
        }

        // Send the aggregated results back to the client
        res.send(results);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Server error', details: error.message });
    }
};




const inprogressssamplebuttton = async (req, res) => {

    const query = "EXEC UpdateTestStatusToInProgress @SampleID = " + req.params.sampleid + ",@Testname=" + req.params.testname + ";";
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

const generatereportandai = async (req, res) => {

    const checkbox = req.params.checkbox

    const patientDoctorPrescriptionQuery = `SELECT * FROM GetPatientDoctorPrescription(${req.params.sampleid})`// Replace with your actual database connection module
    console.log(patientDoctorPrescriptionQuery)
    const sampleid = req.params.sampleid
    const testname = req.params.testname

    try {

        executeQuery(patientDoctorPrescriptionQuery)
            .then(async (pdpRows) => {
                // Process patient, doctor, and prescription details here
                const patientDoctorPrescriptionData = pdpRows;
                if (checkbox == 0) {
                    const query = "SELECT * FROM dbo.GetLabResults(" + req.params.sampleid + "," + req.params.testname + ");";
                    console.log(query);

                    try {

                        executeQuery(query)
                            .then(rows => {
                                // Group data by SampleID and TestName
                                const groupedData = rows.reduce((acc, row) => {
                                    const { SampleID, TestName, FieldName, NormalRange, FieldResult } = row;

                                    const key = `${SampleID}-${TestName}`;
                                    if (!acc[key]) {
                                        acc[key] = {
                                            SampleID,
                                            TestName,
                                            fields: []
                                        };
                                    }

                                    acc[key].fields.push({ FieldName, NormalRange, FieldResult });
                                    return acc;
                                }, {});

                                // Convert the grouped data object to an array
                                const response = Object.values(groupedData);

                                // Combine patientDoctorPrescriptionData and labResultsData
                                const combinedData = {
                                    patientDoctorPrescriptionData,
                                    labResultsData: response,
                                };


                                res.status(200).send(combinedData);
                            })
                            .catch(error => {
                                console.error('Error executing query:', error);
                                res.status(400).send(error);
                            });
                    } catch (e) {
                        console.error('Error:', e);
                        res.status(500).send(e);
                    }


                }
                else if (checkbox == 1) {
                    const query = `SELECT * FROM dbo.GetLabResults(${req.params.sampleid}, ${req.params.testname});`;
                    console.log(query);

                    try {
                        executeQuery(query)
                            .then(async rows => {
                                // Group data by SampleID and TestName
                                const groupedData = rows.reduce((acc, row) => {
                                    const { SampleID, TestName, FieldName, NormalRange, FieldResult } = row;

                                    const key = `${SampleID}-${TestName}`;
                                    if (!acc[key]) {
                                        acc[key] = {
                                            SampleID,
                                            TestName,
                                            fields: []
                                        };
                                    }

                                    acc[key].fields.push({ FieldName, NormalRange, FieldResult });
                                    return acc;
                                }, {});
                                const response = Object.values(groupedData);
                                // Convert the grouped data object to an array
                                const responseArray = Object.values(groupedData);

                                // Generate a single prompt using the grouped data
                                const allFieldsText = responseArray.map(item => {
                                    const { TestName, fields } = item;
                                    const fieldsText = fields.map(field => `${field.FieldName} value ${field.FieldResult}`).join(', ');
                                    return `${TestName}: ${fieldsText}`;
                                }).join('; ');


                                //   // Generate prompt using the grouped data
                                //   const prompts = responseArray.map(item => {
                                //       const { TestName, fields } = item;
                                //       const fieldsText = fields.map(field => `${field.FieldName} value ${field.FieldResult}`).join(', ');
                                //       return `the ${TestName} and ${fieldsText} what is it good or bad if it bad write very short what precaution should I use to get rid of it`;
                                //   });
                                const prompt = `The following are the test results: ${allFieldsText}. Please indicate if the results are good or bad. If any results are bad, provide a very short precaution to mitigate the issue. Don't break lines, responde in one paragraph of around 60 words`;


                                // Call the generative AI model for each prompt
                                const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                                console.log(prompt)
                                try {
                                    const result = await model.generateContent(prompt);
                                    const aiResponse = await result.response.text(); // Assuming the response is directly available in result.response.text
                                    console.log(aiResponse)
                                    const combinedData = {
                                        patientDoctorPrescriptionData,
                                        labResultsData: response,
                                    };

                                    // Send the results back
                                    res.status(200).send({
                                        combinedData,
                                        aiResponses: aiResponse,
                                    });
                                } catch (error) {
                                    console.error('Error generating AI content:', error);
                                    res.status(500).send(error); // Assuming appropriate error handling for 500 status
                                }
                            })

                            .catch(error => {
                                console.error('Error executing query:', error);
                                res.status(400).send(error);
                            });
                    } catch (e) {
                        console.error('Error:', e);
                        res.status(500).send(e);
                    }


                }
                else {
                    console.log("problem in check box")
                }


            }).catch((e) => {
                res.status(404)
            })
    }
    catch (e) {
        console.log(e)
        res.status(400)
    }









}



const getinvoicedata = async (req, res) => {

    const query = "select *  FROM dbo.GetInvoiceData (" + req.params.id + ");";


    console.log(query)

    try {
        const rows = await executeQuery(query);

        if (rows.length === 0 || (rows[0].PatientName && rows[0].PatientName === 'No ID found')) {
            console.log('No data found for the provided ID');
            res.status(404).send('No data found for the provided ID');
        } else {
            // Initialize an empty object to store grouped data
            const groupedData = {};

            // Iterate through the rows
            rows.forEach(row => {
                const key = `${row.PatientName}-${row.PrescriptionDate}-${row.DoctorName}-${row.PrescriptionID}`;
                // If the key doesn't exist in groupedData, create it
                if (!groupedData[key]) {
                    groupedData[key] = {
                        PatientName: row.PatientName,
                        PrescriptionDate: row.PrescriptionDate,
                        DoctorName: row.DoctorName,
                        PrescriptionID: row.PrescriptionID,
                        TotalCost: row.TotalCost,
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
            res.status(200).send(result);
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Internal Server Error');
    }
};








const getcompeltedtest = async (req, res) => {

    const query = "SELECT * FROM dbo.GetCompletedTests(" + req.params.id + ");";
    console.log(query);


    try {
        const rows = await executeQuery(query);

        if (rows.length === 0 || (rows[0].PatientName && rows[0].PatientName === 'No ID found')) {
            console.log('No data found for the provided ID');
            res.status(404).send('No data found for the provided ID');
        } else {
            // Initialize an object to group data by PatientName
            const groupedData = {};

            // Iterate through the rows
            rows.forEach(row => {
                const patientKey = row.PatientName;

                // If the patientKey doesn't exist in groupedData, create it
                if (!groupedData[patientKey]) {
                    groupedData[patientKey] = {
                        PatientName: row.PatientName,
                        Samples: {} // Object to store samples by SampleID
                    };
                }

                // Get reference to the patient's samples object
                const patientSamples = groupedData[patientKey].Samples;

                // If the SampleID doesn't exist in patientSamples, create it
                if (!patientSamples[row.SampleID]) {
                    patientSamples[row.SampleID] = {
                        SampleID: row.SampleID,
                        Tests: {} // Object to store tests by TestName
                    };
                }

                // Get reference to the specific sample's tests object
                const sampleTests = patientSamples[row.SampleID].Tests;

                // If the TestName doesn't exist in sampleTests, create it
                if (!sampleTests[row.TestName]) {
                    sampleTests[row.TestName] = {
                        TestName: row.TestName,
                        Fields: [] // Array to store fields
                    };
                }

                // Add field details to the Fields array
                sampleTests[row.TestName].Fields.push(row.FieldName);
            });

            // Convert groupedData object into an array of values
            const result = Object.values(groupedData).map(patient => ({
                PatientName: patient.PatientName,
                Samples: Object.values(patient.Samples).map(sample => ({
                    SampleID: sample.SampleID,
                    Tests: Object.values(sample.Tests).map(test => ({
                        TestName: test.TestName,
                        Fields: test.Fields
                    }))
                }))
            }));

            res.status(200).send(result);
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Internal Server Error');
    }






};




module.exports = {
    enterPrescription,
    viewTests,
    viewInvoice,
    inprogressssample,
    prescriptiondetail,
    totalcostbyid,
    insertinvoice,
    inpendingsample,
    incompeleteresult,
    inserttestresult,
    TestFieldsBySampleIDAndTestName,
    inprogressssamplebuttton,
    generatereportandai,
    getinvoicedata,
    getcompeltedtest

}
const checkbox=req.params.checkbox

const patientDoctorPrescriptionQuery= `SELECT * FROM GetPatientDoctorPrescription(${req.params.sampleid})`// Replace with your actual database connection module
console.log(patientDoctorPrescriptionQuery)
const sampleid=req.params.sampleid
const testname=req.params.testname

try{

executeQuery(patientDoctorPrescriptionQuery)
    .then(async (pdpRows) => {
      // Process patient, doctor, and prescription details here
      const patientDoctorPrescriptionData = pdpRows;
      if(checkbox==0){
        const query = "SELECT * FROM dbo.GetLabResults("+req.params.sampleid+","+req.params.testname+");";
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
     else if(checkbox==1){
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
  
               console.log(prompts)
  
              const results = await Promise.all(prompts.map(async prompt => {
                  const result = await model.generateContent(prompt);
                  const response = await result.response;
                  return response.text();
              }));
              const combinedData = {
                patientDoctorPrescriptionData,
                labResultsData: response,
              };
              // Send the results back
              res.status(200).send({
                // data: responseArray,
                combinedData,
                aiResponses: results,
              });
              
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
  else{
      console.log("problem in check box")
  }


    }).catch((e)=>{

    })
}
catch(e)
{
    console.log(e)
}









if(checkbox==0){
   const query = "SELECT * FROM dbo.GetLabResults("+req.params.sampleid+","+req.params.testname+");";
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
   
           res.status(200).send(response);
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


 
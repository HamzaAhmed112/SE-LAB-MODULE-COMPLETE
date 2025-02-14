USE [HospitalManagementSystem]
GO
/****** Object:  UserDefinedFunction [dbo].[GetTotalBilledAmountForMonth]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetTotalBilledAmountForMonth]
(
    @Year INT,
    @Month INT
)
returns DECIMAL(10, 2)
as
begin
    declare @TotalAmount DECIMAL(10, 2);
    select @TotalAmount = SUM(TotalAmount)
    from DoctorFeeBilling
    where YEAR(Date) = @Year AND MONTH(Date) = @Month;
    return ISNULL(@TotalAmount, 0);
END;


GO
/****** Object:  UserDefinedFunction [dbo].[GetTotalTestCost]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetTotalTestCost](@PrescriptionID INT)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @TotalCost DECIMAL(10, 2);

    SELECT @TotalCost = SUM(TLT.Cost)
    FROM [dbo].[Prescription] Pr
    INNER JOIN [dbo].[PatientTest] PT ON Pr.PrescriptionID = PT.PrescriptionID
    INNER JOIN [dbo].[TotalLabTest] TLT ON PT.TestID = TLT.TestID
    WHERE Pr.PrescriptionID = @PrescriptionID;

    RETURN ISNULL(@TotalCost, 0);
END;


GO
/****** Object:  UserDefinedFunction [dbo].[CheckInvoiceStatus]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[CheckInvoiceStatus](@PrescriptionID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        @PrescriptionID AS PrescriptionID,
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM [dbo].[TestOrders] AS TestOrder 
                WHERE TestOrder.PrescriptionID = @PrescriptionID AND TestOrder.InvoiceID IS NOT NULL
            )
            THEN 'Found'
            ELSE 'Not Found'
        END AS InvoiceStatus
);


GO
/****** Object:  UserDefinedFunction [dbo].[CheckPrescriptionPresence]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[CheckPrescriptionPresence](@PrescriptionID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM dbo.Prescription WHERE PrescriptionID = @PrescriptionID) 
            THEN 'Found' 
            ELSE 'Not Found' 
        END AS PrescriptionStatus
);


GO
/****** Object:  UserDefinedFunction [dbo].[GetCompletedTests]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetCompletedTests](@PrescriptionID INT)
RETURNS TABLE
AS
RETURN
(
    WITH CompletedTests AS (
        SELECT
            PT.TestID,
            TLT.Testname,
            TCS.Status,
            TCS.SampleID
        FROM
            [dbo].[PatientTest] PT
        INNER JOIN [dbo].[TestCountAndStatus] TCS ON PT.TestID = TCS.TestID
        INNER JOIN [dbo].[TotalLabTest] TLT ON PT.TestID = TLT.TestID
        WHERE
            PT.PrescriptionID = @PrescriptionID
            AND TCS.Status = 'Completed'
    )
    SELECT
        P.PatientName AS PatientName,
        CT.Testname AS TestName,
        CT.SampleID AS SampleID,
        TF.FieldName AS FieldName
    FROM
        [dbo].[Prescription] Pr
    INNER JOIN [dbo].[Appointment] A ON Pr.AppointmentID = A.AppointmentID
    INNER JOIN [dbo].[Patient] P ON A.PatientID = P.PatientID
    INNER JOIN CompletedTests CT ON Pr.PrescriptionID = @PrescriptionID
    INNER JOIN [dbo].[TestFieldsBridge] TFB ON CT.TestID = TFB.TestID
    INNER JOIN [dbo].[TestFields] TF ON TFB.FieldID = TF.FieldID
    
    UNION ALL
    
    SELECT
        'No ID found' AS PatientName,
        NULL AS TestName,
        NULL AS SampleID,
        NULL AS FieldName
    WHERE
        NOT EXISTS (
            SELECT 1
            FROM [dbo].[Prescription] Pr
            WHERE Pr.PrescriptionID = @PrescriptionID
        )
);

GO
/****** Object:  UserDefinedFunction [dbo].[GetCompletedTests1]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetCompletedTests1] (
    @PrescriptionID INT
)
RETURNS TABLE
AS
RETURN
(
    WITH CompletedTests AS (
        SELECT
            PT.TestID,
            TLT.Testname,
            TCS.Status,
            TCS.SampleID
        FROM
            dbo.PatientTest PT
        INNER JOIN dbo.TestCountAndStatus TCS ON PT.TestID = TCS.TestID
        INNER JOIN dbo.TotalLabTest TLT ON PT.TestID = TLT.TestID
        WHERE
            PT.PrescriptionID = @PrescriptionID
            AND TCS.Status = 'Completed'
    )
    SELECT DISTINCT
        P.PatientName AS PatientName,
        CT.Testname AS TestName,
        CT.SampleID AS SampleID,
        TF.FieldName AS FieldName
    FROM
        dbo.Prescription Pr
    INNER JOIN dbo.Appointment A ON Pr.AppointmentID = A.AppointmentID
    INNER JOIN dbo.Patient P ON A.PatientID = P.PatientID
    INNER JOIN CompletedTests CT ON Pr.PrescriptionID = @PrescriptionID
    INNER JOIN dbo.TestFieldsBridge TFB ON CT.TestID = TFB.TestID
    INNER JOIN dbo.TestFields TF ON TFB.FieldID = TF.FieldID
    
    UNION ALL
    
    SELECT
        'No ID found' AS PatientName,
        NULL AS TestName,
        NULL AS SampleID,
        NULL AS FieldName
    WHERE
        NOT EXISTS (
            SELECT 1
            FROM dbo.Prescription Pr
            WHERE Pr.PrescriptionID = @PrescriptionID
        )
);

GO
/****** Object:  UserDefinedFunction [dbo].[GetInvoiceData]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetInvoiceData](@PrescriptionID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        P.PatientName AS PatientName,
        Pr.[Date] AS PrescriptionDate,
        E.Empname AS DoctorName,
        Pr.PrescriptionID AS PrescriptionID,
        TLT.Testname AS TestName,
        TLT.Cost AS TestCost,
        I.Amount AS TotalCost  -- Adjusted alias for Invoice table
    FROM
        [dbo].[Prescription] Pr
    INNER JOIN [dbo].[Appointment] A ON Pr.AppointmentID = A.AppointmentID
    INNER JOIN [dbo].[Patient] P ON A.PatientID = P.PatientID
    INNER JOIN [dbo].[Employee] E ON A.DoctorID = E.EmpID
    INNER JOIN [dbo].[PatientTest] PT ON Pr.PrescriptionID = PT.PrescriptionID
    INNER JOIN [dbo].[TotalLabTest] TLT ON PT.TestID = TLT.TestID
    LEFT JOIN [dbo].[TestOrders] [TO] ON Pr.PrescriptionID = [TO].PrescriptionID
    LEFT JOIN [dbo].[LabInvoices] I ON [TO].InvoiceID = I.InvoiceID  -- Adjusted alias for Invoice table
    WHERE
        Pr.PrescriptionID = @PrescriptionID
    
    UNION ALL
    
    SELECT
        'No ID found' AS PatientName,
        NULL AS PrescriptionDate,
        NULL AS DoctorName,
        NULL AS PrescriptionID,
        NULL AS TestName,
        NULL AS TestCost,
        NULL AS TotalCost
    WHERE
        NOT EXISTS (
            SELECT 1
            FROM [dbo].[Prescription] Pr
            WHERE Pr.PrescriptionID = @PrescriptionID
        )
);


GO
/****** Object:  UserDefinedFunction [dbo].[GetLabResults]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetLabResults] (
    @SampleID INT,
    @TestName VARCHAR(100)
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        lr.SampleID,
        @TestName AS TestName,
        tf.FieldName,
        tf.NormalRange,
        lr.FieldResult
    FROM
        dbo.LabResults lr
    JOIN
        dbo.TestFields tf ON lr.FieldID = tf.FieldID
    JOIN
        dbo.TestFieldsBridge tfb ON tf.FieldID = tfb.FieldID
    JOIN
        dbo.TotalLabTest tlt ON tfb.TestID = tlt.TestID
    WHERE
        lr.SampleID = @SampleID
        AND tlt.TestName = @TestName
        AND lr.FieldResult IS NOT NULL
);   

GO
/****** Object:  UserDefinedFunction [dbo].[GetNullFieldResults]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- Create the function
CREATE FUNCTION [dbo].[GetNullFieldResults]()
RETURNS TABLE
AS
RETURN
(
    SELECT *
    FROM dbo.LabResults
    WHERE FieldResult IS NULL
);


GO
/****** Object:  UserDefinedFunction [dbo].[GetPatientDoctorPrescription]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetPatientDoctorPrescription] (
    @SampleID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT DISTINCT
        p.PatientName,
        e.EmpName AS DoctorName,
        tord.PrescriptionID
    FROM
        dbo.Samples s
    JOIN
        dbo.TestOrders tord ON s.OrderID = tord.OrderID
    JOIN
        dbo.Prescription pr ON tord.PrescriptionID = pr.PrescriptionID
    JOIN
        dbo.Appointment a ON pr.AppointmentID = a.AppointmentID
    JOIN
        dbo.Patient p ON a.PatientID = p.PatientID
    JOIN
        dbo.Doctor d ON a.DoctorID = d.DoctorID
    JOIN
        dbo.Employee e ON d.DoctorID = e.EmpID
    WHERE
        s.SampleID = @SampleID
);

GO
/****** Object:  UserDefinedFunction [dbo].[GetPrescriptionDetails]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetPrescriptionDetails](@PrescriptionID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        P.PatientName AS PatientName,
        Pr.[Date] AS PrescriptionDate,
        E.Empname AS DoctorName,
        Pr.PrescriptionID AS PrescriptionID,
        TLT.Testname AS TestName,
        TLT.Cost AS TestCost
    FROM
        [dbo].[Prescription] Pr
    INNER JOIN [dbo].[Appointment] A ON Pr.AppointmentID = A.AppointmentID
    INNER JOIN [dbo].[Patient] P ON A.PatientID = P.PatientID
    INNER JOIN [dbo].[Employee] E ON A.DoctorID = E.EmpID
    INNER JOIN [dbo].[PatientTest] PT ON Pr.PrescriptionID = PT.PrescriptionID
    INNER JOIN [dbo].[TotalLabTest] TLT ON PT.TestID = TLT.TestID
    WHERE
        Pr.PrescriptionID = @PrescriptionID
    
    UNION ALL
    
    SELECT
        'No ID found' AS PatientName,
        NULL AS PrescriptionDate,
        NULL AS DoctorName,
        NULL AS PrescriptionID,
        NULL AS TestName,
        NULL AS TestCost
    WHERE
        NOT EXISTS (
            SELECT 1
            FROM [dbo].[Prescription] Pr
            WHERE Pr.PrescriptionID = @PrescriptionID
        )
);


GO
/****** Object:  UserDefinedFunction [dbo].[GetSamplesInPending]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetSamplesInPending]()
RETURNS TABLE
AS
RETURN
(
   
    SELECT TC.SampleID, TL.Testname, pa.PatientName
    FROM TestCountAndStatus TC
    INNER JOIN TotalLabTest TL ON TC.TestID = TL.TestID
	JOIN TestOrders o
	on tc.OrderID = o.OrderID
	join Prescription p
	on p.PrescriptionID = o.PrescriptionID
	join Appointment a
	on p.AppointmentID = a.AppointmentID
	join Patient pa
	on a.PatientID = pa.PatientID
    WHERE TC.Status = 'Pending'
);
GO
/****** Object:  UserDefinedFunction [dbo].[GetSamplesInPending2]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetSamplesInPending2]()
RETURNS TABLE
AS
RETURN
(
    SELECT 
        DISTINCT TC.SampleID, 
        TL.Testname,
        P.PatientName
    FROM 
        TestCountAndStatus TC
    INNER JOIN 
        Samples S ON TC.SampleID = S.SampleID
    INNER JOIN 
        TotalLabTest TL ON TC.TestID = TL.TestID
    INNER JOIN 
        PatientTest PT ON TC.TestID = PT.TestID
    INNER JOIN 
        Prescription Pr ON PT.PrescriptionID = Pr.PrescriptionID
    INNER JOIN 
        Appointment A ON Pr.AppointmentID = A.AppointmentID
    INNER JOIN 
        Patient P ON A.PatientID = P.PatientID
    WHERE 
        TC.Status = 'Pending'
);
GO
/****** Object:  UserDefinedFunction [dbo].[GetSamplesInPending3]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetSamplesInPending3]()
RETURNS TABLE
AS
RETURN
(
   
    SELECT TC.SampleID, TL.Testname, pa.PatientName
    FROM TestCountAndStatus TC
    INNER JOIN TotalLabTest TL ON TC.TestID = TL.TestID
	JOIN TestOrders o
	on tc.OrderID = o.OrderID
	join Prescription p
	on p.PrescriptionID = o.PrescriptionID
	join Appointment a
	on p.AppointmentID = a.AppointmentID
	join Patient pa
	on a.PatientID = pa.PatientID
    WHERE TC.Status = 'Pending'
);
GO
/****** Object:  UserDefinedFunction [dbo].[GetSamplesInProgress]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetSamplesInProgress]()
RETURNS TABLE
AS
RETURN
(
   
    SELECT TC.SampleID, TL.Testname, pa.PatientName
    FROM TestCountAndStatus TC
    INNER JOIN TotalLabTest TL ON TC.TestID = TL.TestID
	JOIN TestOrders o
	on tc.OrderID = o.OrderID
	join Prescription p
	on p.PrescriptionID = o.PrescriptionID
	join Appointment a
	on p.AppointmentID = a.AppointmentID
	join Patient pa
	on a.PatientID = pa.PatientID
    WHERE TC.Status = 'In Progress'
);
GO
/****** Object:  UserDefinedFunction [dbo].[GetTestFieldsBySampleIDAndTestName]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetTestFieldsBySampleIDAndTestName]
(
    @SampleID INT,
    @TestName VARCHAR(100)
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        tf.FieldID,
        tf.FieldName,
        tf.NormalRange
    FROM 
        dbo.Samples s
    JOIN 
        dbo.TestOrders o ON s.OrderID = o.OrderID
    JOIN 
        dbo.TestCountAndStatus tcs ON o.OrderID = tcs.OrderID
    JOIN 
        dbo.TotalLabTest tlt ON tcs.TestID = tlt.TestID
    JOIN 
        dbo.TestFieldsBridge tfb ON tlt.TestID = tfb.TestID
    JOIN 
        dbo.TestFields tf ON tfb.FieldID = tf.FieldID
    WHERE 
        s.SampleID = @SampleID
        AND tlt.TestName = @TestName
)


GO
/****** Object:  StoredProcedure [dbo].[InsertIntoLabInvoices]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[InsertIntoLabInvoices]
    @Amount DECIMAL(10, 2)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[LabInvoices] ([Timestamp], [Amount])
    VALUES (GETDATE(), @Amount);
END;


GO
/****** Object:  StoredProcedure [dbo].[InsertInvoiceAndTestOrder]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[InsertInvoiceAndTestOrder]
    @Amount DECIMAL(10, 2),
   @PrescriptionID INT,
    @CollectionTime TIME,
    @TestID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @InsertedInvoiceID TABLE (InvoiceID INT);

    -- Insert into LabInvoices table and capture the generated InvoiceID
    INSERT INTO [dbo].[LabInvoices] ([Timestamp], [Amount])
    OUTPUT INSERTED.InvoiceID INTO @InsertedInvoiceID
    VALUES (GETDATE(), @Amount);

    -- Use the generated InvoiceID to insert into TestOrders table
    DECLARE @InvoiceID INT;
    SELECT @InvoiceID = InvoiceID FROM @InsertedInvoiceID;

    INSERT INTO [dbo].[TestOrders] ([InvoiceID], [PrescriptionID], [Timestamp], [collection_time])
    VALUES (@InvoiceID, @PrescriptionID, GETDATE(), @CollectionTime);

    -- Return the TestID
    SELECT @TestID = SCOPE_IDENTITY();
END;


GO
/****** Object:  StoredProcedure [dbo].[UpdateLabResultWithTimestamp]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[UpdateLabResultWithTimestamp]
    @SampleID INT,
    @FieldID INT,
    @NewValue VARCHAR(MAX),
    @TestName VARCHAR(255) -- Added parameter for TestName
AS
BEGIN
    SET NOCOUNT ON;

    -- Declare variables to hold the updated values
    DECLARE @OrderID INT;
    DECLARE @TestID INT;

    -- Get the TestID from the TotalLabTests table based on the TestName
    SELECT @TestID = TestID
    FROM dbo.TotalLabTest
    WHERE TestName = @TestName;

    -- Check if a matching TestID was found
    IF @TestID IS NULL
    BEGIN
        -- Handle the case where the TestID was not found
        RAISERROR('TestID not found for the given TestName', 16, 1);
        RETURN;
    END

    -- Update the LabResults table
    UPDATE dbo.LabResults
    SET FieldResult = @NewValue,
        Timestamp = GETDATE() -- Update the Timestamp column with the current date and time
    WHERE SampleID = @SampleID
    AND FieldID = @FieldID
    AND TestID = @TestID; -- Added TestID condition

    -- Get the OrderID from the Sample table
    SELECT @OrderID = OrderID
    FROM dbo.Samples
    WHERE SampleID = @SampleID;

    -- Check if the FieldResult matches the expected FieldID, SampleID, and TestID
    IF EXISTS (
        SELECT 1
        FROM dbo.LabResults lr
        WHERE lr.FieldID = @FieldID AND lr.SampleID = @SampleID AND lr.TestID = @TestID AND lr.FieldResult IS NOT NULL
    )
    BEGIN
        -- Update the status to 'Completed' in the TestCountAndStatus table
        UPDATE tcs
        SET tcs.Status = 'Completed'
        FROM dbo.TestCountAndStatus tcs
        WHERE tcs.TestID = @TestID AND tcs.OrderID = @OrderID;
    END;
END

GO
/****** Object:  StoredProcedure [dbo].[UpdateTestStatusToInProgress]    Script Date: 5/22/2024 9:50:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[UpdateTestStatusToInProgress]
    @SampleID INT,
    @TestName VARCHAR(100)
AS
BEGIN
    DECLARE @OrderID INT;
    DECLARE @TestID INT;

    -- Get the OrderID associated with the SampleID
    SELECT @OrderID = s.OrderID
    FROM [dbo].[Samples] s
    WHERE s.SampleID = @SampleID;

    -- Get the TestID associated with the TestName
    SELECT @TestID = tlt.TestID
    FROM [dbo].[TotalLabTest] tlt
    WHERE tlt.Testname = @TestName;

    -- Update the Status to 'In Progress' in the TestCountAndStatus table
    UPDATE tcs
    SET tcs.Status = 'In Progress'
    FROM [dbo].[TestCountAndStatus] tcs
    WHERE tcs.OrderID = @OrderID
    AND tcs.TestID = @TestID;
END;


GO

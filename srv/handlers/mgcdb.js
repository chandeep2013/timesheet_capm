const cds = require("@sap/cds");
const SequenceUtil = require('../utils/seq/SequenceUtil');

module.exports = cds.service.impl(async function () {
    const db = await cds.connect.to("db");
    var seqConfigPath = __dirname + '/EntitySequenceMapping.json';
    console.log("Config path:" + seqConfigPath);
    const seqUtil = new SequenceUtil(db, this, seqConfigPath);
    await seqUtil.validate();

    this.on("DELETE", "*", async (req, next) => {
        let id = req.data.ID;
        let cdsEntity = req.target.projection.from.ref[0];
        await UPDATE(cdsEntity).set({
            DELETED: true
        }).where({
            ID: id
        });
    });

    this.on("GET", "TimeSheetDetails_prd", async (req, next) => {
        return next();
    });

    this.on("UPDATE", "TimeSheetDetails_prd", async (req, next) => {
        let id = req.data.ID;


        const {
            TimeSheetDetails_prd, Employees_prd, Job_prd, Section_prd, Phase_prd
            //} = cds.entities();
        } = cds.entities('mgc.srv.MgcDbService');
        const srv = cds.services['mgc.srv.MgcDbService'];

        let cdsEntity = req.target.projection.from.ref[0];


        var employeeId = req.data.EmployeeID;
        var totalHours = req.data.TotalHours;
        var regularTime = req.data.RegularTime;
        var thresholdVal = Number(req.data.OtThreshold);
        var payPeriodBeginDate = req.data.PayPeriodBeginDate;
        var payPeriodEndDate = req.data.PayPeriodEndDate;
        var appName = req.data.AppName;

        //logic for MangerApprovalMail : start

        var ManagerApprovalEmail1 = '';
        var ManagerApprovalName = '';
        if (employeeId) {
            let whereObject = { ID: employeeId };
            if (req.data.WorkOrder) {
                var empWorkHours = await SELECT.from(Employees_prd).where(whereObject);
                if (empWorkHours.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours[0].PositionManagerEmail == null ? '' : empWorkHours[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours[0].PositionManagerName == null ? '' : empWorkHours[0].PositionManagerName;
                }
            }
            if (req.data.CostCenter) {
                var empWorkHours2 = await SELECT.from(Employees_prd).where(whereObject);
                if (empWorkHours2.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours2[0].PositionManagerEmail == null ? '' : empWorkHours2[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours2[0].PositionManagerName == null ? '' : empWorkHours2[0].PositionManagerName;
                }
            }
            if (req.data.ReceivingUnitTruck) {
                var empWorkHours1 = await SELECT.from(Employees_prd).where(whereObject);
                if (empWorkHours1.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours1[0].PositionManagerEmail == null ? '' : empWorkHours1[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours1[0].PositionManagerName == null ? '' : empWorkHours1[0].PositionManagerName;
                }
            }
        }

        if (req.data.AppName === "CP_CREW" && employeeId === "") {
            if (req.data.WorkOrder) {
                let whereObjectCrew = { ID: req.data.ForemanID };
                var empWorkHours = await SELECT.from(Employees_prd).where(whereObjectCrew);
                if (empWorkHours.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours[0].PositionManagerEmail == null ? '' : empWorkHours[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours[0].PositionManagerName == null ? '' : empWorkHours[0].PositionManagerName;
                }
            }

            if (req.data.CostCenter) {
                let whereObjectCrew = { ID: req.data.ForemanID };
                var empWorkHours = await SELECT.from(Employees_prd).where(whereObjectCrew);
                if (empWorkHours.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours[0].PositionManagerEmail == null ? '' : empWorkHours[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours[0].PositionManagerName == null ? '' : empWorkHours[0].PositionManagerName;
                }
            }
        }

        var tempMail;
        var tempMail1;
        let whereObject1 = { ID: req.data.Phase };
        let whereObject2 = { ID: req.data.Section };
        let whereObject3 = { ID: req.data.Job };
        if (req.data.Phase) {
            var phaseWorkHours = await SELECT.from(Phase_prd).where(whereObject1);
            if (phaseWorkHours.length > 0) {
                if (phaseWorkHours[0].ProjectManagerEmail) {
                    tempMail = phaseWorkHours[0].ProjectManagerEmail.split(";");
                    if (tempMail[0] !== undefined) {
                        ManagerApprovalEmail1 = tempMail[0] == null ? '' : tempMail[0];
                    }
                    if (tempMail[1] !== undefined) {
                        req.data.ProjectcoordinatorEmail = tempMail[1] == null ? '' : tempMail[1];
                    }

                }

                if (phaseWorkHours[0].ProjectManager) {
                    tempMail1 = phaseWorkHours[0].ProjectManager.split(";");
                    if (tempMail1[0] !== undefined) {
                        ManagerApprovalName = tempMail1[0] == null ? '' : tempMail1[0];
                    }
                }
            }
        }
        if (req.data.Section) {
            if (ManagerApprovalEmail1 == '') {
                var SectionWorkHours = await SELECT.from(Section_prd).where(whereObject2);
                if (SectionWorkHours.length > 0) {
                    if (SectionWorkHours[0].ProjectManagerEmail) {
                        tempMail = SectionWorkHours[0].ProjectManagerEmail.split(";");
                        if (tempMail[0] !== undefined) {
                            ManagerApprovalEmail1 = tempMail[0] == null ? '' : tempMail[0];
                        }
                        if (tempMail[1] !== undefined) {
                            req.data.ProjectcoordinatorEmail = tempMail[1] == null ? '' : tempMail[1];
                        }
                    }

                    if (SectionWorkHours[0].ProjectManager) {
                        tempMail1 = SectionWorkHours[0].ProjectManager.split(";");
                        if (tempMail1[0] !== undefined) {
                            ManagerApprovalName = tempMail1[0] == null ? '' : tempMail1[0];
                        }
                    }


                }
            }
        }
        if (req.data.Job) {
            if (ManagerApprovalEmail1 == '') {
                var jobWorkHours = await SELECT.from(Job_prd).where(whereObject3);
                if (jobWorkHours.length > 0) {
                    if (jobWorkHours[0].ProjectManagerEmail) {
                        tempMail = jobWorkHours[0].ProjectManagerEmail.split(";");
                        if (tempMail[0] !== undefined) {
                            ManagerApprovalEmail1 = tempMail[0] == null ? '' : tempMail[0];
                        }
                        if (tempMail[1] !== undefined) {
                            req.data.ProjectcoordinatorEmail = tempMail[1] == null ? '' : tempMail[1];
                        }
                    }

                    if (jobWorkHours[0].ProjectManager) {
                        tempMail1 = jobWorkHours[0].ProjectManager.split(";");
                        if (tempMail1[0] !== undefined) {
                            ManagerApprovalName = tempMail1[0] == null ? '' : tempMail1[0];
                        }
                    }


                }
            }
        }
        req.data.ManagerApprovalEmail = ManagerApprovalEmail1;
        req.data.ManagerApprovalName = ManagerApprovalName;
        // }

        //logic for MangerApprovalMail : end

        // hours to percentage logic : start

        var time = req.data.TotalHours;

        if (time) {
            var timeSplit = time.toString().split('.');
            if (timeSplit.length > 1) {
                // Split the time into hours and minutes
                let [hours, minutes] = time.toString().split('.').map(Number);
                // Convert minutes to a full number if they are a decimal
                if (!Number.isInteger(minutes)) {
                    minutes = Math.round(minutes * 60);
                }

                // Round minutes to the nearest quarter (15, 30, 45, 00)
                let roundedMinutes = Math.round(minutes / 15) * 15;

                // Handle cases where minutes round up to 60
                if (roundedMinutes === 60) {
                    hours += 1;
                    roundedMinutes = 0;
                }

                // Convert rounded minutes back to a fraction of an hour
                let fraction = roundedMinutes / 60;

                // Combine hours and fraction
                var adjustedHour = hours + fraction;
                var fadjustedHour = adjustedHour.toString();
                req.data.TotalHoursPercentage = fadjustedHour;
                console.log(req.data.TotalHoursPercentage + " Total Hours");

            } else {
                req.data.TotalHoursPercentage = time.toString().split('.')[0]
            }

        }
        // hours to percentage logic : end
        return next();
    });

    this.on("POST", "TimeSheetDetails_prd", async (req, next) => {
        let id = req.data.ID;
        const {
            TimeSheetDetails_prd, Employees_prd, Job_prd, Section_prd, Phase_prd
            //} = cds.entities();
        } = cds.entities('mgc.srv.MgcDbService');

        const srv = cds.services['mgc.srv.MgcDbService'];
        let cdsEntity = req.target.projection.from.ref[0];

        var employeeId = req.data.EmployeeID;

        //logic for MangerApprovalMail : start

        var ManagerApprovalEmail1 = '';
        var ManagerApprovalName = '';
        if (employeeId) {
            let whereObject = { ID: employeeId };
            if (req.data.WorkOrder) {
                var empWorkHours = await SELECT.from(Employees_prd).where(whereObject);
                if (empWorkHours.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours[0].PositionManagerEmail == null ? '' : empWorkHours[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours[0].PositionManagerName == null ? '' : empWorkHours[0].PositionManagerName;
                }
            }
            if (req.data.CostCenter) {
                var empWorkHours2 = await SELECT.from(Employees_prd).where(whereObject);
                if (empWorkHours2.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours2[0].PositionManagerEmail == null ? '' : empWorkHours2[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours2[0].PositionManagerName == null ? '' : empWorkHours2[0].PositionManagerName;
                }
            }
            if (req.data.ReceivingUnitTruck) {
                var empWorkHours1 = await SELECT.from(Employees_prd).where(whereObject);
                if (empWorkHours1.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours1[0].PositionManagerEmail == null ? '' : empWorkHours1[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours1[0].PositionManagerName == null ? '' : empWorkHours1[0].PositionManagerName;
                }
            }
        }

        if (req.data.AppName === "CP_CREW" && employeeId === "") {
            if (req.data.WorkOrder) {
                let whereObjectCrew = { ID: req.data.ForemanID };
                var empWorkHours = await SELECT.from(Employees_prd).where(whereObjectCrew);
                if (empWorkHours.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours[0].PositionManagerEmail == null ? '' : empWorkHours[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours[0].PositionManagerName == null ? '' : empWorkHours[0].PositionManagerName;
                }
            }

            if (req.data.CostCenter) {
                let whereObjectCrew = { ID: req.data.ForemanID };
                var empWorkHours = await SELECT.from(Employees_prd).where(whereObjectCrew);
                if (empWorkHours.length > 0) {
                    ManagerApprovalEmail1 = empWorkHours[0].PositionManagerEmail == null ? '' : empWorkHours[0].PositionManagerEmail;
                    ManagerApprovalName = empWorkHours[0].PositionManagerName == null ? '' : empWorkHours[0].PositionManagerName;
                }
            }
        }
        var tempMail;
        var tempMail1;
        let whereObject1 = { ID: req.data.Phase };
        let whereObject2 = { ID: req.data.Section };
        let whereObject3 = { ID: req.data.Job };
        if (req.data.Phase) {
            var phaseWorkHours = await SELECT.from(Phase_prd).where(whereObject1);
            if (phaseWorkHours.length > 0) {
                if (phaseWorkHours[0].ProjectManagerEmail) {
                    tempMail = phaseWorkHours[0].ProjectManagerEmail.split(";");
                    if (tempMail[0] !== undefined) {
                        ManagerApprovalEmail1 = tempMail[0] == null ? '' : tempMail[0];
                    }
                    if (tempMail[1] !== undefined) {
                        req.data.ProjectcoordinatorEmail = tempMail[1] == null ? '' : tempMail[1];
                    }
                }

                if (phaseWorkHours[0].ProjectManager) {
                    tempMail1 = phaseWorkHours[0].ProjectManager.split(";");
                    if (tempMail1[0] !== undefined) {
                        ManagerApprovalName = tempMail1[0] == null ? '' : tempMail1[0];
                    }
                }


            }
        }
        if (req.data.Section) {
            if (ManagerApprovalEmail1 == '') {
                var SectionWorkHours = await SELECT.from(Section_prd).where(whereObject2);
                if (SectionWorkHours.length > 0) {
                    if (SectionWorkHours[0].ProjectManagerEmail) {
                        tempMail = SectionWorkHours[0].ProjectManagerEmail.split(";");
                        if (tempMail[0] !== undefined) {
                            ManagerApprovalEmail1 = tempMail[0] == null ? '' : tempMail[0];
                        }
                        if (tempMail[1] !== undefined) {
                            req.data.ProjectcoordinatorEmail = tempMail[1] == null ? '' : tempMail[1];
                        }
                    }

                    if (SectionWorkHours[0].ProjectManager) {
                        tempMail1 = SectionWorkHours[0].ProjectManager.split(";");
                        if (tempMail1[0] !== undefined) {
                            ManagerApprovalName = tempMail1[0] == null ? '' : tempMail1[0];
                        }
                    }


                }
            }
        }
        if (req.data.Job) {
            if (ManagerApprovalEmail1 == '') {
                var jobWorkHours = await SELECT.from(Job_prd).where(whereObject3);
                if (jobWorkHours.length > 0) {
                    if (jobWorkHours[0].ProjectManagerEmail) {
                        tempMail = jobWorkHours[0].ProjectManagerEmail.split(";");
                        if (tempMail[0] !== undefined) {
                            ManagerApprovalEmail1 = tempMail[0] == null ? '' : tempMail[0];
                        }
                        if (tempMail[1] !== undefined) {
                            req.data.ProjectcoordinatorEmail = tempMail[1] == null ? '' : tempMail[1];
                        }
                    }

                    if (jobWorkHours[0].ProjectManager) {
                        tempMail1 = jobWorkHours[0].ProjectManager.split(";");
                        if (tempMail1[0] !== undefined) {
                            ManagerApprovalName = tempMail1[0] == null ? '' : tempMail1[0];
                        }
                    }


                }
            }
        }
        req.data.ManagerApprovalEmail = ManagerApprovalEmail1;
        req.data.ManagerApprovalName = ManagerApprovalName;
        // }

        //logic for MangerApprovalMail : end


        // hours to percentage logic : start

        var time = req.data.TotalHours;

        if (time) {
            var timeSplit = time.toString().split('.');
            if (timeSplit.length > 1) {
                // Split the time into hours and minutes
                let [hours, minutes] = time.toString().split('.').map(Number);
                // Convert minutes to a full number if they are a decimal
                if (!Number.isInteger(minutes)) {
                    minutes = Math.round(minutes * 60);
                }

                // Round minutes to the nearest quarter (15, 30, 45, 00)
                let roundedMinutes = Math.round(minutes / 15) * 15;

                // Handle cases where minutes round up to 60
                if (roundedMinutes === 60) {
                    hours += 1;
                    roundedMinutes = 0;
                }

                // Convert rounded minutes back to a fraction of an hour
                let fraction = roundedMinutes / 60;

                // Combine hours and fraction
                var adjustedHour = hours + fraction;
                var fadjustedHour = adjustedHour.toString();
                req.data.TotalHoursPercentage = fadjustedHour;
                console.log(req.data.TotalHoursPercentage + " Total Hours");

            } else {
                req.data.TotalHoursPercentage = time.toString().split('.')[0]
            }

        }
        // hours to percentage logic : end

        return next();
    });

    this.on('RTOTCalulation', async (req) => {

        const {
            TimeSheetDetails_prd
        } = cds.entities('mgc.srv.MgcDbService');

        const srv = cds.services['mgc.srv.MgcDbService'];
        let cdsEntity = 'mgc_prd.db.TimeSheetDetails';

        var employeeId = req.data.EmployeeID;
        var payPeriodBeginDate = req.data.PayPeriodBeginDate;
        var payPeriodEndDate = req.data.PayPeriodEndDate;
        var appName = req.data.AppName;

        function formatDate(date) {
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            if (month.toString().length === 1) { month = "0" + month }
            if (day.toString().length === 1) { day = "0" + day }

            var fDate = year + "-" + month + "-" + day;
            return fDate;
        }

        // check weekly or biweekly start 


        if (req.data.OtFrequency === "Weekly") {

            // var dateCheck = req.data.Date; // 2024-01-08
            var payPeriodBeginDate = req.data.PayPeriodBeginDate;
            var payPeriodEndDate = req.data.PayPeriodEndDate;

            // var dDateCheck = new Date(dateCheck);
            var dPayPeriodBeginDate = new Date(payPeriodBeginDate);
            var dPayPeriodEndDate = new Date(payPeriodEndDate);

            //Calculate Weekly period start and end date for biweekly period
            var weeklyPayPeriodEndDate = new Date(dPayPeriodBeginDate.getFullYear(), dPayPeriodBeginDate.getMonth(), dPayPeriodBeginDate.getDate() + 6);
            var weeklyPayPeriodStartDate = new Date(dPayPeriodEndDate.getFullYear(), dPayPeriodEndDate.getMonth(), dPayPeriodEndDate.getDate() - 6);

            try {
                let whereObject = { PAYPERIODBEGINDATE: payPeriodBeginDate, PAYPERIODENDDATE: payPeriodEndDate, EMPLOYEEID: employeeId, SAVESUBMITSTATUS: { '!=': "Rejected" }};
                var empWorkHours = await SELECT.from(TimeSheetDetails_prd).where(whereObject);
            } catch (error) {
                console.log("Error : " + error)
            }

            empWorkHours.sort((a, b) => {
                const dateA = new Date(a.Date);
                const dateB = new Date(b.Date);
                return dateA - dateB;
            });

            var aFirstWeekRange = [], aSecondWeekRange = [];
            for (var f = 0; f < empWorkHours.length; f++) {
                var dCheck = new Date(empWorkHours[f].Date);
                if (dCheck.getTime() >= dPayPeriodBeginDate.getTime() && dCheck.getTime() <= weeklyPayPeriodEndDate.getTime()) {
                    aFirstWeekRange.push(empWorkHours[f]);
                } else if (dCheck.getTime() >= weeklyPayPeriodStartDate.getTime() && dCheck.getTime() <= dPayPeriodEndDate.getTime()) {
                    aSecondWeekRange.push(empWorkHours[f]);
                }
            }

            /// RT OT Logic for aFirstWeekRange
            aFirstWeekRange.sort((a, b) => {
                const dateA = new Date(a.Date);
                const dateB = new Date(b.Date);
                return dateA - dateB;
            });
            for (var a = 0; a < aFirstWeekRange.length; a++) {
                if (aFirstWeekRange[a].PayCode === "1040" || aFirstWeekRange[a].PayCode === "") {
                    if (aFirstWeekRange[a].SendingUnitTrailer === "" || aFirstWeekRange[a].SendingUnitTrailer === null) {
                        var thresholdVal = Number(aFirstWeekRange[a].OtThreshold);
                        var sumToCalc = 0;
                        for (var y = 0; y <= a; y++) {
                            if (aFirstWeekRange[y].PayCode === "1040" || aFirstWeekRange[y].PayCode === "") {
                                if (aFirstWeekRange[y].SendingUnitTrailer === "" || aFirstWeekRange[y].SendingUnitTrailer === null) {
                                    sumToCalc = sumToCalc + Number(aFirstWeekRange[y].TotalHoursPercentage);
                                }
                            }
                        }

                        var sumTotalHourPercentage = 0, sumTotalOT = 0;
                        for (var z = 0; z < a; z++) {
                            if (aFirstWeekRange[z].PayCode === "1040" || aFirstWeekRange[z].PayCode === "") {
                                if (aFirstWeekRange[z].SendingUnitTrailer === "" || aFirstWeekRange[z].SendingUnitTrailer === null) {
                                    sumTotalHourPercentage = sumTotalHourPercentage + Number(aFirstWeekRange[z].TotalHoursPercentage);
                                    sumTotalOT = sumTotalOT + Number(aFirstWeekRange[z].OverTime);
                                }
                            }
                        }

                        if (sumToCalc <= thresholdVal) {
                            aFirstWeekRange[a].OverTime = "0";
                            aFirstWeekRange[a].RegularTime = aFirstWeekRange[a].TotalHoursPercentage;
                        } else {

                            if (sumTotalOT !== 0 && sumTotalOT !== null) {
                                aFirstWeekRange[a].OverTime = aFirstWeekRange[a].TotalHoursPercentage;
                                aFirstWeekRange[a].RegularTime = "0";
                            } else {
                                var sVal = sumToCalc - thresholdVal;
                                var sValRT = Number(aFirstWeekRange[a].TotalHoursPercentage) - sVal;
                                aFirstWeekRange[a].OverTime = sVal.toString();
                                aFirstWeekRange[a].RegularTime = sValRT.toString();
                            }
                        }
                    } else {
                        aFirstWeekRange[a].RegularTime = "0";
                        aFirstWeekRange[a].OverTime = "0";
                    }
                } else {
                    aFirstWeekRange[a].RegularTime = "0";
                    aFirstWeekRange[a].OverTime = "0";
                }
            }

            try {

                for (var i = 0; i < aFirstWeekRange.length; i++) {
                    await UPDATE(cdsEntity).set(aFirstWeekRange[i]).where(
                        {
                            ID: aFirstWeekRange[i].ID,
                            APPNAME: aFirstWeekRange[i].AppName,
                            DATE: aFirstWeekRange[i].Date
                        }
                    );

                }

            } catch (error) {
                console.error('An error occurred during the update:', error);
            }

            ///Logic for second week
            aSecondWeekRange.sort((a, b) => {
                const dateA = new Date(a.Date);
                const dateB = new Date(b.Date);
                return dateA - dateB;
            });

            for (var a = 0; a < aSecondWeekRange.length; a++) {
                if (aSecondWeekRange[a].PayCode === "1040" || aSecondWeekRange[a].PayCode === "") {
                    if (aSecondWeekRange[a].SendingUnitTrailer === "" || aSecondWeekRange[a].SendingUnitTrailer === null) {
                        var thresholdVal = Number(aSecondWeekRange[a].OtThreshold);
                        var sumToCalc = 0;
                        for (var y = 0; y <= a; y++) {
                            if (aSecondWeekRange[y].PayCode === "1040" || aSecondWeekRange[y].PayCode === "") {
                                if (aSecondWeekRange[y].SendingUnitTrailer === "" || aSecondWeekRange[y].SendingUnitTrailer === null) {
                                    sumToCalc = sumToCalc + Number(aSecondWeekRange[y].TotalHoursPercentage);
                                }
                            }
                        }

                        var sumTotalHourPercentage = 0, sumTotalOT = 0;
                        for (var z = 0; z < a; z++) {
                            if (aSecondWeekRange[z].PayCode === "1040" || aSecondWeekRange[z].PayCode === "") {
                                if (aSecondWeekRange[z].SendingUnitTrailer === "" || aSecondWeekRange[z].SendingUnitTrailer === null) {
                                    sumTotalHourPercentage = sumTotalHourPercentage + Number(aSecondWeekRange[z].TotalHoursPercentage);
                                    sumTotalOT = sumTotalOT + Number(aSecondWeekRange[z].OverTime);
                                }
                            }
                        }

                        if (sumToCalc <= thresholdVal) {
                            aSecondWeekRange[a].OverTime = "0";
                            aSecondWeekRange[a].RegularTime = aSecondWeekRange[a].TotalHoursPercentage;
                        } else {

                            if (sumTotalOT !== 0 && sumTotalOT !== null) {
                                aSecondWeekRange[a].OverTime = aSecondWeekRange[a].TotalHoursPercentage;
                                aSecondWeekRange[a].RegularTime = "0";
                            } else {
                                var sVal = sumToCalc - thresholdVal;
                                var sValRT = Number(aSecondWeekRange[a].TotalHoursPercentage) - sVal;
                                aSecondWeekRange[a].OverTime = sVal.toString();
                                aSecondWeekRange[a].RegularTime = sValRT.toString();
                            }
                        }
                    } else {
                        aSecondWeekRange[a].RegularTime = "0";
                        aSecondWeekRange[a].OverTime = "0";
                    }
                } else {
                    aSecondWeekRange[a].RegularTime = "0";
                    aSecondWeekRange[a].OverTime = "0";
                }
            }

            try {

                for (var i = 0; i < aSecondWeekRange.length; i++) {
                    await UPDATE(cdsEntity).set(aSecondWeekRange[i]).where(
                        {
                            ID: aSecondWeekRange[i].ID,
                            APPNAME: aSecondWeekRange[i].AppName,
                            DATE: aSecondWeekRange[i].Date
                        }
                    );

                }

            } catch (error) {
                console.error('An error occurred during the update:', error);
            }

        } else {

            try {
                let whereObject = { PAYPERIODBEGINDATE: payPeriodBeginDate, PAYPERIODENDDATE: payPeriodEndDate, EMPLOYEEID: employeeId, SAVESUBMITSTATUS: { '!=': "Rejected" }};
                var empWorkHours = await SELECT.from(TimeSheetDetails_prd).where(whereObject);
            } catch (error) {
                console.log("Error : " + error)
            }

            empWorkHours.sort((a, b) => {
                const dateA = new Date(a.Date);
                const dateB = new Date(b.Date);
                return dateA - dateB;
            });

            for (var a = 0; a < empWorkHours.length; a++) {

                if (empWorkHours[a].PayCode === "1040" || empWorkHours[a].PayCode === "") {
                    if (empWorkHours[a].SendingUnitTrailer === "" || empWorkHours[a].SendingUnitTrailer === null) {
                        var thresholdVal = Number(empWorkHours[a].OtThreshold);
                        var sumToCalc = 0;
                        for (var y = 0; y <= a; y++) {

                            if (empWorkHours[y].PayCode === "1040" || empWorkHours[y].PayCode === "") {
                                if (empWorkHours[y].SendingUnitTrailer === "" || empWorkHours[y].SendingUnitTrailer === null) {
                                    sumToCalc = sumToCalc + Number(empWorkHours[y].TotalHoursPercentage);
                                }
                            }
                        }

                        var sumTotalHourPercentage = 0, sumTotalOT = 0;
                        for (var z = 0; z < a; z++) {

                            if (empWorkHours[z].PayCode === "1040" || empWorkHours[z].PayCode === "") {
                                if (empWorkHours[z].SendingUnitTrailer === "" || empWorkHours[z].SendingUnitTrailer === null) {
                                    sumTotalHourPercentage = sumTotalHourPercentage + Number(empWorkHours[z].TotalHoursPercentage);
                                    sumTotalOT = sumTotalOT + Number(empWorkHours[z].OverTime);
                                }
                            }
                        }

                        if (sumToCalc <= thresholdVal) {
                            empWorkHours[a].OverTime = "0";
                            empWorkHours[a].RegularTime = empWorkHours[a].TotalHoursPercentage;
                        } else {

                            if (sumTotalOT !== 0 && sumTotalOT !== null) {
                                empWorkHours[a].OverTime = empWorkHours[a].TotalHoursPercentage;
                                empWorkHours[a].RegularTime = "0";
                            } else {
                                var sVal = sumToCalc - thresholdVal;
                                var sValRT = Number(empWorkHours[a].TotalHoursPercentage) - sVal;
                                empWorkHours[a].OverTime = sVal.toString();
                                empWorkHours[a].RegularTime = sValRT.toString();
                            }
                        }
                    } else {
                        empWorkHours[a].RegularTime = "0";
                        empWorkHours[a].OverTime = "0";
                    }
                } else {
                    empWorkHours[a].RegularTime = "0";
                    empWorkHours[a].OverTime = "0";
                }
            }

            try {

                for (var i = 0; i < empWorkHours.length; i++) {
                    await UPDATE(cdsEntity).set(empWorkHours[i]).where(
                        {
                            ID: empWorkHours[i].ID,
                            APPNAME: empWorkHours[i].AppName,
                            DATE: empWorkHours[i].Date
                        }
                    );

                }

            } catch (error) {
                console.error('An error occurred during the update:', error);
            }

        }


        return empWorkHours;
    });

});
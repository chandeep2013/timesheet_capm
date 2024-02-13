namespace mgc.srv;

using {mgc_prd.db as MGCdb_prd} from '../db/mgcdb_prd/Database';

using {WBS} from '../db/mgcdb_prd/Database';

@cds.query.limit: { default: 1000, max: 5000 } @(requires:'authenticated-user')
service MgcDbService @(path : '/mgcdb-prd-srv') @(impl : '/srv/handlers/mgcdb.js') {

@cds.query.limit: 5000
 entity Employees_prd as projection on MGCdb_prd.Employee {  
     *
} where DELETED = false;

 entity Job_prd as projection on MGCdb_prd.Jobs {
      *
} where DELETED = false and Status = 'Active';


 entity Section_prd as projection on MGCdb_prd.Sections {
      *
} where DELETED = false and Status = 'Active';

@cds.query.limit: 5000
 entity Phase_prd as projection on MGCdb_prd.Phases {
      *
} where DELETED = false and Status = 'Active';

@cds.query.limit: 5000
 entity WorkOrder_prd as projection on MGCdb_prd.WorkOrder {
      *
} where DELETED = false;

 entity Equipment_prd as projection on MGCdb_prd.Equipment {
      *
} where DELETED = false;

 entity TimeSheetDetails_prd as projection on MGCdb_prd.TimeSheetDetails {
      *
} where DELETED = false;

 entity TimeSheetDetailsCpi_prd as projection on MGCdb_prd.TimeSheetDetails {
      *
};

 entity PayRollHeader_prd as projection on MGCdb_prd.PayRollHeader {
      *
} where DELETED = false;

 entity Activities_prd as projection on MGCdb_prd.Activities {
      *
} where DELETED = false;

 entity RtOt_prd as projection on MGCdb_prd.RtOt {
      *
} where DELETED = false;

@cds.query.limit: 5000
@readonly
entity WbsElement_prd  as projection on WBS{
      *
} where STATUS = 'Active' and STATUS_1 = 'Active' and STATUS_2 = 'Active';

@open
type object {};
function RTOTCalulation(EmployeeID : String, AppName: String,PayPeriodBeginDate: String,PayPeriodEndDate: String,OtFrequency: String,Date:String) returns array of object;


}


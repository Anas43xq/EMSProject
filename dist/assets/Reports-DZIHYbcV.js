import{u as T,s as d,j as t}from"./index-BBL5zgFY.js";import{r as c}from"./vendor-5bkAA5gm.js";import{U as b,c as G,d as U,T as O,F as V,r as _}from"./lucide-cejH3fEv.js";import{f as l}from"./format-sbWH3_uq.js";import"./pdf-BwXo9bY9.js";import"./supabase-CQnWzhEg.js";function Q(){const[w,v]=c.useState([]),[m,u]=c.useState(!1),[h,j]=c.useState("employee"),[g,N]=c.useState("30"),[i,D]=c.useState(""),{showNotification:y}=T();c.useEffect(()=>{R()},[]);const R=async()=>{try{const{data:e,error:r}=await d.from("departments").select("id, name").order("name");if(r)throw r;v(e||[])}catch(e){console.error("Error loading departments:",e)}},p=()=>{const e=new Date,r=parseInt(g);if(isNaN(r))return null;const s=new Date(e);return s.setDate(s.getDate()-r),s.toISOString()},k=async()=>{let e=d.from("employees").select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        position,
        employment_type,
        status,
        hire_date,
        departments!department_id (name)
      `).order("last_name");i&&(e=e.eq("department_id",i));const{data:r,error:s}=await e;if(s)throw s;return r?r.map(n=>{var a;return{"Employee ID":n.id,"First Name":n.first_name,"Last Name":n.last_name,Email:n.email,Phone:n.phone,Position:n.position,Department:((a=n.departments)==null?void 0:a.name)||"N/A","Employment Type":n.employment_type,Status:n.status,"Hire Date":l(new Date(n.hire_date),"yyyy-MM-dd")}}):[]},A=async()=>{let e=d.from("leaves").select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        leave_type,
        start_date,
        end_date,
        days,
        status,
        reason
      `).order("start_date",{ascending:!1});const r=p();r&&(e=e.gte("start_date",r)),i&&(e=e.eq("employees.department_id",i));const{data:s,error:n}=await e;if(n)throw n;return s?s.map(a=>{var o;return{"Leave ID":a.id,Employee:`${a.employees.first_name} ${a.employees.last_name}`,Department:((o=a.employees.departments)==null?void 0:o.name)||"N/A","Leave Type":a.leave_type,"Start Date":l(new Date(a.start_date),"yyyy-MM-dd"),"End Date":l(new Date(a.end_date),"yyyy-MM-dd"),Days:a.days,Status:a.status,Reason:a.reason||"N/A"}}):[]},S=async()=>{let e=d.from("attendance").select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        date,
        check_in,
        check_out,
        status,
        hours_worked
      `).order("date",{ascending:!1});const r=p();r&&(e=e.gte("date",r)),i&&(e=e.eq("employees.department_id",i));const{data:s,error:n}=await e;if(n)throw n;return s?s.map(a=>{var o;return{"Attendance ID":a.id,Employee:`${a.employees.first_name} ${a.employees.last_name}`,Department:((o=a.employees.departments)==null?void 0:o.name)||"N/A",Date:l(new Date(a.date),"yyyy-MM-dd"),"Check In":a.check_in||"N/A","Check Out":a.check_out||"N/A",Status:a.status,"Hours Worked":a.hours_worked||0}}):[]},C=async()=>{let e=d.from("performance_reviews").select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        review_period,
        rating,
        goals,
        achievements,
        areas_for_improvement,
        reviewer_notes
      `).order("review_period",{ascending:!1});const r=p();r&&(e=e.gte("review_period",r)),i&&(e=e.eq("employees.department_id",i));const{data:s,error:n}=await e;if(n)throw n;return s?s.map(a=>{var o;return{"Review ID":a.id,Employee:`${a.employees.first_name} ${a.employees.last_name}`,Department:((o=a.employees.departments)==null?void 0:o.name)||"N/A","Review Period":l(new Date(a.review_period),"yyyy-MM-dd"),Rating:a.rating,Goals:a.goals||"N/A",Achievements:a.achievements||"N/A","Areas for Improvement":a.areas_for_improvement||"N/A","Reviewer Notes":a.reviewer_notes||"N/A"}}):[]},E=async()=>{let e=d.from("payroll").select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        pay_period,
        basic_salary,
        allowances,
        deductions,
        net_salary,
        payment_date,
        payment_status
      `).order("pay_period",{ascending:!1});const r=p();r&&(e=e.gte("pay_period",r)),i&&(e=e.eq("employees.department_id",i));const{data:s,error:n}=await e;if(n)throw n;return s?s.map(a=>{var o;return{"Payroll ID":a.id,Employee:`${a.employees.first_name} ${a.employees.last_name}`,Department:((o=a.employees.departments)==null?void 0:o.name)||"N/A","Pay Period":l(new Date(a.pay_period),"yyyy-MM-dd"),"Basic Salary":a.basic_salary,Allowances:a.allowances,Deductions:a.deductions,"Net Salary":a.net_salary,"Payment Date":a.payment_date?l(new Date(a.payment_date),"yyyy-MM-dd"):"Pending","Payment Status":a.payment_status}}):[]},M=async()=>{let e=d.from("departments").select(`
        id,
        name,
        type,
        description,
        employees!department_id (count)
      `).order("name");i&&(e=e.eq("id",i));const{data:r,error:s}=await e;if(s)throw s;return r?r.map(n=>{var a,o;return{"Department ID":n.id,"Department Name":n.name,Type:n.type,Description:n.description||"N/A","Total Employees":((o=(a=n.employees)==null?void 0:a[0])==null?void 0:o.count)||0}}):[]},x=async e=>{u(!0);try{let r,s;switch(e){case"employee":r=await k(),s="employee-directory-report";break;case"leave":r=await A(),s="leave-report";break;case"attendance":r=await S(),s="attendance-report";break;case"performance":r=await C(),s="performance-report";break;case"payroll":r=await E(),s="payroll-report";break;case"department":r=await M(),s="department-report";break}r&&r.length>0?(P(r,s),y("success",`Report generated successfully! ${r.length} records exported.`)):y("warning","No data found for the selected criteria.")}catch(r){console.error("Error generating report:",r),y("error","Failed to generate report")}finally{u(!1)}},P=(e,r)=>{if(e.length===0)return;const s=Object.keys(e[0]),n=[s.join(","),...e.map(q=>s.map(I=>{var f;return`"${(((f=q[I])==null?void 0:f.toString())||"").replace(/"/g,'""')}"`}).join(","))].join(`
`),a=new Blob([n],{type:"text/csv;charset=utf-8;"}),o=document.createElement("a"),$=URL.createObjectURL(a);o.setAttribute("href",$),o.setAttribute("download",`${r}-${l(new Date,"yyyy-MM-dd")}.csv`),o.style.visibility="hidden",document.body.appendChild(o),o.click(),document.body.removeChild(o)},F=()=>{x(h)},L=[{id:"employee",name:"Employee Directory Report",description:"Complete list of all employees with their details",icon:b,color:"bg-blue-500"},{id:"leave",name:"Leave Report",description:"Summary of leave applications and balances",icon:G,color:"bg-green-500"},{id:"attendance",name:"Attendance Report",description:"Monthly attendance records and statistics",icon:U,color:"bg-cyan-500"},{id:"performance",name:"Performance Report",description:"Performance reviews and ratings summary",icon:O,color:"bg-orange-500"},{id:"payroll",name:"Payroll Report",description:"Salary disbursement and payroll summary",icon:V,color:"bg-red-500"},{id:"department",name:"Department Report",description:"Department-wise employee distribution",icon:b,color:"bg-teal-500"}];return t.jsxs("div",{className:"space-y-6",children:[t.jsxs("div",{children:[t.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:"Reports & Analytics"}),t.jsx("p",{className:"text-gray-600 mt-2",children:"Generate and download various reports in CSV format"})]}),t.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:L.map(e=>t.jsx("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow",children:t.jsxs("div",{className:"flex items-start space-x-4",children:[t.jsx("div",{className:`${e.color} p-3 rounded-lg`,children:t.jsx(e.icon,{className:"w-6 h-6 text-white"})}),t.jsxs("div",{className:"flex-1",children:[t.jsx("h3",{className:"text-lg font-bold text-gray-900 mb-2",children:e.name}),t.jsx("p",{className:"text-sm text-gray-600 mb-4",children:e.description}),t.jsx("button",{onClick:()=>x(e.id),disabled:m,className:"flex items-center space-x-2 text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed",children:m?t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"}),t.jsx("span",{className:"text-sm",children:"Generating..."})]}):t.jsxs(t.Fragment,{children:[t.jsx(_,{className:"w-4 h-4"}),t.jsx("span",{className:"text-sm",children:"Generate Report"})]})})]})]})},e.id))}),t.jsxs("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 p-6",children:[t.jsx("h2",{className:"text-xl font-bold text-gray-900 mb-4",children:"Custom Report"}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Report Type"}),t.jsxs("select",{value:h,onChange:e=>j(e.target.value),className:"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[t.jsx("option",{value:"employee",children:"Employee Report"}),t.jsx("option",{value:"leave",children:"Leave Report"}),t.jsx("option",{value:"attendance",children:"Attendance Report"}),t.jsx("option",{value:"performance",children:"Performance Report"}),t.jsx("option",{value:"payroll",children:"Payroll Report"}),t.jsx("option",{value:"department",children:"Department Report"})]})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Date Range"}),t.jsxs("select",{value:g,onChange:e=>N(e.target.value),className:"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[t.jsx("option",{value:"7",children:"Last 7 Days"}),t.jsx("option",{value:"30",children:"Last 30 Days"}),t.jsx("option",{value:"90",children:"Last 3 Months"}),t.jsx("option",{value:"365",children:"Last Year"}),t.jsx("option",{value:"all",children:"All Time"})]})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Department"}),t.jsxs("select",{value:i,onChange:e=>D(e.target.value),className:"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[t.jsx("option",{value:"",children:"All Departments"}),w.map(e=>t.jsx("option",{value:e.id,children:e.name},e.id))]})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Format"}),t.jsx("select",{disabled:!0,className:"w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed",children:t.jsx("option",{children:"CSV"})}),t.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"CSV format is currently supported"})]})]}),t.jsx("button",{onClick:F,disabled:m,className:"mt-6 flex items-center space-x-2 bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",children:m?t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"animate-spin rounded-full h-5 w-5 border-b-2 border-white"}),t.jsx("span",{children:"Generating Report..."})]}):t.jsxs(t.Fragment,{children:[t.jsx(_,{className:"w-5 h-5"}),t.jsx("span",{children:"Generate Custom Report"})]})})]})]})}export{Q as default};

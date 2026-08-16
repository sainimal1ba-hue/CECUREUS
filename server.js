//server.js
// connection code ,certain code snippits and Debugging is done with Open AI :CHAT GPT
const express = require('express');
const crypto = require("crypto");
const app = express();

app.use(express.json());
app.use((req, res, next) => {
    console.log("\n==============================");
    console.log("REQUEST RECEIVED");
    console.log("METHOD:", req.method);
    console.log("URL:", req.url);
    console.log("BODY:", req.body);
    console.log("==============================\n");

    next();
});
app.get('/test', (req, res) => {
    console.log("TEST ENDPOINT HIT");
    res.json({
        success: true,
        message: "CECUREUS backend is reachable"
    });
});
const mysql = require("mysql2/promise");
let db;
async function startServer() {
    try {
        //const db = await mysql.createConnection({
        db = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "12345678",
            database: "cecureus_dev"
        });
        console.log("DBMS_Connection_successful!");
        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    } catch (err) {
        console.log("FAILED_to_connect");
        console.log(err);
    }
}
startServer();
function otp_generator(){
    const chars = "1234567890";
    let otp_variable = "";
    for (let i = 0;i<6;i++){
        //let index = Math.floor(Math.random()*chars.length);
        const index = crypto.randomInt(0, chars.length);//secure otp generation
        otp_variable = otp_variable+(chars[index]);

    }
    return otp_variable;
}
function authenticate(phone_number){
    phone_number = phone_number.replaceAll(" ","");
    phone_number = phone_number.replaceAll("+91","");
    phone_number = phone_number.trim();
    if (phone_number.length == 10){
        phone_number = Number(phone_number);
        if(!isNaN(phone_number)){
            return ["pass",phone_number];
        
        }
        else {
            return ["phone number cannot contain characters",0] ;
        }
    }
    else{
        return ["phone number is of invalid length",0];
    }}

async function process_phone_number(phone_no){
    let phone_data = authenticate(phone_no);
    //phone_no = phone_data[1];
    try {
    if(phone_data[0]=="pass"){
        phone_no = String(phone_data[1]);
        const sql = `SELECT identifier FROM accounts WHERE identifier_type = ? AND identifier = ?;`;
        const sql2 = `SELECT identifier FROM otp_verification WHERE identifier_type = ? AND identifier = ? AND otp_request_time >= NOW() - INTERVAL 1 MINUTE;`;
        const sql4 = `SELECT identifier,verification_attempts, resend_attempts FROM otp_verification WHERE identifier_type = ? AND identifier = ?`;
        const sql3 =`DELETE from otp_verification WHERE identifier_type = ? AND identifier = ? AND otp_request_time <= NOW() - INTERVAL 1 MINUTE;`;
        const sql5 = `DELETE FROM otp_verification WHERE  verified = false AND otp_request_time < NOW() - INTERVAL 5 MINUTE;`;
        const values = ["phone", phone_no];
        const [results] = await db.execute(sql, values);
        const [results2] = await db.execute(sql2, values);
        const [results4] = await db.execute(sql4,values);
        const [results3] = await db.execute(sql3,values);  
        const [results5] = await db.execute(sql5,[]); //  DELETE-checkpoint-DELETE_all_expired_otp_that_is_not_verifier;
        console.log(results3);
        let verification_attempts = 0;
        let resend_attempts = 0;
        if (results.length === 0 && results2.length === 0){
               if (results4.length != 0){
                verification_attempts = Number(results4[0].verification_attempts);
                resend_attempts = Number(results4[0].resend_attempts);}
                //console.log(verification_attempts,resend_attempts)
                return [phone_no,"success",verification_attempts,resend_attempts];

        }
        else if (results2.length != 0){
            return ["invalid","RESEND AFTER 1 MINUTE."];
        }
        else{
        return ["invalid","This phone number alredy exists."];}
    }
    else {
        console.log("ERROR:",phone_data[0]);
        return ["invalid",phone_data[0]];
    } }
    catch (err){
    console.error(err);
    return ["invalid", "Database error"];}
};

function name_authenticate(name){
    let namelencheck = name;
    namelencheck = namelencheck.replaceAll(" ","");//to remove inbetween spaces for checking length of name
    const allowedchar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz. -'";
    let errorcode = "pass";
    let valid = true;
    let dot_count = 0;
    let dash_count = 0;
    let space_count = 0;
    let apostrophe_count = 0;
    //const setallowedchar = new Set(allowedchar);
    for (const ch of name){
        if(allowedchar.includes(ch)){
            if (ch == "."){dot_count +=1; }
            if (ch == "-"){dash_count +=1; }
            if (ch == " "){space_count +=1; }
            if (ch == "'"){apostrophe_count +=1; }
            //console.log(namelencheck);
            //console.log(namelencheck.length);
            if (namelencheck.length < 3 || namelencheck.length > 100){
                errorcode = "name length invalid";
                valid = false;
                break;
            }
            if( dot_count > 3 || dash_count > 2||space_count >6|| apostrophe_count >2 ){
                valid = false ;// for data quality and sql injection
                errorcode = "duplicates found in name,please avoid using'-','.','''or space multiple times";
                break;
            }
        }
        else{
            errorcode = "invalid charcters in name!";
            valid = false ;
            break;
        }
    }
    name = name.trim();
    if(name === ""){
        errorcode = "please provide a name";
        valid = false;
    }
    retlist = [valid,name,namelencheck,errorcode];
    return retlist ;}

function errormessageselection (phone_data,name_data){
    if (name_data == "pass"){
        return phone_data
    }
    else {
        return name_data
    }}
//const sql = "desc otp_verification";
//const values = [];

async function otp_verification (otp_given,phone_given){
    otp_given = otp_given.trim();
    try {
    const sql = `select generated_otp from otp_verification where generated_otp = ? AND identifier = ?;`;
    const sql2 = `select generated_otp from otp_verification where generated_otp = ? AND identifier = ? AND otp_request_time >= NOW() - INTERVAL 5 MINUTE;`;
    const sql3 = `DELETE FROM otp_verification WHERE verified = false  AND otp_request_time < NOW() - INTERVAL 5 MINUTE;`;
    const sql4 =`UPDATE otp_verification SET verification_attempts = verification_attempts + 1 WHERE identifier = ?;`; 
    const sql5 =`UPDATE otp_verification SET verified = TRUE WHERE identifier = ?;`;
    const sql6 =`select  verification_attempts from otp_verification where identifier = ?;`;
    //const sql7 =`DELETE FROM otp_verification WHERE identifier = ?; `;
    let value4 = [phone_given];
    //const sql3 = `insert into accounts();`;
    let values = [otp_given,phone_given];
    console.log("otp_given:", otp_given);
    console.log("phone_given:", phone_given);
    const [results6] = await db.execute(sql6, value4);
    const [results] = await db.execute(sql, values);
    const [results2] = await db.execute(sql2,values);
    values = [];
    const [results3] = await db.execute(sql3,values)//OTP EXPIRY CHECKPOINT - 2
    if (results.length != 0 ){
        if (results2.length != 0 && results6.length != 0 )
        {
            if( results6[0].verification_attempts < 5)
            {
            const[result5] = await db.execute(sql5,value4);
            return "otp_verified.";
            }
            else{
               // const[result7] = await db.execute(sql7,value4);
                return "TOO many verification attempts ! ,otp forced expired2";
            }
        }
        else {
            return "This otp has expired.";} }
    else {
        if (results6[0].verification_attempts < 5){
        const [results4] = await db.execute(sql4,value4);
        console.log(results4);
        return "incorrect otp.1";
     }
     else{
        return "TOO many verification attempts ! ,otp forced expired1";
     }
    }
    }
    catch(err)
    {
      console.log("DBMS_ERROR_DURING_VERIFICATION:");
      console.log(err);
    }
};
function generate_session_token(){
    const crypto = require("crypto");
    const sessionToken = crypto.randomUUID();// uuid avoids collision.
    console.log(sessionToken);
    return sessionToken;
}
async function check_credentials(given_password,given_userid){
    let valid = true;
    let errorcode = "success";
    given_password = given_password.trim();
    given_userid = given_userid.trim();
    const allowedchar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_!@#$%^&*()~`,./<>?;/=+";
    for (const ch of given_password){
        if(allowedchar.includes(ch)){
            //console.log(namelencheck);
            //console.log(namelencheck.length);
            if (given_password.length < 8 || given_password.length > 25){
                errorcode = "length invalid minimum of 8 and maximum of 25 charecters allowed! in password";
                valid = false;
                break;
            }
        }
        else{
            errorcode = "invalid chracters in password!!!";
            valid = false ;
            break;
        }
    }
    for (const userch of given_userid){
        if(allowedchar.includes(userch)){
             if (given_userid.length < 8 || given_userid.length > 35){
                errorcode = "length invalid minimum of 8 and maximum of 35 charecters allowed in userid";
                valid = false;
                break;
            }
        }
        else{
            errorcode = "invalid chracters in userid please avoid spaces or other invalid characters";
            valid = false ;
            break;
        }
    }
    const sql_cmd = `select * from accounts where  user_id  = ?;`;
    let val = [given_userid];
    const [resultcheck] = await db.execute(sql_cmd, val);
    if(resultcheck.length === 0){
    }
    else {
        valid = false;
        errorcode = "This user name is taken, please try a different one."
    }
    if(given_password === ""){
        errorcode = "please provide a password";
        valid = false;
    }
    else if (given_userid == ""){
        errorcode = "please provide a userid";
        valid = false;
    }
    let retlist = [valid,given_password,errorcode];
    return retlist ;}

async function createaccount(given_data){
    let useridcheck = await check_credentials(given_data["password"],given_data["userId"]);
    let dob = String (given_data["year"]) +"-"+ String(given_data["month"])+"-"+ String(given_data["day"]);
    //console.log("data reseaved :"+ given_data);
    console.log(dob);
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(given_data["password"], 12);
    const sql_cmdr = `select name,verified from otp_verification where identifier = ?`;
    let ph = given_data["identifier"];
    ph = authenticate(ph);
    ph = ph[1];
    const value_retreve = [ph];
    console.log(ph);
    const [result] = await db.execute(sql_cmdr, value_retreve);
const sql_cmd = `INSERT INTO accounts
(
    account_name,
    user_id,
    dob,
    identifier_type,
    identifier,
    password_hash,
    usertype,
    session_token,
    session_created_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());`;
const sql_cmd1 = `DELETE FROM otp_verification WHERE identifier = ?;`;
if (result.length !== 0 && useridcheck[0]){
let token = generate_session_token();
const value2 = [result[0].name,given_data["userId"],dob,given_data["identifier_type"],ph, hashedPassword,given_data["userType"],token];
if (result[0].verified){
    const [result2] = await db.execute(sql_cmd, value2);
    const [result3] = await db.execute(sql_cmd1, value_retreve);
    //let val = [given_userid];
    console.log(given_data);
    console.log(result2);
    console.log(result3);
    return [true,"account-created",token];
}
else{
    return [false ,"otp is not verified yet_account cannot be created!",""]
}
}
else {
    console.log("no otp verification done")
    return [false ,"otp is not verified yet_account cannot be created!",""]
}
}

async function handlclient_phone_otp(data){
    let condition = true ;
    let sql1 =`SELECT resend_attempts FROM otp_verification WHERE identifier = ?;`;
    let phone_no = authenticate(data['phone']);
    const value1 = [phone_no[1]];
    const [results1] = await db.execute(sql1, value1);
    let result1 = 0;
    if (results1.length != 0){
        result1 = results1[0].resend_attempts;}
    let otp = "Not provided"
    //console.log(req.body);
    //const data = req.body;
    let name = data['name'];
    const pho_data = data['phone'];
    let phone = ['pass',phone_no];
    if(result1 < 5){
        phone = await process_phone_number(pho_data);}
    let ret = name_authenticate(name);
    name = ret[1];
    let namevalid = ret[0];
    let namelencheck = ret[2];
    console.log(ret[3]);
    let statemessage = errormessageselection(phone[1],ret[3]);
    
    if (phone[0] != "invalid" && namevalid && result1<5)
    {
        otp = otp_generator();
        const otp_generation_time = Date.now(); //number of milliseconds since January 1, 1970 (UTC).
        //const FIVE_MINUTES = 5 * 61 * 1000; // one second fail_safe
        //const expiryTime = Date.now() + FIVE_MINUTES;
        const sql = `INSERT INTO otp_verification(
        identifier,
        name,
        generated_otp,
        identifier_type,
        verification_attempts,
        resend_attempts)
        VALUES(?,?,?,?,?,?);`;
        const values = [phone[0],name,otp,'phone',0,(phone[3]+1)];
        console.log(phone);
        console.log(values);
        const [results] = await db.execute(sql, values);
        console.log("results:",results);
        // connect to live server to get data on attempts ....
    }
    else{
        condition = false;
        if (result1>=5){
            statemessage = "Too many resend attempts_please try later";
        }
    }
    console.log("result1 =", result1);
    console.log("condition =", condition);
    console.log("statemessage =", statemessage);
    let returnlist = [condition,statemessage,otp,phone[0]];
    return returnlist;
}

app.post('/login', async (req, res) => {
    console.log('Received Data:');
    const data = req.body;
    let appointment = ["",""];
    console.log(data);
    let token = "";
    let verification_email = '';
    let condition = false ;
    let otp = 'not_provided1';
    let statemessage = "undefined_state";
    
    if (data['otpstage'] && data["operation"] === "verify_otp"){
        let verification_phone = authenticate(data['phone'])
        console.log('phone verification:',verification_phone[1])
        console.log('phone number',verification_phone[1])
        let res = await otp_verification(data['otp'],verification_phone[1]);
        if (res != "otp_verified."){
            condition = false
        }
        else {
            condition = true;
        }
        statemessage = res ;
        console.log(res);
    }
    else if (data["operation"]=== "Login"){
        let passw = data["password"]// unhashed password from user
        let sql_etv = `select  password_hash  from accounts where  user_id  = ?;`;
        let sql_etb = `select  login_attempts  from accounts where  user_id  = ?;`;
        let sql_eta = `update accounts set login_attempts = ? where user_id = ?;`;
        let sql_session = `update accounts set session_created_at = NOW();`;
        let sql_check_point = `update accounts set  login_attempts = 0 where session_created_at <= NOW() - INTERVAL 5 MINUTE;`;
        let value_f = [data["userId"]];
        const [rest_p] =  await db.execute(sql_etb,value_f);
        let rest_b = rest_p[0].login_attempts;
        const [rest_r] =  await db.execute(sql_etv, value_f);
        const bcrypt = require("bcrypt");
        const passwordMatches = await bcrypt.compare(
            passw,
            rest_r[0].password_hash);
      if (passwordMatches && rest_b < 5 ) {
        console.log("Password correct"); 
        token = generate_session_token();
        statemessage = "logged in";
        condition = true;
        let value_g = [0,data["userId"]];
        await db.execute(sql_eta,value_g);
        await db.execute(sql_session);}
    else if (rest_b >= 5){
        console.log("rate_limiting!")
        statemessage = "too many login attempts plz try again later"
        condition = false;
    }
     else {
        let value_d = [(rest_b + 1),data["userId"]];
        await db.execute(sql_eta,value_d);
        statemessage = "incorrect credentials";
        condition = false ;
        console.log("Password incorrect");}

    }
    else if(data["operation"]==="generate_otp"){
        console.log(data);
        let return_result = await handlclient_phone_otp(data);
        condition  = return_result[0];
        statemessage  = return_result[1];
        otp  = return_result[2];
        console.log(return_result[3]);
    }
    else if (data["operation"] === "check_Credentials"){
        ret_msg = await check_credentials(data["password"],data["userId"])//retlist = [valid,given_password,errorcode];
        statemessage = ret_msg[2];
        condition = ret_msg[0];}
    else if (data["operation"]==="CreateAccount"){
        console.log("operation aquired");
        let ret_mg = await createaccount(data);
        statemessage = ret_mg[1];
        condition = ret_mg[0];
        token = ret_mg[2];
    }
    else if(data["operation"]=== "retreve_name"){
        console.log("retreving_data")
        let sql_cmd_r = `select  account_name from accounts where  session_token = ? AND  user_id  = ?;`;
        let value_r = [data["token"],data["userId"]];
        const [res_r] =  await db.execute(sql_cmd_r, value_r);
        if(res_r.length !== 0){
            statemessage = res_r[0].account_name;
        }
        else {
            statemessage = ".";
        }
    }
   else if (data["operation"] === "book_appointment") {
    const sql_dum_retreve = `select account_id from accounts where  user_id = ? and session_token = ?;`;
    let val_dum = [data["userId"], data["token"]];
    const [result123] = await db.execute(sql_dum_retreve,val_dum);
    const ac_id = result123[0].account_id;
const sqlcm = `INSERT INTO sessions (
    account_id,
    consultant_category,
    preferred_language,
    booking_month,
    booking_day,
    time_slot,
    medium)
VALUES ( ? ,? ,? ,? ,? ,? ,? );`;
let val_u = [ac_id,data.category,data.language ,data.month,data.day, data.time ,data.medium];
    if (
        data.category &&
        data.language &&
        data.month &&
        data.day &&
        data.time &&
        data.medium
    ) {
    
const [rest] = await db.execute(sqlcm,val_u)
    condition = true;
    statemessage = "appointment request sent, you will be contacted shortly";
    console.log("placing in session:");
    console.log(rest);
    } 
    else {
        statemessage = "Please fill all the details for booking.";
    }
}
else if (data["operation"] === "showBooking"){
const sqla = `select account_id from accounts where  session_token  = ?;`;
const vala = [data["token"]];
const [resa1] = await db.execute(sqla,vala);
let id = resa1[0].account_id;
const sqld = `select booking_day , time_slot , booking_month from sessions where account_id = ?;`;
const vald = [id];
const [resa2] = await db.execute(sqld,vald);
console.log(resa2);
let final_string = "";
if(resa2.length !== 0){
    for (const booking of resa2) {
    final_string +=
        `Booking Day:  ${booking.booking_month}- ${booking.booking_day}\n` +
        `Time Slot: ${booking.time_slot}\n\n`;
}
}
else {
     final_string = "no booking history."
}
appointment = final_string ;
condition = true ;
}
    else {
        console.log("undefined_request!!!")
    }
    //console.log("name:",name,"phone:",phone,"otp:", otp );
    res.json({
        success: condition,
        message: statemessage,
        token : token,
        appointment: appointment
    });
    console.log("YOU'R OTP IS :",otp);
    console.log({
    success: condition,
    message: statemessage,
    token : token,
    appointment: appointment
});
});
// tast to compleate :
// rate limiting...........done.
// otp verification........done.
// otp storage.............done. 
// setup sql...............done.
// setup encryption model..done.
// set up AI model api.....virsion 2.
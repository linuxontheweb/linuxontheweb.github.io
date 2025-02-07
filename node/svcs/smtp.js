/*
let mailOptions = {
	from: `'First Last' <${EMAIL}>`, // sender address
	to: "seomone@somewhere.com", // list of receivers
	subject: "Test from me to you", // Subject line
	text: "Hello. If you are there, then let me know!!!" // plain text body
};
*/

const nodemailer = require("nodemailer");

const log = (...args)=>{console.log(...args)};

const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASSWORD;

if (!(USER && PASS)){
log("EMAIL_USER && EMAIL_PASSWORD NOT IN THE ENVIRONMENT!?!?!?");
return;
}

const transporter = nodemailer.createTransport({
	host: "smtp.mail.yahoo.com",
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: USER,
		pass: PASS
	},
	tls: {
	// do not fail on invalid certs
		rejectUnauthorized: false
	}
});

//log(`User: ${process.env.EMAIL_USER}`);
//log(`Pass: ${process.env.EMAIL_PASSWORD}`);

const getUser = ()=>{return USER;}
const sendMail = async(opts={})=>{
	opts.from = USER;
	const send=()=>{
		return new Promise((Y,N)=>{
			transporter.sendMail(opts, (error, info) => {
				if (error) {
					let s = error.toString();
					Y({error: s});
					return;
				}
				Y({id: info.messageId});
			});
		});
	};
	if (!(opts.to && opts.text && opts.subject)) return {error: "Missing one of: to, subject or text"};
	return await send();
}

module.exports={
sendMail,
getUser
};


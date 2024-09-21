/*
let mailOptions = {
	from: `'Dennis Kane' <${EMAIL}>`, // sender address
	to: "sbartfast3@gmail.com", // list of receivers
	subject: "Test from yahoo to gmail", // Subject line
	text: "Hello. If you are there, then let me know!!!" // plain text body
};
*/

const nodemailer = require("nodemailer");

const log = (...args)=>{console.log(...args)};
const transporter = nodemailer.createTransport({
	host: "smtp.mail.yahoo.com",
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD
	},
	tls: {
	// do not fail on invalid certs
		rejectUnauthorized: false
	}
});

//log(`User: ${process.env.EMAIL_USER}`);
//log(`Pass: ${process.env.EMAIL_PASSWORD}`);
const sendMail = async(opts={})=>{
	const send=()=>{
		return new Promise((Y,N)=>{
			transporter.sendMail(opts, (error, info) => {
				if (error) {
					let s = error.toString();
					Y({error: s});
					return;
				}
				Y({id: info.messageId});
//	console.log('Message sent: %s', info.messageId);
			});
		});
	};
//log(opts);
	if (!(opts.from && opts.to && opts.text && opts.subject)) return {error: "Missing one of: from, to, subject or text"};
	return await send();
}

module.exports={
sendMail
};


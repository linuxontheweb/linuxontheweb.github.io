
//«
const { ImapFlow } = require('imapflow');
const simpleParser = require('mailparser').simpleParser;
const log=(...args)=>{console.log(...args)};
//»

const client = new ImapFlow({//«
	host: 'imap.mail.yahoo.com',
	port: 993,
	secure: true,
	logger:false,
	auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
	}
});//»

const getMail = () => {//«
return new Promise(async(Y,N)=>{


let lock;
try {


// Wait until client connects and authorizes
await client.connect();
// Select and lock a mailbox. Throws if mailbox does not exist
lock = await client.getMailboxLock('INBOX');

// fetch latest message source. 
// client.mailbox includes information about currently selected mailbox. 
// "exists" value is also the largest sequence number available in the mailbox
let mess = await client.fetchOne(client.mailbox.exists, { source: true });
//let mess = await client.fetchOne(client.mailbox.exists, { envelope: true });

simpleParser(mess.source, {}, (err, parsed) => {
	if (err) return Y({error:err});
	else Y({message: parsed});
});

// list subjects for all messages
// uid value is always included in FETCH response, envelope strings are in unicode.
// for await (let message of client.fetch('1:*', { envelope: true })) {
//    console.log(`${message.uid}: ${message.envelope.subject}`);
// }

//log(`${mess.uid}: ${mess.envelope.subject}`);


} 
catch(error){
	Y({error});
} 
finally {
// Make sure lock is released, otherwise next `getMailboxLock()` never returns
	if (lock && lock.release) lock.release();
}
// log out and close connection
try{
	await client.logout();
}catch(e){
log("Caught client.logout() error!");
log(e);
}

});
};//»

module.exports={
	getMail
};


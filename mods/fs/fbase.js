(()=>{"use strict";const MODNAME="fs.fbase";

//Docs/Schema «

/* Firebase Docs «


Sort data

To retrieve sorted data, start by specifying one of the order-by methods to
determine how results are ordered:

Method	Usage
orderByChild()	Order results by the value of a specified child key or nested child path.
orderByKey()	Order results by child keys.
orderByValue()	Order results by child values.



Filtering data

To filter data, you can combine any of the limit or range methods with an
order-by method when constructing a query.

Method	Usage
limitToFirst()	Sets the maximum number of items to return from the beginning of the ordered list of results.
limitToLast()	Sets the maximum number of items to return from the end of the ordered list of results.
startAt()	Return items greater than or equal to the specified key or value, depending on the order-by method chosen.
startAfter()	Return items greater than the specified key or value depending on the order-by method chosen.
endAt()	Return items less than or equal to the specified key or value, depending on the order-by method chosen.
endBefore()	Return items less than the specified key or value depending on the order-by method chosen.
equalTo()	Return items equal to the specified key or value, depending on the order-by method chosen.
Unlike the order-by methods, you can combine multiple limit or range functions. For example, you can combine the startAt() and endAt() methods to limit the results to a specified range of values.

Limit the number of results

You can use the limitToFirst() and limitToLast() methods to set a maximum
number of children to be synced for a given event. For example, if you use
limitToFirst() to set a limit of 100, you initially only receive up to 100
child_added events. If you have fewer than 100 items stored in your Firebase
database, a child_added event fires for each item.

As items change, you receive child_added events for items that enter the query
and child_removed events for items that drop out of it so that the total number
stays at 100.

»*/

/* Schema «


{
"rules": {
	".read": false,
	".write": false,
	"LOTW": {
		"prof": {
			".indexOn": ["updated"], 
			".read": "auth != null",
			"$uid": {
				".write": "auth != null && auth.uid === $uid",
				".validate": "(!data.exists() && 
					newData.hasChildren(['updated', 'name', 'picture'])) || 
					(data.exists() && (
						newData.hasChildren(['updated', 'name']) || 
						newData.hasChildren(['updated', 'picture']) || 
						newData.hasChildren(['updated', 'status']) || 
						newData.hasChildren(['updated', 'bio'])
					))",
				"updated": {
					".validate": "newData.isNumber()" 
				},
				"name": {
					".validate": "newData.isString() && 
						newData.val() === auth.token.name"
				},
				"picture": {
					".validate": "newData.isString() && 
						newData.val() === auth.token.picture"
				},
				"status": {
					".validate": "newData.isString() && 
						newData.val().length < 100"
				},
				"bio": {
					".validate": "newData.isString() && 
						newData.val().length < 1000"
				},
				"$other": {
					".validate": false
				}
			}
		},
		"user": {
			"$uid": {
				".write": "auth != null && auth.uid === $uid",
				"nextGrpId": {
					".read": "auth != null && auth.uid === $uid",
					".validate": "newData.isNumber() && 
						(
							(data.exists() && newData.val() === data.val() + 1) || 
							(!data.exists() && newData.val() === 3)
						)"
				},
				"grpDefs": {
					".read": "auth != null",
					"$grpid": {
						".validate": "$grpid.matches(/^\\d+$/) && 
							newData.hasChildren(['name', 'desc'])",
						"name": {
							".validate": "newData.isString() && 
								newData.val().length > 1 && 
								newData.val().length < 16 && 
								newData.val().matches(/^[_a-zA-Z][_a-zA-Z0-9]+$/)"
						},
						"desc": {
							".validate": "newData.isString() && 
								newData.val().length < 100"
						},
						"$other": {
							".validate": false
						}
					}
				},
				"group": {
					"$grpid": {
						".validate": "$grpid.matches(/^\\d+$/)",
						"members": {
							".read": "auth != null && auth.uid === $uid",
							"$memid": {
								".validate": "newData.isBoolean()"
							}
						},
						"nextNodeId": {
							".read": "auth != null && auth.uid === $uid",
							".validate": "newData.isNumber() && 
								(
									(data.exists() && newData.val() === data.val() + 1) || 
									(!data.exists() && newData.val() === 1)
								)"
						},
						"lastUpdate": {
							".read": "auth != null && (
								($grpid === '1' && auth.uid === $uid) || 
								($grpid === '2') || 
								(auth.uid === $uid ||
									root.child('LOTW').child('user').child($uid).
									child('group').child($grpid).child('members').
									child(auth.uid).val() === true)
								)",
							".validate": "newData.hasChildren(['sessId', 'timestamp', 'desc'])",
							"sessId":{
								".validate": "newData.isString() && newData.val().length < 16"
							},
							"timestamp":{
								".validate": "newData.isNumber()"
							},
							"desc":{
								".validate": "newData.isString() && newData.val().length < 100"
							},
							"$other":{
								".validate": false
							}
						},
						"nodes": {
							".indexOn": ["parId", "path", "blobId"],
							".read": "auth != null && (
								($grpid === '1' && auth.uid === $uid) || 
								($grpid === '2') || 
								(auth.uid === $uid ||
									root.child('LOTW').child('user').child($uid).
									child('group').child($grpid).child('members').
									child(auth.uid).val() === true)
								)",
							"$nodeid": {
								".validate": "data.exists() || 
									newData.hasChildren(['parId', 'type', 'path'])",
								"parId": {
									".validate": "newData.isNumber()"
								},
								"path": {
									".validate": "newData.isString() && 
										newData.val().length < 100"
								},
								"type": {
									".validate": "!data.exists() && 
										newData.isString() && 
										newData.val().length < 5"
								},
								"blobId": {
									".validate": "newData.isNumber()"
								},
								"$other": {
									".validate": false
								}
							}
						},
						"blobs": {
							".read": "auth != null && (
								($grpid === '1' && auth.uid === $uid) || 
								($grpid === '2') || 
								(auth.uid === $uid ||
									root.child('LOTW').child('user').child($uid).
									child('group').child($grpid).child('members').
									child(auth.uid).val() === true)
								)",
							"$blobid": {
								".validate": "newData.hasChildren(['contents'])",
								"meta": {
									".validate": true
								},
								"contents": {
									".validate": "newData.isString() && 
										newData.val().length < 100000"
								},
								"$other": {
									".validate": false
								}
							}
						},
						"$other": {
							".validate": false
						}
					}
				},
				"$other": {
					".validate": false
				}
			}
		},
		"$other": {
			".validate": false
		}
	},
	"$other": {
		".validate": false
	}
}
}


»*/
/*Schema w/ folds and comments «

Take out commented lines with:
:'<,'>s/\/\/.*$//
Remove newlines with:
:'<,'>s/^\n\+//

{//«
"rules": {
	".read": false,
	".write": false,
	"LOTW": {
		"prof": {// User-to-user discovery via queries «
			".indexOn": ["updated"], // Also: 'votes'
			".read": "auth != null",
			"$uid": {//«
				".write": "auth != null && auth.uid === $uid",
				".validate": "(!data.exists() && //«
					newData.hasChildren(['updated', 'name', 'picture'])) || 
					(data.exists() && (
						newData.hasChildren(['updated', 'name']) || 
						newData.hasChildren(['updated', 'picture']) || 
						newData.hasChildren(['updated', 'status']) || 
						newData.hasChildren(['updated', 'bio'])
					))",//»
				"updated": {//«
					".validate": "newData.isNumber()" // serverTimestamp()
				},//»
				"name": {//«
					".validate": "newData.isString() && 
						newData.val() === auth.token.name"
				},//»
				"picture": {//«
					".validate": "newData.isString() && 
						newData.val() === auth.token.picture"
				},//»
				"status": {//«
					".validate": "newData.isString() && 
						newData.val().length < 100"
				},//»
				"bio": {//«
					".validate": "newData.isString() && 
						newData.val().length < 1000"
				},//»
				"$other": {//«
					".validate": false
				}//»
			}//»
		},//»
		"user": {// User data is organized into "access groups" «
			"$uid": {
				".write": "auth != null && auth.uid === $uid",
// Group numbers ($grpid) «
// Group 1: private, owner readable
// Group 2: public, authenticated user readable
// Groups 3+: member readable: members are in users/$uid/groups/$grpid/members 
//»
				"nextGrpId": {//«
					".read": "auth != null && auth.uid === $uid",
					".validate": "newData.isNumber() && //«
						(
							(data.exists() && newData.val() === data.val() + 1) || 
							(!data.exists() && newData.val() === 3)
						)"//»
				},//»
				"grpDefs": {//«
					".read": "auth != null",
					"$grpid": {//«
						".validate": "$grpid.matches(/^\\d+$/) && 
							newData.hasChildren(['name', 'desc'])",
						"name": {//«
							".validate": "newData.isString() && 
								newData.val().length > 1 && 
								newData.val().length < 16 && 
								newData.val().matches(/^[_a-zA-Z][_a-zA-Z0-9]+$/)"
						},//»
						"desc": {//«
							".validate": "newData.isString() && 
								newData.val().length < 100"
						},//»
						"$other": {//«
							".validate": false
						}//»
					}//»
				},//»
				"group": {//«
					"$grpid": {//«
						".validate": "$grpid.matches(/^\\d+$/)",
						"members": {//«
							".read": "auth != null && auth.uid === $uid",
							"$memid": {
								".validate": "newData.isBoolean()"
							}
						},//»
						"nextNodeId": {//«
							".read": "auth != null && auth.uid === $uid",
							".validate": "newData.isNumber() && //«
							(
							(data.exists() && newData.val() === data.val() + 1) || 
							(!data.exists() && newData.val() === 1)
							)"//»
						},//»
						"lastUpdate": {//«
							".read": "auth != null && (//«
								($grpid === '1' && auth.uid === $uid) || 
								($grpid === '2') || 
								(auth.uid === $uid ||
									root.child('LOTW').child('user').child($uid).
									child('group').child($grpid).child('members').
									child(auth.uid).val() === true)
								)",//»
							".validate": "newData.hasChildren(['sessId', 'timestamp', 'desc'])",
							"sessId":{//«
								".validate": "newData.isString() && newData.val().length < 16"
							},//»
							"timestamp":{//«
								".validate": "newData.isNumber()"
							},//»
							"desc":{//«
								".validate": "newData.isString() && newData.val().length < 100"
							},//»
							"$other":{//«
								".validate": false
							}//»
						},//»
						"nodes": {//«
							".indexOn": ["parId", "path", "blobId"],
							".read": "auth != null && (//«
								($grpid === '1' && auth.uid === $uid) || 
								($grpid === '2') || 
								(auth.uid === $uid ||
									root.child('LOTW').child('user').child($uid).
									child('group').child($grpid).child('members').
									child(auth.uid).val() === true)
								)",//»
							"$nodeid": {//«
								".validate": "data.exists() || 
									newData.hasChildren(['parId', 'type', 'path'])",
								"parId": {//«
									".validate": "newData.isNumber()"
								},//»
								"path": {//«
									".validate": "newData.isString() && 
										newData.val().length < 100"
								},//»
								"type": {//«
									".validate": "!data.exists() && 
										newData.isString() && 
										newData.val().length < 5"
								},//»
								"blobId": {//«
									".validate": "newData.isNumber()"
								},//»
								"$other": {//«
									".validate": false
								}//»
							}//»
						},//»
						"blobs": {//«
							".read": "auth != null && (//«
								($grpid === '1' && auth.uid === $uid) || 
								($grpid === '2') || 
								(auth.uid === $uid ||
									root.child('LOTW').child('user').child($uid).
									child('group').child($grpid).child('members').
									child(auth.uid).val() === true)
								)",//»
							"$blobid": {//«
								".validate": "newData.hasChildren(['contents'])",
								"meta": {//«
									".validate": true
								},//»
								"contents": {//«
									".validate": "newData.isString() && 
										newData.val().length < 100000"
								},//»
								"$other": {//«
									".validate": false
								}//»
							}//»
						},//»
						"$other": {//«
							".validate": false
						}//»
					}//»
				},//»
				"$other": {//«
					".validate": false
				}//»
			}
		},//»
		"$other": {//«
			".validate": false
		}//»
	},
	"$other": {//«
		".validate": false
	}//»
}
}//»

»*/
/* Workflow «

1) Check for existence of prof/$uid/updated

If not, get profile, and do:
let ref = fbase_db_mod.ref(fbase_db, "LOTW");
let obj = {};
obj[`prof/${uid}`] = {updated, name, picture};
obj[`user/${uid}/nextGrpId`] = 3;
update(ref, obj);

2) We might have *mounted* the user group dirs without ever actually
writing to them, which means they don't (yet) technically exist.

»*/

//»


// mkNewFile: is @HDJSAKRNT right?!?!?!

/*8/28/26 Get setBlob to work «

USERGRP.setBlob

»*/

/* 8/27/26: Developing a NICE WORKFLOW... «

4 different kinds of directories:

MNT_FS_TYPE (a list of "mounted" dirs):
1) Mount '/mnt' in sys/fs.js://«
MNT_FS_TYPE: The type of /mnt itself. This is wholly a "local" type whose
contents depend on calls such as in step #2 below.
Always fully populated, only system level JS can currently update this, but
we may eventually implement mount/unmount commands.
//»

FBASE_USERS_FS_TYPE (a list of fbase users: they at least had to log into
Google while in LOTW):
2) Mount '/mnt/fbase' in init @WYRHTKGH//«
FBASE_USERS_FS_TYPE: Nothing but the listing of users goes in here
Populating of this directory means choosing from the listing of users
returned from LOTW/prof. It may be possible to "continue" populating this
by searching for users based on additional/expanded criteria.
//»

FBASE_USER_MAIN_FS_TYPE (a list of profile files, group directories, 
and possibly more):
3) Mount '/mnt/fbase/<a_username>' in populate_fbase_users @YFKMYOGJT «
FBASE_USER_MAIN_FS_TYPE: The "base" user directory, which keeps the
separate "group" directories ('pub', 'prv', etc.) as well as "profile" files
like 'name', 'picture', etc, and maybe even 'status'. Once this is populated,
this probably shouldn't need to be repopulated. Caveat: there might be additional
dir_groups's added (or removed) since when the directory was first mounted.
WE DON'T CURRENTLY SUPPORT THE MOUNTING OF ARBITRARY MEMBER-BASED DIRECTORIES, WE
CURRENTLY SUPPORT ONLY 'PUB' (WORLD READABLE) AND 'PRV' (OWNER READABLE). To 
support the mounting of arbitrary groups, we will need to query the path: 
'LOTW/user/$uid/grpDefs', to get the following array:
[
	{
		<grp_id_1>: { name_1, desc_1 } 
	},
	{
		<grp_id_2>: { name_2, desc_2 } 
	},
	...
]
But in order to do *this*, we will probably want a dedicated fbase filesystem
administrator command library, e.g. at coms/fbase.js.

//»

FBASE_USER_GRP_FS_TYPE (each is a kind of "sovereign" root filesystem):
4) Mount '/mnt/fbase/<a_username>/<dir_group>' in populate_fbase_user_dir «
@YGJDPLKIU
FBASE_USER_GRP_FS_TYPE: The individual "groups" with their various backend
r/w permissions. In the front-end, these (currently) default to dir.perm = true.
These should work exactly as (the standard, local) OP_FS_TYPE in the LOTW system,
in terms of populating the full directories with 'ls' and trying to get single
"kids" when requesting single files when the directories are not (yet) fully
populated.
//»


What sorts of interface mechanisms do we want for this?
Obviously: a command library at coms/fbase.js should suffice.

The library should verify that /mnt/fbase is mounted and in working order.
If not, it should allow for the mounting of it, as well as whatever
diagnostics/maintenance might be needed for its well-oiled usage.


Now, how to create a new file @HEREMKNEW?
We need to:
let obj = {};
let path = `LOTW/user/$uid/group/$grpId`;
obj["nextNodeId"] = next_node_id;
let parId = 123 //...;
let path = `${parId}/${name}`;
let type = FILE_NODE_TYPE;
let blobId = NULL_FBASE_RTDB_BLOB; // standard null blob
obj[`nodes/${next_node_id}`] = {
	parId,
	path,
	type,
	blobId
};

For "real" blobIds, let's just use huge numbers (like the millisecond timestamp).
Those values are not as "important" as the node values because they are completely
"owned" by the nodes.


//»*/
/* 8/26/26: Now *really* back ?!?!?«

I've had *tons* of meditation upon (as well as doing *plenty* of work on)
everything related to the dynamics of nodes and dependencies thereof (Icons).

Now I am back to thinking in terms of the *assumption* of basically working
mechanisms of a browser-based OS, such that we can now extend the functionality
via...

Okay, how to do the initial making of a user profile?


RIGHT NOW THE BLOCKING POINT IS:

populate_fbase_users:

let ref = fbase_db_mod.ref(fbase_db, "LOTW/prof");
let c1 = fbase_db_mod.orderByChild('updated');
let c2 =fbase_db_mod.limitToLast(25);
let q = fbase_db_mod.query(ref, c1, c2);

let snap = await fbase_db_mod.get(q);

@WEJKRLJS
if (!snap.exists()){
// BARF!!!
return;
}

This should be considered an "EXISTENTIAL" ISSUE, meaning that the site
maintainer/administrator has not actually done the first thing to initialize
the backend.

So we can:

Do a "touch" on "LOTW/prof/$uid"

newData.hasChildren(['updated', 'name', 'picture']))



validation.ts:122 Uncaught (in promise) Error: equalTo failed: value argument
contains undefined in property:
 - LOTW.user.FgiH6QEFncUo10iF7BekOYC4DTj2.group.1.nodes
 - LOTW.user.FgiH6QEFncUo10iF7BekOYC4DTj2.group.2.nodes

I guess we need to instantiate both of these first 


@HOPORNKER:

at DirNode.populate_fbase_user_grp_dir (fbase.js?v=7998040:1765:22)
at DirNode.loadKids (fs.js:1461:20)
at do_path (shell.js?v=2349283:3034:14)
at async com_ls.run (shell.js?v=2349283:3112:3)


@UKHFAJFUE: Could not initialize all of the fields in the different
user fs groups, e.g. 'prv' and 'pub'.


As regards setting front-end permissions for the user directories, we are simply
setting them to ALWAYS TRUE (i.e., @HEREPUBPERM and @HEREPRVPERM), because we
are never assuming *anything* about backend logic here in the frontend. Everyone
is welcome, per frontend customs, to *try* to do anything they want to the backend.
»*/

// Old Notes «

/* BUG BUG BUG: 8/27/26«


Let's just want to pull down the nextNodeId just before
doing the given operation, in order to reduce the complexity inherent
in keeping state sync'ed for no good earthly reason.

Call await NEXT_NODE_ID(<dir_id>);
@YURJKFHFN


This is simply restatement of the note of 7/20/26.
We need to implement mkNewFile and mkDir:
in FBASE_USER_GRP_FS_TYPE @YGJDPLKIU.

WE JUST NEED TO IMPLEMENT mkDir (mkdir) and mkNewFile (touch) @EURKSDNR!!!

So let's start this journey by thinking analytically.

First, we need to see if the given nodes exist. So we need to 
fully populate the dirobj and see if a FSNode with the given name
already exists.

If not, we are free to create the given node (file or dir) with the
nextNodeId. In case we are using the wrong id, we need to resync to
the backend.

But we should have already sync'ed w/ the backend somewhere during
initialization!!!


So how do we pull down the nextNodeId?
path = 'LOTW/user/$uid/group/$grpId/nextNodeId'

»*/
/* 7/21/26 - 8/25/26: NICE BIG BREAK... «

... inclluding a 10-day stint at Meridian, engaged in such activities
as explicitly threating a certain officer of a certain state. I'm not
saying it was the right thing to do, I'm just saying it was what it was.

PERIOD.

»*/
/* 7/20/26: WHAT ABOUT mkDir and mkNewFile?  «

***WE STILL NEED TO IMPLEMENT THOSE BASIC FUNCTIONS***

Should we not implement them as methods on the given parent DirNode's,
which take a name (e.g. no internal slashes allowed) as argument?

This is just a minor "update" to the current way, which takes the parents
as the first arg to mkDir and touchFile (which should be renamed to mkNewFile).

nextNodeId: kept under $grpid
/user/$uid/group/$grpid/nextNodeId


»*/
/* 7/19/26: Write to user/$uid/group/$grpid/lastUpdate instead of using "sessId"  «

To indicate to other devices that their own versions might be out-of-sync 
with the backend, just have listeners on: 
'user/$uid/group/$grpid/lastUpdate', which can include:
	- sessId: a random, locally generated id string
	- timestamp: serverTimestamp()
	- desc: textual description up to 100 chars

THE POINT BEING THAT I'M SICK OF THINKING OF SUPER SECRET THINGS (LIKE SESSION
IDS) THAT ARE SUPPOSEDLY CAPABLE OF MAKING *EVERYTHING* WORK "PERFECTLY", AS
LONG AS YOU "STICK WITH THE PROGRAM".

We can *always* write to this during every structure-changing update (not
simply updating the contents of a file), and all stale sessions will know that
they are invalid, and we can 

	- force a resync by wiping out the child nodes, and removing the done property
	- refuse to do any writing until the resync is done


So now the only complex validations are the reads in:

user/$uid/group/$grpid/[lastUpdate|nodes|blobs]:

auth != null && (
	($grpid === '1' && auth.uid === $uid) ||  // private: owner only
	($grpid === '2') || // public: the world
	(auth.uid === $uid || // owner or member
		root.child('LOTW').child('user').child($uid).
		child($grpid).child('members').
		child(auth.uid).val() === true)
	)

»*/
/* 7/18/26: Rule cascading, "outer" vs "inner" rules, etc «

My use case is this. I am implementing randomized "session ids" in the client,
so that the same logged in user will have different ids for different devices,
and I don't want the programmatic interface to have any way of "stealing" the
ids of other sessions, even if they all technically "belong" to the same user.
So I am marking the ids as unreadable to the application, even as the security
rules perform validation based on their values.

//«
Your strategy of locking down .read access while using internal rule validation
is an excellent, highly secure approach for isolating device sessions. Firebase
security rules will perfectly enforce this because their internal "root power"
reading capabilities do not leak back to the application layer.Since your goal
is to prevent a compromised client or programmatic interface from "stealing" or
brute-forcing other active session IDs belonging to the same user, you must
structure your rules and data paths to avoid common Firebase
pitfalls.Recommended Security Rules ArchitectureTo completely isolate these
sessions, organize your database path by nesting the session data under the
user's ID, and strictly enforce auth.uid alongside write-only permissions.

{
  "rules": {
    "user_sessions": {
      "$uid": {
        // Enforce that a user can only access their own session tree
        ".write": "auth !== null && auth.uid === $uid",
        // Prevent listing all session IDs under this user
        ".read": false, 
        
        "$session_id": {
          // Optional: Allow the client to read its OWN specific session data if it already knows its randomized ID
          ".read": "auth !== null && auth.uid === $uid",
          // The client can create or update its own session slot
          ".write": "auth !== null && auth.uid === $uid",
          // Enforce business logic using internal data snapshots
          ".validate": "newData.hasChildren(['device_token', 'last_active'])"
        }
      }
    }
  }
}

Critical Security Mechanics for Your Use Case

No List (Shallow) Leaks: By setting .read: false at the $uid level, you prevent
a client from issuing a once() or on() query on /user_sessions/YOUR_USER_ID.
The Firebase server will instantly reject the request, ensuring the client can
never pull a list of other active $session_id keys.

Direct Path Knowledge Requirement: If you choose to set .read: true deeper at
the $session_id level, a client can only read data if it already knows its
exact, randomized cryptographic ID (e.g., /user_sessions/$uid/$session_id). It
cannot fish for other sessions because Firebase Realtime Database rules do not
filter data—they are all-or-nothing for the exact path requested.

Validation Isolation: Your other database paths can safely use
root.child('user_sessions').child(auth.uid).child(newData.child('session_id').val()).exists()
to verify a session is valid. The rules engine handles this entirely
server-side.

Mitigating the "Blind Write" Risk

Because a user has .write: true under their $uid path, a compromised client
could technically attempt a "blind write" attack by guessing a random string
and trying to overwrite or delete a session ID slot (e.g., sending a delete
request to a guessed path).

To prevent a client from destroying or altering another device's session data
blindly, use a create-only validation rule to protect existing slots:

"$session_id": {

  // Prevent overwriting/deleting existing session slot unless explicitly allowed
  
  ".validate": "!data.exists() && newData.hasChildren(['created_at'])"
}
//»



Tell me more about all this stuff.

//«
Realtime Database rules have a distinct logical landscape, and mastering the
shift from broad queries to atomic path operations is usually the exact moment
developers unlock its full security potential.

To cement this lesson completely, here is the exact mental model of how the
Firebase engine treats "outer" (shallow) paths versus "inner" (nested) paths
during client requests.

1. The Cascading Rule: "Read Permissions Flow Down"

In Firebase Realtime Database, .read and .write rules are top-down. If you
grant permission at a parent node, you cannot revoke it at a child node.

The Trap: If you put .read: true at /users, a client can read all data for
every user. Putting .read: false inside /users/$uid will do absolutely nothing.

The Rule: Permission cascades. Once access is granted, it is unlocked for
everything underneath it.


2. The Query Rule: "Rules Are Not Filters"

This is the "outer" rule behavior that catches most developers off guard. When
a client attaches a listener or runs a query on an outer path, Firebase checks
the rule only at that exact outer path.

The Behavior: If a client requests db.ref('user_sessions/user123'), Firebase
checks the .read rule at user_sessions/user123.

The Result: If that specific path is .read: false, Firebase rejects the entire
request immediately with "Permission Denied." It will not scan the inner
children to see if some of them are marked true. Firebase requires permission
for the entire chunk of data you are asking for.


3. The Atomic Path Rule: "Direct Knowledge Access"

This is the "inner" rule behavior you are leveraging for your session
isolation.

The Behavior: If the outer path is .read: false, but an inner path like
user_sessions/user123/session_abc123 is .read: true, the client can still
access the data—but only if it requests that exact atomic path directly.

The Result: 
Running db.ref('user_sessions/user123/session_abc123').once('value') will succeed
perfectly. Because the client provided the exact key, Firebase bypasses the
blocked outer node and evaluates the rule directly at that specific inner node.


Summary Checklist for Your Architecture

Operation Type	Target Path						Outer Rule 				Inner Rule 				Result
												(user_sessions/$uid)	($session_id)	

List/Query		/user_sessions/user123			.read: false			Not evaluated			❌ Blocked (Protects other sessions)

Atomic Read		/user_sessions/user123/guess125	.read: false			.read: true (if exists)	❌ Blocked (If guess is wrong)

Atomic Read		/user_sessions/user123/actualId	.read: false			.read: true				Allowed (Device knows its own ID)

Rule Validation	Internal Server					Bypasses completely		Uses Root Power			Allowed (Reads any data instantly)
//»

»*/
/* 7/17/26: Need to update the schema, so that nodes and blobs are in $grpid «

We are currently only validating the sessId fields with updates/additions to:
	- $grpid/nodes 
	- $grpid/blobs

... but not:
	- $grpid/members



»*/
/* 7/15/26: HOW TO DEWEMPT «

NO "USERNAMES": They are like vestigal tails.


Need a local (JSON) cache of user profiles, returned from queries 
to the users schema @SHYTUYOK:

const FBASE_USERS_CACHE_PATH = "/var/cache/fbase/users";


@WYRHTKGH: The init phase of this module needs to return a DirNode
(to the caller in sys/fs.js, which will "physically" mount it) that 
includes options for:
	- type (FBASE_USERS_FS_TYPE == "fbase-users")
	- popDir (populate_fbase_users)
	- tryGetKid(name): 
		await users_dir.loadKids(); 
		return users_dir.getKid(name);







This popDir will then need to create DirNodes that have their own popDir
methods, in order to mount the various permission-levels, whether:

(type FBASE_USER_DIR_FS_TYPE == "fbase-user-dir")
	- profile files: e.g. /mnt/fbase/<username>/status
	- private (groupId=1): e.g. /mnt/fbase/<username>/prv
	- public (groupId=2): e.g. /mnt/fbase/<username>/pub
	- group (groupId=3+): e.g. /mnt/fbase/<username>/mygroup

Those DirNode's, will in turn have there own "standard" popDir methods,
based simply on the groupId's in question.

(type FBASE_USER_GRP_FS_TYPE == "fbase-user-grp")



»*/
/* 7/14/26: System for looking up users «

No need to do username updating.
In fact, no need to implement "usernames".

We don't even need a username->uid mapping

If the only user lookup procedure is a query(), like such:

let c1 = orderByChild('time');
let c2 = limitToLast(num_recent_stats);
let ref = REF("LOTW/status");
let q = query(ref, c1, c2);
... then the very fact that we are using indexes means that the actual 
keys are irrelevant.

SO: ALL WE REALLY NEED TO DO IS indexOn:
//SHYTUYOK
"users": {
	".indexOn": ["votes", "updated"],
	".read" : "auth != null",
	"$uid": {
		".write" : "auth != null && auth.uid === $uid",
		"name": {
// user.displayName
			".validate": "newData.isString() && newData.val() === auth.token.name"
		},
		"picture":{
//user.photoURL
			".validate": "newData.isString() && newData.val() === auth.token.picture"
		},
		"status":{
			".validate": "newData.isString() && newData.length <= 100"
		}
		"bio":{
			".validate": "newData.isString() && newData.length <= 1000"
		},
		"updated": {
			".validate": "newData().isNumber()"
		},
		"votes": 123
	},
	"uid_xyz789": {
		"name": "Bob Jones",
		"status": "[How I'm doing now]",
		"bio": "Designer.",
		"picture": "https://...".
		"updated": 134567890,
		"vores": 1
	}
}


auth object structure:

{
  "uid": "string",
  "provider": "string", 
  "token": {
    "aud": "string",
    "auth_time": "number", // initial login time
    "exp": "number",
    "firebase": {
      "identities": {
        "email": ["string"],
        "google.com": ["string"],
        "facebook.com": ["string"]
      },
      "sign_in_provider": "string" // auth.provider
    },
    "iat": "number",
    "iss": "string",
    "sub": "string",
    "email": "string",
    "email_verified": "boolean",
    "name": "string",
    "picture": "string",
    "phone_number": "string"
  }
}

curuser.displayName == auth.token.name
curuser.email == auth.token.email
curuser.photoURL == auth.token.picture


»*/
/* 7/13/26: Starting fresh with a strict class-based mindset «

STARTING ANEW: We are now in: mods/fs/fbase.js

LOTW.globals.firebase:
{
	config : {apiKey, authDomain, databaseURL, projectId, appId, ...},
	appUrl, authUrl, dbUrl 
}


How to store extra info do we need on fs nodes:


Before, we seemed to keep the github id's in an (public) appData object
on the parent DirNode's.

Let's change this to a generic private field called #data, which can get
passed via the constructor's opts,
new DirNode(name, par, {
	data: { // Stored in node.#data
		fbaseUid:"..."
	}
});

Then we if we need external access, can have a getData(which) that does:
return this.#data[which].

JUST ADDED THIS ONTO FSNode.


»*/
/* 7/12/26: Let's start with public and private filesystems «
Then, think about how to implement groups, like below

$uid: {
	sessId:{},
	curSessId:{},
	nextGroupId:{
// Start with 3
		".validate": "newData.isNumber() && (
			(!data.exists() && newData().val()===3) || 
			(data.exists() && newData().val() == data.val()+1)
		)"
	},
	nextNodeId:{},
//OLSHGTNSJ
	grpDefs: {
		".read": "auth != null",
		".write": "auth != null && auth.uid === $uid",
		"$grpid": {
			name: {
				".validate" : " [Match: /Some pattern here/] "
			},
			tags: {
				"$tagid": {
					".validate": "$tagid.matches(/.../)"
				}
			},
			members: {
				uid_abcdefg: true,
				// ...
			},
			"$other": {
				".validate": false
			}
		}
	},
	group: {
		".write": "auth != null && auth.uid === $uid",
		"1": { // Private: owner r/w
			".read": "auth != null && auth.uid === $uid",
			nodes:{},
			blobs:{},
			"$other": {
				".validate": false
			}
		},
		"2": { // Public: owner r/w, world read
			".read": "auth != null",
			nodes:{},
			blobs:{},
			"$other": {
				".validate": false
			}
		},
		"$grpid": { // Group: owner r/w, group member read
			".read": "auth != null && (
				auth.uid === $uid || 
root.child('LOTW').child($uid).child('grpDefs').child($grpid).child('members').
														child(auth.uid).exists()
			)",
			"nodes":{},
			"blobs":{},
			"$other": {
				".validate": false
			}
		}
	}
}

"your_collection": {
  "$keyname": {
    ".validate": "$keyname.matches(/^prefix_[a-zA-Z0-9]+$/) && newData.val().matches(/^[a-zA-Z0-9_.-]+$/)"
  }
}

Note on Escaping: If you ever need to use a backslash in your RegEx inside a
JSON rule string (like \d for digits), you have to escape the backslash for
JSON compliance, resulting in a double backslash: \\d.

»*/
/* 7/11/26: Thinking about the simplest possible user id scheme «


I'm really just contemplating the ways to devise the most dead simple method of
implementing a users schema. To access another user's readable data, a logged
in user will need to know whatever "user id" permanently identifies the given
user. There should be a way for users to arbitrarily change their current
usernames so that the new one points to the permanent user id.


To map mutable usernames to permanent user IDs efficiently in Firebase Realtime
Database, the standard and most performant pattern is to use a reverse lookup
index.Because Firebase lacks native relational joins, you create a dedicated
database node that acts as a pointer map. This gives you an O(1) constant-time
lookup without needing to scan your entire database or use complex logic.

The Recommended Schema

You split your data into two main nodes: one for the core user profiles (keyed
by permanent IDs) and one for the username registry (keyed by the mutable
usernames).

{
  "users": {
    "uid_abc123": {
      "username": "coder_99",
      "displayName": "Alice Smith",
      "bio": "Hello world!"
    },
    "uid_xyz789": {
      "username": "pixel_art",
      "displayName": "Bob Jones",
      "bio": "Designer."
    }
  },
  "usernames": {
    "coder_99": "uid_abc123",
    "pixel_art": "uid_xyz789"
  }
}

How a User Looks Up Another User

To find a user by their current username, your application performs a quick
two-step read:

1) Fetch the value at usernames/coder_99. This returns the permanent ID: 
"uid_abc123".

2) Fetch the profile at users/uid_abc123.

The "Dead Simple" Username Change (Atomic Write)

To allow a user to arbitrarily change their username, you must perform three
actions simultaneously

1) Ensure the new username is not already taken.
2) Write the new username to the user's permanent profile.
3) Delete the old username from the registry so someone else can claim it.

You can achieve this in a single, atomic server request using update() combined
with database security rules. This completely bypasses the need for server-side
counters, increments, or transactions.


The Client-Side Code:

import { ref, update } from "firebase/database";

async function changeUsername(uid, oldUsername, newUsername) {
  const updates = {};
  
  // 1. Claim the new username in the registry
  updates[`usernames/${newUsername}`] = uid;
  
  // 2. Free up the old username
  updates[`usernames/${oldUsername}`] = null;
  
  // 3. Update the permanent profile
  updates[`users/${uid}/username`] = newUsername;

  // Execute all three changes atomically on the server
  await update(ref(db), updates);
}

The "Free" Validation via Security Rules

To make sure a user cannot accidentally steal someone else's username during
this update, you enforce uniqueness directly in your Firebase Security Rules.
The server evaluates these rules instantly before committing the write.

{
  "rules": {
    "usernames": {
      "$username": {
        // Only allow writing if the username is completely empty (not taken),
        // OR if the current authenticated user already owns this specific mapping.
        ".write": "!data.exists() || data.val() === auth.uid",
        ".validate": "newData.val() === auth.uid"
      }
    },
    "users": {
      "$uid": {
        // Users can only edit their own permanent profile node
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}

Why this beats server-side IDs

No Race Conditions: If two users try to claim "superstar" at the exact same
millisecond, the security rules guarantee that whichever request hits the
server first wins. The second request is rejected instantly.

Completely URL-Safe: Because the usernames node uses the username as the key,
your client-side routing becomes incredibly simple (e.g., fetching
usernames/my_username to load a profile page).



TO STOP DELETION
// 1. Must be empty OR owned by the user
// 2. AND the incoming data MUST exist (blocks 'null' deletes)
".write": "(!data.exists() || data.val() === auth.uid) && newData.exists()",
".validate": "newData.val() === auth.uid"


»*/
/*7/10/26: Turn this file into a module to be loaded by init in sys/fs.js «

Put this in something like mods/fs/fbase.js

First: since we are using the single login method from /login, get rid of
that stuff in here. If the user logs out from there, onAuthStateChanged will
be called, and we will not be able to interact with the back end because
only authenticated users can read.

Get handles to FileNode and DirNode.

Export getBlob and setBlob in FileNode constructor.
Export popDir and tryGet kid in DirNode constructor.


AS LONG AS WE ALSO EXPORT db-CHANGING PRIMITIVES LIKE: 
	- mkEmptyFile
	- mkDir
	- renameNode // change name only
	- mvNode // change parent node (this implies a simple, bookmark operation
														for updating the path)
	- delNode (dir's must be empty)


... then all of the private functions should stay where there are.


THE ABOVE POINT MAKES THE FOLLOWING STATEMENT UNTRUE:
??? We will receive handles to _node_update and _dir_update to enable
updating the private fields ???



We can DYNAMICALLY IMPORT from firebase urls via:

let FB_BASE = "https://www.gstatic.com/firebasejs/12.6.0";
let FB_APP_URL = `${FB_BASE}/firebase-app.js`;
let FB_DB_URL = `${FB_BASE}/firebase-database.js`;

let mod = await import(FB_APP_URL);
... then presumably, the exported methods are attached directly to
the mod object.




For getting the UID VALUE, I'm not sure if the following is correct or not...
there might be *another* UID somewhere on the cur_user object which is used for
the 'auth.uid' parts in the database schema.

const UID = () => {
	if (cur_user && cur_user.providerData) return cur_user.providerData[0].uid;
}

»*/
/* 7/6/26: Back here  «

Its close to a month since I restarted my work on this concept. Since the
last entry here (1+ weeks ago), I've been needed to fully refactor and clean up
the file system primitives, so that everything that is essential is kept on
FSNode's, and stateless functions are generally not used.

What I'm close to working out is a robust method for plugging domain-specific
logic into the system via "mount points" somewhere in the file system's tree
structure.

»*/
/*10/20/25: NEED TO RESET THE SCHEMA: «

Just added 'blobId' to indexOn for /LOTW/$ghid/node This way we can see if
there are ever 0 nodes attached to a given blob, in case we want to keep the
blobs around for any reason, regardless of whether they are linked to any
nodes.

»*/
/*10/17/25: Need to export a try_get_kid sort of function so that «

path_to_node in sys/fs.js can do the same type of path resolution mechanism 
as for OP_FS_TYPE nodes.

- getUsersNodeByNameAndPar

So now we should be able to resolve multi-path paths (e.g.
/users/guyhar123/dir1/dir2/dir3/dir4/file.txt) by querying only for the nodes
of the constituent directories in the path (dir1, dir2, dir3, dir4), rather
than for their full listings.

We might eventually do a lookup map that associates paths with their node ids.

»*/
/*10/16/25: Put 'status' back into the db.«

Now we should integrate everything from 2 days ago with:

	- the github login name fetching/storing (use this in the constructor of 
		NetFsDB)

	- Set the initial status update along with setting everything else 
		(msg: "hi", time: serverTimestamp())

	- Mount the users directory with the same logic as before 
		(query for most recent status updates)

»*/
/*10/15/25: How to discover other user's home directories?«

- Reimplement the (~100 char) status thing, like before?
- Maybe a "rank" (or "points") field, so the top N users may be queried.
- Below we have a groups structure that can be used to authorize the writes of, 
  e.g. "administrative" users

"groups": {
	"admin": {
		".read": false,
		".write": "auth != null && auth.provider === 'github' && 
				auth.token.firebase.identities['github.com'][0] === 7414094",
		$ghid: {
			".validate": "newData.isBoolean()"
		}
	}
},
"status": {
	".indexOn": ["time", "rank"],
	"$ghid": {
		".read": "auth != null",
		".validate": "newData.hasChildren(['time', 'name']) || newData.hasChildren(['rank'])",
		"time": {
			".validate": "newData.isNumber()",
			".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
		},
		"msg": {
			".validate":"newData.isString() && newData.val().length < 100",
			".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
		},
		"name": {
			".validate":"newData.isString() && newData.val().length <= 39",
			".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
		},
		"rank": { // Only users in the admin group can write
			".validate": "newData.isNumber()",
			".write": "auth != null && auth.provider === 'github' && 
						root.child('LOTW').child('groups').child('admin')
						.child(auth.token.firebase.identities['github.com'][0]) === true",
		},
		"$other": {
			".validate": false
		}
	}
}

»*/
/*10/14/25: Reducing the complexity of the 3-step process of initializing a remote user directory.«

in the new db schema, I just checked for '!data.exists()' in the appropriate places
so that we can now do a one-step initialization process like:

let session_id = get_session_id();
let next_node_id = 1;
const base_path = `LOTW/${ghid}`;
update(base_path, {
	[`sessIds/${session_id}`]: true,
	curSessId: session_id, // Added: !data.exists()
	nextNodeId: {
		nodeId: next_node_id, // (!data.exists() && newData.val() === 1)
		sessId: session_id // Added: !data.exists()
	}
});

Now let's create 2 commends:
1) chkfbdb
2) mkfbdb

Now we have the 2 main variables (sessId and nextNodeId) as the initialization variables 
of a 'NetFsDB' object. So now the idea is to add methods to this object to make
it look like the system 'FsDb' object.



»*/
/*10/13/25: I want a tidy database object (something like 'FsDb' in sys/fs.js):«

After commenting out the entirety of the last version of this file, I decided to
use the onAuthStateChanged callback via the same "global" way as the 
onValue('.info/connected') callback.

I also wanted to get rid of the gui interface aspects of logging in (i.e.
buttons with logos on them). If they want to go that route, the dedicated
/login url can be used for that purpose.

Since we should support MULTIPLE github logins from the same LOTW instance, we
should namespace the session ids (either in localStorage or /var/appdata) via
the (persistent numerical) github user ids.

Now the question is simple: SHOULD AN INSTANCE OF NetFsDB BE TIED TO A SINGLE
(NUMERICAL) GITHUB ID? Should any NetFsDB instance indeed exist if no remote
directory has even been set up yet?  If there is no session id, does/should
this *guarantee* that there is no database on the backend? Regardless, we just
need to check for: LOTW/$GHID/nextNodeId/nodeId (Number >= 1).

Now when setting it up:
let session_id = get_session_id();
let next_node_id = 1;
const base_path = `LOTW/${ghid}`;

1)
update(base_path, {
	[`sessIds/${session_id}`]: true, //This must always work upon database creation
})

2) The given session_id must be registered in the sessIds table (from step 1).
update(base_path, {
	curSessId: session_id
});

3) The sessId field must be the same as the db's value of curSessId (from step 3).
update(base_path, {
	nextNodeId: {
		sessId: session_id,
		nodeId: next_node_id
	}
});

4) If step 1 succeeds and step 2 or 3 fails, then we seem to have an inconsistent state,
and we'll need to triage the situation and abort these steps.

5) Otherwise, if all steps have succeeded, save session_id in localStorage, e.g.:
  - localStorage.setValue(`fbase-sess_id-github:${ghid}`, session_id).

»*/

/*10/11/25: The urgency is arising. First, we'll delete everything from «
the firebase datastore, and replace the security rules, whole cloth, with our
new ones (the DB SCHEMA). Then we'll put this file in another location, and
start it over again. We are going to need to clean up the logic that we've
recently added to sys/fs.js. The plan is to do a 1:1 mapping of the (indexedDB)
database logic used in sys/fs.js.

Way more than that stupid crap (below) about hardware APIs there is a need of a
central location for, and common interface into all of the various ways of
interacting, computationally-speaking, with the wider world.

»*/
/*10/9/25: The fundamental idea I am having is to do only what is necessary «

to support an "ecosystem" that is centered around web-client-centric scripting
languages.

One of the more telling outcomes will/should be the increasing usage of (web-based) hardware
APIs, as opposed to DOM APIs.

»*/
/*10/7/25: Overall workflow «

1. Load the net.fs library (this module)
2. Get the current user object
  - If not found, the user can only proceed by logging in
3. Once logged in, check that a remote user directory has been set up. 
  - If none exists, the user must create one.
4. Check for the session id ($sid) in local storage.
  - If not found, call create_session_id() until an unused one is found, 
	and set it in local storage.
5. Call set_session_id() with the value of $sid.
6. Perform remote fs operations.

  - If these fail with permission denied (on one's own directory), this most
    likely means that another session has called set_session_id. Report this
	(likely) error condition, and inform the user that they must manually reset 
	the session id to continue.

»*/
/*10/6/25: Persistent session ids, create_new_file() example «

64^4 = 16,777,216 // SESS_ID_BYTE_LEN = 3
64^8 = 281,474,976,710,656 // SESS_ID_BYTE_LEN = 6

Let's do persistent 24 bit session ids (4 chars, ~16M  possible). This is
instead of jumping through all the hoops of constantly changing them. Only upon
the first usage of the database in a client instance (local database
initialization) do we need to secure a unique id. We just need to keep a little
bit of local state, such as an object in e.g. APPDATA_PATH/netfs/sessId.


const SESS_ID_BYTE_LEN = 3; // 4 ascii chars long
const get_sess_id = () => {
let sess_id = (crypto.getRandomValues(new Uint8Array(SESS_ID_BYTE_LEN))).toBase64()
		.replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
	return sess_id;
};


Now we can do these 2 operations in a row, wrapped in a Promise:
1) get_next_id
2) increment_next_id

We know that if another session id is set between these 2 steps, then
increment_next_id won't work, and we won't have any gaps in the ids.

Or increment_next_id rather gets put into an update operation, which creates a new
node:

const create_new_file = async (par_id, name, bytes) => {

	let node_id = await get_next_node_id(); // Use this as the blob_id: they're in different "tables"
	let update_obj = {
		nodes: {
			[node_id]: {
				type: "f",
				parId: par_id,
				blobId: node_id,
				path: `${par_id}/${name}`
			}
		},
		blobs: {
			[node_id]: {
				contents: bytes.toBase64(),
				meta: {
					//...
				}
			}
		},
		nextNodeId: increment(1)
	};
	await update("/$ghid", update_obj); // If this fails, no incrementing is done

};


»*/
/*10/5/25: Session ids«

Let's get a crypto-secure 24bit value as Base64 (4 ascii characters), and call
set_session which updates:

"$ghid": {

session_id: {
	'.validate": "newData.isString() && newData.val().length >= 4"
},
old_session_ids: { // Possibly this
	".validate": "!root.child($ghid).child('old_session_ids')[newData.val()]"
},
nodes:{
	"$nodeid": {
		".validate": "newData.child('session_id').val() === root.child($ghid).child('session_id') && <other validation logic here>";
	}
},
blobs:{...}

}


If we are paranoid, we can use old_session_ids, which forces us to
never reuse an old one. So then the update will be like:

let sess_id = get_random_bytes(3).toBase64().replace(/=+^/,"");
update(ghid, {
	session_id: sess_id,
	old_session_ids[sess_id]: true
});
//Now we have an effective "lock"

If sess_id already exists in old_session_ids, then this will fail and we will need to repeat
this process. So we create session ids either upon initialization of our user database, or
upon failure. We can always store the session id, and read it back upon reloading the page.

Using 24 bit session ids (16,777,216 possibilities), the string lengths are always 4.

Going down to 16 bit session ids (65,536 possibilities), the strings lengths are always 3.
So 24 bit seems to be a rather good middle ground between string size and hash space.

»*/
/*10/4/25: New file node creation workflow«

When creating a new file, we will do:

1) push("/blobs/$ghid", {meta, contents}); // Save the file
2) push("/nodes/$ghid", { parId, type, path, blobId: $newRef}) // Create the node with blobId=file's key

The cases where we successfully create the new file but fail to create the node should be rare,
since node creation is such a quick operation, being that nodes are such small objects.

»*/
/*10/3/25: RESOLVED: query()«

If we need to call to get the next key, then we should implement our own keys:

next_key: {
	"$ghid": {
		".write": "auth.ghid = $ghid",
		".read": "auth.ghid = $ghid",
		".validate": "newData.isNumber() && newData.val() > data.val()"
	}
}

There should not be any harm in calling update/increment on the next_key.

Also: there is no reason to do "blobs", if everything is meant to be stored here
in this database as a string (rather than locally as a proper file with read/write 
file stream methods.)

query("/nodes/$ghid", orderByChild('path'),equalTo($pathname),limitToFirst(1))

We might need to put the key field inside the node object, in case the key is
not available to us upon getting it. 

push(parRef, value?): 
Generates a new child location using a unique key and returns its Reference.

If you provide a value to push(), the value is written to the generated
location. If you don't pass a value, nothing is written to the database and the
child remains empty (but you can use the Reference elsewhere).

»*/
/*10/1/25: To mount /users, we need to have a cache of the last N statuses, «
and check for the cache or get them. This gives us id->username mappings. Then
we'll mount them with the usernames for the key names.

We should put a appData field on FSNode, for use by the individual applications.
»*/
/*9/30/25: Let's use update (instead of runTransaction). We will always «
check is_connected, and use a flag (e.g. "force-offline") to force updates 
when it is false. This affects stuff like @NSBDHFUR, where there is (currently) 
3 successive calls to run_transaction.
»*/
/*9/29/25: Just need to work out the details of how files/folders are represented«
on the backend, and how they may be queried. Then we can package these functions
into an api that can be exported to sys/fs.js, so that the NetNode may be finally
in control of how everything flows through the lOTW system.

"$uid":{
	"1234567":{
		type: "d",
		size: 2,
		list: {
			vals: ["dir1", "file1.txt"],
			details: [-1, 100],
		},
		kids: {
			"ZmlsZTEudHh0" : {// key=sanitize("file1.txt")
				type: "f",
				size: 100,
				created:  1234567890.
				modified: 1234901234.
				enc: "utf8",
				value : "This is the thing in the time of the place of file1!?!?!"
			},
			"ZGlyMQ":{// key=sanitize("dir1")
				type: "d",
				size: <list.vals.length>,
				list: {
					vals: [...],
					details: [...]
				},
				kids: {
					//...
				}
			}
		}
	}
}

»*/
/*9/28/25: ONLY DOING GITHUB AUTH«

So a user can write to their directory at: e.g. for me /uids/7414094

To map from username to id:
https://api.github.com/users/linuxontheweb

{
	"login": "linuxontheweb",
	"id": 7414094,
	"url": "https://api.github.com/users/linuxontheweb",
	"html_url": "https://github.com/linuxontheweb",
	"name": "Dennis Kane",
	//...
}

I don't want to even think about who a LOTW user is when it comes to computer
development questions. The idea of having a github account is the one standard
way we have of knowing who a user is along these lines. The idea of letting
google "users" use the site effectively allows anonymous users, since google
(especially now that there is no G+ anymore) has no way to look anybody up.


»*/
/*9/24/25: This library exists as a suite of tools for internet-based «
filesystems, using backends like the Firebase Realtime Database. We will need
to integrate with the logic in sys/fs.js in order to allow for getting
directory listings.

We might want to get `class FSNode` (from sys/fs.js) and extend it inside here.

But we might want to spend some time looking at the interfaces for FSNode and
all classes that extend it, in order to refactor it in order to simplify the
logic in coms/fs.js (for file moving, copying, etc).

»*/

//»

// Imports «
//const {globals} = LOTW;
const { // api.util «
	isArr,
	isNum,
	isStr,
	isEOF,
	isErr,
	log,
	jlog,
	cwarn,
	cerr
} = LOTW.api.util;//»

// globals

const {// fs (FBASE_USER_MAIN_FS_TYPE, NODE_TYPE's) «
FBASE_USER_MAIN_FS_TYPE,
FBASE_USERS_FS_TYPE,
FBASE_USER_GRP_FS_TYPE,

// File system "node" types

FILE_NODE_TYPE,
DIR_NODE_TYPE,
LINK_NODE_TYPE,

//BAD_LINK_NODE_TYPE,
//NULL_BLOB_NODE_TYPE,

} = LOTW.globals.fs;//»
const { // firebase «
	appUrl, 
	authUrl, 
	dbUrl 
} = LOTW.globals.firebase;//»

//»
// Var «

const NULL_FBASE_RTDB_BLOB = 0;

const PRV_DIR_ID = 1;
const PUB_DIR_ID = 2;

let cur_user;
let next_node_ids;
let next_grp_id;

let DirNode, FileNode, _node_update, _dir_update;

let fbase_app_mod;
let fbase_auth_mod;
let fbase_db_mod;
let fbase_app;
let fbase_db;
let fbase_auth;

const FBASE_USERS_CACHE_PATH = "/var/cache/fbase/users";
let users_cache_node;

let first_auth_change = false;

//»
//Funcs «

const blobTo64 = (blob) => {//«
	return new Promise((Y, N) => {
		let r = new FileReader();
		r.readAsDataURL(blob);
		r.onloadend = () => {Y(r.result.split(',')[1]);};
		r.onerror = (e) => Y();
	});
};//»

const GET = async(arg)=>{//«
try {
	return await fbase_db_mod.get(arg);
}
catch(e){
cerr(e);
//	return e;
}
};//»
const UPDATE = async(ref, obj)=>{//«

try {
	await fbase_db_mod.update(ref, obj);
	return true;
}
catch(e){
	return e;
}

};//»
const REF = path => {//«
	return fbase_db_mod.ref(fbase_db, path); 
};//»
const VAL = snap => {//«
	if (!snap){
cerr("NO SNAP");
		return;
	}
	if (!snap.exists()){
cerr("!SNAP.EXISTS()");
		return;
	}
	return snap.val();
};//»
const NEXT_NODE_ID = async(dirid) => {//«
	if (!cur_user) return;
	// YURJKFHFN
//	cwarn(`Need nextNodeId from: ${path}`);
	return GET(REF(`LOTW/user/${cur_user.uid}/group/${dirid}/nextNodeId`));
};//»

const try_get_fbase_user_grp_kid = async (par, name) => {//«

if (!cur_user) return;
let uid = par.getData('fbaseUid');
let grpid = par.getData('fbaseGrpId');
let parid = par.id;
//cwarn(`TRY GET '${name}':  uid: ${uid}  grpid: ${grpid}  parid: ${parid}`);
/*
Construct the path via the parent node's nodeId
*/
let path = `${parid}/${name}`;
log(`TRY_GET_KID: ${path}`);

let ref = fbase_db_mod.ref(fbase_db, `LOTW/user/${uid}/group/${grpid}/nodes`);
let c1 = fbase_db_mod.orderByChild('path');
let c2 = fbase_db_mod.equalTo(path);
let c3 = fbase_db_mod.limitToFirst(1);
let q = fbase_db_mod.query(ref, c1, c2, c3);
let snap = await GET(q);
let arr = VAL(snap);
if (!arr) {
cwarn("DID NOT GET!");
	return;
}
//if (!(snap && snap.exists())) return;
//let arr = snap.val();
// Make a FileNode or DirNode

log("GOT KID!!!");
log(arr);

// This loop would only be infinite if the array were empty, which it should never be
let node;
for (let i=0; ; i++){ //«
	if (!arr[i]) continue;
	let obj = arr[i];
	let typ = obj.type;
	let parid = obj.parId;
	let name = (obj.path.split("/"))[1];
//cwarn(`MAKE NODE(${i}) WITH:`);
//log(obj);
	if (typ === FILE_NODE_TYPE){
		node = new FileNode(name, par);
		_node_update(4, node, obj.blobId);
	}
	else if (typ === DIR_NODE_TYPE){
		node = new DirNode(name, par);
	}
	else{
cerr(`WHAT NODE TYPE??? ${typ}`); // Is this a symlink?
		return;
	}
	_node_update(3, node, i); // node.#id is the iterator
	break; // We found want we want!
}//»
_dir_update(1, par, node); // Add to par.#kids
return node;

};//»

const populate_fbase_user_grp_dir = async (dir) => {//«
// e.g. /mnt/users/user123/pub/, and all subdirs thereof
// dir
if (!cur_user) return;

// The FileNode's will implement:
//	- getBlob
//	- setBlob
// The DirNode's will implement: 
// 	- *this* method for popDir
//	- a method for tryGetKid that looks up particular nodes by the exact key.


// 
let uid = dir.getData('fbaseUid');
let grpid = dir.getData('fbaseGrpId');
let parid = dir.id; // HEJRKTKT: UNDEFINED HARHARHAR
cwarn(`POPULATE:  uid: ${uid}  grpid: ${grpid}  parid: ${parid}`);

let ref = fbase_db_mod.ref(fbase_db, `LOTW/user/${uid}/group/${grpid}/nodes`);
let c1 = fbase_db_mod.orderByChild('parId');
let c2 = fbase_db_mod.equalTo(parid);
let q = fbase_db_mod.query(ref, c1, c2); // HOPORNKER
let snap = await GET(q);
if (!snap){
cerr("NO SNAP!?!?!");
return;
}
_dir_update(3, dir, true); // Set dir.#done = true
if (!snap.exists()) {
cwarn("DOES THIS ALWAYS JUST MEAN EMPTY DIRECTORY");
	return;
}
let arr = snap.val();
for (let i=0; i < arr.length; i++){
let obj = arr[i];
if (!obj) continue;
let node;
let name = (obj.path.split("/"))[1];
if (obj.type === FILE_NODE_TYPE){
	node = new FileNode(name, dir);
	_node_update(4, node, obj.blobId);
}
else if (obj.type === DIR_NODE_TYPE){
	node = new DirNode(name, dir);
}
else {
cwarn(`WHAT TYPE IS THIS OBJ(${obj.type})???`);
log(obj);
return;
}
_node_update(3, node, i); // node.#id is the iterator
_dir_update(1, dir, node);
log(node);
}

/*
Where do the fbase nodeId's go?
	- The same slot as the node id's for OP_FS_TYPE: 
		_node_update(3, dir, fbase_node_id)
	- in data.fbaseNodeId?
*/

/*
cwarn("GOT NODES");
for (let obj of arr) {
//«
//	parId: parnode.id,
//	path: `${parnode.id}/${name}`,
//	type: FILE_NODE_TYPE, // Just change this to DIR_NODE_TYPE to make a directory
//	blobId: NULL_FBASE_RTDB_BLOB
//»
}
*/

};//»
const populate_fbase_user_dir = async (user_dir) => {//«
// e.g. /mnt/users/user123/
/*«

Should add FileNode's (status, bio, etc) here, so that the 
owners of that profile can update theirs by writing to them.
so getBlob/setBlob need to use the appropriate db methods

Just need to check if uid === curuser.uid.
If not, also add the "pub" dir (grpid == 2)
If so, also add the "prv" dir (grpid == 1)

Then when we *do* implement user groups, we need to search in 
grpDefs (@OLSHGTNSJ), and also return those.

All DirNode's should be proper *groups*, implementing:
popDir: populate_fbase_user_grp_dir
tryGetKid(name): 
	await user_dir.loadKids(); // Calls populate_fbase_user_dir (if needed)
	return user_dir.getKid(name)

»*/

	if (!cur_user) return;

	let uid = user_dir.getData("fbaseUid");
	let prof = user_dir.getData("fbaseProf");

	for (let k in prof) {//«
	// These are stored as "files" in user_dir
		let node = new FileNode(k, user_dir, {
			type: FBASE_USER_MAIN_FS_TYPE,
			data: {
				fbaseUid: uid,
			},
			getBlob: ()=>{
				return new Blob([prof[k]]);
			},
			setBlob: (val)=>{
	if (cur_user && cur_user.uid === uid) {
cwarn(`SO YEW WANNA SET ${k}??? ARE YOU THE USER?`);
log("VAL", val);
	}
			}
		});
		_dir_update(1, user_dir, node);
	}//»
log(`TYPE: ${FBASE_USER_GRP_FS_TYPE}`);
// YGJDPLKIU
	let pub = new DirNode("pub", user_dir, {//«
		type: FBASE_USER_GRP_FS_TYPE,
		data: {
			fbaseUid: uid,
			fbaseGrpId: PUB_DIR_ID,
		},
		popDir: populate_fbase_user_grp_dir,
		tryGetKid: try_get_fbase_user_grp_kid,
		perm: true, // HEREPUBPERM
		getBlob: async (node) => {//«
cwarn("USERGRP.getBlob", node);
return new Blob(["This is the thing in the time of the place!!!"]);
		},//»
		setBlob: async (node, val) => {//«
cwarn("USERGRP.setBlob", node);
log(val);
return {size: 1234};
		},//»
		mkDir: async (parnode, name, opts)=>{
cwarn(`parnode.mkDir (pub) ${name}!!!`);
		},
		mkNewFile: async (parnode, name, opts)=>{
cwarn(`parnode.mkNewFile (pub) ${name}!!!`);
		}
	});
	_dir_update(1, user_dir, pub);
	_node_update(3, pub, PUB_DIR_ID); // Id
//»
	if (uid === cur_user.uid){// "prv" «
		let prv = new DirNode("prv", user_dir, {
			type: FBASE_USER_GRP_FS_TYPE,
			data: {
				fbaseUid: uid,
				fbaseGrpId: PRV_DIR_ID,
			},
			popDir: populate_fbase_user_grp_dir,
			tryGetKid: try_get_fbase_user_grp_kid,
			perm: true, // HEREPRVPERM

getBlob: async (node) => {//«

if (!cur_user) return;
cwarn("USERGRP.getBlob", node);
//if (node.blobId === 0 || node.blobId === NULL_BLOB_NODE_TYPE) return new Blob([]);
if (node.blobId === 0) return new Blob([]);

/* WEHRJSGRHJ

//HOW TO GET THE BLOB???

*/
let path = `LOTW/user/${cur_user.uid}/group/${PRV_DIR_ID}/blobs/${node.blobId}`;
cwarn(`PATH: <${path}>`);
let snap =  await GET(REF(path));
if (!snap) {
cerr("NOSNAP");
	return;
}
let val = VAL(snap);
if (!(val && val.contents)) {
cerr("NO SNAP VAL.contents");
	return;
}
let str = atob(val.contents);
return new Blob([str]);

},//»

setBlob: async (node, blob) => {//«

if (!cur_user) return;

// SBRYRKTH
cwarn("USERGRP.setBlob", node);
let val = await blobTo64(blob);
log(`B64 LENGTH: ${val.length}`);
let bid = node.blobId;
let obj = {};
//if (bid === 0 || bid === NULL_BLOB_NODE_TYPE) {

if (bid === 0) {
bid = (new Date()).getTime(); // milliseconds
cwarn(`New blobId: ${bid}`);
	obj[`nodes/${node.id}/blobId`] = bid;
}
else{
cwarn("JUST UPDATE THE BLOB");
}
obj[`blobs/${bid}/contents`] = val;
let path = `LOTW/user/${cur_user.uid}/group/${PRV_DIR_ID}`;
log(`SET THIS OBJ TO: PATH = <${path}>`);
log(obj);

let ref = REF(path);

let rv = await UPDATE(ref, obj);
if (rv !== true){
cwarn("COULD NOT SET THE BLOB VALUE!!!");
return;
}

return blob;

},//»

// EURKSDNR
mkDir: async (parnode, name, opts)=>{//«

if (!cur_user) return;

let snap = await NEXT_NODE_ID(PRV_DIR_ID);
let rv = VAL(snap);
if (!isNum(rv)) {
	return;
}
let next_id = rv;

log(`mkDir: GOT next_id: ${next_id}`);


let obj = {};
obj["nextNodeId"] = next_id + 1;
obj[`nodes/${next_id}`] = {
	parId: parnode.id,
	path: `${parnode.id}/${name}`,
	type: DIR_NODE_TYPE, 
};


rv = await UPDATE(REF(`LOTW/user/${cur_user.uid}/group/${PRV_DIR_ID}`), obj);
if (rv !== true){
cerr("COULD NOT CREATE THE NEW DIR");
	return;
}

let node = new DirNode(name, parnode);
_dir_update(1, parnode, node); // Set parnode.#kids[name]
return node;

},//»

//HEREMKNEW
mkNewFile: async (parnode, name, opts)=>{//«

	if (!cur_user) return;

	let snap = await NEXT_NODE_ID(PRV_DIR_ID);
	let rv = VAL(snap);
	if (!isNum(rv)) {
		return;
	}
	let next_id = rv;

log(`mkNew: GOT next_id: ${next_id}`);

	//HDJSAKRNT 

	let obj = {};
	obj["nextNodeId"] = next_id + 1;
	obj[`nodes/${next_id}`] = {
		parId: parnode.id,
		path: `${parnode.id}/${name}`,
		type: FILE_NODE_TYPE, // Just change this to DIR_NODE_TYPE to make a directory
		blobId: NULL_FBASE_RTDB_BLOB
	};


	rv = await UPDATE(REF(`LOTW/user/${cur_user.uid}/group/${PRV_DIR_ID}`), obj);
	if (rv !== true){
cerr("COULD NOT CREATE THE NEW FILE");
		return;
	}

	let node = new FileNode(name, parnode);
//	_node_update(4, node, NULL_BLOB_NODE_TYPE); // Set node.#blobId
	_node_update(4, node, 0); // Set node.#blobId
	_dir_update(1, parnode, node); // Set parnode.#kids[name]
	return node;

}//»

		});
		_dir_update(1, user_dir, prv); // Add kid
		_node_update(3, prv, PRV_DIR_ID); // Id HEREPRVRV
	}//»

	_dir_update(3, user_dir, true); // done

};//»
const populate_fbase_users = async (users_dir) => {//«
// e.g. /mnt/users/
if (!cur_user) return;

// First, if using cache check for the existence of FBASE_USERS_CACHE_PATH

// I am guessing the returned values come in the form of:
// {uid1: {name, picture, status, bio, updated, votes, ...}, uid2: {...}, ...}

//let cache_node = await FBASE_USERS_CACHE_PATH.toNode();
let old_obj = await users_cache_node.json; 
if (!old_obj) old_obj = {};

// This will return DirNode's of type: FBASE_USER_DIR_FS_TYPE,
// who will need to provide a popDir method like:
// populate_fbase_user_dir

// If not, run a query based on certain index values

let ref = fbase_db_mod.ref(fbase_db, "LOTW/prof");

// Constraints
let c1 = fbase_db_mod.orderByChild('updated');  // Or: 'votes', etc.
let c2 =fbase_db_mod.limitToLast(25);
let q = fbase_db_mod.query(ref, c1, c2);

let snap;
try {
	snap = await fbase_db_mod.get(q);
}
catch(e){
// FAIL!!!
cerr(e);
	return;
}

if (!snap.exists()) {
// WEJKRLJS
cwarn("GOT !snap.exists()!!!");
return;
}

// If a cache exists, merge the returned profiles with the existing ones

let new_obj = snap.val();
for (let uid in new_obj) old_obj[uid] = new_obj[uid];

// Add the kids, using the data option:
// const opts={data: {fbaseUid: uid}};
// These are all DirNode's...
for (let uid in old_obj) {
	let prof = old_obj[uid];
// Also: picture, status, bio, updated[, votes]
	let name = prof.name;
	let use_name = name.replace(/\s+/, "").toLowerCase();

	// If 'use_name' already exists as a dirname in /mnt/fbase/, then 
	// just add numbers to the end of it.

	if (users_dir.getKid(use_name)) {
		let iter=1;
		while (users_dir.getKid(`${use_name}${iter}`)) iter++;
		use_name = `${use_name}${iter}`;
	}
// YFKMYOGJT
	let dir = new DirNode(use_name, users_dir, {
//		type: FBASE_USER_DIR_FS_TYPE,
		type: FBASE_USER_MAIN_FS_TYPE,
		popDir: populate_fbase_user_dir,
		tryGetKid: async (name)=>{
/*
Since the names of the dirs are currently arbitrarily given, then it makes no
sense to have a literal system of looking up users based on predetermined
dirnames.
*/
			await dir.loadKids();
			return dir.getKid(name);
		},
		data: {
			fbaseUid: uid,
			fbaseProf: prof
		},
	});
	_dir_update(1, users_dir, dir);
}

// Call _dir_update() for setting done=true
_dir_update(3, users_dir, true);

await users_cache_node.setValue(JSON.stringify(old_obj));

};//»

const get_last_updated_or_create_profile = async () => {//«

if (!cur_user){
cerr(`CALLED get_last_updated_or_create_profile W/ NO CUR_USER!?!?!?`);
return;
}

let uid = cur_user.uid;
let uid_path = `LOTW/prof/${uid}`;
let updated_path = `${uid_path}/updated`;
//log(`GET REF: ${uid_path}`);
let updated_ref = fbase_db_mod.ref(fbase_db, updated_path);
//log(ref);
let snap = await GET(updated_ref);
//log(snap);
if (!snap){
cwarn("GET FAILED");
return;
}
if (snap.exists()) {
//log("LAST UPDATED", snap.val());
	return;
}


cwarn(`NEED TO INITIALIZE USER: ${uid} !!!`);

let ref = fbase_db_mod.ref(fbase_db, "LOTW");
let obj = {};
obj[`prof/${uid}`] = {
	updated: fbase_db_mod.serverTimestamp(),
	name: cur_user.displayName, 
	picture: cur_user.photoURL,
};
obj[`user/${uid}/nextGrpId`] = 3;


// UKHFAJFUE
// Trying these gives permission denied!?!?!

obj[`user/${uid}/group/1/nextNodeId`] = 1;
obj[`user/${uid}/group/1/nodes`] = {};
obj[`user/${uid}/group/1/blobs`] = {};

obj[`user/${uid}/group/2/nextNodeId`] = 1;
obj[`user/${uid}/group/2/nodes`] = {};
obj[`user/${uid}/group/2/blobs`] = {};

log(obj);

let rv = await UPDATE(ref, obj);

if (rv !== true){
cwarn("THERE WAS A PROBLEM INITIALIZING THE USER PROFILE!!!");
}

// UOEOWEKRJ
next_node_ids = [1, 2]; // As long as we subtract 1 from the group id's
//next_node_ids = [undefined, 1, 2]; // Without substracting

//log(rv);
}//»

//»

LOTW.mods[MODNAME] = class {//«

constructor(arg){//«
	DirNode = arg.DirNode;
	FileNode = arg.FileNode;
	_node_update = arg.nodeUpdate;
	_dir_update = arg.dirUpdate;
cwarn(`MAKE <${MODNAME}>`);
}//»

#authChangeCb(val){//«

cur_user = val;
if (cur_user && !first_auth_change){
	first_auth_change = true;
	get_last_updated_or_create_profile();
}

}//»

get curUser(){return cur_user;}

// par_node: the dir node for '/mnt'
async init(par_node) {//«

users_cache_node = await FBASE_USERS_CACHE_PATH.toNode({mkFile: true});

if (!users_cache_node){
cerr(`Could not get.create: ${FBASE_USERS_CACHE_PATH}`);
return;
}

//cwarn("GOT", FBASE_USERS_CACHE_PATH);
//log(users_cache_node);

try{
	fbase_app_mod = await import(appUrl);
	fbase_auth_mod = await import(authUrl);
	fbase_db_mod = await import(dbUrl);
}
catch(e){
cwarn("CAUGHT FBASE IMPORT");
cerr(e);
return false;
}


fbase_app = fbase_app_mod.initializeApp(LOTW.globals.firebase.config);
fbase_db = fbase_db_mod.getDatabase(fbase_app);
fbase_auth = fbase_auth_mod.getAuth(fbase_app);
fbase_auth_mod.onAuthStateChanged(fbase_auth, val=>{this.#authChangeCb(val);});

//WYRHTKGH

let fbase_dir = new DirNode("fbase", par_node, {
	type: FBASE_USERS_FS_TYPE,
	popDir: populate_fbase_users,
	tryGetKid: async (name)=>{
		await fbase_dir.loadKids(); // dir.done is checked in loadKids()
		return fbase_dir.getKid(name);
	}
});
_dir_update(1, par_node, fbase_dir); // Add kid

return true;

}//»

}//»









//OLD«

/*OLD DB SCHEMA«

NEED TO UPDATE THIS WITH THE GROUPS LOGIC ON 7/12/26

Just like with our local file system, we should have a separate blob storage on the backend. 

The outer "namespaces" (like LOTW) are meant to encapsulate the data of the various (siloed) applications 
that the backend might possibly be used for. 

// Generic read/write rules ($ghid is our numerical github id, and is used as the name of an outer object)
// ".read": "auth != null",
// ".write": "auth != null &&  // Yes we are authorized...
//		auth.provider === 'github' && // by github...
//		auth.token.firebase.identities['github.com'][0] === $ghid && // with the correct id...
//		newData.child('sessId').val() == root.child('curSessId').val() // identified by the current session

MOST RECENT:


{
 "rules": {
  ".read": false,
  ".write": false,
  "LOTW": {
   "status": {
    ".indexOn": ["time"],
    ".read": "auth != null",
    "$uid": {
     ".validate": "newData.hasChildren(['time', 'name'])",
     ".write": "auth != null && auth.uid === $uid",
     "time": {
      ".validate": "newData.isNumber()"
     },
     "msg": {
      ".validate":"newData.isString() && newData.val().length < 100"
     },
     "name": {
      ".validate":"newData.isString() && newData.val().length <= 39"
     },
     "$other": {
      ".validate": false
     }
    }
   },
   "$uid": {
    "sessIds": {
     "$sid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && auth.uid === $uid",
      ".validate": "!data.exists() && newData.isBoolean() && newData.val() === true"
     }
    },
    "curSessId": {
     ".read": "auth != null && auth.uid === $uid",
     ".write": "auth != null && auth.uid === $uid",
     ".validate": "newData.isString() && newData.val().length == 8 && ((data.exists() && root.child('LOTW').child($uid).child('sessIds').child(newData.val()).val() === true) || !data.exists())"
    },
    "nextNodeId": {
     ".read": "auth != null && auth.uid === $uid",
     ".write": "auth != null && auth.uid === $uid",
     ".validate": "newData.hasChildren(['sessId', 'nodeId'])",
     "nodeId": {
      ".validate": "newData.isNumber() && ((data.exists() && newData.val() === data.val() + 1) || (!data.exists() && newData.val() === 1))"
     },
     "sessId": {
      ".validate": "newData.isString() && ((data.exists() && newData.val() === root.child('LOTW').child($uid).child('curSessId').val()) || !data.exists())"
     },
     "$other": {
      ".validate": false
     }
    },
    "nodes": {
     ".indexOn": ["parId", "path", "blobId"],
     ".read": "auth != null",
     "$nodeid": {
      ".write": "auth != null && auth.uid === $uid",
      ".validate": "data.exists() || newData.hasChildren(['parId', 'type', 'path', 'sessId'])",
      "parId": {
       ".validate": "newData.isNumber()"
      },
      "path": {
       ".validate": "newData.isString() && newData.val().length < 100"
      },
      "type": {
       ".validate": "!data.exists() && newData.isString() && newData.val().length < 5"
      },
      "blobId": {
       ".validate": "newData.isNumber()"
      },
      "sessId": {
       ".validate": "newData.isString() && newData.val() === root.child('LOTW').child($uid).child('curSessId').val()" 
      },
      "$other": {
       ".validate": false
      }
     }
    },
    "blobs": {
     "$blobid": {
      ".read": "auth != null",
      ".write": "auth != null && auth.uid === $uid",
      ".validate": "newData.hasChildren(['sessId', 'contents'])",
      "meta": {
       ".validate": true
      },
      "contents": {
       ".validate": "newData.isString() && newData.val().length < 100000"
      },
      "sessId": {
       ".validate": "newData.isString() && newData.val() === root.child('LOTW').child($uid).child('curSessId').val()" 
      },
      "$other": {
       ".validate": false
      }
     }
    },
    "$other": {
     ".validate": false
    }
   }
  }
 }
}


Also: Let's await on update.
»*/

// Previous version «
/*

//Imports«

const{globals}=LOTW;
const {fsMod: fs, fbase}=globals;
const {USERS_TYPE, APPDATA_PATH} = globals.fs;
const {config: firebaseConfig} = globals.firebase;
const {Com} = globals.ShellMod.comClasses;
const{
mkdv,
mk,
isArr,
isNum,
isStr,
isEOF,
isErr,
log,
jlog,
cwarn,
cerr
}=LOTW.api.util;
const{root, mount_tree}=fs;
const {fs: fsapi}=LOTW.api;
//const {popup} = globals.popup;
//Database

import { initializeApp } from "firebase_app";

import {
//getAuth,
onAuthStateChanged,
//signInWithPopup,
//GithubAuthProvider,
//signOut 
} from "firebase_auth";

import { 
getDatabase,
ref,
set,
get,
//update as _update,
update,
query,
runTransaction,
serverTimestamp,
orderByChild,
limitToFirst,
limitToLast,
startAt,
equalTo,
onValue,
// YDNHOXWY: Now: serverValue.increment() !?!?
increment, 
enableLogging
} from "firebase_database";

//»

//Var«

// CHANGE TO 6 == 8 ascii chars
const SESS_ID_BYTE_LEN = 3; // 4 ascii chars long

const fbase_app = initializeApp(firebaseConfig);
//const fbase_auth = getAuth(fbase_app);
const fbase_db = getDatabase(fbase_app);
//const gh_provider = new GithubAuthProvider();
//gh_provider.setCustomParameters({
//	prompt: 'select_account'
//});
let is_connected = false;
let cur_user;
let db;

const DEF_STATS_MINS_AGO = 1000;
const DEF_STATS_NUM_RECENT = 20;
//let next_node_id;
//let cur_sid;

// Attach a listener to detect changes in the connection state
//When we do tons of dev reloading, this never gets unregistered, and we end up getting tons
//of warnings, upon reconnecting after disconnecting (e.g. due to closing the laptop cover).
//Perhaps we can export an onkill method.

const DISCON_CB = onValue(ref(fbase_db, ".info/connected"), (snap) => {
	is_connected = snap.val();
cwarn(`Connected: ${is_connected}`);
});
const AUTH_CB = onAuthStateChanged(fbase_auth, user => {
	cur_user = user;
	if (cur_user){
		globals.auth.github.uid = cur_user.providerData[0].uid;
	}
	else if (!cur_user){
		delete globals.auth.github.uid;
		db = undefined;
	}
cwarn("User", cur_user);
});

const ONKILL = ()=>{
cwarn("KILL");
	AUTH_CB();
	DISCON_CB();
if (db){
globals["var"]["netfs.login"] = db.login;
globals["var"]["netfs.nextNodeId"] = db.nextNodeId;
globals["var"]["netfs.sessId"] = db.sessId;
}
};
//»

class NetFsDB {//«

constructor(sid_arg, login_arg, next_node_id_arg){//«
	this.sessId = sid_arg;
	this.login = login_arg;
	this.nextNodeId = next_node_id_arg;
}//»

async createDirNode(parId, name){//«

if (!(Number.isFinite(parId) && isStr(name))){
	throw new Error(`Invalid args to createDirNode`);
}

let path = `${parId}/${name}`;
let node = {parId, path, type: "d"};
let rv = await UPDATE(UBASE(),{
	nextNodeId: {
		nodeId: this.nextNodeId+1,
		sessId: this.sessId
	},
	[`nodes/${this.nextNodeId}`]: {
		parId,
		path,
		sessId: this.sessId,
		type: "d"
	}
});
if (isErr(rv)){
cerr(rv);
return rv;
}

let id = this.nextNodeId;
this.nextNodeId++;
return id;
}//»
async createFileNode(parId, name, val){//«

if (!(Number.isFinite(parId) && isStr(name))){
	throw new Error(`Invalid args to createFileNode`);
}

let id = this.nextNodeId;
let path = `${parId}/${name}`;
let use_blob_id;
if (!val) use_blob_id = 0;
else use_blob_id = id;

let obj = {
	nextNodeId: {
		nodeId: id+1,
		sessId: this.sessId
	},
	[`nodes/${id}`]: {
		parId,
		path,
		blobId: use_blob_id,
		sessId: this.sessId,
		type: "f"
	}
};
let sz;
if (val){
	let bytes;
	if (isStr(val)){
		bytes = (new TextEncoder()).encode(val);
	}
	else if (val instanceof Uint8Array){
		bytes = val;
	}
	else{
cwarn("WHAT THE HELL TYPE IS THIS???");
log(val);
		throw new Error("UNKNOWN FILE VALUE TYPE IN createFileNode!!! (see value above)");
	}
	obj[`blobs/${id}`] = {
		sessId: this.sessId,
		contents: B64(bytes)
	}
	sz = bytes.byteLength;
}
else sz = 0;
this.nextNodeId++;
let rv = await UPDATE(UBASE(), obj);
if (isErr(rv)){
cerr(rv);
return rv;
}
return {id, size: sz};
//return sz;

}//»
async getDirList(ghid, parId){//«
let ref = REF(`LOTW/${ghid}/nodes`);
let c1 = orderByChild('parId');
let c2 = equalTo(parId);
let q = query(ref, c1, c2);
let snap = await GET(q);
if (isErr(snap)){
cerr(snap);
return;
//	return snap;
}
if (!snap.exists()){
return [];
}
return snap.val();

}//»
async setBlob(blob_id, node_id, val, start_bytes){//«
if (!isNum(blob_id)){
DIE(`BLOBID IS NaN --> ${blob_id}`);
}
	let bytes;
	if (isStr(val)){
		bytes = (new TextEncoder()).encode(val);
	}
	else if (val instanceof Uint8Array){
		bytes = val;
	}
	else{
cwarn("WHAT THE HELL TYPE IS THIS???");
log(val);
		throw new Error("UNKNOWN FILE VALUE TYPE IN createFileNode!!! (see value above)");
	}
	if (start_bytes){
		let end_bytes = bytes;
		bytes = new Uint8Array(start_bytes.byteLength + end_bytes.byteLength);
		bytes.set(start_bytes, 0);
		bytes.set(end_bytes, start_bytes.byteLength);
	}
	let obj = {};
	let use_blob_id;
	let do_inc;
	if (blob_id === 0) {
		use_blob_id = this.nextNodeId;
//cwarn(`MAKE SURE THAT THE blobId PROPERTY OF THE NetFsDB NODE SOMEHOW GETS UPDATED TO: ${use_blob_id}`);
		do_inc = true;
		obj[`nodes/${node_id}/blobId`] = use_blob_id;
		obj['nextNodeId'] = {
			nodeId: this.nextNodeId+1,
			sessId: this.sessId
		};
	}
	else{
		use_blob_id = blob_id;
		do_inc = false;
	}
//	let obj = {
//		[`blobs/${blob_id}`]: {
//			sessId: this.sessId,
//			contents: B64(bytes)
//		}
//	};	
	obj[`blobs/${use_blob_id}`] = {
		sessId: this.sessId,
		contents: B64(bytes)
	};
	let rv = await UPDATE(UBASE(), obj);
if (isErr(rv)){
cerr(rv);
return;
}
	if (do_inc) this.nextNodeId++;
return {
blobId: use_blob_id,
size: bytes.byteLength
};
//	return bytes.byteLength;
}//»

}//»

//Funcs«

const UID = () =>{
	if (cur_user && cur_user.providerData) return cur_user.providerData[0].uid;
};
globals.funcs["netfs.getUserId"] = UID;

const UBASE = ()=> {//«
	let id = UID();
	if (!id) return;
	return `LOTW/${id}`;
};//»
const SID = (val) => {//«
	let id = UID();
	if (!id) return;
	let key = `fbase-sid-gh-${id}`;
	if (!val) return localStorage.getItem(key);
	localStorage.setItem(key, val);
};//»
const GH_UNAME = (val) => {//«
	let id = UID();
	if (!id) return;
	let key = `uname-gh-${id}`;
	if (!val) return localStorage.getItem(key);
	localStorage.setItem(key, val);
};//»
const REF = (path)=> {//«
	return ref(fbase_db, path);
//	if (path) return ref(fbase_db, path);
//	return ref(db);
};//»
const GET = async(arg)=>{//«
//arg might be:
//- a string (implicitly means convert it to a ref)
//- a ref
//- a query (which is a reference together with a list of constraints)
//
if (isStr(arg)) arg = ref(fbase_db, arg);
try {
	return await get(arg);
}
catch(e){
	return e;
}

};//»
const UPDATE = async(ref_or_path, vals)=>{//«

if (isStr(ref_or_path)) ref_or_path = ref(fbase_db, ref_or_path);
try {
	await update(ref_or_path, vals);
	return true;
}
catch(e){
	return e;
}

};//»
const B64 = bytes =>{//«
	if (bytes.toBase64) return bytes.toBase64();
	return btoa(String.fromCharCode(...bytes));
};//»
const FROMB64 = str => {//«
if (!Uint8Array.fromBase64){
	try{
		return Uint8Array.fromBase64(str);
	}
	catch(e){
cerr(s);
		return null;
	}
}
str = atob(str);
let arr = new Uint8Array(str.length);
let len = arr.length;
for (let i = 0; i < len; i++) {
	arr[i] = str.charCodeAt(i);
}
return arr;

};//»
const DIE = mess => {throw new Error(mess);};

const get_session_id = () => {//«
let sess_id=(crypto.getRandomValues(new Uint8Array(SESS_ID_BYTE_LEN))).toBase64()
		.replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
	return sess_id;
};//»
const get_gh_login = async()=>{//«
	let gotname = GH_UNAME();
	if (gotname) return gotname;
	let ghid = UID();
	if (!ghid) return DIE(`Called get_gh_login when not signed in!?!?`);
	let rv;
	try{
		rv  = await fetch(`https://api.github.com/user/${ghid}`)
	}
	catch(e){
cerr(e)
//		return e.message;
		return e;
	}
	if (!rv.ok){
		return new Error("Could not fetch");
	}
	let obj = await rv.json();
	if (!(obj&&obj.login)){
cwarn("There is no login on the object below!?!?!?");
log(obj);
		return new Error("NO OBJ && OBJ.LOGIN FOUND?!?!? (see console)");
	}
	GH_UNAME(obj.login);
	return obj.login;
};//»
const get_statuses=async(opts={minsAgo: DEF_STATS_MINS_AGO, numRecent: DEF_STATS_NUM_RECENT})=>{//«
	let mins_ago = opts.minsAgo;
	let num_recent_stats = opts.numRecent;

	let start_time = new Date().getTime() - (mins_ago * 60000);
	let c1 = orderByChild('time');
//	let c2 = startAt(start_time);
	let c3 = limitToLast(num_recent_stats);
	let ref = REF("LOTW/status");
	let q = query(ref, c1, c3);
//	let q = query(ref, c1, c2, c3);
	let snap = await GET(q);
	if (isErr(snap)){
		return snap;
	}
	if (!snap.exists()){
		return new Error(`no statuses were found`);		
	}
	return snap.val();
};//»
const set_user_dirs = async () => {//«
cwarn("GET STATUSES...");
	let stats = await get_statuses();
	if (isErr(stats)) return stats;
	let keys = Object.keys(stats);
	let arr = [];
	for (let key of keys) arr.push(stats[key].name, key);
	await fsapi.popDir(root.kids.users, {vals: arr});
	return true;
};//»

//Exported functions (to sys/fs.js)
const get_user_dir_list = async (ghid, parId, path)=>{//«
//cwarn(`GETLIST(${ghid}): <${path}>`);
cwarn(`GETLIST(${ghid}): <${parId}> (${path})`);
if (!parId) parId = 0;
let rv = await db.getDirList(ghid, parseInt(parId));
let keys = Object.keys(rv);
let names = [];
let vals = [];
let blobIds = [];
for (let k of keys){
	let obj = rv[k];
	let name = obj.path.split("/")[1];
	let val;
	if (obj.type==="d") val = -1;
	else val = 0;
	blobIds.push(obj.blobId||0);
	names.push(name);
	vals.push(val);
}
return {
	names: names,
	vals: vals,
	ids: keys,
	blobIds
}; 

};
globals.funcs["netfs.getUserDirList"] = get_user_dir_list;
//»
const fb_read = async(ghid, blobId, opts={}) => {//«
//const fb_read = async(ghid, parid, name, opts={}) => {
cwarn(`READ(LOTW/${ghid}/blobs/${blobId})`);
	let is_text = opts.forceText || opts.text;
	if (!blobId) {
		if (is_text) return "";
		return new Uint8Array(0);
	}
	let rv = await GET(`LOTW/${ghid}/blobs/${blobId}`);
	if (isErr(rv)) return;
	let bytes = FROMB64(rv.val().contents);
	if (is_text) {
		return new TextDecoder().decode(bytes);
	}
	return bytes;
};
globals.funcs["netfs.fbRead"] = fb_read;
//»
const fb_write = async(path, val, opts={})=> {//«
//This must be a fullpath
cwarn(`WRITE(${path})`);

let saypath = path;
if (!path.match(/^\x2fusers\x2f/)){
	return new Error(`${path}: invalid path`);
}
if (!db){
	return new Error(`Not logged in`);
}
let arr = path.split("/");
arr.shift();
arr.shift();
let username = arr.shift();
if (username !== db.login){
	return new Error(`Permission denied`);
}
let name = arr.pop();
if (!name){
return new Error("WUTNOFILENAME");
}
let parpath = arr.join("/");
let parId;
if (!parpath) parId = 0;
else {
	let parnode = await parpath.toNode();
	if (!parnode) {
		return new Error(`NOPARNODE (${parpath})`);
	}
	parId = parnode.id;
}
log(`<${parpath}>(${parId}) <${name}>`);
if (!is_connected){
	return new Error("Not connected!");
}
return await db.createFileNode(parId, name, val);

};
globals.funcs["netfs.fbWrite"] = fb_write;
//»
const fb_set_blob = async (uid, node_id, blob_id, val, opts={}) => {//«
if (uid !== UID()){
cerr(`uid mismatch: ${uid} !== ${UID()}`);
return;
}
if (!Number.isFinite(blob_id)){
cerr(`INVALID BLOB_ID (NAN: ${blob_id})`);
return;
}

let start_bytes;
if (opts.append){
let rv = await fb_read(uid, blob_id);
if (!(rv instanceof Uint8Array)){
	return;
}
start_bytes = rv;
}
return db.setBlob(blob_id, node_id, val, start_bytes);

};
globals.funcs["netfs.fbSetBlob"] = fb_set_blob;
//»
const fb_mkdir = async(parpath, parId, name) =>{//«


if (!parpath.match(/^\x2fusers\x2f/)){
cerr(`${path}: invalid path`);
	return
}
if (!name){
cerr(`NO NAME GIVEN`);
	return
}

let arr = parpath.split("/");
arr.shift();
arr.shift();
let username = arr.shift();
if (!db){
cerr("NOTLOGGEDON");
return;
}
if (username !== db.login){
cerr("Permission denied");
return;
}
parpath = arr.join("/");

if (!parId) parId = 0;

cwarn(`MKDIR: <${parpath}> <${name}>`);
return await db.createDirNode(parseInt(parId), name);


};
globals.funcs["netfs.fbMkdir"] = fb_mkdir;
//»
const fb_get_users_node_by_name_and_par = async (name, parnode) => {//«
// parnode.appData was undefined after mkDir
//cwarn('PARNODE');
//log(parnode);
let ghid = parnode.appData.id;
let pathname = `${parnode.id}/${name}`;
log(`GET USER(${ghid}): ${pathname}`);
let q = query(REF(`/LOTW/${ghid}/nodes`), orderByChild('path'), equalTo(pathname), limitToFirst(1));
let rv = await GET(q);
if (isErr(rv)){
cerr(rv);
return;
}
if (!rv.exists()){
cwarn("NOT FOUND");
return;
}
let val = rv.val();
let keys = Object.keys(val);
if (keys.length !== 1){
cerr(`HOW MANY KEYS, wanted 1, but got: ${keys.length}! Here is the object:`);
log(val);
return;
}
let id = keys[0];
let node = val[id];
//log();
//let name = node.path.split("/")[1];
let typ;
if (node.type==="d") typ = -1;
else typ = 0;
return {
	blobId: node.blobId,
	id,
	name,
	val: typ
};

};
globals.funcs["netfs.getUsersNodeByNameAndPar"] = fb_get_users_node_by_name_and_par;
//»

//»

//Commands«

class com_chkfbdb extends Com {//«
	async run() {
		const{args}=this;
		let base = UBASE();
		if (!base) return this.no("not signed in!");
		if (!is_connected) return this.no("not connected!");
		if (db) return this.ok("already checked");
		let snap = await GET(`${base}/nextNodeId/nodeId`);
		if (isErr(snap)) return this.no(snap.message);
		let next_node_id = snap.val();
		if (next_node_id) {
//log(`NNI: ${next_node_id}`);
			let cur_sid = SID();
			if (!cur_sid){
				return this.no(`cur_sid: not found in local storage, but next_node_id exists`);
			}
			let login = await get_gh_login();
			if (isErr(login)) return this.no(login.message);
			db = new NetFsDB(cur_sid, login, next_node_id);
log(db);
			return this.ok("OK");
		}
//		if (cur_sid) return this.no(`cur_sid: was found in local storage, but next_node_id doesn't exist`);
		this.no("NO");
	}
}//»
class com_mkfbdb extends Com {//«

	async run() {
		const{args}=this;
		let id = UID();
		if (!id) return this.no("not signed in!");
		let snap = await GET(`LOTW/status/${id}/name`);
		if (isErr(snap)) return this.no(snap.message);
		if (snap.val()) {
			return this.no("database exists!");
		}
		let sid = get_session_id();
		let login = await get_gh_login();
		if (isErr(login)) return this.no(e.message);
		if (!is_connected) return this.no("not connected!");
		await UPDATE("LOTW", {
			[`status/${id}`]: {
				time: serverTimestamp(),
				msg: "HELO",
				name: login
			},
			[`${id}/sessIds/${sid}`]: true,
			[`${id}/curSessId`]: sid, // Added: !data.exists()
			[`${id}/nextNodeId`]: {
				nodeId: 1, // (!data.exists() && newData.val() === 1)
				sessId: sid // Added: !data.exists()
			}
		});
		SID(sid);
		db = new NetFsDB(sid, login, 1);
log(db);
		this.ok();
	}

}//»
class com_touchfbfile extends Com {//«
async run(){
const{args}=this;
if (!db) return this.no("No db");
log(db);
this.ok();
}
}//»
class com_mountusers extends Com{//«

	async run(){
		const{args}=this;
		if (!!root.kids.users){
			this.wrn("already mounted");
			return;
		}
		mount_tree("users", USERS_TYPE);
//		this.suc("/users: successfully mounted");
		this.inf("Searching for users...");
		let rv = await set_user_dirs();
		if (isErr(rv)){
			this.wrn(`${rv.message}`);
		}
		else if (rv === true){
			this.suc("OK!");
		}
		else{
			this.wrn("Unknown value returned from set_user_dirs! (see console)");
			log(rv);
		}
//Maybe we should export a basic function to fs.populate_dirobj for use with the basic
//shell/terminal functions like ls and doing tab complete.
		this.ok();
	}
}//»

//class com_ghlogin extends Com {//«
//
//async run(){
//
//const{args}=this;
//if (cur_user){
//	this.wrn("Already logged in!");
//	this.ok();
//	return;
//}
//
//try {
//	await signInWithPopup(fbase_auth, gh_provider);
////	await signInWithPopup(fbase_auth, new GithubAuthProvider());
//	this.ok();
//}
//catch(e){
//cerr(e);
//	this.no(e.message);
//	return;
//}
//
//}
//
//}
////»
//class com_ghlogout extends Com {//«
//
//async run(){
//const{args}=this;
//if (!cur_user){
//this.wrn("Already logged out!");
//this.ok();
//return;
//}
////this.ok("DOLOGOUT");
//	try{
//		await signOut(fbase_auth);
////		delete_auth();
//		this.ok('Signed out');
//	}
//	catch(e){
//cerr(e);
//		this.no(e.message);
//	}
//}
//
//}//»

//const coms = {
//
//ghlogin: com_ghlogin,
//ghlogout: com_ghlogout,
//chkfbdb: com_chkfbdb,
//mkfbdb: com_mkfbdb,
//touchfbfile: com_touchfbfile,
//mountusers: com_mountusers,
//
//}

//»

//export {coms, ONKILL as onkill};


if (globals["var"]["netfs.sid"]) {
	db = new NetFsDB(globals["var"]["netfs.sid"], globals["var"]["netfs.login"], globals["var"]["netfs.nextNodeId"]);
log(db);
}
//globals["var"]["netfs.nextNodeId"] = db.nextNodeId;
//globals["var"]["netfs.sid"] = db.sid;

*/
//»

//Old«

/*


//Var«

const FBASE_DIRECTORY_VAL = -1;

const AWAIT_UPDATE_MS = 5000;
let update_num = 1;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// Attach a listener to detect changes in the connection state
let is_connected = false;
//When we do tons of dev reloading, this never gets unregistered, and we end up getting tons
//of warnings, upon reconnecting after disconnecting (e.g. due to closing the laptop cover).
//Perhaps we can export an onkill method.
const DISCON_CB = onValue(ref(db, ".info/connected"), (snap) => {
	is_connected = snap.val();
cwarn(`Connected: ${is_connected}`);
});
const onkill = ()=>{
	DISCON_CB();
};


//LOGIN_BUTTONS_STR«
//const GOOGLE_BUT_ID = "googleSignInBtn";
const GITHUB_BUT_ID = "githubSignInBtn";
const LOGIN_BUTTONS_STR = `
<button name="${GITHUB_BUT_ID}" class="gsi-material-button">
  <div class="gsi-material-button-state"></div>
  <div class="gsi-material-button-content-wrapper">
    <div class="gsi-material-button-icon">

<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.08-.731.084-.716.084-.716 1.192.085 1.816 1.29 1.816 1.29 1.063 1.816 2.784 1.29 3.465.987.108-.767.422-1.29.763-1.59-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.462-2.381 1.229-3.221-.124-.3-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.003.404 2.292-1.552 3.3-.931 3.3-.931.653 1.653.242 2.876.118 3.176.768.84 1.228 1.911 1.228 3.221 0 4.611-2.801 5.625-5.476 5.922.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.196-6.086 8.196-11.386 0-6.627-5.373-12-12-12z"/>
</svg>
    </div>
    <span class="gsi-material-button-contents">Sign in with GitHub</span>
    <span style="display: none;">Sign in with GitHub</span>
  </div>
</button>
`;
//»
//GSI_CSS_STR«
const GSI_CSS_STR = `
.gsi-material-button {
-moz-user-select: none;
-webkit-user-select: none;
-ms-user-select: none;
-webkit-appearance: none;
background-color: WHITE;
background-image: none;
border: 1px solid #747775;
-webkit-border-radius: 20px;
border-radius: 20px;
-webkit-box-sizing: border-box;
box-sizing: border-box;
color: #1f1f1f;
cursor: pointer;
font-family: 'Roboto', arial, sans-serif;
font-size: 14px;
height: 40px;
letter-spacing: 0.25px;
outline: none;
overflow: hidden;
padding: 0 12px;
position: relative;
text-align: center;
-webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
transition: background-color .218s, border-color .218s, box-shadow .218s;
vertical-align: middle;
white-space: nowrap;
width: auto;
max-width: 400px;
min-width: min-content;
}

.gsi-material-button .gsi-material-button-icon {
height: 20px;
margin-right: 12px;
min-width: 20px;
width: 20px;
}

.gsi-material-button .gsi-material-button-content-wrapper {
-webkit-align-items: center;
align-items: center;
display: flex;
-webkit-flex-direction: row;
flex-direction: row;
-webkit-flex-wrap: nowrap;
flex-wrap: nowrap;
height: 100%;
justify-content: space-between;
position: relative;
width: 100%;
}

.gsi-material-button .gsi-material-button-contents {
-webkit-flex-grow: 1;
flex-grow: 1;
font-family: 'Roboto', arial, sans-serif;
font-weight: 500;
overflow: hidden;
text-overflow: ellipsis;
vertical-align: top;
}

.gsi-material-button .gsi-material-button-state {
-webkit-transition: opacity .218s;
transition: opacity .218s;
bottom: 0;
left: 0;
opacity: 0;
position: absolute;
right: 0;
top: 0;
}

.gsi-material-button:disabled {
cursor: default;
background-color: #ffffff61;
border-color: #1f1f1f1f;
}

.gsi-material-button:disabled .gsi-material-button-contents {
opacity: 38%;
}

.gsi-material-button:disabled .gsi-material-button-icon {
opacity: 38%;
}

.gsi-material-button:not(:disabled):active .gsi-material-button-state, 
.gsi-material-button:not(:disabled):focus .gsi-material-button-state {
background-color: #303030;
opacity: 12%;
}

.gsi-material-button:not(:disabled):hover {
-webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
}

.gsi-material-button:not(:disabled):hover .gsi-material-button-state {
background-color: #303030;
opacity: 8%;
}
`;
//»
const GSI_CSS_ID = "gsi_css";

const NEW_DIR = {
	type: "d",
	size: 0,
	list: {
		names: [false],
		vals: [false]
	},
	kids:{
		"%init": true
	}
};
Object.freeze(NEW_DIR);
Object.freeze(NEW_DIR.list);
Object.freeze(NEW_DIR.kids);

const NEW_FILE = {type: "f", size: 0};
Object.freeze(NEW_FILE);

const DEF_TRANS_DELAY = 5000;

//»

//DOM«

////let goog_but, gh_but;
//let gh_but;
//let buttons = button_div.getElementsByTagName("button");
//for (let but of buttons){
//	if (but.name == GITHUB_BUT_ID){
//		gh_but = but;
//	}
//}
//if (!gh_but){
//cerr("WHERE IS THE BUTTON (gh_but)?");
//}
//»
//Funcs«

//function incrementCounter(path, amount) {
//  const counterRef = ref(db, path);
//  set(counterRef, increment(amount));
//}
//incrementCounter('posts/postId123/likes', 1);
//incrementCounter('pages/pageId456/views', -1);


const encode_key=(key) => {//«
	const encoder = new TextEncoder();
	const data = encoder.encode(key);
	return B64(data).replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
}//»
//const decode_key=(safeKey)=>{//«
//	const padded = safeKey.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - safeKey.length % 4) % 4);
//	const decoded = atob(padded);
//	const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
//	return new TextDecoder().decode(bytes);
//};//»
const USERS_CACHE_PATH = `${APPDATA_PATH}/netfs/cache`;

const set_user_dirs = async () => {//«
	if (!await fsapi.mkDir(APPDATA_PATH, "netfs")){ //COMMENTED OUT
		return new Error(`could not create the 'netfs' data directory`);
	}
	let rv = await USERS_CACHE_PATH.toNode();
let obj;
if (rv){
cwarn("HAVE CACHE...");
	obj = await USERS_CACHE_PATH.toJson();
	if (!obj) return new Error(`could not get the user statuses data`);
}
else {
cwarn("GET STATUSES...");
let stats = await get_statuses();
if (isErr(stats)) return stats;
obj = stats.val();
if (!await fsapi.WRITEFILE(USERS_CACHE_PATH, JSON.stringify(obj))){ 
	return new Error(`could not cache the user statuses`);
}
}
let keys = Object.keys(obj);
let arr = [];
for (let key of keys){
arr.push(obj[key].name, key);
//arr.push();
}
await fsapi.popDir(root.kids.users, {vals: arr});
	return true;
};//»
const update = async (refarg, obj) => {//«
	if (isStr(refarg)) refarg = get_ref(refarg);
	try{
		await _update(refarg, obj);
		return true;
	}
	catch(e){
cwarn("The update failed!");
cerr(e);
		return false;
	}
};//»
//const update = async (refarg, obj) => {//«
////This "safe" update sets a timeout for a "reasonable" period, and warns if the server has
////not completed within the specified interval. If after returning, we have previously warned,
////then we let the user know that the update has finished. In case everything works fine,
////nothing is reported.
//	if (isStr(refarg)) refarg = get_ref(refarg);
//
//	let have_num = update_num;
//	update_num++;
//	let did_warn = false;
//	let timeout = setTimeout(()=>{
//cwarn(`update#${have_num} has not returned after: ${AWAIT_UPDATE_MS}ms!`);
//		did_warn = true;
//	}, AWAIT_UPDATE_MS);
//	try {
//		await _update(refarg, obj);
//		clearTimeout(timeout);
//		if (did_warn){
//log(`update#${have_num} has finally returned!`);
//		}
//	}
//	catch(e){
//cwarn(`An error has occurred for update#${have_num}`);
//cerr(e);
//	}
//};//»
const parallel_sort = (primary, secondary, if_rev) => {//«
//«
//Say you are given 2 JS arrays of equal length. One of them must be sorted
//according to the results of a call to sort, and the other one should likewise
//be sorted such that all of its elements should have their positions swapped in
//the same manner as the first.
//
//Grok: doesn't work!
//function sortWithPartner(arr1, arr2) {
//	const indices = arr1.map((_, i) => i);
//	indices.sort((a, b) => arr1[a] - arr1[b]);
//	return [
//		indices.map(i => arr1[i]),
//		indices.map(i => arr2[i])
//	];
//}
//»
// 1. Combine into an array of objects
const combined = primary.map((value, index) => {
	return {
		first: value,
		second: secondary[index]
	};
});

// 2. Sort the array of objects based on the first  value
if (if_rev){
	combined.sort((a, b) => {
		if (a.first > b.first) {
			return -1;
		}
		if (a.first < b.first) {
			return 1;
		}
		return 0;
	});
}
else {
	combined.sort((a, b) => {
		if (a.first < b.first) {
			return -1;
		}
		if (a.first > b.first) {
			return 1;
		}
		return 0;
	});
}

//// 3. Separate the sorted values back into new arrays
//const sortedPrimary = combined.map(item => item.first);
//const sortedSecondary = combined.map(item => item.second);
//
//return [sortedPrimary, sortedSecondary];

return [
	combined.map(item => item.first),
	combined.map(item => item.second)
];

}//»
const get_fbase_user = () =>{//«
	return new Promise((Y,N)=>{
		const auth = getAuth(app);
		let cb = onAuthStateChanged(auth, (user) => {
			cb();
			Y(user);
		});
	});
};//»
const get_ref = (path) => {//«
	if (path) return ref(db, path);
	return  ref(db);
};//»
const get_value = async(ref)=>{//«

let rv;
try{
	rv = await get(ref);
	return rv;
}
catch(e){
	return e;
}

};//»
const delete_auth = () => {//«
	if (globals.auth.github.uid) {
		localStorage.removeItem(`github-${globals.auth.github.uid}`);
		delete globals.auth.github.uid;
		delete globals.auth.github.login;
	}
};//»
const set_auth = (uid, login) => {//«
	globals.auth.github.uid = uid;
	globals.auth.github.login = login;
};//»

const run_transaction = (ref, value, delay=DEF_TRANS_DELAY) => {//«
// * Executes a Firebase transaction with a timeout, ensuring a pending write is
// * aborted if it hasn't completed within the delay.
// *
// * @param {firebase.database.Reference} ref The database reference.
// * @param {*} value The value to set.
// * @param {number} delay The timeout duration in milliseconds.
// * @returns {Promise<void>} A promise that resolves when the transaction
// *   completes or rejects if it fails or times out.

return new Promise(async(resolve, reject) => {
	// Flag to track if the timeout has already occurred
	let timedOut = false;
	let timer;
	// Reject the promise and abort the transaction on timeout
	const onTimeout = () => {
		timedOut = true;
//		ref.transaction(() => undefined); // Send an abort command to the queue
		runTransaction(ref, ()=>{return undefined;});
		resolve(new Error('Firebase write operation timed out.'));
	};

	// Start the timeout timer
	timer = setTimeout(onTimeout, delay);
	let result;
	try {
		result = await runTransaction(ref, curVal=>{
			// If the timer has already fired, abort the transaction
			if (timedOut) {
				return undefined; // Returning undefined aborts the transaction
			}
			return value;
		});
		clearTimeout(timer);
		if (result.committed) {
//log('Transaction successfully committed.');
			resolve(true);
		} 
		else {
			// If the transaction aborted for a reason other than our timeout
//log('Transaction aborted by another process.');
			resolve(new Error('Transaction aborted by another client.'));
		}
	}
	catch(error){
		clearTimeout(timer);
cerr(error);
		resolve(error);
	}
//«
//	ref.transaction((currentValue) => {
//	}).then((result) => {
//		// Clear the timer if the transaction completes for any reason
//	}).catch((error) => {
//		// Clear the timer if the transaction fails
//		clearTimeout(timer);
//		reject(error);
//	});
//»
});
}//»
const get_id = ()=> {//«
	let gh_id = globals.auth.github.uid;
	if (!gh_id){
		return "please call 'user' first!";
	}
	return parseInt(gh_id);
};//»

const set_name = async(use_name)=>{//«

if (!use_name) {
	use_name = await get_name();
	if (isErr(use_name)) return use_name;
//	if (isStr(use_name)) return use_name;
}
//log(`SETTING: ${ghid}: ${use_name}`);
return await update(`/names`, {[ghid]: use_name});

};//»




const fb_read = async(ghid, path, opts = {})=>{//«

let rel_path_enc = "";
if (path.match(/\x2f/)) {
if (path === "/"){
return new Error("'/': invalid path");
}
	let arr = path.split("/");
	for (let name of arr){
		rel_path_enc+=`/kids/${encode_key(name)}`;
	}
}
else{
	rel_path_enc=`/kids/${encode_key(path)}`;
}

let base_path = `/user/${ghid}${rel_path_enc}/contents`;

let snap = await get_value(get_ref(base_path));
if (isErr(snap)){
//	return this.no(snap.message);
	return snap;
}
if (!snap.exists()){
	return new Error(`${path}: not found`);
}

if (opts.forceText || opts.text){
	return (atob(snap.val()));
}
else {
	return FROMB64(snap.val());
}

};//»
globals.funcs["netfs.fbRead"] = fb_read;

const do_fbase_fs_op = async(_this, optsArg={}) => {//«

let ghid = get_id();
if (isStr(ghid)){
	_this.no(ghid);
	return;
}
//This currently only works in the base user dir

const{args, opts}=_this;
if (!is_connected && !opts.offline){
	_this.no("not connected (use --offline to force)");
	return;
}

//let ghid = globals.auth.github.uid;
let path = args.shift();

if (!path) return _this.no("no path given");

let use_obj;
let use_val;
let say_type;
if (optsArg.mkDir){//«
	use_obj = NEW_DIR;
	use_val = FBASE_DIRECTORY_VAL;
	say_type = "folder";
}
else if (optsArg.bytes){
	let bytes = optsArg.bytes;
	use_val = bytes.byteLength;
	say_type = "file";
	use_obj = {type: "f", size: bytes.byteLength, contents: B64(bytes)};
}
else if (optsArg.rmDir) {
	say_type = "folder";
	use_obj = {};//This effectively deletes the object from the database
}
else if (optsArg.rmFile){
	say_type = "file";
	use_obj = {};//Same as above
}
else {
	use_obj = NEW_FILE
	use_val = 0;
	say_type = "file";
}//»

let rel_path_enc = "";
let name;
if (path.match(/\x2f/)) {
if (path === "/"){
return _this.no("'/': invalid path");
}
	let arr = path.split("/");
	name = arr.pop();
	for (let name of arr){
		rel_path_enc+=`/kids/${encode_key(name)}`;
	}
}
else{
	name = path;
}
let base_path = `/user/${ghid}${rel_path_enc}`;
let list_ref = get_ref(`${base_path}/list`);
let snap = await get_value(list_ref);
if (isErr(snap)){
	return _this.no(snap.message);
}
if (!snap.exists()){
	if (!rel_path_enc) _this.no("you must create your user directory with fbmkhomedir!");
	else{
		_this.no(`the parent directory was not found`);
	}
	return 
}

let list = snap.val();
let ind = list.names.indexOf(name);
if (ind >= 0){
	if (optsArg.mkDir) {
		_this.no(`exists: ${name}`);
		return;
	}
	else if (optsArg.rmDir){
		if (list.vals[ind] !== FBASE_DIRECTORY_VAL){
			_this.no(`'${name}': not a directory`);
			return;
		}
		let rv = await get_value(get_ref(`${base_path}/kids/${encode_key(name)}/size`));
		if (isErr(rv)){
			return _this.no(rv.message);
		}
		if (rv.val() > 0){
			return _this.no(`'${name}': the directory is not empty`);
		}
	}
	else if (optsArg.rmFile){
		if (list.vals[ind] === FBASE_DIRECTORY_VAL){
			_this.no(`'${name}': is a directory`);
			return;
		}
	}
	else if (!use_val){
		_this.ok(`exists: ${name}`);
		return;
	}
	else if (list.vals[ind] === FBASE_DIRECTORY_VAL){
		_this.no(`'${name}': cannot write to the directory`);
		return;
	}
	else{
//We have a value and a file (update it)
		list.names.splice(ind, 1);
		list.vals.splice(ind, 1);
	}
}
else if (optsArg.rmDir || optsArg.rmFile){

_this.no(`'${name}': not found`);
return;
}

let use_len;
if (optsArg.rmDir || optsArg.rmFile){
	list.names.splice(ind, 1);
	list.vals.splice(ind, 1);
	use_len = list.names.length;
	if (!use_len){
		list.names=[false];
		list.vals=[false];
	}
}
else if (!list.names[0]){
	list.names = [name];
	list.vals = [use_val];
	use_len = 1;
}
else{
	list.names.push(name);
	list.vals.push(use_val);
	let rv = parallel_sort(list.names, list.vals);
	list.names = rv[0];
	list.vals = rv[1];
	use_len = list.names.length;
}

let enc_path = encode_key(name);

let update_obj = {
	list,
	size: use_len,
	[`kids/${enc_path}`]: use_obj
};
if (await update(base_path, update_obj)) _this.ok();
else _this.no("Update failed! (see console for error)");

};//»


//»

//Commands«


const com_ghname2id = class extends Com{//«

async run(){
const{args}=this;
let name = args.shift();
if (!name) return this.no("Need a github username!");
let rv;
try{
rv  = await fetch(`https://api.github.com/users/${name}`)
}
catch(e){
this.no(e.message);
cerr(e)
return;
}
if (!rv.ok){
this.no("Could not fetch");
return;
}
let obj = await rv.json();
if (!(obj&&obj.id)){
	this.no("NO OBJ && OBJ.ID FOUND?!?!? (see console)");
	cwarn("There is no id on the object below!?!?!?");
	log(obj);
	return;
}
this.out(obj.id+"");
this.ok();
}

}//»
const com_ghid2name = class extends Com{//«

async run(){
const{args}=this;
let id = args.shift();
if (!id) return this.no("Need a github id!");
let rv;
try{
rv  = await fetch(`https://api.github.com/user/${id}`)
}
catch(e){
this.no(e.message);
cerr(e)
return;
}
if (!rv.ok){
this.no("Could not fetch");
return;
}
let obj = await rv.json();
if (!(obj&&obj.login)){
	this.no("NO OBJ && OBJ.LOGIN FOUND?!?!? (see console)");
	cwarn("There is no login on the object below!?!?!?");
	log(obj);
	return;
}
this.out(obj.login+"");
this.ok();
}

}//»
const com_fbsetname = class extends Com{//«
async run(){
const{args}=this;
if (await set_name()) this.ok();
else this.no("Update failed! (see console for error)");
}
}//»
const com_user = class extends Com{//«
//This will be the interface into one's own user account
static getOpts(){
	return{
		s:{
			f: 1,
			c: 1
		},
		l:{
			force: 1,
			click: 1
		}
	};
}
async run(){

const{args, opts, env}=this;
let com = args.shift();
if (!com) com = "stat";
//log(env);
const coms = ["signin", "in", "i", "signout", "out", "o", "stat"];
if (!coms.includes(com)){
	this.no(`invalid command: ${com}`);
	return;
}

let is_signin = com === "signin" || com === "in" || com === "i";
let is_signout = com === "signout" || com === "out" || com === "o";
let is_stat = com === "stat";

if ((is_stat || is_signin) && globals.auth.github.login && !(opts.force || opts.f)){
	let already = "";
//	if (is_signin) already = " already";
	this.ok(`you are${already} signed in as: ${globals.auth.github.login}`);
	return;
}

const auth = getAuth(app);

const handle_user = async user => {//«
	if (is_signout){
		try{
			await signOut(auth);
			delete_auth();
			this.ok('Signed out');
		}
		catch(e){
			cerr(e);
			this.no(e.message);
		}
		return;
	}
	if (!(user.uid && user.providerData && user.providerData[0].uid)){
		this.no("'uid' NOT FOUND in user OR user.providerData[0]! (see console)");
cwarn("Here is the offending user object without user.id OR user.providerData[0].uid");
log(user);
		return;
	}
	let uid = user.providerData[0].uid;
	env["GITHUB_ID"] = uid;
//	let uid = user.uid;
	let login = localStorage.getItem(`github-${uid}`);
	if (login){
		env["GITHUB_NAME"] = login;
log("Got github login", login);
		set_auth(uid, login);
		this.ok(`you are signed in as: ${login}`);
		return;
	}
	login = await get_name(uid);
	if (isErr(login)){
		this.no(login.message);
		return;
	}
	env["GITHUB_NAME"] = login;
//«
//	let rv;
//	try{
//		rv = await fetch(`https://api.github.com/user/${uid}`);
//	}
//	catch(e){
//		this.no(`fetch error: ${e.message}`);
//cerr(e);
//		return;
//	}
//	if (!rv.ok){
//		this.no(`could not fetch the user object for github uid(${uid}) from api.github.com!`);
//		return;
//	}
//	let obj = await rv.json();
////SUKFMGH
//	login = obj.login;
//	if (!login){
//		this.no(`no login name for github uid(${uid}) on the user object received from api.github.com!`);
//		return;
//	}
//log("Setting", `github-${uid}`, login);
//»
	localStorage.setItem(`github-${uid}`, login);
	set_auth(uid, login);
	this.ok(`you are signed in as: ${login}`);
};//»

let cb = onAuthStateChanged(auth, async user => {//«
cb();//Just doing this once, so the returned value is supposed to unregister the callback.

if (user) return handle_user(user);

delete_auth();

if (!is_signin) {
	this.ok("You are signed out");
	return;
}

//«
//Either the user clicks a sign-in button, and pop_div.cancel() will be called, or
//they will click the popup's lone button (here arbitrarily labelled "CANCEL"), and 
//the command will immediately return. 
//
//If they try clicking the popup's button after clicking one of the sign-in
//buttons, the popup's callback will return because the is_active flag is set.
//»

let pop_div;
let is_active = false;
const do_signin = async()=> {//«
	try {
		await signInWithPopup(auth, new GithubAuthProvider());
		pop_div && pop_div.cancel();
	}
	catch(e){
		cerr(e);
		this.no(e.message);
		pop_div && pop_div.cancel();
		return;
	}
	user = await get_fbase_user();
	if (user){
		handle_user(user);
	}
	else{
		this.no(`Failed to get user object after after signing in`);
	}
};//»
if ((opts.click || opts.c) && globals.popup) {//«

if (!document.getElementById(GSI_CSS_ID)) {
	let sty = mk("style");
	sty.innerHTML = GSI_CSS_STR;
	sty.id = GSI_CSS_ID;
	document.head.appendChild(sty);
}

const button_div = mkdv();
button_div.innerHTML = LOGIN_BUTTONS_STR;
let gh_but;
let buttons = button_div.getElementsByTagName("button");
for (let but of buttons){
	if (but.name == GITHUB_BUT_ID){
		gh_but = but;
	}
}
pop_div = globals.popup.popup(button_div, {//«
	cb: ()=>{
		if (is_active) return;
//If we get down here, neither of the sign-in buttons will have been clicked
		this.wrn("Cancelled!");
		this.ok();
	}, 
	oktxt: "CANCEL"
});//»
gh_but.onclick=async()=>{//«
	is_active = true;
	gh_but.onclick = null;
//	goog_but.onclick = null;
	do_signin();
};//»

}//»
else{
	do_signin();
}

});//»

}
}//»
const com_users = class extends Com{//«

//mount: mount a filesystem under "/users" of type: USERS_TYPE.

//list; give fine-grained control over what user directories to list inside of /users.

	async run(){
		const{args}=this;
		let com = args.shift();

if (!globals.auth.github.uid){
	return this.no("please call 'user' first!");
}

		if (!com){
			this.no(`missing command`);
			return;
		}
		let did_mount = !!root.kids.users;
		if (com=="mount") {//«
			if (did_mount){
				this.wrn("already mounted");
			}
			else{
				mount_tree("users", USERS_TYPE);
				this.suc("/users: successfully mounted");
let rv = await set_user_dirs();
this.inf("Mounting the users...");
if (isErr(rv)){
this.wrn(`${rv.message}`);
}
else if (rv === true){
this.suc("OK!");
}
else{
this.wrn("Unknown value returned from set_user_dirs! (see console)");
log(rv);
}
//Maybe we should export a basic function to fs.populate_dirobj for use with the basic
//shell/terminal functions like ls and doing tab complete.
			}
			this.ok();
		}//»
		else if (com == "umount"){
			if (did_mount) delete root.kids.users;
			else this.wrn("/users: not mounted");
			this.ok();
		}
		else if (com=="list") {//«
			if (!did_mount) return this.no("Did not mount!");
let user = await get_fbase_user();
if (!user) return this.no("Not signed in!");
log(user);
this.wrn("GET THE LIST...");
this.ok();
		}//»
		else{
			this.no(`unknown command: ${com}`);
		}
	}
}//»
const com_fbase = class extends Com{//«
	async run(){
		const{args}=this;
		let com = args.shift();
		if (com == "ref") {
let path = args.shift();
let ref;
if (path) ref = ref(db, path);
else ref = ref(db);
log(ref);
this.ok();
		}
		else if (com == "set") {
//".write": "newData.child('timestamp').val() > now - 60000"
////".write": "newData.child('timestamp').val() > now - 60000 || !data.exists()"//???
let path = args.shift();
let val = args.shift();
if (!val) val = true;
let ref;
if (path) ref = ref(db, path);
else ref = ref(db);
try {
let rv = await set(ref, val);
this.ok();
}
catch(e){
this.no(e.message);
cerr(e);
}
		}
		else{
			this.no(`'${com}': unknown command`);
		}
	}
}//»
const com_fbtouch = class extends Com{//«
static getOpts(){
	return {
		l: {offline: 1}
	}
}
run(){
	do_fbase_fs_op(this);
}
}//»
const com_fbwrite = class extends Com{//«
static getOpts(){
	return {
		l: {offline: 1}
	}
}
async run(){
//Should we just do a base64 of the bytes?
const{args, term}=this;
let path = args.shift();
if (!path) return this.no("File arg needed");
let bytes = await path.toBytes(term);
if (!bytes) return this.no(`${path}: invalid path`);
if (!bytes.length) return do_fbase_fs_op(this);
do_fbase_fs_op(this, {bytes});
}
}//»
const com_fbmkdir = class extends Com{//«
static getOpts(){
	return {
		l: {offline: 1}
	}
}
run(){
	do_fbase_fs_op(this, {mkDir: true});
}
}//»
const com_fbmkhomedir = class extends Com{//«
async run(){
const{args}=this;

const gh = globals.auth.github;
if (!gh.uid){
	return this.no("please call 'user' first!");
}
let type_ref = get_ref(`/user/${gh.uid}/type`);
let snap = await get_value(type_ref);
if (isErr(snap)){
	return this.no(snap.message);
}
if (snap.exists()){
	this.wrn("the home directory exists");
	this.ok();
	return;
}

let username = await get_name();
if (isErr(username)){
cerr(username);
this.no(username.message);
return;
}

if (await update("/user", {[gh.uid]: NEW_DIR})) this.ok();
else this.no("Update failed! (see console for error)");

//update("/", {
//	[`names/${gh.uid}`]: username, 
//	[`user/${gh.uid}`]: NEW_DIR
//});

}
}//»
const com_fbls = class extends Com{//«
async run(){
const{args}=this;

let ghid = get_id();
if (isStr(ghid)) return this.no(ghid);
let path = args.shift();
let list = await get_user_dir_list(ghid, path);
if (isErr(list)) return this.no(list.message);
let names = list.names;
if (names[0]===false){
	this.wrn(`the directory is empty`);
	this.ok();
	return;
}
let vals = list.vals;
let out = "";
for (let i=0; i < names.length; i++){
	let nm = names[i];
	if (vals[i]===-1){
		nm = `${nm}/`;
	}
	out += `${nm} `;
}
this.out(out);
this.ok();
}
}//»
const com_fbstat = class extends Com {//«
	async run(){
		const{args}=this;

//		let ghid = get_id();
//		if (isStr(ghid)) return this.no(ghid);
		let id = globals.auth.github.uid;
		let login = globals.auth.github.login;
		if (!(id && login)) return this.no("please call 'user' first");
		if (!args.length){
			return this.no("Nothing given!");
		}
		let obj = {
			time: serverTimestamp(),
			msg: args.join(" "),
			name: login
		};
		if (await update("/status", {[id]: obj})) this.ok();
		else this.no("Update failed! (see console for error)");
	}
}//»
const com_fbstats = class extends Com{//«
static getOpts(){
return {
s:{
y: 1,
s: 1
}
}
}
//This allows for the ability to run a query on the numerical ids, and get back whatever relevant
//information they might want to provide.

async run(){
const{args, opts}=this;

let snap = await get_statuses();
if (isErr(snap)) return this.no(snap.message);
let use_year = opts.y;
let use_secs = opts.s;
snap.forEach(kid=>{
	let val = kid.val();
	let arr = (new Date(val.time)+"").split(" ");
	let time = use_secs ? arr[4] : arr[4].replace(/:..$/, "");
	let str = use_year ? `${arr[1]} ${arr[2]} ${arr[3]} ${time}` : `${arr[1]} ${arr[2]} ${time}`;
	this.out(`${val.name} (${str}): ${val.msg}`);
});
this.ok();
}
}//»
const com_fbrm = class extends Com{//«
async run(){
const{args}=this;
//This is just like write, but we pass null to existing file ref
do_fbase_fs_op(this, {rmFile: true});
}
}//»
const com_fbrmdir = class extends Com{//«
async run(){
const{args}=this;
//This is just like write, but we pass null to an existing directory ref
do_fbase_fs_op(this, {rmDir: true});
}
}//»

const com_fbread = class extends Com{//«

async run(){

const{args}=this;
let ghid = get_id();
if (isStr(ghid)){
	this.no(ghid);
	return;
}
let path = args.shift();
if (!path){
	return this.no("path not given");
}
let is_text = path.hasTextExt();
let val = await fb_read(ghid, path, {forceText: is_text});
//«
//let rel_path_enc = "";
//if (path.match(/\x2f/)) {
//if (path === "/"){
//return this.no("'/': invalid path");
//}
//	let arr = path.split("/");
//	for (let name of arr){
//		rel_path_enc+=`/kids/${encode_key(name)}`;
//	}
//}
//else{
//	rel_path_enc=`/kids/${encode_key(path)}`;
//}
//
//let base_path = `/user/${ghid}${rel_path_enc}/contents`;
//
//let snap = await get_value(get_ref(base_path));
//if (isErr(snap)){
//	return this.no(snap.message);
//}
//if (!snap.exists()){
//	this.no(`${path}: not found`);
//	return;
//}
//»
if (isErr(val)){
this.no(val.message);
return;
}
this.out(val);

this.ok();

}
}//»

//»

//Export«
const coms = {
	users: com_users,
	user: com_user,
	ghname2id: com_ghname2id,
	ghid2name: com_ghid2name,
	fbase: com_fbase,
	fbtouch: com_fbtouch,
	fbmkdir: com_fbmkdir,
	fbmkhomedir: com_fbmkhomedir,
	fbls: com_fbls,
	fbstat: com_fbstat,
	fbstats: com_fbstats,
	fbwrite: com_fbwrite,
	fbrm: com_fbrm,
	fbrmdir: com_fbrmdir,
	fbread: com_fbread,
	fbsetname: com_fbsetname,
}

export {coms, onkill};

//»

*/

/*«

PAST:

root: {

".read": false,
".write": false,

LOTW: {

	"$ghid": {
		sessIds: { // Register a unique session id here upon local initialization, stored locally
			".validate": "!root.child($ghid).child('sessIds')[newData.val()]"
		},
		curSessId: {
			'.validate": "newData.isString() && newData.val().length == 4"
		},
		nextNodeId: {
		},
		nodes: {
			".indexOn" = ["parId", "path"],
			"$nodeId": {
				".read": "auth != null",
				".write": "auth.ghid = $ghid",
				".validate": "data.exists() || newData.hasChildren(['parId', 'type', 'path'])",
				"parId": { // Mutable
					".validate": "newData.isNumber()"
				},
				"path": { // Mutable: parId/name
					".validate": "newData.isString() && newData.val().length < $PATH_MAX"
				},
				"type": {
					".validate": "!data.exists() && newData.isString() && newData.val().length < $TYPE_MAX"
				},
				"blobId": {
					".validate": "!data.exists() && newData.isString() && newData.val().length < $ID_MAX"
				}
				"$other": {
					".validate": false
				}
			}
		},
		blobs: {
			"$blobId": {
				"meta": { // Example
					"field1": {
						".validate": "newData.isString() && newData.val().length < $FIELD1_MAX"
					},
					"field2": {
						".validate": "newData.isNumber()" 
					},
					"field3": {
						".validate": "newData.isBoolean()"
					},
					".other": {
						".validate": false
					}
				},
				"contents": {
					".validate": "newData.isString() && newData.val().length < $CONTENTS_MAX"
				},
				"$other": {
					".validate": false
				}
			}
		}
	}
},

OTHER_NS: {

}

}

»*/
/*«
goog_but.onclick=async()=>{//«
	is_active = true;
	goog_but.onclick = null;
	gh_but.onclick = null;
	try {
		await fbase.signInWithPopup(auth, new fbase.GoogleAuthProvider());
		this.ok("Signed in with Google!");
	}
	catch(e){
		cerr(e);
		this.no(e.message);
	}
	pop_div.cancel();
};//»
<button name="${GOOGLE_BUT_ID}" class="gsi-material-button">
  <div class="gsi-material-button-state"></div>
  <div class="gsi-material-button-content-wrapper">
    <div class="gsi-material-button-icon">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
      </svg>
    </div>
    <span class="gsi-material-button-contents">Sign in with Google</span>
    <span style="display: none;">Sign in with Google</span>
  </div>
</button>
<br><br>
»*/
/*«
const firebaseConfig = {
	apiKey: "AIzaSyCEEMw3b1_bWj-OxM9oMKlKhkTTWxbIhlI",
	authDomain: "linuxontheweb.firebaseapp.com",
	databaseURL: "https://linuxontheweb.firebaseio.com",
	projectId: "linuxontheweb",
	storageBucket: "linuxontheweb.firebasestorage.app",
	messagingSenderId: "668423415088",
	appId: "1:668423415088:web:979b40c704cab2322ed4f5"
};
»*/

//»

//»

})();

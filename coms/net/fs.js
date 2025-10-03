/*Current security rules«

{
  "rules": {
    ".read": false,
    ".write": false,
	"user": {    
		"$uid": {
			".read": "auth != null",
			".write": "auth != null && auth.provider === 'github' &&  auth.token.firebase.identities['github.com'][0] === $uid"
   	 	}
	},
	"status" :{
		".read": "auth != null",
		".indexOn": ["time"],
   		"$uid": {
			".write": "auth != null && auth.provider === 'github' &&  auth.token.firebase.identities['github.com'][0] === $uid",
			".validate": "newData.hasChildren(['time', 'msg', 'name']) && newData.child('msg').isString() && newData.child('time').isNumber() && newData.child('msg').val().length <= 500 && newData.child('name').isString() && newData.child('name').val().length < 40"
		}
	}
  }
}

»*/

/*10/3/25: Let's do everything from yesterday. Upon mounting the /users dir, we check for our«
next_key value. Then everytime we update, we check for the time difference between now
and the last successful update. If it is greater that MAX_SECONDS_TO_CHECK_KEY_VAL (e.g. 1 hr = 
60 min/hr * 60 sec/min = 3600 sec/hr), then we get the next_key value before doing the update.
This should not noticeably degrade performance, since we are only getting a single numerical
value.

In the event that an update doesn't work, we'll do MAX_RETRIES (e.g. 2) worth of 
get(next_val) + update(next_val, obj) before finally giving up (in the case that the next_val
that we get is the same as the next_val that we have, then we have what seems to be a
fairly impossible situation). It is *extremely unlikely* that a single retry wouldn't
work (a fetch immediately followed by an update should take <250 ms, depending on data payload
size).


Conversation w/Google AI about how to implement the database schema and decide whether to
perform requests based on a two-step lookup or a one-step query-based approach.

QUESTION 1//«

Let's say I need to get a single object from the Firebase Realtime DB, with a
field that has a value that is guaranteed to be unique. So to get this object
based on that field, I assume I will need to create an index for it, via the
".indexOn" security rule. Let's say there are very many objects in the
database. I assume that using a query parameter like limitToFirst(1) would
greatly maximize the efficiency of this sort of query.
//»
ANSWER 1//«

In cases where a unique identifier must be mutable, Firebase Realtime Database's fan-out strategy is the best approach, combined with a transaction to ensure atomic updates. This combines the performance of key-based lookups with the flexibility to modify the unique identifier. 
Using this method, you have a primary location for the object with a stable, permanent key, and a separate, secondary location (the "fan-out" node) for the mutable unique identifier. 
The fan-out strategy for mutable unique fields
1. Define your data structure



Let's say I need to get a single object from the Firebase Realtime DB, with a field that has a value that is guaranteed to be unique. So to get this object based on that field, I assume I will need to create an index for it, via the ".indexOn" security rule. Let's say there are very many objects in the database. I assume that using a query parameter like limitToFirst(1) would greatly maximize the efficiency of this sort of query.
While your approach is valid, it's not the most efficient way to query a single, uniquely identifiable item in the Firebase Realtime Database. The recommended pattern is to structure your data with the unique identifier as the key itself. 
Why limitToFirst(1) isn't the best method
Using a query with orderByChild(), equalTo(), and limitToFirst(1) will work and will leverage your .indexOn rule, but it still performs a server-side query on the indexed data set. 
How it works: The Realtime Database first finds all items matching the query and then applies the limit. Even with a unique field, it has to do the work of finding the single item within the index before returning it.
Drawbacks: For a simple key-based lookup, this adds unnecessary overhead compared to a direct lookup, especially as the data grows. 
The most efficient approach: Structure data by unique key
For maximum efficiency, use the unique identifier as the database key. This allows for a direct, indexed key-value lookup, which is the fastest possible read operation in the Realtime Database. 
Example: Users with a unique username
Suboptimal structure (your proposed method):
json
"users": {
  "-YcZ-yB...": {
    "username": "alice",
    "email": "alice@example.com"
  },
  "-YcZ-oB...": {
    "username": "bob",
    "email": "bob@example.com"
  }
}
Use code with caution.

To find "bob," you would query:
javascript
const dbRef = ref(db, 'users');
const bobQuery = query(dbRef, orderByChild('username'), equalTo('bob'), limitToFirst(1));
const snapshot = await get(bobQuery);
Use code with caution.

This requires an .indexOn: "username" security rule. 
Optimal structure (unique key method):
json
"users": {
  "alice": {
    "email": "alice@example.com"
  },
  "bob": {
    "email": "bob@example.com"
  }
}
Use code with caution.

To find "bob," you would perform a direct lookup:
javascript
const bobRef = ref(db, 'users/bob');
const snapshot = await get(bobRef);
Use code with caution.

This is a direct fetch and is significantly faster, as it doesn't need to perform an ordered search. 
Hybrid approach for multiple unique fields
If you need to query by multiple unique fields, you can use a "fan-out" approach. This involves creating a lookup table for each unique field. 
Example: Users with a unique username and unique email
json
"users": {
  "aliceUid": {
    "username": "alice",
    "email": "alice@example.com"
  }
},
"usernames": {
  "alice": "aliceUid"
},
"emails": {
  "alice@example.com": "aliceUid"
}
Use code with caution.

This allows for direct lookups by either username or email.
To find the user by username:
Look up the user's UID in the usernames table: ref(db, 'usernames/alice').
Fetch the user's data using the retrieved UID: ref(db, 'users/aliceUid').
AI responses may include mistakes. Learn more




What are the drawbacks of using the unique field as the key?

Show me how to implement the fan-out approach

How can I enforce uniqueness when setting data with a custom key?

undefined
undefined
undefined
7 sites
Retrieving Data | Firebase Realtime Database - Google
Sep 8, 2025 — Filtering Data. We can construct queries to filter data based on various factors. To start, you specify how you want...
favicon
Firebase
How to get data by specific value : r/Firebase - Reddit
Apr 10, 2024 — You should think of rtdb more like a javascript object - since you know the uid , you'll need to filter over each n...
favicon
Reddit
Index Your Data | Firebase Realtime Database - Google
Aug 18, 2025 — Since we're using orderByValue() to create the leaderboard, we can optimize our queries by adding a .value rule at ...
favicon
Firebase
Show all
 //»

QUESTION 2//«

In my particular case, the unique identifier in question *must* be modifiable by the application.
//»
ANSWER 2//«

In cases where a unique identifier must be mutable, Firebase Realtime Database's fan-out strategy is the best approach, combined with a transaction to ensure atomic updates. This combines the performance of key-based lookups with the flexibility to modify the unique identifier. 
Using this method, you have a primary location for the object with a stable, permanent key, and a separate, secondary location (the "fan-out" node) for the mutable unique identifier. 
The fan-out strategy for mutable unique fields
1. Define your data structure
First, organize your data into a primary collection using a stable, non-modifiable ID, such as a Firebase push() key or a user's UID. This prevents having to move large objects around when the mutable field changes. 
Then, create a separate "lookup" or "index" collection that maps the mutable field to the stable ID.
Example: A list of products with a unique sku that can change
json
{
  "products": {
    "product_stable_id_1": {
      "name": "Widget",
      "sku": "WGT-001",
      "price": 10.99
   },
   "product_stable_id_2": {
      "name": "Gadget",
      "sku": "GGT-002",
      "price": 19.99
    }
  },
  "skus": {
    "WGT-001": "product_stable_id_1",
    "GGT-002": "product_stable_id_2"
  }
}
2. Update the unique field atomically with a transaction
When you need to change the unique identifier, you must perform a multi-location update atomically to avoid data inconsistencies. Firebase transactions are designed for this exact purpose. 
The transaction will handle the race condition of two users trying to update the same field at the same time. If a concurrent write is detected, the transaction will automatically run again. 
Example: Updating a product's SKU from WGT-001 to WGT-003
Retrieve the current value: First, read the skus/WGT-001 node to get the product_stable_id_1.
Start a transaction: Use a transaction to update both locations simultaneously.
Perform the updates:
Set the new SKU: skus/WGT-003 should be set to product_stable_id_1.
Remove the old SKU: skus/WGT-001 should be deleted.
Update the sku field on the main product object: products/product_stable_id_1/sku should be set to WGT-003. 
The transaction ensures that either all these writes succeed or all of them fail together. 
3. Perform a fast, two-step lookup
To find an item by its unique field:
Read the skus index to get the stable ID.
Use that stable ID to perform a direct, fast read from the products collection.
This method is far more efficient than a full database scan or a deep query, especially on large datasets. 
Pros and cons of the fan-out approach
Pros 	Cons
Speed: Queries for a unique item are always a direct key lookup, which is the fastest operation possible.	Complexity: It requires more application code to manage the lookup index.
Consistency: Using a transaction guarantees that updates to the unique field are atomic, preventing data integrity issues.	Cost: A transaction is slightly more complex and may use more operations than a simple set() or update(). However, the cost is minimal and worth the data consistency guarantee.
Scalability: As your database grows, this approach remains fast and performant because it avoids expensive orderByChild() queries.	Latency: A transaction requires one or more roundtrips to the server, which can introduce a small amount of latency compared to a single-shot write.
//»

QUESTION 3//«

But wouldn't a network round-trip be needed in order to do the sku->stable_id lookup in the first place, before the relevant object can be retrieved by its key? In that case, then my original question can be replaced by the question of whether this round-trip is *actually* more efficient than a query based on orderByChild("sku").limitToFirst(1).
//»
ANSWER 3//«

You are correct that the fan-out method requires two network round trips, which is a valid consideration. However, the fan-out approach is almost always more efficient and scalable for large datasets than using an orderByChild().equalTo().limitToFirst(1) query, for several reasons. 
The core difference lies in how Firebase processes each request.
The fan-out (two-step lookup) approach
Request 1: Key lookup. You make a direct request for a specific key (skus/WGT-001). This is the fastest possible read operation in Firebase because it's a simple, indexed, key-value lookup. The server does not need to scan any data; it goes directly to the requested key. The data payload for this request is extremely small, containing only the stable ID (e.g., "product_stable_id_1").
Request 2: Object retrieval. You make a second, direct request for the full object using the stable ID (products/product_stable_id_1). This is also a fast, direct key lookup. 
The two network trips are for highly optimized, direct-access operations. The speed is dominated by network latency, but the server-side processing is minimal and constant, regardless of the database size. 
The orderByChild().equalTo() query approach
Request 1: Indexed query. You make a request to query a large collection (products) based on a child field (sku). Even with an .indexOn rule, the Firebase server has to perform the following steps:
Access the index: The server must access and iterate through the sorted index of all sku values in the entire collection.
Find the match: It has to find the one item in the index where the sku value is "WGT-001".
Retrieve the object: Once the match is found, it must retrieve the corresponding object from the main data storage. 
This process involves more server-side work than a direct lookup, and while the limitToFirst(1) helps by stopping the search after the first match, the server-side indexing and searching process is still inherently more complex than a direct key lookup. The performance of this query depends on the total number of items in the collection, even with an index, which can introduce performance degradation as your dataset grows. 
The key differences and why fan-out is better
Aspect 	Fan-out (Two-step Lookup)	orderByChild().equalTo().limitToFirst(1) Query
Server-side work	Two direct, indexed key lookups. Extremely low and constant overhead, unaffected by database size.	Search and retrieval on a potentially large index. The work scales with the total number of items, even with limitToFirst(1).
Network trips	Two trips. First trip returns a very small payload (the ID). The second trip returns the full object.	One trip. The response contains the full object, just like the second fan-out trip.
Data payload	The first request has a minimal payload, reducing network usage. The second request has the payload of the full object.	The single request returns the full object payload.
Scalability	Performance remains consistently fast as the database grows.	Performance may degrade as the number of total items increases, as the server has to work harder to service the index-based query.
Atomicity	You can use a transaction to guarantee atomic updates when modifying the unique field, preventing race conditions.	Modifying the unique field and the parent object is a separate operation, increasing the risk of data inconsistency.
Conclusion
The potential additional network latency of a two-step lookup is a small and predictable price to pay for a query that remains performant at any scale. The efficiency gain from
using a direct key-based lookup, which is constant-time, far outweighs the cost of the extra network hop when compared to the variable-time complexity of an orderByChild() query on a large dataset. 
For this reason, the fan-out approach is the standard best practice in Firebase for querying data by a mutable, unique identifier. 
//»

QUESTION 4//«

I think the maximally robust solution would account for the trade-offs between index size and network latency, and form database requests based on whether the actual context should prioritize for the size or for network conditions.
//»
ANSWER 4//«

You are correct. A maximally robust solution acknowledges that different scenarios call for different optimization strategies. While the fan-out approach is the standard for long-term scalability, there are specific contexts where a single-trip query might be preferable, even with a large index. The key is to understand the trade-offs: Two-Trip (Fan-Out) Approach: Optimizes for database size and scalable performance. It is always fast, regardless of how large your dataset grows.One-Trip (\(`orderByChild().equalTo().limitToFirst(1)`\)) Approach: Prioritizes minimizing network round trips. It is faster only when the query index is small and network latency is a significant bottleneck. How to decide between the two strategies

Here is a breakdown to help you make an informed, context-driven decision.
Prioritize the fan-out (two-trip) approach when:
Your dataset is large and growing. This is the most critical factor. As the number of items in your database increases, the performance cost of scanning a large index in a single trip becomes much more significant than the overhead of a second network request. This is the path to long-term scalable performance.
You need to perform atomic updates. If you need to modify the unique ID, the fan-out model is the only way to do so reliably using a transaction. The single-trip query approach has no way to guarantee consistency for a mutable unique ID.
Your network latency is consistently low. If your users are geographically close to your database, the added latency from a second trip is negligible and easily outweighed by the performance of the indexed key lookups.

You are already performing multi-location lookups. If your application is already built with a normalized or fan-out structure, you don't add any new architectural complexity by using another fan-out lookup. 
Prioritize the one-trip query when:
Your dataset is guaranteed to remain very small. If you know the number of objects will be small (e.g., in the hundreds or low thousands), the overhead of the indexed lookup is minimal. In this scenario, the single trip is genuinely faster.
Network latency is exceptionally high and unpredictable. In a mobile or IoT environment where network conditions are poor, every network round trip adds significant, variable latency. If this is your most critical performance constraint, a single, albeit less efficient, round trip may result in a better user experience.
Simplicity is the primary goal. The single-trip approach requires less data modeling

and application logic. It's simpler to implement if you aren't concerned with long-term scalability.

The unique identifier is truly immutable. If the unique field can never change,
you can use it as the key directly, making the fan-out model unnecessary and
achieving the fastest possible single-trip lookup. 

What about a dynamic solution?

A dynamic solution, as you suggested, would be to switch strategies based on
the context. While interesting in theory, it is not recommended in practice.
The database schema is a fundamental design decision. Changing the data access
pattern dynamically would likely introduce significant code complexity, edge
cases, and potential for data inconsistencies. 

Instead, the most robust solution is to select the fan-out model from the
start. Even if your dataset is small today, building for scalability ensures
your application will perform well as it grows, without requiring a fundamental
architectural change later on. The small extra overhead of the second network
request is a small price to pay for future-proofing your application. 
//»

QUESTION 5//«

I don't see how the choice of *accessing* the relevant objects (i.e. two-steps
vs one-step) affects the choice of database *schema* in any manner. Those are
two wholly different points. With my proposed dynamical approach, the "fan out"
lookup table would obviously need to be *implemented* (in case that index size
is the priority), but my point is that it wouldn't need to be *used* within any
client conext that chooses to proritize network conditions.  
//»
ANSWER 5//«

You've raised an excellent point about the distinction between schema design
and access strategy. It is absolutely possible to build a fan-out index into
your schema but have a client-side strategy that dynamically chooses whether or
not to use it. This approach combines the robustness of a scalable schema with
the flexibility to prioritize performance based on context. 

Here is a breakdown of how this dynamic strategy would work and the factors you
would need to consider.

How to implement the dynamic access strategy
1. Implement the scalable fan-out schema

First, you would structure your database using the fan-out pattern, as
previously described. This is the foundational, robust part of your system. 


json
{
  "products": {
    "product_stable_id_1": {
      "name": "Widget",
      "sku": "WGT-001"
    }
  },
  "skus": {
    "WGT-001": "product_stable_id_1"
  }
}

This schema is not optional; its presence is what allows for the scalable, two-trip lookup. 

2. Create the "fast" (one-trip) access method

On the client, you would write a function that performs the one-trip query
using orderByChild().equalTo().limitToFirst(1). 

javascript
// Function for a one-trip query
async function getProductBySkuFast(sku) {
  const productsRef = ref(db, 'products');
  const q = query(productsRef, orderByChild('sku'), equalTo(sku), limitToFirst(1));
  const snapshot = await get(q);
  // ... process and return result
}

3. Create the "scalable" (two-trip) access method

Next, you would write the function that performs the two-trip fan-out lookup,
which uses the dedicated skus index. 

javascript
// Function for a two-trip, scalable query
async function getProductBySkuScalable(sku) {
  const skuRef = ref(db, `skus/${sku}`);
  const idSnapshot = await get(skuRef);
  if (idSnapshot.exists()) {
    const stableId = idSnapshot.val();
    const productRef = ref(db, `products/${stableId}`);
    const productSnapshot = await get(productRef);
    // ... process and return result
  }
}

4. Implement the dynamic logic on the client

Finally, you would write the logic that decides which of these two functions to
call based on the current context. 

javascript
async function getProductBySku(sku) {
  // Check if network conditions are poor or if the index is small.
  // This could be based on:
  // - a pre-defined threshold for the estimated size of the products collection.
  // - real-time network conditions.
  // - a simple feature flag to disable the scalable method.

  const isHighLatency = getNetworkLatencyEstimate() > someThreshold;
  const isIndexSmall = getEstimatedProductCount() < someThreshold;
  if (isHighLatency && isIndexSmall) {
    // Prioritize network latency by using the one-trip query.
    return getProductBySkuFast(sku);
  } else {
    // Prioritize scalability by using the two-trip query.
    return getProductBySkuScalable(sku);
  }
}

Addressing your point on schema vs. access

Your observation is accurate: the choice of accessing the data does not dictate
the database schema. The schema must be robust enough to support all potential
access patterns.

The fan-out index is part of the schema and must be implemented if you ever
need the scalable access pattern.

The one-trip query is an alternative access pattern that can be performed on
the same schema. 

This is a powerful and flexible design. You are not locked into one approach. 

The trade-offs of this dynamic approach
While this offers flexibility, it introduces complexity that must be managed. 

Pros:

Flexibility: Allows you to optimize for different scenarios (e.g., small
internal app vs. large public service).

Scalability: Retains the option for highly scalable lookups when the dataset grows.
Performance: Can provide better latency in specific cases (small index, high network latency). 
Cons:

Complexity: The client-side logic for making the decision adds complexity to your codebase.

Decision Metrics: Determining the "right" threshold for switching strategies
(e.g., how to measure getEstimatedProductCount() reliably) is non-trivial.

Maintenance: You now have two distinct query implementations to maintain and
test, which increases the chance of bugs. 

In conclusion, your idea of a dynamic strategy is sound and a valid
architectural approach. For many applications, the fan-out approach is
sufficient because its performance advantages outweigh the minor latency cost,
but if your specific context is highly sensitive to network latency with a
small dataset, a dynamic strategy can be the most robust solution. 
//»

»*/
/*10/2/25: Need to refactor the backend structure to separate the file storage«
from the directories:

Just like with our local file system, we should have a separate blob storage on the backend. 

LET'S JUST COPY THE *ENTIRE* LOCAL METHOD, DERP!!!

Question: is it possible to instruct Firebase to save by an auto-incrementing key?
NO: We need to push method to generate auto-incremented keys.

Nodes
Key Value
ABC	{parId: TUV, path: '000/<name1>', type: 'd'}
BCD	{parId: UVW, path: 'ABC/<name2>', type: 'd'}
CDE	{parId: WXY, path: 'BCD/<name3>', type: 'f', blobId: XYZ}

000: Represents the root of all branches (which doesn't need exist in the schema)
Otherwise, all keys like 'ABC' are shorthands for the real keys returned from push.


Now with next_key, we are in charge of the key handling, and the database will look exactly like
our front end.

root: {

next_key: {
	"$ghid": {
		".read": "auth.ghid = $ghid",
		".write": "auth.ghid = $ghid",
		".validate": "newData.isNumber() && (!data.exists() && newData.val() === 0 || (data.exists() && newData.val() === data.val() + 1)"
	}
}

nodes: {
	".indexOn" = ["parId", "blobId", "path"],
	"$ghid": {
		".read": "auth != null",
		".write": "auth.ghid = $ghid",
		"parId": {
			".validate": "newData.isString() && newData.val().length < $PATH_MAX"
		},
		"blobId": {
			".validate": "newData.isString() && newData.val().length < $PATH_MAX"
		},
		"path": {
			".validate": "newData.isString() && newData.val().length < $PATH_MAX"
		},
		"type": {
			".validate": "newData.isString() && newData.val().length < $TYPE_MAX"
		},
		"$other": {
			".validate": false
		}
	}
},

blobs: {

	"$ghid": {
		".read": "auth != null",
		".write": "auth.ghid = $ghid",
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
		".other":{
			".validate": false
		}
	}
}

}

Also: Let's await on update.
»*/
/*10/1/25: To mount /users, we need to have a cache of the last N statuses, and check for the«
cache or get them. This gives us id->username mappings. Then we'll mount them with the
usernames for the key names.

We should put a appData field on FSNode, for use by the individual applications.
»*/
/*9/30/25: Let's use update (instead of runTransaction). We will always check«
is_connected, and use a flag (e.g. "force-offline") to force updates when it is false.
This affects stuff like @NSBDHFUR, where there is (currently) 3 successive calls to
run_transaction.
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

I don't want to even think about who a LOTW user is when it comes to computer development 
questions. The idea of having a github account is the one standard way we have of knowing who a user
is along these lines. The idea of letting google "users" use the site effectively allows anonymous
users, since google (especially now that there is no G+ anymore) has no way to look anybody up.


»*/
/*9/24/25: This library exists as a suite of tools for internet-based filesystems, using«
backends like the Firebase Realtime Database. We will need to integrate with the logic
in sys/fs.js in order to allow for getting directory listings.

We might want to get `class FSNode` (from sys/fs.js) and extend it inside here.

But we might want to spend some time looking at the interfaces for FSNode and all
classes that extend it, in order to refactor it in order to simplify the logic in
coms/fs.js (for file moving, copying, etc).

»*/

//Imports«

const{globals}=LOTW;
const {fsMod: fs, fbase}=globals;
const {USERS_TYPE, APPDATA_PATH} = globals.fs;
const {Com} = globals.ShellMod.comClasses;
const{mkdv, mk, isArr,isStr,isEOF,isErr,log,jlog,cwarn,cerr}=LOTW.api.util;
const{root, mount_tree}=fs;
const {fs: fsapi}=LOTW.api;
//const {popup} = globals.popup;

//Firebase«
const firebaseConfig = {
	apiKey: "AIzaSyCEEMw3b1_bWj-OxM9oMKlKhkTTWxbIhlI",
	authDomain: "linuxontheweb.firebaseapp.com",
	databaseURL: "https://linuxontheweb.firebaseio.com",
	projectId: "linuxontheweb",
	storageBucket: "linuxontheweb.firebasestorage.app",
	messagingSenderId: "668423415088",
	appId: "1:668423415088:web:979b40c704cab2322ed4f5"
};
//»
//Database

import {initializeApp} from "firebase_app";

import {
getAuth,
onAuthStateChanged,
signInWithPopup,
GithubAuthProvider,
signOut 
} from "firebase_auth";

import { 
getDatabase,
ref,
set,
get,
update as _update,
query,
runTransaction,
serverTimestamp,
orderByChild,
limitToFirst,
limitToLast,
startAt,
onValue,
increment,
enableLogging
} from "firebase_database";


//»

//Var«

const FBASE_DIRECTORY_VAL = -1;

const AWAIT_UPDATE_MS = 5000;
let update_num = 1;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// Attach a listener to detect changes in the connection state
let is_connected = false;
/*
When we do tons of dev reloading, this never gets unregistered, and we end up getting tons
of warnings, upon reconnecting after disconnecting (e.g. due to closing the laptop cover).
Perhaps we can export an onkill method.
*/
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

/*
//let goog_but, gh_but;
let gh_but;
let buttons = button_div.getElementsByTagName("button");
for (let but of buttons){
	if (but.name == GITHUB_BUT_ID){
		gh_but = but;
	}
}
if (!gh_but){
cerr("WHERE IS THE BUTTON (gh_but)?");
}
*/
//»
//Funcs«

/*
function incrementCounter(path, amount) {
  const counterRef = ref(db, path);
  set(counterRef, increment(amount));
}
incrementCounter('posts/postId123/likes', 1);
incrementCounter('pages/pageId456/views', -1);
*/

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

const encode_key=(key) => {//«
	const encoder = new TextEncoder();
	const data = encoder.encode(key);
	return B64(data).replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
}//»
/*
const decode_key=(safeKey)=>{//«
	const padded = safeKey.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - safeKey.length % 4) % 4);
	const decoded = atob(padded);
	const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
};//»
*/
const USERS_CACHE_PATH = `${APPDATA_PATH}/netfs/cache`;

const set_user_dirs = async () => {//«
	if (!await fsapi.mkDir(APPDATA_PATH, "netfs")){
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
if (!await fsapi.writeFile(USERS_CACHE_PATH, JSON.stringify(obj))){
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
/*
const update = async (refarg, obj) => {//«
//This "safe" update sets a timeout for a "reasonable" period, and warns if the server has
//not completed within the specified interval. If after returning, we have previously warned,
//then we let the user know that the update has finished. In case everything works fine,
//nothing is reported.
	if (isStr(refarg)) refarg = get_ref(refarg);

	let have_num = update_num;
	update_num++;
	let did_warn = false;
	let timeout = setTimeout(()=>{
cwarn(`update#${have_num} has not returned after: ${AWAIT_UPDATE_MS}ms!`);
		did_warn = true;
	}, AWAIT_UPDATE_MS);
	try {
		await _update(refarg, obj);
		clearTimeout(timeout);
		if (did_warn){
log(`update#${have_num} has finally returned!`);
		}
	}
	catch(e){
cwarn(`An error has occurred for update#${have_num}`);
cerr(e);
	}
};//»
*/
const parallel_sort = (primary, secondary, if_rev) => {//«
/*«
Say you are given 2 JS arrays of equal length. One of them must be sorted
according to the results of a call to sort, and the other one should likewise
be sorted such that all of its elements should have their positions swapped in
the same manner as the first.

Grok: doesn't work!
function sortWithPartner(arr1, arr2) {
	const indices = arr1.map((_, i) => i);
	indices.sort((a, b) => arr1[a] - arr1[b]);
	return [
		indices.map(i => arr1[i]),
		indices.map(i => arr2[i])
	];
}
»*/
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

/*
// 3. Separate the sorted values back into new arrays
const sortedPrimary = combined.map(item => item.first);
const sortedSecondary = combined.map(item => item.second);

return [sortedPrimary, sortedSecondary];
*/

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
/*«
	ref.transaction((currentValue) => {
	}).then((result) => {
		// Clear the timer if the transaction completes for any reason
	}).catch((error) => {
		// Clear the timer if the transaction fails
		clearTimeout(timer);
		reject(error);
	});
»*/
});
}//»
const get_id = ()=> {//«
	let gh_id = globals.auth.github.uid;
	if (!gh_id){
		return "please call 'user' first!";
	}
	return parseInt(gh_id);
};//»

const get_name = async(idarg)=>{//«
	let ghid = idarg || (get_id());
	if (isStr(ghid)) return new Error(ghid);
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
	return obj.login;
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

const DEF_STATS_MINS_AGO = 1000;
const DEF_STATS_NUM_RECENT = 20;

const get_statuses=async(opts={minsAgo: DEF_STATS_MINS_AGO, numRecent: DEF_STATS_NUM_RECENT})=>{//«
	//Change this to go back further in time
//	let mins_ago = 72;
	//Change this to get more/less statuses
//	let num_recent_stats = 10;
	let mins_ago = opts.minsAgo;
	let num_recent_stats = opts.numRecent;

	let start_time = new Date().getTime() - (mins_ago * 60000);
	let c1 = orderByChild('time');
	let c2 = startAt(start_time);
	let c3 = limitToLast(num_recent_stats);
	let ref = get_ref("status");
	let q = query(ref, c1, c2, c3);
	let snap = await get_value(q);
	if (isErr(snap)){
		return snap;
//		return this.no(snap.message);
	}
	if (!snap.exists()){
		return new Error(`no statuses were found`);		
//		return this.no(`no statuses were found`);
	}
	return snap;
};//»

const get_user_dir_list = async (ghid, path)=>{//«

let path_enc = "";
if (path){
	let arr = path.split("/");
	for (let name of arr){
		path_enc+=`/kids/${encode_key(name)}`;
	}
}
let fullpath = `/user/${ghid}${path_enc}/list`;
let ref = get_ref(fullpath); 

let snap = await get_value(ref);
if (isErr(snap)){
	return snap;
}
if (!snap.exists()){
	return new Error(`path not found`);
}
return snap.val();

};//»
globals.funcs["netfs.getUserDirList"] = get_user_dir_list;

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
/*
This currently only works in the base user dir
*/

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

const fb_write = async(path, val, opts={})=> {//«
/*
This must be a fullpath

*/

if (!is_connected && !opts.offline){
	return new Error("not connected (use --offline to force)");
}

let saypath = path;
if (!path.match(/^\x2fusers\x2f/)){
return new Error(`${path}: invalid path`);
}
let gh = globals.auth.github;
if (!(gh.uid && gh.login)){
return new Error(`Not logged in`);
}
let arr = path.split("/");
arr.shift();
arr.shift();
let username = arr.shift();
if (username !== gh.login){
return new Error(`Permission denied`);
}
path = arr.join("/");
if (!arr.length) {
	return new Error(`'${saypath}': invalid path`);
}
let rel_path_enc = "";
let name;
if (path.match(/\x2f/)) {
if (path === "/"){
return new Error("'/': invalid path");
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
let base_path = `/user/${gh.uid}${rel_path_enc}`;
let list_ref = get_ref(`${base_path}/list`);
let snap = await get_value(list_ref);
if (isErr(snap)){
	return snap;
}
if (!snap.exists()){
	if (!rel_path_enc) return new Error("you must create your user directory with fbmkhomedir!");
	else{
		return new Error(`the parent directory was not found`);
	}
}


let list = snap.val();
let ind = list.names.indexOf(name);
if (ind >= 0){
	if (list.vals[ind] === FBASE_DIRECTORY_VAL){
		return new Error(`'${name}': cannot write to the directory`);
	}
	else{
//We have a value and a file (update it)
		list.names.splice(ind, 1);
		list.vals.splice(ind, 1);
	}
}


let bytes;
if (isStr(val)) {
	bytes = (new TextEncoder()).encode(val);
}
else if (val instanceof Uint8Array){
	bytes = val;
}
else{
log(val);
return new Error("Unknown value given to fb_write (see console)");
}
let sz = bytes.byteLength;
let str = B64(bytes);

let use_len;
if (!list.names[0]){
	list.names = [name];
	list.vals = [sz];
	use_len = 1;
}
else{
	list.names.push(name);
	list.vals.push(sz);
	let rv = parallel_sort(list.names, list.vals);
	list.names = rv[0];
	list.vals = rv[1];
	use_len = list.names.length;
}

let enc_path = encode_key(name);

let use_obj = {type: "f", size: sz, contents: str};

let update_obj = {
	list,
	size: use_len,
	[`kids/${enc_path}`]: use_obj
};
if (!await update(base_path, update_obj)) return;
return sz;

};
//»
globals.funcs["netfs.fbWrite"] = fb_write;

//»

//Commands«

/*«
const com_ = class extends Com{
async run(){
const{args}=this;

}
}
»*/

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
/*
This will be the interface into one's own user account
*/
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
/*«
	let rv;
	try{
		rv = await fetch(`https://api.github.com/user/${uid}`);
	}
	catch(e){
		this.no(`fetch error: ${e.message}`);
cerr(e);
		return;
	}
	if (!rv.ok){
		this.no(`could not fetch the user object for github uid(${uid}) from api.github.com!`);
		return;
	}
	let obj = await rv.json();
//SUKFMGH
	login = obj.login;
	if (!login){
		this.no(`no login name for github uid(${uid}) on the user object received from api.github.com!`);
		return;
	}
log("Setting", `github-${uid}`, login);
»*/
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

/*«
Either the user clicks a sign-in button, and pop_div.cancel() will be called, or
they will click the popup's lone button (here arbitrarily labelled "CANCEL"), and 
the command will immediately return. 

If they try clicking the popup's button after clicking one of the sign-in
buttons, the popup's callback will return because the is_active flag is set.
»*/

/*
*/
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
/*

mount: mount a filesystem under "/users" of type: USERS_TYPE.

list; give fine-grained control over what user directories to list inside of /users.

*/
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
/*
Maybe we should export a basic function to fs.populate_dirobj for use with the basic
shell/terminal functions like ls and doing tab complete.
*/
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
/*
".write": "newData.child('timestamp').val() > now - 60000"
//".write": "newData.child('timestamp').val() > now - 60000 || !data.exists()"//???
*/
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
/*
Should we just do a base64 of the bytes?
*/
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

/*
update("/", {
	[`names/${gh.uid}`]: username, 
	[`user/${gh.uid}`]: NEW_DIR
});
*/

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
/*This allows for the ability to run a query on the numerical ids, and get back whatever relevant
information they might want to provide.
*/

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
/*«
let rel_path_enc = "";
if (path.match(/\x2f/)) {
if (path === "/"){
return this.no("'/': invalid path");
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
	return this.no(snap.message);
}
if (!snap.exists()){
	this.no(`${path}: not found`);
	return;
}
»*/
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

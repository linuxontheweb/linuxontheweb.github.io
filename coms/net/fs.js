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
	"$uid": {
		".read": "auth != null",
		".write": "auth != null && auth.provider === 'github' &&  auth.token.firebase.identities['github.com'][0] === $uid",
		".validate": "newData.hasChildren(['time', 'content']) && newData.child('content').isString() && newData.child('time').isNumber() && (data.exists() && newData.child('content').val().length <= data.child('content').val().length) || newData.child('content').val().length <= 501"
	}
}

}
}

»*/
/*Firebase Realtime database documentation«
From: https://firebase.google.com/docs/reference/js/database

function(app, ...)// getDatabase«

getDatabase(app, url)//«

Returns the instance of the Realtime Database SDK that is associated with the
provided FirebaseApp. Initializes a new instance with default settings if no
instance exists or if the existing instance uses a custom database URL.

Signature:

export declare function getDatabase(app?: FirebaseApp, url?: string): Database;
Parameters
Parameter	Type	Description
app	FirebaseApp	The FirebaseApp instance that the returned Realtime Database instance is associated with.
url	string	The URL of the Realtime Database instance to connect to. If not provided, the SDK connects to the default instance of the Firebase App.
Returns:

Database

The Database instance of the provided app.
//»

//»
function(db, ...)// ref, refFromURL«

connectDatabaseEmulator(db, host, port, options)//«
Modify the provided instance to communicate with the Realtime Database emulator.

Note: This method must be called before performing any other operation.

Signature:


export declare function connectDatabaseEmulator(db: Database, host: string, port: number, options?: {
    mockUserToken?: EmulatorMockTokenOptions | string;
}): void;
Parameters
Parameter	Type	Description
db	Database	The instance to modify.
host	string	The emulator host (ex: localhost)
port	number	The emulator port (ex: 8080)
options	{ mockUserToken?: EmulatorMockTokenOptions | string; }	
Returns:

void
//»
goOffline(db)//«
Disconnects from the server (all Database operations will be completed offline).

The client automatically maintains a persistent connection to the Database
server, which will remain active indefinitely and reconnect when disconnected.
However, the goOffline() and goOnline() methods may be used to control the
client connection in cases where a persistent connection is undesirable.

While offline, the client will no longer receive data updates from the
Database. However, all Database operations performed locally will continue to
immediately fire events, allowing your application to continue behaving
normally. Additionally, each operation performed locally will automatically be
queued and retried upon reconnection to the Database server.

To reconnect to the Database and begin receiving remote events, see goOnline().

Signature:


export declare function goOffline(db: Database): void;
Parameters
Parameter	Type	Description
db	Database	The instance to disconnect.
Returns:

void
//»
goOnline(db)//«
Reconnects to the server and synchronizes the offline Database state with the server state.

This method should be used after disabling the active connection with
goOffline(). Once reconnected, the client will transmit the proper data and
fire the appropriate events so that your client "catches up" automatically.

Signature:

export declare function goOnline(db: Database): void;
Parameters
Parameter	Type	Description
db	Database	The instance to reconnect.
Returns:

void
//»
ref(db, path)//«

Returns a Reference representing the location in the Database corresponding to
the provided path. If no path is provided, the Reference will point to the root
of the Database.

Signature:


export declare function ref(db: Database, path?: string): DatabaseReference;
Parameters
Parameter	Type	Description
db	Database	The database instance to obtain a reference for.
path	string	Optional path representing the location the returned Reference will point. If not provided, the returned Reference will point to the root of the Database.
Returns:

DatabaseReference

If a path is provided, a Reference pointing to the provided path. Otherwise, a Reference pointing to the root of the Database.
//»
refFromURL(db, url)//«

Returns a Reference representing the location in the Database corresponding to
the provided Firebase URL.

An exception is thrown if the URL is not a valid Firebase Database URL or it
has a different domain than the current Database instance.

Note that all query parameters (orderBy, limitToLast, etc.) are ignored and are
not applied to the returned Reference.


Signature:

export declare function refFromURL(db: Database, url: string): DatabaseReference;
Parameters
Parameter	Type	Description
db	Database	The database instance to obtain a reference for.
url	string	The Firebase URL at which the returned Reference will point.
Returns:

DatabaseReference

A Reference pointing to the provided Firebase URL.
//»

//»
function()// orderBy(Key|Priority|Value), force(LongPolling|WebSockets), serverTimestamp«

forceLongPolling()//«

Force the use of longPolling instead of websockets. This will be ignored if
websocket protocol is used in databaseURL.

Signature:

export declare function forceLongPolling(): void;
Returns:

void
//»
forceWebSockets()//«
Force the use of websockets instead of longPolling.

Signature:

export declare function forceWebSockets(): void;
Returns:

void
//»
orderByKey()//«

Creates a new QueryConstraint that orders by the key.

Sorts the results of a query by their (ascending) key values.

You can read more about orderByKey() in Sort data.

Signature:

export declare function orderByKey(): QueryConstraint;
Returns:

QueryConstraint
//»
orderByPriority()//«

Creates a new QueryConstraint that orders by priority.

Applications need not use priority but can order collections by ordinary
properties (see Sort data for alternatives to priority.

Signature:


export declare function orderByPriority(): QueryConstraint;
Returns:

QueryConstraint
//»
orderByValue()//«

Creates a new QueryConstraint that orders by value.

If the children of a query are all scalar values (string, number, or boolean),
you can order the results by their (ascending) values.

You can read more about orderByValue() in Sort data.

Signature:


export declare function orderByValue(): QueryConstraint;
Returns:

QueryConstraint
//»
serverTimestamp()//«

Returns a placeholder value for auto-populating the current timestamp (time
since the Unix epoch, in milliseconds) as determined by the Firebase servers.

Signature:


export declare function serverTimestamp(): object;
Returns:

object
//»

//»
function(delta, ...)// increment«
increment(delta)//«

Returns a placeholder value that can be used to atomically increment the
current database value by the provided delta.

Signature:


export declare function increment(delta: number): object;
Parameters
Parameter	Type	Description
delta	number	the amount to modify the current value atomically.
Returns:

object

A placeholder value for modifying data atomically server-side.
//»
//»
function(limit, ...)// limitTo(First|Last)«
limitToFirst(limit)//«

Creates a new QueryConstraint that if limited to the first specific number of children.

The limitToFirst() method is used to set a maximum number of children to be
synced for a given callback. If we set a limit of 100, we will initially only
receive up to 100 child_added events. If we have fewer than 100 messages stored
in our Database, a child_added event will fire for each message. However, if we
have over 100 messages, we will only receive a child_added event for the first
100 ordered messages. As items change, we will receive child_removed events for
each item that drops out of the active list so that the total number stays at
100.

You can read more about limitToFirst() in Filtering data.

Signature:


export declare function limitToFirst(limit: number): QueryConstraint;
Parameters
Parameter	Type	Description
limit	number	The maximum number of nodes to include in this query.
Returns:

QueryConstraint
//»
limitToLast(limit)//«

Creates a new QueryConstraint that is limited to return only the last specified number of children.

The limitToLast() method is used to set a maximum number of children to be
synced for a given callback. If we set a limit of 100, we will initially only
receive up to 100 child_added events. If we have fewer than 100 messages stored
in our Database, a child_added event will fire for each message. However, if we
have over 100 messages, we will only receive a child_added event for the last
100 ordered messages. As items change, we will receive child_removed events for
each item that drops out of the active list so that the total number stays at
100.

You can read more about limitToLast() in Filtering data.

Signature:


export declare function limitToLast(limit: number): QueryConstraint;
Parameters
Parameter	Type	Description
limit	number	The maximum number of nodes to include in this query.
Returns:

QueryConstraint
//»
//»
function(parent, ...)// child, push«
child(parent, path)//«

Gets a Reference for the location at the specified relative path.

The relative path can either be a simple child name (for example, "ada") or a
deeper slash-separated path (for example, "ada/name/first").

Signature:


export declare function child(parent: DatabaseReference, path: string): DatabaseReference;
Parameters
Parameter	Type	Description
parent	DatabaseReference	The parent location.
path	string	A relative path from this location to the desired child location.
Returns:

DatabaseReference

The specified child location.
//»
push(parent, value)//«

Generates a new child location using a unique key and returns its Reference.

This is the most common pattern for adding data to a collection of items.

If you provide a value to push(), the value is written to the generated
location. If you don't pass a value, nothing is written to the database and the
child remains empty (but you can use the Reference elsewhere).

The unique keys generated by push() are ordered by the current time, so the
resulting list of items is chronologically sorted. The keys are also designed
to be unguessable (they contain 72 random bits of entropy).

See Append to a list of data. See The 2^120 Ways to Ensure Unique Identifiers.

Signature:


export declare function push(parent: DatabaseReference, value?: unknown): ThenableReference;
Parameters
Parameter	Type	Description
parent	DatabaseReference	The parent location.
value	unknown	Optional value to be written at the generated location.
Returns:

ThenableReference

Combined Promise and Reference; resolves when write is complete, but can be used immediately as the Reference to the child location.
//»
//»
function(path, ...)// orderByChild«
orderByChild(path)//«

Creates a new QueryConstraint that orders by the specified child key.

Queries can only order by one key at a time. Calling orderByChild() multiple
times on the same query is an error.

Firebase queries allow you to order your data by any child key on the fly.
However, if you know in advance what your indexes will be, you can define them
via the .indexOn rule in your Security Rules for better performance. See
the https://firebase.google.com/docs/database/security/indexing-data rule for
more information.

You can read more about orderByChild() in Sort data.

Signature:

export declare function orderByChild(path: string): QueryConstraint;
Parameters
Parameter	Type	Description
path	string	The path to order by.
Returns:

QueryConstraint
//»
//»
function(query, ...)// get, query, off, onValue, onChild(Added|Changed|Moved|Removed)«

get(query)//«
Gets the most up-to-date result for this query.

Signature:

export declare function get(query: Query): Promise<DataSnapshot>;
Parameters
Parameter	Type	Description
query	Query	The query to run.
Returns:

Promise<DataSnapshot>

A Promise which resolves to the resulting DataSnapshot if a value is available,
or rejects if the client is unable to return a value (e.g., if the server is
unreachable and there is nothing cached).

//»
off(query, eventType, callback)//«

Detaches a callback previously attached with the corresponding on*() (onValue,
onChildAdded) listener. Note: This is not the recommended way to remove a
listener. Instead, please use the returned callback function from the
respective on* callbacks.

Detach a callback previously attached with on*(). Calling off() on a parent
listener will not automatically remove listeners registered on child nodes,
off() must also be called on any child listeners to remove the callback.

If a callback is not specified, all callbacks for the specified eventType will
be removed. Similarly, if no eventType is specified, all callbacks for the
Reference will be removed.

Individual listeners can also be removed by invoking their unsubscribe callbacks.

Signature:

export declare function off(query: Query, eventType?: EventType, callback?: (snapshot: DataSnapshot, previousChildName?: string | null) => unknown): void;
Parameters
Parameter	Type	Description
query	Query	The query that the listener was registered with.
eventType	EventType	One of the following strings: "value", "child_added", "child_changed", "child_removed", or "child_moved." If omitted, all callbacks for the Reference will be removed.
callback	(snapshot: DataSnapshot, previousChildName?: string | null) => unknown	The callback function that was passed to on() or undefined to remove all callbacks.
Returns:

void
//»
onChildAdded(query, callback, cancelCallback?, options?)//«

onChildAdded(query, callback, cancelCallback)
onChildAdded(query, callback, options)
onChildAdded(query, callback, cancelCallback, options)

Listens for data changes at a particular location.

This is the primary way to read data from a Database. Your callback will be
triggered for the initial data and again whenever the data changes. Invoke the
returned unsubscribe callback to stop receiving updates. See Retrieve Data on
the Web for more details.

An onChildAdded event will be triggered once for each initial child at this
location, and it will be triggered again every time a new child is added. The
DataSnapshot passed into the callback will reflect the data for the relevant
child. For ordering purposes, it is passed a second argument which is a string
containing the key of the previous sibling child by sort order, or null if it
is the first child.

Signature:

export declare function onChildAdded(query: Query, callback: (snapshot: DataSnapshot, previousChildName?: string | null) => unknown, cancelCallback?: (error: Error) => unknown): Unsubscribe;

Parameters
Parameter	Type	Description
query	Query	The query to run.
callback	(snapshot: DataSnapshot, previousChildName?: string | null) => unknown	A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot and a string containing the key of the previous child, by sort order, or null if it is the first child.
cancelCallback	(error: Error) => unknown	An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
options	ListenOptions	An object that can be used to configure onlyOnce, which then removes the listener after its first invocation.
Returns:

Unsubscribe

A function that can be invoked to remove the listener.
//»
onChildChanged(query, callback, cancelCallback?, options?)//«

onChildChanged(query, callback, cancelCallback)
onChildChanged(query, callback, options)
onChildChanged(query, callback, cancelCallback, options)

Listens for data changes at a particular location.

This is the primary way to read data from a Database. Your callback will be
triggered for the initial data and again whenever the data changes. Invoke the
returned unsubscribe callback to stop receiving updates. See Retrieve Data on
the Web for more details.

An onChildChanged event will be triggered when the data stored in a child (or
any of its descendants) changes. Note that a single child_changed event may
represent multiple changes to the child. The DataSnapshot passed to the
callback will contain the new child contents. For ordering purposes, the
callback is also passed a second argument which is a string containing the key
of the previous sibling child by sort order, or null if it is the first child.

Signature:

export declare function onChildChanged(query: Query, callback: (snapshot: DataSnapshot, previousChildName: string | null) => unknown, cancelCallback?: (error: Error) => unknown): Unsubscribe;
Parameters
Parameter	Type	Description
query	Query	The query to run.
callback	(snapshot: DataSnapshot, previousChildName: string | null) => unknown	A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot and a string containing the key of the previous child, by sort order, or null if it is the first child.
cancelCallback	(error: Error) => unknown	An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
options	ListenOptions	An object that can be used to configure onlyOnce, which then removes the listener after its first invocation.
Returns:

Unsubscribe

A function that can be invoked to remove the listener.
//»
onChildMoved(query, callback, cancelCallback?, options?)//«

onChildMoved(query, callback, cancelCallback)
onChildMoved(query, callback, options)
onChildMoved(query, callback, cancelCallback, options)

Listens for data changes at a particular location.

This is the primary way to read data from a Database. Your callback will be
triggered for the initial data and again whenever the data changes. Invoke the
returned unsubscribe callback to stop receiving updates. See Retrieve Data on
the Web for more details.

An onChildMoved event will be triggered when a child's sort order changes such
that its position relative to its siblings changes. The DataSnapshot passed to
the callback will be for the data of the child that has moved. It is also
passed a second argument which is a string containing the key of the previous
sibling child by sort order, or null if it is the first child.

Signature:

export declare function onChildMoved(query: Query, callback: (snapshot: DataSnapshot, previousChildName: string | null) => unknown, cancelCallback?: (error: Error) => unknown): Unsubscribe;
Parameters
Parameter	Type	Description
query	Query	The query to run.
callback	(snapshot: DataSnapshot, previousChildName: string | null) => unknown	A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot and a string containing the key of the previous child, by sort order, or null if it is the first child.
cancelCallback	(error: Error) => unknown	An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
options	ListenOptions	An object that can be used to configure onlyOnce, which then removes the listener after its first invocation.
Returns:

Unsubscribe

A function that can be invoked to remove the listener.
//»
onChildRemoved(query, callback, cancelCallback?, options?)//«

onChildRemoved(query, callback, cancelCallback)
onChildRemoved(query, callback, options)
onChildRemoved(query, callback, cancelCallback, options)

Listens for data changes at a particular location.

This is the primary way to read data from a Database. Your callback will be
triggered for the initial data and again whenever the data changes. Invoke the
returned unsubscribe callback to stop receiving updates. See Retrieve Data on
the Web for more details.

An onChildRemoved event will be triggered once every time a child is removed.
The DataSnapshot passed into the callback will be the old data for the child
that was removed. A child will get removed when either:

a client explicitly calls remove() on that child or one of its ancestors - a
client calls set(null) on that child or one of its ancestors - that child has
all of its children removed - there is a query in effect which now filters out
the child (because it's sort order changed or the max limit was hit)

Signature:

export declare function onChildRemoved(query: Query, callback: (snapshot: DataSnapshot) => unknown, cancelCallback?: (error: Error) => unknown): Unsubscribe;
Parameters
Parameter	Type	Description
query	Query	The query to run.
callback	(snapshot: DataSnapshot) => unknown	A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot and a string containing the key of the previous child, by sort order, or null if it is the first child.
cancelCallback	(error: Error) => unknown	An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
options	ListenOptions	An object that can be used to configure onlyOnce, which then removes the listener after its first invocation.
Returns:

Unsubscribe

A function that can be invoked to remove the listener.
//»
onValue(query, callback, cancelCallback?, options?)//«

onValue(query, callback, cancelCallback)
onValue(query, callback, options)
onValue(query, callback, cancelCallback, options)

Listens for data changes at a particular location.

This is the primary way to read data from a Database. Your callback will be
triggered for the initial data and again whenever the data changes. Invoke the
returned unsubscribe callback to stop receiving updates. See Retrieve Data on
the Web for more details.

An onValue event will trigger once with the initial data stored at this
location, and then trigger again each time the data changes. The DataSnapshot
passed to the callback will be for the location at which on() was called. It
won't trigger until the entire contents has been synchronized. If the location
has no data, it will be triggered with an empty DataSnapshot (val() will return
null).

Signature:

export declare function onValue(query: Query, callback: (snapshot: DataSnapshot) => unknown, cancelCallback: (error: Error) => unknown, options: ListenOptions): Unsubscribe;
Parameters
Parameter	Type	Description
query	Query	The query to run.
callback	(snapshot: DataSnapshot) => unknown	A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot.
cancelCallback	(error: Error) => unknown	An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
options	ListenOptions	An object that can be used to configure onlyOnce, which then removes the listener after its first invocation.
Returns:

Unsubscribe

A function that can be invoked to remove the listener.
//»

query(query, queryConstraints)//«
Creates a new immutable instance of Query that is extended to also include additional query constraints.

Signature:

export declare function query(query: Query, ...queryConstraints: QueryConstraint[]): Query;
Parameters
Parameter	Type	Description
query	Query	The Query instance to use as a base for the new constraints.
queryConstraints	QueryConstraint[]	The list of QueryConstraints to apply.
Returns:

Query

Exceptions
if any of the provided query constraints cannot be combined with the existing or new constraints.
//»
//»
function(ref, ...)// set, update, remove, runTransaction«
onDisconnect(ref)//«

Returns an OnDisconnect object - see Enabling Offline Capabilities in
JavaScript for more information on how to use it.

Signature:

export declare function onDisconnect(ref: DatabaseReference): OnDisconnect;
Parameters
Parameter	Type	Description
ref	DatabaseReference	The reference to add OnDisconnect triggers for.
Returns:

OnDisconnect
//»
remove(ref)//«

Removes the data at this Database location.

Any data at child locations will also be deleted.

The effect of the remove will be visible immediately and the corresponding
event 'value' will be triggered. Synchronization of the remove to the Firebase
servers will also be started, and the returned Promise will resolve when
complete. If provided, the onComplete callback will be called asynchronously
after synchronization has finished.

Signature:

export declare function remove(ref: DatabaseReference): Promise<void>;
Parameters
Parameter	Type	Description
ref	DatabaseReference	The location to remove.
Returns:

Promise<void>

Resolves when remove on server is complete.
//»
runTransaction(ref, transactionUpdate, options)//«

Atomically modify the data at this location. Unlike a normal set(), which just
overwrites the data regardless of its previous value, runTransaction() is used
to modify the existing value to a new value, ensuring there are no conflicts
with other clients writing to the same location at the same time.

To accomplish this, you pass runTransaction() an update function which is used
to transform the current value into a new value. If another client writes to
the location before your new value is successfully written, your update
function will be called again with the new current value, and the write will be
retried. This will happen repeatedly until your write succeeds without conflict
or you abort the transaction by not returning a value from your update
function.

Note: Modifying data with set() will cancel any pending transactions at that
location, so extreme care should be taken if mixing set() and runTransaction()
to update the same data.

Note: When using transactions with Security and Firebase Rules in place, be
aware that a client needs .read access in addition to .write access in order to
perform a transaction. This is because the client-side nature of transactions
requires the client to read the data in order to transactionally update it.

Signature:

export declare function runTransaction(ref: DatabaseReference, transactionUpdate: (currentData: any) => unknown, options?: TransactionOptions): Promise<TransactionResult>;
Parameters
Parameter	Type	Description
ref	DatabaseReference	The location to atomically modify.

transactionUpdate	(currentData: any) => unknown	A developer-supplied function which will be 
passed the current data stored at this location (as a JavaScript object). 
The function should return the new value it would like written (as a JavaScript object). 
If undefined is returned (i.e. you return with no arguments) the transaction will be aborted 
and the data at this location will not be modified.

options	TransactionOptions	An options object to configure transactions.
Returns:

Promise<TransactionResult>

A Promise that can optionally be used instead of the onComplete callback to handle success and failure.

//»
set(ref, value)//«
Writes data to this Database location.

This will overwrite any data at this location and all child locations.

The effect of the write will be visible immediately, and the corresponding
events ("value", "child_added", etc.) will be triggered. Synchronization of the
data to the Firebase servers will also be started, and the returned Promise
will resolve when complete. If provided, the onComplete callback will be called
asynchronously after synchronization has finished.

Passing null for the new value is equivalent to calling remove(); namely, all
data at this location and all child locations will be deleted.

set() will remove any priority stored at this location, so if priority is meant
to be preserved, you need to use setWithPriority() instead.

Note that modifying data with set() will cancel any pending transactions at
that location, so extreme care should be taken if mixing set() and
transaction() to modify the same data.

A single set() will generate a single "value" event at the location where the
set() was performed.

Signature:

export declare function set(ref: DatabaseReference, value: unknown): Promise<void>;
Parameters
Parameter	Type	Description
ref	DatabaseReference	The location to write to.
value	unknown	The value to be written (string, number, boolean, object, array, or null).
Returns:

Promise<void>

Resolves when write to server is complete.
//»
setPriority(ref, priority)//«
Sets a priority for the data at this Database location.

Applications need not use priority but can order collections by ordinary
properties (see Sorting and filtering data ).

Signature:

export declare function setPriority(ref: DatabaseReference, priority: string | number | null): Promise<void>;
Parameters
Parameter	Type	Description
ref	DatabaseReference	The location to write to.
priority	string | number | null	The priority to be written (string, number, or null).
Returns:

Promise<void>

Resolves when write to server is complete.
//»
setWithPriority(ref, value, priority)//«
Writes data the Database location. Like set() but also specifies the priority for that data.

Applications need not use priority but can order collections by ordinary
properties (see Sorting and filtering data ).

Signature:

export declare function setWithPriority(ref: DatabaseReference, value: unknown, priority: string | number | null): Promise<void>;
Parameters
Parameter	Type	Description
ref	DatabaseReference	The location to write to.
value	unknown	The value to be written (string, number, boolean, object, array, or null).
priority	string | number | null	The priority to be written (string, number, or null).
Returns:

Promise<void>

Resolves when write to server is complete.
//»
update(ref, values)//«
Writes multiple values to the Database at once.

The values argument contains multiple property-value pairs that will be written
to the Database together. Each child property can either be a simple property
(for example, "name") or a relative path (for example, "name/first") from the
current location to the data to update.

As opposed to the set() method, update() can be use to selectively update only
the referenced properties at the current location (instead of replacing all the
child properties at the current location).

The effect of the write will be visible immediately, and the corresponding
events ('value', 'child_added', etc.) will be triggered. Synchronization of the
data to the Firebase servers will also be started, and the returned Promise
will resolve when complete. If provided, the onComplete callback will be called
asynchronously after synchronization has finished.

A single update() will generate a single "value" event at the location where
the update() was performed, regardless of how many children were modified.

Note that modifying data with update() will cancel any pending transactions at
that location, so extreme care should be taken if mixing update() and
transaction() to modify the same data.

Passing null to update() will remove the data at this location.

See Introducing multi-location updates and more.

Signature:

export declare function update(ref: DatabaseReference, values: object): Promise<void>;
Parameters
Parameter	Type	Description
ref	DatabaseReference	The location to write to.
values	object	Object containing multiple values.
Returns:

Promise<void>

Resolves when update on server is complete.

//»
//»
function(value, ...)// end(At|Before), start(At|Before), equalTo«
endAt(value, key)//«
Creates a QueryConstraint with the specified ending point.

Using startAt(), startAfter(), endBefore(), endAt() and equalTo() allows you to
choose arbitrary starting and ending points for your queries.

The ending point is inclusive, so children with exactly the specified value
will be included in the query. The optional key argument can be used to further
limit the range of the query. If it is specified, then children that have
exactly the specified value must also have a key name less than or equal to the
specified key.

You can read more about endAt() in Filtering data.

Signature:

export declare function endAt(value: number | string | boolean | null, key?: string): QueryConstraint;
Parameters
Parameter	Type	Description
value	number | string | boolean | null	The value to end at. The argument type depends on which orderBy() function was used in this query. Specify a value that matches the orderBy() type. When used in combination with orderByKey(), the value must be a string.
key	string	The child key to end at, among the children with the previously specified priority. This argument is only allowed if ordering by child, value, or priority.
Returns:

QueryConstraint
//»
endBefore(value, key)//«
Creates a QueryConstraint with the specified ending point (exclusive).

Using startAt(), startAfter(), endBefore(), endAt() and equalTo() allows you to
choose arbitrary starting and ending points for your queries.

The ending point is exclusive. If only a value is provided, children with a
value less than the specified value will be included in the query. If a key is
specified, then children must have a value less than or equal to the specified
value and a key name less than the specified key.

Signature:

export declare function endBefore(value: number | string | boolean | null, key?: string): QueryConstraint;
Parameters
Parameter	Type	Description
value	number | string | boolean | null	The value to end before. The argument type depends on which orderBy() function was used in this query. Specify a value that matches the orderBy() type. When used in combination with orderByKey(), the value must be a string.
key	string	The child key to end before, among the children with the previously specified priority. This argument is only allowed if ordering by child, value, or priority.
Returns:

QueryConstraint
//»
equalTo(value, key)//«
Creates a QueryConstraint that includes children that match the specified value.

Using startAt(), startAfter(), endBefore(), endAt() and equalTo() allows you to
choose arbitrary starting and ending points for your queries.

The optional key argument can be used to further limit the range of the query.
If it is specified, then children that have exactly the specified value must
also have exactly the specified key as their key name. This can be used to
filter result sets with many matches for the same value.

You can read more about equalTo() in Filtering data.

Signature:

export declare function equalTo(value: number | string | boolean | null, key?: string): QueryConstraint;
Parameters
Parameter	Type	Description
value	number | string | boolean | null	The value to match for. The argument type depends on which orderBy() function was used in this query. Specify a value that matches the orderBy() type. When used in combination with orderByKey(), the value must be a string.
key	string	The child key to start at, among the children with the previously specified priority. This argument is only allowed if ordering by child, value, or priority.
Returns:

QueryConstraint
//»
startAfter(value, key)//«
Creates a QueryConstraint with the specified starting point (exclusive).

Using startAt(), startAfter(), endBefore(), endAt() and equalTo() allows you to
choose arbitrary starting and ending points for your queries.

The starting point is exclusive. If only a value is provided, children with a
value greater than the specified value will be included in the query. If a key
is specified, then children must have a value greater than or equal to the
specified value and a a key name greater than the specified key.

Signature:

export declare function startAfter(value: number | string | boolean | null, key?: string): QueryConstraint;
Parameters
Parameter	Type	Description
value	number | string | boolean | null	The value to start after. The argument type depends on which orderBy() function was used in this query. Specify a value that matches the orderBy() type. When used in combination with orderByKey(), the value must be a string.
key	string	The child key to start after. This argument is only allowed if ordering by child, value, or priority.
Returns:

QueryConstraint
//»
startAt(value, key)//«

Creates a QueryConstraint with the specified starting point.

Using startAt(), startAfter(), endBefore(), endAt() and equalTo() allows you to
choose arbitrary starting and ending points for your queries.

The starting point is inclusive, so children with exactly the specified value
will be included in the query. The optional key argument can be used to further
limit the range of the query. If it is specified, then children that have
exactly the specified value must also have a key name greater than or equal to
the specified key.

You can read more about startAt() in Filtering data.

Signature:

export declare function startAt(value?: number | string | boolean | null, key?: string): QueryConstraint;
Parameters
Parameter	Type	Description
value	number | string | boolean | null	The value to start at. The argument type depends on which orderBy() function was used in this query. Specify a value that matches the orderBy() type. When used in combination with orderByKey(), the value must be a string.
key	string	The child key to start at. This argument is only allowed if ordering by child, value, or priority.
Returns:

QueryConstraint
//»
//»
function(enabled, ...)// enableLogging«
enableLogging(enabled, persistent)//«
enableLogging(enabled, persistent)	Logs debugging information to the console.
Logs debugging information to the console.

Signature:


export declare function enableLogging(enabled: boolean, persistent?: boolean): any;
Parameters
Parameter	Type	Description
enabled	boolean	Enables logging if true, disables logging if false.
persistent	boolean	Remembers the logging state between page refreshes if true.
Returns:

any
//»
//»
function(logger, ...)// enableLogging«
enableLogging(logger)//«
enableLogging(logger)	Logs debugging information to the console.
Logs debugging information to the console.

Signature:


export declare function enableLogging(logger: (message: string) => unknown): any;
Parameters
Parameter	Type	Description
logger	(message: string) => unknown	A custom logger function to control how things get logged.
Returns:

any
//»
//»

Classes//«
Class	Description
Database	Class representing a Firebase Realtime Database.
DataSnapshot	A DataSnapshot contains data from a Database location.Any time you read data from the Database, you receive the data as a DataSnapshot. A DataSnapshot is passed to the event callbacks you attach with on() or once(). You can extract the contents of the snapshot as a JavaScript object by calling the val() method. Alternatively, you can traverse into the snapshot by calling child() to return child snapshots (which you could then call val() on).A DataSnapshot is an efficiently generated, immutable copy of the data at a Database location. It cannot be modified and will never change (to modify data, you always call the set() method on a Reference directly).
OnDisconnect	The onDisconnect class allows you to write or clear data when your client disconnects from the Database server. These updates occur whether your client disconnects cleanly or not, so you can rely on them to clean up data even if a connection is dropped or a client crashes.The onDisconnect class is most commonly used to manage presence in applications where it is useful to detect how many clients are connected and when other clients disconnect. See Enabling Offline Capabilities in JavaScript for more information.To avoid problems when a connection is dropped before the requests can be transferred to the Database server, these functions should be called before writing any data.Note that onDisconnect operations are only triggered once. If you want an operation to occur each time a disconnect occurs, you'll need to re-establish the onDisconnect operations each time you reconnect.
QueryConstraint	A QueryConstraint is used to narrow the set of documents returned by a Database query. QueryConstraints are created by invoking endAt(), endBefore(), startAt(), startAfter(), limitToFirst(), limitToLast(), orderByChild(), orderByChild(), orderByKey() , orderByPriority() , orderByValue() or equalTo() and can then be passed to query() to create a new query instance that also contains this QueryConstraint.
TransactionResult	A type for the resolve value of runTransaction().
//»
Interfaces//«
Interface	Description
DatabaseReference	A DatabaseReference represents a specific location in your Database and can be used for reading or writing data to that Database location.You can reference the root or child location in your Database by calling ref() or ref("child/path").Writing is done with the set() method and reading can be done with the on*() method. See https://firebase.google.com/docs/database/web/read-and-write
IteratedDataSnapshot	Represents a child snapshot of a Reference that is being iterated over. The key will never be undefined.
ListenOptions	An options objects that can be used to customize a listener.
Query	A Query sorts and filters the data at a Database location so only a subset of the child data is included. This can be used to order a collection of data by some attribute (for example, height of dinosaurs) as well as to restrict a large list of items (for example, chat messages) down to a number suitable for synchronizing to the client. Queries are created by chaining together one or more of the filter methods defined here.Just as with a DatabaseReference, you can receive data from a Query by using the on*() methods. You will only receive events and DataSnapshots for the subset of the data that matches your query.See https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data for more information.
ThenableReference	A Promise that can also act as a DatabaseReference when returned by push(). The reference is available immediately and the Promise resolves as the write to the backend completes.
TransactionOptions	An options object to configure transactions.
//»
Type Aliases//«
Type Alias	Description
EventType	One of the following strings: "value", "child_added", "child_changed", "child_removed", or "child_moved."
QueryConstraintType	Describes the different query constraints available in this SDK.
Unsubscribe	A callback that can invoked to remove a listener.//»
EventType//«
One of the following strings: "value", "child_added", "child_changed", "child_removed", or "child_moved."

Signature:

export declare type EventType = 'value' | 'child_added' | 'child_changed' | 'child_moved' | 'child_removed';
//»
QueryConstraintType//«
Describes the different query constraints available in this SDK.

Signature:

export declare type QueryConstraintType = 'endAt' | 'endBefore' | 'startAt' | 'startAfter' | 'limitToFirst' | 'limitToLast' | 'orderByChild' | 'orderByKey' | 'orderByPriority' | 'orderByValue' | 'equalTo';
//»
Unsubscribe//«
A callback that can invoked to remove a listener.

Signature:

export declare type Unsubscribe = () => void;
//»

»*/
/*Firebase security language/rules«

Console link:
https://console.firebase.google.com/project/linuxontheweb/database/linuxontheweb/rules

Basics
From: https://firebase.google.com/docs/rules/basics

All authenticated users
"some_path": {
	".read": "auth.uid !== null",
	".write": "auth.uid !== null"
}

Content-owner only access
"some_path": {
	"$uid": {
		// Allow only authenticated content owners access to their data
		".read": "auth !== null && auth.uid === $uid",
		".write": "auth !== null && auth.uid === $uid"
	}
}

Attribute-based and Role-based access
"some_path": {
	"${subpath}": {
		".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'",
		".read": true
	}
}

Custom-claim attributes and roles
https://firebase.google.com/docs/auth/admin/custom-claims
"some_path": {
	"$uid": {
		// Create a custom claim for each role or group
		// you want to use
		".write": "auth.uid !== null && auth.token.writer === true",
		".read": "auth.uid !== null && auth.token.reader === true"
	}
}

Rules language
https://firebase.google.com/docs/rules/rules-language

Pre-defined variables

There are a number of helpful, pre-defined variables that can be accessed
inside a rule definition. Here is a brief summary of each:

Predefined Variables

now			The current time in milliseconds since Linux epoch. This works
			particularly well for validating timestamps created with the SDK's
			firebase.database.ServerValue.TIMESTAMP.

root		A RuleDataSnapshot representing the root path in the Firebase
			database as it exists before the attempted operation.

newData		A RuleDataSnapshot representing the data as it would exist after
			the attempted operation. It includes the new data being written and existing
			data.

data		A RuleDataSnapshot representing the data as it existed before the attempted operation.

$ 			variables	A wildcard path used to represent ids and dynamic child keys.

auth		Represents an authenticated user's token payload.


"messages": {
	"$message": {
		// only messages from the last ten minutes can be read
		".read": "data.child('timestamp').val() > (now - 600000)",

		// new messages must have a string content and a number timestamp
		".validate": "newData.hasChildren(['content', 'timestamp']) &&
			newData.child('content').isString() &&
			newData.child('timestamp').isNumber()"
	}
}

"rooms": {
	// This rule applies to any child of /rooms/, the key for each room id
	// is stored inside $room_id variable for reference
	"$room_id": {
		"topic": {
			// The room's topic can be changed if the room id has "public" in it
			".write": "$room_id.contains('public')"
		}
	}
}


"widget": {
	// a widget can have a title or color attribute
	"title": { ".validate": true },
	"color": { ".validate": true },

	// but no other child paths are allowed
	// in this case, $other means any key excluding "title" and "color"
	"$other": { ".validate": false }
}

"foo": {
	// /foo is readable by the world
	".read": true,

	// /foo is writable by the world
	".write": true,

	// data written to /foo must be a string less than 100 characters
	".validate": "newData.isString() && newData.val().length < 100"
}

Consider this example, which allows write operations as long as the value of
the /allow_writes/ node is true, the parent node does not have a readOnly flag
set, and there is a child named foo in the newly written data:

".write": "root.child('allow_writes').val() === true && !data.parent().child('readOnly').exists() &&
			newData.child('foo').exists()"


"baskets": {
	".read": "auth.uid !== null && query.orderByChild === 'owner' &&
				query.equalTo === auth.uid" // restrict basket access to owner of basket
}

// Would succeed
db.ref("baskets").orderByChild("owner").equalTo(auth.currentUser.uid).on("value", cb)                 

// Would fail with PermissionDenied
db.ref("baskets").on("value", cb)


messages: {
	".read": "query.orderByKey && query.limitToFirst <= 1000"
}


// Example queries:

// Would fail with PermissionDenied
db.ref("messages").on("value", cb)

// Would succeed (default order by key)
db.ref("messages").limitToFirst(1000).on("value", cb)

The following query. expressions are available in Realtime Database Security Rules.

Query-based rule expressions

Expression				Type	Description
query.orderByKey		boolean	True for queries ordered by key, priority, or value. False otherwise.
query.orderByPriority
query.orderByValue	
query.orderByChild		string 	Use a string to represent the relative path to a child node. 
						null	For example, query.orderByChild === "address/zip". If the query 
								isn't ordered by a child node, this value is null.

query.startAt			string	Retrieves the bounds of the executing query, or returns null if there 
query.endAt  			number	is no bound set.
query.equalTo			boolean 	
             			null	

query.limitToFirst		number	Retrieves the limit on the executing query, or returns null if 
query.limitToLast		null	there is no limit set.


»*/
/*Example logs scanning in Google Cloud Logs Explorer:«

https://console.cloud.google.com/logs/query?project=linuxontheweb

Sample Queries Page:
https://cloud.google.com/logging/docs/view/query-library

severity=NOTICE AND
resource.labels.method=~"firebase" AND
protoPayload.authenticationInfo.principalEmail=~"gmail\.com$" AND
timestamp>="2025-09-22T00:00:00Z" AND timestamp<="2025-09-24T00:00:00Z"

Here is the JSON:

{
"protoPayload": {
	"@type": "type.googleapis.com/google.cloud.audit.AuditLog",
	"status": {},
	"authenticationInfo": {
		"principalEmail": "XXXXXX@gmail.com"
	},
	"requestMetadata": {
		"callerIp": "XXXX:XXXX:XXXX:XXXX:XX:XXXX:XXXX:XXXX",
		"callerSuppliedUserAgent": "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36,gzip(gfe),gzip(gfe)",
		"requestAttributes": {
			"time": "2025-09-24T22:15:52.015862Z",
			"auth": {}
		},
		"destinationAttributes": {}
	},
	"serviceName": "mobilesdk-pa.googleapis.com",
	"methodName": "google.internal.firebase.v1.SettingsService.GetFirebaseTokens",
	"authorizationInfo": [
		{
			"resource": "projects/668423415088",
			"permission": "firebasehosting.sites.update",
			"granted": true,
			"resourceAttributes": {},
			"permissionType": "ADMIN_WRITE"
		},
		{
			"resource": "projects/668423415088",
			"permission": "firebasedatabase.instances.update",
			"granted": true,
			"resourceAttributes": {},
			"permissionType": "ADMIN_WRITE"
		}
	],
	"resourceName": "projects/668423415088",
	"request": {
		"@type": "type.googleapis.com/google.internal.firebase.v1.GetFirebaseTokensRequest",
		"projectNumber": "668423415088",
		"namespace": "linuxontheweb"
	}
},
"insertId": "XXXXXXXXXX",
"resource": {
	"type": "audited_resource",
	"labels": {
		"service": "mobilesdk-pa.googleapis.com",
		"method": "google.internal.firebase.v1.SettingsService.GetFirebaseTokens",
		"project_id": "linuxontheweb"
	}
},
"timestamp": "2025-09-24T22:15:51.883631Z",
"severity": "NOTICE",
"logName": "projects/linuxontheweb/logs/cloudaudit.googleapis.com%2Factivity",
"receiveTimestamp": "2025-09-24T22:15:52.389570564Z"
}

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
/*9/27/25: To sanitize strings for Firebase keys:«

JS String -> binary string -> btoa -> encodeURIComponent (for the "/" characters in btoa).

function sanitizeKey(key) {
	const encoder = new TextEncoder();
	const data = encoder.encode(key);
	return btoa(String.fromCharCode(...data))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

function unsanitizeKey(safeKey) {
	const padded = safeKey.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - safeKey.length % 4) % 4);
	const decoded = atob(padded);
	const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

Simple: If you have a user directory, you CAN'T change your username
You must delete the directory first!

$ setname [u|update]

".validate": "newData.isString() && 
	newData.val().matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,4}$/i)"

Dir listing format: 
<name>: <integer>
	Dir = -1
	File = 0-MAXLEN
	ListName = true

So in every dir, we might have:
{
	lists:{
		public:["dir1", -1, "file1", 100, "file2", 500, "sloom", -1],
		private:["public", true, "blarr.d": -1, "file3", 101, "file2", 202]
//		private:["private", true, "file3", 101, "file2", 202] //BAD: Infinite recursion
	}
}

The '"public", true' pair means to include the contents of lists.public. Need to ensure that
infinite recursion doesn't occur here.

const usersRef = firebase.database().ref('users');
usersRef.orderByChild('name').equalTo('<filename>').once('value', (snapshot) => {
	snapshot.forEach((childSnapshot) => {
		console.log(childSnapshot.key, childSnapshot.val());
	});
});


»*/
/* 9/25/25: How to *force* ref.transaction(val) to complete the write, before continuing «
with the app logic.

//Google AI, using aborted transactions
//«function transactWithTimeout(ref, value, delay) {
// * Executes a Firebase transaction with a timeout, ensuring a pending write is
// * aborted if it hasn't completed within the delay.
// *
// * @param {firebase.database.Reference} ref The database reference.
// * @param {*} value The value to set.
// * @param {number} delay The timeout duration in milliseconds.
// * @returns {Promise<void>} A promise that resolves when the transaction
// *   completes or rejects if it fails or times out.

return new Promise((resolve, reject) => {
	// Flag to track if the timeout has already occurred
	let timedOut = false;
	let timer;

	// Reject the promise and abort the transaction on timeout
	const onTimeout = () => {
		timedOut = true;
		ref.transaction(() => undefined); // Send an abort command to the queue
		reject(new Error('Firebase write operation timed out.'));
	};

	// Start the timeout timer
	timer = setTimeout(onTimeout, delay);

	ref.transaction((currentValue) => {
		// If the timer has already fired, abort the transaction
		if (timedOut) {
			return undefined; // Returning undefined aborts the transaction
		}
		return value;
	}).then((result) => {
		// Clear the timer if the transaction completes for any reason
		clearTimeout(timer);

		if (result.committed) {
			console.log('Transaction successfully committed.');
			resolve();
		} else {
			// If the transaction aborted for a reason other than our timeout
			console.log('Transaction aborted by another process.');
			reject(new Error('Transaction aborted by another client.'));
		}
	}).catch((error) => {
		// Clear the timer if the transaction fails
		clearTimeout(timer);
		reject(error);
	});
});
}
//»

//Grok, using goOffline
function curlLikeWrite(ref, value, timeoutMs = 5000, maxAttempts = 3) {//«
return new Promise((resolve, reject) => {
let timeoutId;
let completed = false;

// Single set call
firebase.database().set(ref, value).then(() => {
clearTimeout(timeoutId); // Cancel any active timeout
completed = true; // Stop further attempts
console.log('Write completed');
resolve(true);
}).catch(error => {
clearTimeout(timeoutId); // Cancel any active timeout
completed = true; // Stop further attempts
reject(error);
});

// Attempt network connection checks
function attemptNetworkConnect(attempt) {
if (completed) return; // Exit if write completed
if (attempt > maxAttempts) {
firebase.database().goOffline();
alert('Max attempts reached. Reload page.');
reject(new Error('Max attempts exceeded'));
return;
}

timeoutId = setTimeout(() => {
if (!completed && confirm(`Reconnect attempt ${attempt} of ${maxAttempts}. Check network and click OK.`)) {
attemptNetworkConnect(attempt + 1); // Next attempt
} else {
firebase.database().goOffline();
alert('Write cancelled. Reload page.');
reject(new Error('User cancelled'));
}
}, timeoutMs);
}
attemptNetworkConnect(1);
});
}//»

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
const {USERS_TYPE, fsMod: fs, fbase}=globals;
const {Com} = globals.ShellMod.comClasses;
const{mkdv, mk, isArr,isStr,isEOF,isErr,log,jlog,cwarn,cerr}=LOTW.api.util;
const{root, mount_tree}=fs;
const {popup} = globals.popup;

//»

//Var«

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

const FBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
const FBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
const FBASE_DB_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
//»

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

const FBASE_DIRECTORY_VAL = -1;
const DEF_TRANS_DELAY = 5000;

//»

//DOM«
if (!document.getElementById(GSI_CSS_ID)) {
	let sty = mk("style");
	sty.innerHTML = GSI_CSS_STR;
	sty.id = GSI_CSS_ID;
	document.head.appendChild(sty);
}
const button_div = mkdv();
button_div.innerHTML = LOGIN_BUTTONS_STR;

//let goog_but, gh_but;
let gh_but;
let buttons = button_div.getElementsByTagName("button");
for (let but of buttons){
	if (but.name == GITHUB_BUT_ID){
		gh_but = but;
	}
/*
	if (but.name == GOOGLE_BUT_ID){
		goog_but = but;
	}
	else if (but.name == GITHUB_BUT_ID){
		gh_but = but;
	}
*/
}
//if (!(goog_but && gh_but)){
if (!gh_but){
cerr("WHERE IS THE BUTTON (gh_but)?");
}
//»
//Funcs«

const init_fbase = async()=>{//«

let initializeApp;//App

let getAuth,//Auth
	onAuthStateChanged,
	signInWithPopup,
//	GoogleAuthProvider,
	GithubAuthProvider,
	signOut;

let getDatabase,//Database
	ref,
	set,
	get,
	query,
	runTransaction,
	serverTimestamp,
	orderByChild,
	limitToFirst,
	limitToLast,
	startAt,
	enableLogging;

try {

//App
	({ initializeApp } = await import(FBASE_APP_URL));

//Auth
	({
		getAuth,
		onAuthStateChanged,
		signInWithPopup,
//		GoogleAuthProvider,
		GithubAuthProvider,
		signOut 
	} =  await import(FBASE_AUTH_URL));

//Database
	({ 
		getDatabase,
		ref,
		set,
		get,
		query,
		runTransaction,
		serverTimestamp,
		orderByChild,
		limitToFirst,
		limitToLast,
		startAt,
		enableLogging
	} = await import(FBASE_DB_URL));
}
catch(e){
	cerr(e);
	return "Could not import!";
}
//fbase.initializeApp = initializeApp;
fbase.app = initializeApp(firebaseConfig);
fbase.getAuth = getAuth; 
fbase.onAuthStateChanged=onAuthStateChanged; 
fbase.signInWithPopup=signInWithPopup; 
//fbase.GoogleAuthProvider=GoogleAuthProvider; 
fbase.GithubAuthProvider=GithubAuthProvider; 
fbase.signOut=signOut;
fbase.getDatabase = getDatabase;
fbase.ref = ref;
fbase.set = set;
fbase.get = get;
fbase.query = query;
fbase.runTransaction = runTransaction;
fbase.orderByChild = orderByChild;
fbase.limitToFirst = limitToFirst;
fbase.limitToLast = limitToLast;
fbase.startAt = startAt;
fbase.serverTimestamp = serverTimestamp;
fbase.enableLogging = enableLogging;
fbase.didInit = true;
return true;

}//»

const sanitizeKey=(key) => {//«
	const encoder = new TextEncoder();
	const data = encoder.encode(key);
	let b64;
	if (data.toBase64) b64 = data.toBase64();
	else b64 = btoa(String.fromCharCode(...data));
	return b64.replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
}//»
const unsanitizeKey=(safeKey)=>{//«
	const padded = safeKey.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - safeKey.length % 4) % 4);
	const decoded = atob(padded);
	const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
};//»

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
if (!fbase.didInit){
throw new Error("NEVER CALLED init_fbase() ?!?!");
}
	return new Promise((Y,N)=>{
		const auth = fbase.getAuth(fbase.app);
		let cb = fbase.onAuthStateChanged(auth, (user) => {
			cb();
			Y(user);
		});
	});
};//»
const get_ref = (path) => {//«
	let db = fbase.getDatabase(fbase.app);
	let ref;
	if (path) ref = fbase.ref(db, path);
	else ref = fbase.ref(db);
	return ref;
};//»
const get_value = async(ref)=>{//«

let rv;
try{
	rv = await fbase.get(ref);
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
		fbase.runTransaction(ref, ()=>{return undefined;});
		resolve(new Error('Firebase write operation timed out.'));
	};

	// Start the timeout timer
	timer = setTimeout(onTimeout, delay);
	let result;
	try {
		result = await fbase.runTransaction(ref, curVal=>{
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
const fbase_prep = ()=> {//«
	if (!fbase.didInit){
		return "did not init firebase";
	}
	let gh_id = globals.auth.github.uid;
	if (!gh_id){
		return "please call 'user' first!";
	}
	return parseInt(gh_id);
};//»
const create_new_file_or_dir = async(_this, opts={}) => {//«

let ghid = fbase_prep();
if (isStr(ghid)){
	_this.no(ghid);
	return;
}
/*
This currently only works in the base user dir
*/
let use_obj;
let use_val;
let say_type;
if (opts.isDir){
	use_obj = NEW_DIR;
	use_val = FBASE_DIRECTORY_VAL;
	say_type = "folder";
}
else{
	use_obj = NEW_FILE
	use_val = 0;
	say_type = "file";
}

const{args}=_this;

//let ghid = globals.auth.github.uid;
let path = args.shift();

if (!path) return _this.no("no path given");

let rel_path_enc = "";
let name;
if (path.match(/\x2f/)) {
	let arr = path.split("/");
//log(arr);
	name = arr.pop();
	for (let name of arr){
		rel_path_enc+=`/kids/${sanitizeKey(name)}`;
	}
//	return _this.no("not (yet) allowing '/' in the name!");
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
if (list.names.includes(name)){
	if (opts.isDir) _this.no(`exists: ${name}`);
	else _this.ok(`exists: ${name}`);
	return;
}
if (list.names[0]===false){
	list.names = [name];
	list.vals = [use_val];
}
else{
	list.names.push(name);
	list.vals.push(use_val);
	let rv = parallel_sort(list.names, list.vals);
//log(rv);
	list.names = rv[0];
	list.vals = rv[1];
}

let enc_path = sanitizeKey(name);
let path_ref = get_ref(`${base_path}/kids/${enc_path}`);

let rv = await run_transaction(path_ref, use_obj);
if (isErr(rv)) return _this.no(rv.message);
rv = await run_transaction(list_ref, list);
if (isErr(rv)) {
	_this.no(`The ${say_type} was created, but the list failed to be updated (error message: ${rv.message})`);
	return;
}
let size_ref = get_ref(`${base_path}/size`);
rv = await run_transaction(size_ref, list.names.length);
if (isErr(rv)) {
	_this.no(`The list size failed to be updated (error message: ${rv.message})`);
	return;
}

_this.ok();

};//»

//»

//Commands«

/*«
const com_ = class extends Com{
async run(){
const{args}=this;

}
}
»*/

const com_fbstats = class extends Com{//«

async run(){
const{args}=this;

//Change this to go back further in time
let mins_ago = 72;

//Change this to get more/less statuses
let num_recent_stats = 10;

let start_time = new Date().getTime() - (mins_ago * 60000);
let c1 = fbase.orderByChild('time');
let c2 = fbase.startAt(start_time);
let c3 = fbase.limitToLast(num_recent_stats);
let ref = get_ref("status");
let q = fbase.query(ref, c1, c2, c3);
let snap = await get_value(q);
if (isErr(snap)){
	return this.no(snap.message);
}
if (!snap.exists()){
	return this.no(`no statuses were found`);
}
snap.forEach(kid=>{
	let val = kid.val();
	let arr = (new Date(val.time)+"").split(" ");
	let str = `${arr[1]} ${arr[2]} ${arr[3]} ${arr[4]}`
	this.out(`${kid.key} (${str}): ${val.content}`);
});
this.ok();
}
}//»
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
const com_user = class extends Com{//«
/*
This will be the interface into one's own user account
*/
static getOpts(){
	return{
		s:{
			f: 1
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

if (!fbase.didInit) return this.no("Did not initialize firebase");

if ((is_stat || is_signin) && globals.auth.github.login && !opts.f){
	let already = "";
//	if (is_signin) already = " already";
	this.ok(`you are${already} signed in as: ${globals.auth.github.login}`);
	return;
}

const auth = fbase.getAuth(fbase.app);

const handle_user = async user => {//«

	if (is_signout){
		try{
			await fbase.signOut(auth);
			delete_auth();
			this.ok('Signed out');
		}
		catch(e){
			cerr(e);
			this.no(e.message);
		}
		return;
	}
	let already = "";
//	if (is_signin) already = " already";
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
log("Got github login", login);
		set_auth(uid, login);
		this.ok(`you are${already} signed in as: ${login}`);
		return;
	}
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
	localStorage.setItem(`github-${uid}`, login);
	set_auth(uid, login);
	this.ok(`you are${already} signed in as: ${login}`);
};//»

let cb = fbase.onAuthStateChanged(auth, user => {//«
cb();//Just doing this once, so the returned value is supposed to unregister the callback.

if (user) return handle_user(user);

delete_auth();

if (!is_signin) {
	this.ok("You are signed out");
	return;
}

let is_active = false;
/*«
Either the user clicks a sign-in button, and pop_div.cancel() will be called, or
they will click the popup's lone button (here arbitrarily labelled "CANCEL"), and 
the command will immediately return. 

If they try clicking the popup's button after clicking one of the sign-in
buttons, the popup's callback will return because the is_active flag is set.
»*/
let pop_div = popup(button_div, {//«
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
	try {
		await fbase.signInWithPopup(auth, new fbase.GithubAuthProvider());
	}
	catch(e){
		cerr(e);
		this.no(e.message);
		pop_div.cancel();
		return;
	}
	let user = await get_fbase_user();
	if (user){
		handle_user(user);
	}
	else{
		this.no(`Failed to get user object after after signing in`);
	}
	pop_div.cancel();
};//»

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
/*
Maybe we should export a basic function to fs.populate_dirobj for use with the basic
shell/terminal functions like ls and doing tab complete.
*/
				this.suc("/users: successfully mounted");
			}
			this.ok();
		}//»
		else if (com=="list") {//«
			if (!did_mount) return this.no("Did not mount!");
			if (!fbase.didInit) return this.no("Did not initialize firebase");
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
		if (!com) com = "init";
		if (com == "init") {
			if (fbase.didInit){
				this.wrn("did already init");
				this.ok();
				return;
			}
			let rv = await init_fbase();
			if (rv === true){
				this.ok("init: ok");
				return;
			}
			if (isStr(rv)) return this.no(rv);
			log(rv);
			this.no("Unknown value returned from init_fbase() (see console)");
			return;
		}
		if (!fbase.didInit){
			this.no("did not init firebase");
			return;
		}
		let db = fbase.getDatabase(fbase.app);
		if (com == "db") {
log(db);
this.ok();
		}
		else if (com == "ref") {
let path = args.shift();
let ref;
if (path) ref = fbase.ref(db, path);
else ref = fbase.ref(db);
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
if (path) ref = fbase.ref(db, path);
else ref = fbase.ref(db);
try {
let rv = await fbase.set(ref, val);
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
run(){
	create_new_file_or_dir(this);
}
}//»
const com_fbmkdir = class extends Com{//«
run(){
	create_new_file_or_dir(this, {isDir: true});
}
}//»
const com_fbmkhomedir = class extends Com{//«
async run(){
const{args}=this;

if (!fbase.didInit){
	this.no("did not init firebase");
	return;
}
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

let home_ref = get_ref(`/user/${gh.uid}`);

let rv = await run_transaction(home_ref, NEW_DIR);
if (isErr(rv)) return this.no(rv.message);
this.ok();

}
}//»
const com_fbls = class extends Com{//«
async run(){
const{args}=this;

let ghid = fbase_prep();
if (isStr(ghid)) return this.no(ghid);
let path = args.shift();
let path_enc = "";
if (path){
	let arr = path.split("/");
	for (let name of arr){
		path_enc+=`/kids/${sanitizeKey(name)}`;
	}
}
let fullpath = `/user/${ghid}${path_enc}/list`;
let ref = get_ref(fullpath); 

let snap = await get_value(ref);
if (isErr(snap)){
	return this.no(snap.message);
}
if (!snap.exists()){
	return this.no(`path not found`);
}
let list = snap.val();
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
/*This allows for the ability to run a query on the numerical ids, and get back whatever relevant
information they might want to provide.
*/
	async run(){
		const{args}=this;

		let ghid = fbase_prep();
		if (isStr(ghid)) return this.no(ghid);
		if (!args.length){
			return this.no("Nothing given!");
		}
		let ref = get_ref(`/status/${ghid}`);
		let obj = {
//			time: Math.floor((new Date().getTime())/1000),
			time: fbase.serverTimestamp(),
			content: args.join(" ")
		};
		let rv = await run_transaction(ref, obj);
		if (isErr(rv)) return this.no(rv.message);
		this.ok();
	}
}//»

//»

const coms = {//«
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
}//»

export {coms};

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


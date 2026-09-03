(()=>{"use strict";
//README«

/*Old«

The LOTW file system is implemented here. IndexedDB is used to define the
structure of the file system, while the origin-private file system (OPFS) API
is used as the storage solution for "normal" files. As convenience, there are
String prototypes (@STRPROTOS) that enable the quick translation between
pathnames and file system nodes as well as file contents.  If the string is
only a simple file name (e.g. my_file.txt) or a relative path (e.g.
../config.json), then you can pass in an object with a "cwd" member, in order
for the full path to be resolved.

For example:

let fname = "my_file.txt";
let path = "/home/me/Desktop";

let node = await fname.toNode({cwd: path});
//If the file exists, an instance of FSNode (defined @FSNODEDEF) will be returned.

»*/
/* PATTERN FOR CREATING NEW FILE NODE TYPES W/ ARBITRARY data/getBlob/setBlob«

@YSXBPMNF

Here is a basic template:

const getter = async (node, opts) => {//«
	let my_str = node.getData("someStr");

	let blob;
	// Make the blob...
	return blob_to_ret_val(blob, opts); 
};//»
const setter = async (node, val, opts={}) => {//«

let my_arr = node.getData("someArr");
// opts: append
let size;
// Figure out the saved size
return {size}
};//»
const data = {//«
	someStr : "hi",
	someArr: [1,2,3],
	someBool: false
};//»

let my_node = new FileNode(my_name, my_par, {
	getBlob: getter,
	setBlob: setter,
	data
});
_dir_update(1, par, my_node);

»*/

//»


/* 9/1/26:«


»*/
/* 8/30/26: Ideas «

Claim: that there are 7 basic primities for any possible file system
operations:

3 for FileNodes: The given node already exists
  - getBlob/setBlob
  - backendDelNode

4 for DirNodes: The given nodes need to be created or cached into memory 
as children
  - mkNewFile/mkDir: A node may be created
  - tryLoadKid: A node may be cached
  - loadKids: Many nodes may be cached


I mainly just want to refactor what I already have, generalize it, and use the
result to create various other types of file system mounts.

I just really want to ensure all of the method extension pathways are sound,
but especially that the "node delete" pathway makes sense.

I know we start with doFsRm. First we call canRm, then node.del(opts)
@OJNDMFJGH. 

In del_node (@EHRJTKML), for maximal genericity, we should pack all of the
different cases (OP_FS_TYPE, SHM_FS_TYPE, FBASE_USER_GRP_FS_TYPE) into a single
invocation of `node.backendDelNode()`.


»*/
/* 8/26/26: Back to extending the fs  «

Need a concept of filesystem types that have a persistent backend schema,
such as OP_FS_TYPE.


NOW: Want to uncomment the mount of FBASE_RTDB_FS_TYPE in the init phase? 



!!! BUG BUG BUG !!! (FIXED???)

After mv'ing a file node, the scr_node.id property somehow mysteriously
vanishes @MXFBNRHOL.

IT'S BECAUSE WE ARE COPYING THE NODES VIA MK_DIR_KID (), BUT NOT PUTTING
THE id PROPERTY ONTO IT.

FIXED @XRUIOPKGH

Anything else that does this sort of copying needs to do this, but I
am at a loss and to anything other than `do_move` that might do so. 


When giving a type, for the DirNode constructor, the nodes mntPar is
*supposed* to be the node itself, per @WEBRJTIOX, but when creating
the 'prv' and 'pub' DirNode's in fbase.js, it doesn't seem to hold true
because in the console:

prv = await "/mnt/fbase/slartibartfast/prv".toNode()

prv.fullpath // -> '/mnt/fbase/slartibartfast/prv'

prv.mntPar.fullpath // -> '/mnt/fbase/slartibartfast'

When trying to create files on our new file system (FBASE_USER_GRP_FS_TYPE),
there is a difference between doing redirects and calling touch. When
doing redirects, the shell (I assume) is always calling the OP_FS_TYPE
methods, before there is an attempt to do it according to the "spec" of
the actual file system. I'm not sure why both ways of doing it are
being attempted. Nevertheless, we should try to iterate FIRST with
the canonical touch/save functions, and then only look into the 
redirection modality.


»*/
/* 8/24/26: BACK TO PUSHING ICONS INTO FSNode.icons «

Data kept here: @SRKTOYKHM

... and then deleting ALL of these when successfully doing rm and mv
operations.

I think we can say that this is all about accountancy for the purpose of icon
*deletion*. But there is one problem: when moving an icon.

»*/

// Notes«

/* 8/6/26: Stop passing icons through comMv! «

For the 2 callbacks @WURBTMYJ (done_cb and no_move_cb), just call them with the
*paths*, and the caller can trivially associate this with the relevant element.
It simply doesn't make any sense, conceptually speaking, to have any awareness
of graphical objects in this module.

»*/
/* 8/4/26: Gotten rid of the main "old school" api methods «

They've all been changed to:

parobj.mkWhat:

mkNewFile,
mkDir
mkSymLink
mkHardLink

»*/
/*8/3/26: No more writeFile, saveFsByPath, or mkFile !!! «

These represent the old way of stateless functions.

It is important to use the new way: String.prototype -> FSNode.

This ensures that the program pathways are as "tight" as possible.

There are still a handful of calls to fsapi.mkDir scattered about
(desk.js, term.js, coms/fs.js), so these should be updated to
pardir.mkDir(newdirname), then we can rename it to mk_dir.


»*/
/* 8/1/26: In String.toParNodeAndName «

How about an option to create a file or dir w/ the given name?

This is less "powerful" than String.toNode({mkFile: true}), because
*that* one creates all of the missing directories in the path, while
*this* only succeeds if the immediate parent actually exists.

@EJUPMNHGU

»*/
/* 7/31/26: During comMv, let's make dest folder 'isMoveLocked' «

@MNASYRGK:

dest_par_node.addMoveLock(move_lock);


This way, nothing weird should happen during long mv/cp operations.


First of all, a "lock" is just an empty object, i.e. kept as a private
variable in FileNodes, but now we can have locks that are kept in the
comMv scope.

But there is a difference between these two things:

1) The shell's mv/cp which allows arbitrary source args. Here, there is NO SUCH
THING AS *the* src folder, while there necessarily is a dest folder (i.e. the
final arg).

2) The desktop's mouse-based mv/cp operation which necessarily has singular
source and dest folders.

So in comMv, we can figure out the dest par node as the first thing, and
then put our move lock on it.

Then, if the desktop wants to put a lock on the source par node, then it
can do that.

ALSO: created ALWAYS_DONE_DIR_TYPES, so that in the constructor,
this.#done = true. This currently only is only used for SHM_FS_TYPE.

»*/
/* 7/30/26: Back here after refactoring the desktop 'open icon' logic «

I just commented out all "weird" desktop updating operations
(make_icon_if_new, move_icon_by_path, update_folder_statuses). The working
theory is that, ***IN GENERAL, ICONS DO NOT MATTER***. The corollary is:
***IF YOU ARE DOING SOMETHING THAT MATTERS, USE THE SHELL***


First of all:

Folder icons that are not actively being shown in the GUI are 
"auto-pruned" by the folder app logic as such:

kid.show = async()=>{
	let got = dir.getKid(kid.dataset.name);
	if (!got){
		kid._del();
		return;
	}
// Make the icon...
}


»*/
/* 7/26/26: TRYING TO UNCOVER WHERE THE node.link PROPERTY COMES FROM «

First of all, we do have a symLink property on LinkNode that is set
via _set_sym_link.

»*/
/* 7/24/26: How to add/del icons «

THIS IS THE SAME ESSENTIAL NOTE AS 7/2/26!!!

@RNFHTOYL: Where directory child elements are added
@DPLRJTBBM: Where directory child elements are deleted

We need to check for the existence of NS.Desk as well as being in
a "normal" operation mode (i.e. not initializing).

Then, there might be issues with existing icons that have been created in (or
will be deleted by) the GUI logic (e.g. in NS.Desk.move_icons). In this case,
we will need to provide an 'opts' object, so that these icons are left alone.


Also, we technically will need to allow for doing these icon add/del operations
on RootDirNode, but "top level" dirs are currently only in the fs init 
phase, and there is no concept of removing them.

»*/
/* 7/22,23/26: Now making the FULL FS ABSTRACTION «

All we have to do is simply *look* at comMv.

»*/
/* 7/21/26: The concept of "moving" (and when it must be "copy and remove") «

WHY IS OP_FS_TYPE REFERENCE TWICE IN COM_MV?


- @XJRJHURJ: This is only for folders that need to do copy-type
operations, and this test is for when we *also* need to do remove
(i.e. it is copy and remove). So we need to make this generic by
way of testing for: hasBackend and hasRm.



move://«

1) Are the fs types the same? If not: goto cp_and_rm
2) hasBackend: Is there a permanent (e.g. database-backed) backend that needs 
to be updated?
	- if not the fs type is "volatile", goto move_finalization 
3) hasSimpleMove/hasAtomicMove (or just: hasMove): Is there a backend mv operation 
that (atomically) provides "change parent" and "rename" (where the parId and 
path=parId/name fields are both updated)?
	- If so, try the move operation
		- if failed: error ("Backend move failed")
		- else: goto move_finalization
4) Go to cp_and_rm

//»

move_finalization://«

1) If "change parent":
	- remove the node from the old parent
	- update the node's name (if applicable)
	- add to the new parent
2) If "rename" only:
	- update the node's name

//»

cp_and_rm://«

1) hasRm: Can the "from" fs type do a remove?
	- if not: error ("Can't remove")
2) hasMkNewFile: Can the "to" fs type make a new file (assumption: the contents 
of any new file can *always* be updated)
	- if not: error ("Can't create")
3) Get save_blob from from_node
4) Make to_node
5) Save save_blob to to_node
6) Try remove from_node from backend
	- If success remove from_node from old parent
	- else error ("Backend removal failed")
7) add to_node to the new parent

//»


Lesson: We need these predicates:  

1) hasBackend
2) hasSimpleMove (includes chgPar and rename)
3) hasRm and hasMkNewFile

SITE_FS_TYPE (we are currently just checking for 'writable'):
- hasBackend: true
- hasSimpleMove: false
- hasRm: false
- hasMkNewFile: false

For move's, this forces us to *try* either a move or cp_and_rm,
but when all the pathways fail, this ends up being an overall 
failed operation.


What if we had a fs like this:
- hasBackend: true
- hasSimpleMove: false
- hasRm: false
- hasMkNewFile: true

Then, we can't do move's, but we can do cp's
But, if hasRm=true, then we *can* do move's, but only via the cp_and_rm path.

»*/
/* 7/20/26: Just made mkDir and mkNewFile on DirNode's  «

These need to be passed in as args for alternative FS types,
the same as w/ popDir, tryLoadKid, getBlob, and setBlob.



In path_to_node 
Need to implement tryKetKid for *every* fs type, instead of testing for
`rtype==OP_FS_TYPE`:
	- @SHMYILYHG
	- @BSGDUGTJK

The default one will be to simple call loadKids and then call getKid. 

»*/
/* 7/16/26: Finally: an option in String.toNode for creating new File or Dir «

@HSJRKTHTG: Need to check for mkDir or mkFile on failure. But this isn't
quite right, because I want to automatically make all subdirectories
rather than merely doing toParNodeAndName, and returning on failure.

IS THERE ANYTHING IN HERE THAT ACTUALLY *MAKES* ALL THE SUBDIRS?

»*/
/* 7/13/26: Forget about that "integration" stuff from 7/10/26 «

Now: we are just checking for dev_mode @ESHFKNOI, and then loading our
(new) module at mods/fs/fbase.js, followed by the necessary init stuff.
We can worry over do loading of arbitrary fs types, when there are enough
examples of those to make it a fully generic operation.


»*/
/* 7/11/26: Recenter our thinking around client-side scriptability «

Instead of trying to devise the "perfect" remote db schema to support a
"perfectly mounted filesystem", let's put as much complexity as humanly
possible into the local configuration steps, largely via shell scripts.

»*/
/* 7/10/26: NO!!! Integration of alt file systems via URL "boot flags"  «

Example: ?bgcol=112&mnt=fbase,cool,other

@GPDYHJLO inspect qObj.mnt and attempt to load/mount fs types:
- fbase
- cool
- other

There we will:

1) dynamically load the modules (from, e.g. /mods/fs/fbase.js)
2) call the exported init function to give them handles to
   the different FSNode types, and receive the 'mntPar' DirNode
3) mount the 'mntPar' DirNode returned from step 2:
   - e.g. /mnt/fbase

Then when path_to_node is called on the children, the appropriate
versions of popDir and tryLoadKid will be called, which use the
FileNode/DirNode constructors to export the various "primitive" (db-centric) 
fs methods into this module.


In FSNode.move (@OIKFBJKB), we need to be generic about moving between file
systems of the same type, by way of checking for the ability to do "simple
reparenting".  Otherwise, we need to treat it as the copy-then-delete method
when "moving" between wholly different file systems.


»*/
/* 7/9/26: Change the Firebase logic to any login via auth.uid? «

Need to update lines like this in the database schema:

".write": "auth != null && auth.provider === 'github' && 
	auth.token.firebase.identities['github.com'][0] === $ghid",


... to:

"$uid": {
	".write": "auth != null && auth.uid === $uid",
}


Also: change SESS_ID_BYTE_LEN from 3 to 6, making it much
more robust against collision issues: 256^3=64^4 (~10^8) vs 
256^6=64^8 (~10^15) combinations.

»*/
/* 7/8/26: Workflow of: FSNode.type == "remote" «

The first thing to do is integrate the logic developed ~Oct 2025, which
is now sitting in coms/dev/net/fs.js.

It is important to put the inner core of that logic into modules that are
loaded *after* /sys/fs/js in the main '.html' files, such as /mods/fs/net.js
below:

<script src="/sys/config.js"></script>
<script src="/sys/util.js"></script>
<script src="/sys/fs.js"></script>

<script src="/mods/fs/net.js"></script>

<script src="/sys/desk.js"></script>

In this fs extension, a subtree will be mounted, e.g. on /mnt, and all of
the primitive functions that need to be used by the node classes in 
/sys/fs.js may be exported.

Then, command authors should not *generally* need any awareness of the
underlying implementation details.

So even though any fs extensions are loaded *after* the main fs
module (fs.main), it is the interface module (e.g. sys/desk.js or sys/terminal.js)
which calls the init function of fs.main. This can then call any
init functions which have registered themselves (i.e. in /mods/fs/net.js) 
in order to do mounting operations on the already well-initialized file system.

In case the internet is disconnected while trying to do all the initialization
stuff, we will want another means of performing remote initializations, i.e.
manually invoking (via CLI) the same init functions that were registered
to the system in /mods/fs/net.js, and were called (but failed) during fs.init.

»*/
/*7/7/26: Now: Put a tryLoadKid method on DirNode? «

For every file system type that is not in LOCAL_MNT_TYPES, we now require:
	- FileNode to implement getBlob and setBlob (@SGJTPOL)
	- DirNode to implement popDir and tryLoadKid (@UDLMDHEK)

This is in anticipation of fully integrating the various REMOTE_FS_TYPE's
of mounted file systems into LOTW.

»*/
/*7/6/26: How to load alternative fs types, like "remote"? «

LOAD THEM IN THE .html FILE AFTER FS.JS AND BEFORE THE MAIN .JS FILE 
(e.g. DESK.JS or SHELL.JS)

But first, let's change the (confusing) 'root' property (@NDITPLOI) 
to something more appropriate.

.mntPar

A "mount parent" is the closest parent that defines the given file system
type (i.e. OP_FS_TYPE/DEV_FS_TYPE/SHM_FS_TYPE)



Now we have a symmetry in FileNode between getValue and setValue.
These both call the "external" methods: get_local_blob and set_local_blob.

Want to create two private members on FileNode @SKMTNHGM:
#getBlob, #setBlob

This way, arbitrary file types (using the APIs of various remote domains, etc) 
can extend the functionality like:

let node = new fsapi.FileNode(name, par, {
	getBlob: my_remote_getter,
	setBlob: my_remote_setter
}); 

If these methods aren't supplied in the options, they will default to
get_local_blob and set_local_blob, defined here.


Likewise, for the various DirObj types, we will want to supply our own
populateDir method, which will default to populate_dirobj.

»*/
/*7/3/26: Put del(), move(), and copy() on FileNode???«
Also getters: canDel, canMove, and canCopy?

On DirNode:
getters: canMoveFrom?

IDEA: @OLNDTKJG: node.checkAnyKids

»*/
/* 7/2/26: PUT ICON ADD/DEL LOGIC @HISLKFNF«

Need a better way of thinking about @EHGJGKYE

The idea *was* that only OP_FS_TYPE needed to update a single value in a registry
in order to change the parent of a directory

//"Manual recursion" needed for non HTML5FileSystem folders...
if (type != OP_FS_TYPE && app === FOLDER_APP){
// let arr = [];
// Fill up arr
// arr.push(newpath)
await this.com_mv(arr, ...);
continue;
}

PROBLEMS:

1) This is invoked *even* when we just need to update the name, i.e.

mv /dev/shm/some_folder_name /dev/shm/another_folder_name
(Now we have a warning for that condition)


2) It doesn't actually 'mv', but ALWAYS copies


3) Don't know why `if_cp: true` @SUTIYKJ (instead of `if_cp: if_cp`)

The point is that if a `mv` operation involving an actual change in location
is being done, such that the directory types are the same, then this should 
only need a simple "bookmark" update operation. 

For example, in /dev/shm,
we just need to do: _add_kid/_del_kid on node.par and savedir.

_del_kid(node.par, node);
_add_kid(savedir, node);
»*/
/*6/30/26: Most of this logic should only be accessible from: «

1) String.prototype's
2) FSNode (and derived class) method's 

»*/
/*6/15/25: Time to DEEPLY STUDY this to FULLY encapsulate DIRECTORY CHILDREN«
First step:
Add @JDPEIO, add private #kids field to DirNode and create the object
to hold the children in its constructor.

appData is in opts in mk_dir_kid (@RYSHTKFH), but it is positional in all the
FSNode constructors.

SO: WHO CALLS MK_DIR_KID W/APPDATA OTHER THAN THE ***UNIMPLEMENTED***
NETFILE NODE???


»*/
/*6/10/26: An issue w/ implementing: `$ cp -r /site/path/to/folder .` «
@JPDKAJD: We previously were awaiting on node.buffer, but I think 
that property was removed, and now it seems to work with awaiting
on node.bytes (which *is* defined in FileNode as a getter property).
JUST PUT THE buffer PROPERTY BACK ON FileNode!
»*/
/*12/14/25«

Added try/catch block @XMNYTGH for this fetch statment in get_local_blob
(type===MOUNT_TYPE), and returned null. Then I added a check for null in
coms/fs.js: com_less, which caused the less command to report an error, rather
than (successfully) show an empty buffer. We should probably add this same
check for null to other commands (like vim) and other applications (like
TextEdit) and possibly parts of the system. Also for the fetch in
try_make_site_dir. So this is turning into a pattern...

»*/
/*10/20/25: Need to reimagine the "add_lock_funcs" concept @GSIEKFO, probably by«
adding these methods to the nodes themselves. I guess the lockFile/unlockFile 
functions were being used before the FSNode concept was originally introduced.
As they currently exist, there are going to be blobId collisions between files
of type: OP_FS_TYPE and USERS_TYPE. 

Does the concept of locking a file (for editing) even apply to IDB_DATA_TYPE files?
We were previously calling add_lock_funcs on them in mk_dir_kid (@WLOTUYJG). But
I'm pretty sure there's no good reason for these to be sent to the entire *text* editing
workflow.

Just added the locking/unlocking functions to FileNode and NetFileNode. The only
issues is with locking nodes (with blobId=0) in NetFileNode @EKSHRKG.

»*/
/*10/19/25: LOTS OF CHANGES! «

The notes below are from earlier in the day. I got rid of all invocations of checkDirPerm
and check_fs_dir_perm, and replaced with (getter) DirNode.okWrite (@SIEMGKG).

I did a major overhaul by getting rid of all external invocations of SAVEFSBYPATH.
WRITEFILE can only be called when writing new files. Otherwise, use the given
node's setValue method (currently only implemented on FileNode or NetFileNode).

In apps/Folder.js, I added 'this.node' property to show up as Win.app.node, in
order to clean up the logic of calling the desktop's saveAs (e.g. from TextEdit).

*	*	*

VERY UGLY THINGS GOING ON @WNGKHPLK. AFTER ALL THESE YEARS, THERE IS *STILL* NO
RHYME OR REASON RELATED TO WHAT IS RETURNED FROM THE VARIOUS FILE SAVING/WRITING FUNCTIONS. 
WE ARE CURRENTLY RETURNING A NUMBER (BYTES WRITTEN), BUT IF A NODE IS BEING CREATED, THEN 
THE NEW NODE'S ID IS A MUCH, MUCH MORE SIGNIFICANT PIECE OF INFORMATION.

The fundamental distinction I want to make is:
1) If a file exists (path_to_node yields a node), then use the node's setValue method
to handle all write operations.
2) If not, use WRITEFILE.

SAVEFSBYPATH
Returns«

let rv = await write_blob(await node.entry, blob, opts); // rv == {size: blob.size};

node.size = rv.size;
if (opts.retObj) {
	rv.node = node;
	return rv;
}
return node;
»

vim«
//We want the size information here because of reporting it.
let opts={retObj: true};
//...
if (edit_ftype === USERS_TYPE){
	let node = await fsapi.WRITEFILE(usepath, val);
	if (node) rv = {node, size: node.size};
}
else {
	rv = await fsapi.SAVEFSBYPATH(usepath, val, opts);
}
if (!(rv&&rv.node)){
//REPORT ERROR!!!
return;
}
»
cp from OP_FS_TYPE -> copy_node (@EYTKFHSC)

WRITEFILE (calls SAVEFSBYPATH)
Shell redirect (Stdout.write)«

if (!await fsapi.WRITEFILE(fullpath, val, {append: op===">>"})) {
	return `${fname}: Could not write to the file`;
}
return true;
»
Desktop«
In the desktop, when going through the gui to create a new text file, save_icon_editing->doend
calls WRITEFILE.
»
TextEdit«

if (topwin.icon){
    let rv = await topwin.icon.node.setValue(area.value);
    if (rv && !Number.isFinite(rv.size)) poperr("Could not save the file");
    else{
        statbar.innerText = `${rv.size} bytes written`;
    }
    return;
}
else if (topwin.fullpath){
cwarn("Got topwin.fullpath but not topwin.icon!!!");
    let rv = await fsapi.WRITEFILE(topwin.fullpath, area.value, {noMakeIcon: true});
    if (!rv) return poperr("Could not write the file");
    statbar.innerText = `${rv.size} bytes written`;
    return;
}
//...
let node = await fsapi.WRITEFILE(fullpath, area.value);
//...
Win.node = node;
//»
Terminal: Saving history files, etc
com_record (coms/extra.js)


com_ytdl (coms/yt.js): Old style command, depends upon websockets backend won't work unless updated.

In DirNode, just made an okWrite getter method @SIEMGKG
»*/
/*9/29/25: Proposing: NetFileNode«

Let's put a new kind of FSNode in here (NetFileNode @TWKMJORH) devoted to
network-based file systems. I think it is fundamentally important for the logic
of any file system node to *finally* go through this module.  The new node will
need to import the logic from the various modules that actually implement all
of the operations that are needed to interact with the given backend in
question (we DON'T want that messy sort of logic "polluting" this file).

»*/
/*9/24/25: Yesterday I implemented a sign-in system to enable access to the Firebase«
backend, so that LOTW could have networking capabilities. Earlier this morning, I was feeling
bad about the kind of "violence" this would entail to the LOTW system, what with a bunch of
new/untested code. Then I focused my thoughts on this module, and resolved to figure out how
to allow for external fs modules (e.g. sys/inet_fs.js) to mount their roots somewhere on
the main root (@JSHFMOK), and register whatever callbacks they needed to allow for basic functions
like populate_dirobj (@PHDEYHJ).

I want to "kick off" everything with a command to mount a new filesystem type.
The following command will mount the "users" tree onto "/" (e.g. /users), and will be of
type "users".

$ users up

I just created a file in coms/net/fs.js, so we can have a suite of tools to enable testing, 
debugging, and eventually real-world use cases..

»*/
/*5/24/25: THERE WAS AN ISSUE WITH NOT HAVING "." on certain DirNode's kids,«
at the top-level, so we had to add them in at the dir mounting points during
fs init. This bug screwed up the folder app.

We are not able to do any file moving operations to/from SHM_FS_TYPE
First: intra-SHM_FS_TYPE mv operations are trivial for both files and folders
Next:  "   "    "   " cp operations are trivial for files
Then we need to figure out about mv'ing and cp'ing to/from OP_FS_TYPE.
cp is trivial for files
»*/
/*9/8/2024: Made /dev/shm to allow for arbitrary in-memory files and folders. Files under here«
will use a new SHM_FS_TYPE, which tells the system not to mess with databasing (which
means that the entire directory is "forgotten" after each page reload). This makes
it more temporary than /tmp. The file/folder creation and removal operations seem to be working,
but there is no ability to mv or cp.
»*/
/*9/7/2024: Just created a "data" fs type, which expects an object minimally like this:«

{type: "whatever"}

There SHOULD be a "data" (or "value") field as well, though this is not
currently checked. This uses the IDB_DATA_TYPE in the FSNode database's
type field. It works via writeDataFile in the fs api (here). Upon FSNode
creation, the data field is created with the given object. 

In SAVEFSBYPATH, there are 2 possibilities:
1) Upon creation, we pass the data into touchFile (via the 'opts' object)
2) If updating, we call db.setNodeData (which hasn't been tested yet)

The reason for this is to reduce the overhead when dealing with arbitrary data
that is meant to be created/accessed only via internal programmatic methods.

To create:
fsapi.writeDataFile(fullpath, {value: 1, type: "number"})

To update:
node.setValue({type: "whatever", something: "new"});

We are giving a console warning if the type fields do not match upon updating.

»*/

//»

//Imports«

const NS = LOTW;
const util = LOTW.api.util;
const globals = LOTW.globals;

const {
	log,
	cwarn,
	cerr,
	strNum,
	isDef,
	isArr,
	isObj,
	isNum,
	isInt,
	isStr,
	isBool,
	isFunc,
	isEOF,
	isErr,
	getNameExt,
	getFullPath,
	normPath,
	toBlob
} = util;

//const sleep=()=>{return new Promise((Y,N)=>{});}
const {

	LINK_APP,
	FOLDER_APP,
	TEXT_EXTENSIONS,
	ALL_EXTENSIONS_RE

} = globals.app;
const {

	FS_PREF,
	FS_DB_NAME,

// File system "mount" types
	OP_FS_TYPE,
	SHM_FS_TYPE,
	SITE_FS_TYPE,
	DEV_FS_TYPE,
	MNT_FS_TYPE,

	FBASE_USER_GRP_FS_TYPE,

//	FBASE_RTDB_FS_TYPE,

    LOCAL_MNT_FS_TYPES,
    ALWAYS_DONE_DIR_FS_TYPES,
    PERSISTENT_BACKEND_FS_TYPES,
	RM_OK_FS_TYPES,
// File system "node" types

	FILE_NODE_TYPE,
	DIR_NODE_TYPE,
	LINK_NODE_TYPE,
	BAD_LINK_NODE_TYPE,
	NULL_BLOB_NODE_TYPE,

	APPDATA_PATH,

} = globals.fs;


/*
These file systems are always guaranteed to *not* depend on working
internet access in order to succeed.
*/
/*
const LOCAL_MNT_FS_TYPES = [ 
	OP_FS_TYPE, SITE_FS_TYPE, DEV_FS_TYPE, SHM_FS_TYPE, MNT_FS_TYPE 
];

const ALWAYS_DONE_DIR_TYPES = [SHM_FS_TYPE];

const PERSISTENT_BACKEND_FS_TYPES = [ OP_FS_TYPE ];
*/

const {
//	qObj
	test_icons,
	mnt_fbase,
} = globals.qObj;

//»

//Var«

/*

This stuff *might* go into the main config file, but seeing that it is
so "inside baseball" (i.e. no other modules could need this information),
then it might as well stay in here.

*/

const NODES_TABLE_NAME = "Nodes";
const FS_BRANCH_PATH = `0/${FS_PREF}`;
const DEF_NODE_ID = 1;
const DBSIZE = 10*1024*1024;
const FIRST_BLOB_ID = 100;

//»

//FS «

//new FS(){«
globals.fsMod = new function() {
//»

class FsDB {//«
#db;

initDB(){//«
	return new Promise((Y,N)=>{
		let req = indexedDB.open(FS_DB_NAME, 1);
		req.onerror=e=>{
cerr(e);
			Y();
		};
		req.onsuccess=e=>{
			this.#db = e.target.result;
			Y(true);
		};
		req.onblocked=e=>{
cerr(e);
			Y();
		};
		req.onupgradeneeded=(e)=>{
			let store = e.target.result.createObjectStore(NODES_TABLE_NAME, {autoIncrement: true});
			store.createIndex("parId", "parId", {unique: false});
			store.createIndex("value", "value", {unique: false});
			store.createIndex("path", "path", {unique: true});
		}
	});
};//»
getStore(if_write){//«
	return this.#db.transaction([NODES_TABLE_NAME],if_write?"readwrite":"readonly").objectStore(NODES_TABLE_NAME);
}//»
getByPath(path, if_key_only){//«
	return new Promise((Y,N)=>{
		let ind = this.getStore().index("path");
		let req;
		if (if_key_only) req = ind.getKey(path);
		else req = ind.get(path);
		req.onerror=(e)=>{
			cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(e.target.result);
		};
	});
}//»
_getById(id){//«
	return new Promise((Y,N)=>{
		let req 
		try {
			req = this.getStore().get(id);
		}
		catch(e){
cerr(e);
cwarn(`DIAGNOSING store.get(id): store.get(${id})`);
			Y();
			return;
		}
		req.onerror=(e)=>{
			cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(e.target.result);
		};
	});
}//»
putById(id, node){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(true).put(node, id);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
}//»
delById(id){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(true).delete(id);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
}//»
getDirKids(which, dirid){//«
return new Promise((Y,N)=>{

	const doit=()=>{//«
		if (nodes==false||ids==false) return Y();
		if (nodes.length !== ids.length){
cerr(`nodes.length(${nodes.length}) !== ids.length(${ids.length})`);
log("NODES",nodes);
log("IDS",ids);
			return Y();
		}
		let out = [];
		for (let i=0; i < ids.length; i++){
			let n = nodes[i];
			let arr = n.path.split("/");
			out.push({id: ids[i], name: arr[1], parId: n.parId, type: n.type, value: n.value || n.type});
		}
		Y(out);
	};//»

	let ind = this.getStore().index(which);
	let nodes, ids;
	let req1 = ind.getAll(dirid);
	req1.onerror=e=>{
cerr(e);
		nodes = false;
		if (ids || ids===false) doit();
	};
	req1.onsuccess=e=>{
		nodes = e.target.result;
		if (ids || ids===false) doit();
	};

	let req2 = ind.getAllKeys(dirid);
	req2.onerror=e=>{
cerr(e);
		ids = false;
		if (nodes || nodes===false) doit();
	};
	req2.onsuccess=e=>{
		ids = e.target.result;
		if (nodes || nodes===false) doit();
	};

});
}//»
checkIsEmpty(which, dirid) {//«
	return new Promise((Y, N) => {
		// Request only the very first key
		let req = this.getStore().index(which).getKey(dirid); 
		req.onsuccess = () => { Y(req.result === undefined); };
		req.onerror = () => {
			cerr(req.error);
			Y();
		}
	});
}
//»
addNode(node){//«
	return new Promise((Y,N)=>{
		let store= this.#db.transaction([NODES_TABLE_NAME],"readwrite").objectStore(NODES_TABLE_NAME);
		let req=store.add(node);
		req.onerror=(e)=>{cerr(e);Y();};
		req.onsuccess = e => {Y(true);};
	});
}//»
async init(root, branch_name){//«
	if (this.#db) {
cwarn("WHO CALLED FsDB.INIT?");
		return;
	}
	if (!await this.initDB()) {
throw new Error("initDB() failed!");
	}
	let path = `0/${branch_name}`;
	let rootid = await this.getByPath(path, true);
	if (!rootid) {
		if (!await this.addNode({parId: 0, path, type: DIR_NODE_TYPE})){
throw new Error("Could not add the root node!");
			return;
		}
		rootid = await this.getByPath(path, true);
		if (!rootid){
throw new Error(`WUT NO ROOTID RETURNED AFTER ADDING ROOT NODE (${path}) ?!?!?`);
		}
	}
	_set_root_id(rootid);
	return true;
}//»

async createNode(name, type, parId, value){//«
//log(`createNode: ${name} ${type} ${parId}`);
//if (type===DIR_NODE_TYPE||type===NULL_BLOB_NODE_TYPE||type==LINK_NODE_TYPE||(type===FILE_NODE_TYPE && Number.isFinite(value))||type==IDB_DATA_TYPE) {
if (type===DIR_NODE_TYPE||type===NULL_BLOB_NODE_TYPE||type==LINK_NODE_TYPE||(type===FILE_NODE_TYPE && Number.isFinite(value))) {
	let path = `${parId}/${name}`;
	let node = {parId, path, type: type};
	if (value) node.value = value;
//log(node);
	let rv = await this.addNode(node);
	if (!rv){
cwarn("NO RV!");
	}
	else{
		rv = await this.getByPath(path, true);
		if (rv) return rv;
	}
cerr("TEOINMTV");
}

else{
cwarn("createNode: ADD TYPE", type);
}

}//»
async getAll (dirid){//«
	let rv = await this.getDirKids("parId", dirid);
	return {rows: rv||[]};
}//»
checkEmpty(dirid){ return this.checkIsEmpty("parId", dirid); }
async getNodesByBlobId(blobid){//«
	let rv = await this.getDirKids("value", blobid);
	return {rows: rv||[]};
}//»
async getNodeByNameAndParId (name, parid){//«
	let path = `${parid}/${name}`;
	let node = await this.getByPath(path);
	if (!node) return {rows:[]};
	let id = await this.getByPath(path, true);
	if (!id){
cerr(`Could not getByPath(${path},true)`);
	}
	else return {rows:[{id, value: node.type, data: node.value}]}
}//»

async setNodeBlobID(nodeid, blobid){//«
	let node = await this._getById(nodeid);
	if (!node) return;
	node.type=FILE_NODE_TYPE;
	node.value=blobid;
	if (!await this.putById(nodeid, node)) return;
	return true;
}//»
async setNodeData(nodeid, data){//«
	let node = await this._getById(nodeid);
	if (!node) return;
	node.value=data;
	if (!await this.putById(nodeid, node)) return;
	return true;
}//»

async moveNode(id, fromId, toId, newName){//«
//cwarn(`moveNode: ${id}`);
	let node = await this._getById(id);
	let parr = node.path.split("/");
	if (fromId !== toId) {
		node.parId = toId;
	}
	let usename = newName || parr[1];
	node.path=`${toId}/${usename}`;
	if (!await this.putById(id, node)) return;
	return true;
}//»
getById(id){return this._getById(id);}

async removeNode(id, parId){//«

if (!await this.delById(id)) return;

return true;

}//»

dropDatabase(){//«
//throw new Error("Comment me out to use dropDatabase()!");
	return new Promise((Y,N)=>{
		this.#db.close();
		const req = window.indexedDB.deleteDatabase(FS_DB_NAME);
		req.onerror = (event) => {
cerr("Error deleting database.");
			Y();
		};
		req.onblocked = (e)=>{
cwarn("BLOCKED");
			Y();
		};
		req.onsuccess = (event) => {
			Y(true);
		};
	});
}//»

}//»

//FS/File/Dir/Link Node classes«

const LOCKED_BLOBS = {};

// File-private setter methods «

// These allow as to set private FSNode members with "external" calls
// The functions are defined inside of static blocks

let _node_update;
let _dir_update;

let _add_root_kid;

// indexedDB row id's
let _set_root_id;

// Read from: localStorage['nextBlobId']
// Used for the names of the files in OPFS://blobs/

// For file on /dev/shm
let _set_mem_blob; 

let _set_sym_link;

let _set_data;

//»

class RootDirNode {//«
#id;
#kids;
#appName;
//#done;
constructor(){//«
	this.isDir = true;
	this.#appName = FOLDER_APP;
	this.#kids = {};
//	this.#done = true;
}//»
loadKids(){}
get id(){return this.#id;}
get appName(){return this.#appName}
//get root(){return true;}
get isRoot(){return true;}
get haveKids(){return true;}
//get root(){return this;}
get mntPar(){return this;}
get fullpath(){return "/";}
get path(){return "/";}
get type(){return "root";}
get name(){return "/";}
get baseName(){return "/";}
set name(arg){}
get sys(){return true;}
get done(){return true;}
rmMoveLock(){}
get list(){return this.#kids;}
get kids(){throw new Error("YOU TRIED TO ACCESS KIDS");}
set kids(arg){throw new Error("YOU TRIED TO SET KIDS");}
getKid(name){return this.#kids[name];}
get nameList() {return Object.keys(this.#kids);}
get kidList(){return Object.values(this.#kids);}
get length() {return Object.keys(this.#kids).length;}
//get par(){return this;}
get list(){
	let rv = [];
	let kids = this.#kids;
	for (let k in kids){
		rv.push(kids[k]);
	}
	return rv;
}

static {

_add_root_kid = (kid) => {//«
if (root.#kids[kid.name]){
return;
}
root.#kids[kid.name] = kid;
}//»

_set_root_id = (id) =>{root.#id = id;};

}

}//»

//FSNODEDEF

class FSNode {//«

//Private «
//NDITPLOI
#data;
#blobId;
#id;
#par;
#name;
#delNode;
#size;
//»
constructor(name, par, opts={}){//«
if (!isStr(name)){
log(name);
return THROW("WHAT IS THIS NAME????");
}
	this.#name = name;
	this.#par = par;
	this._type = opts.type;

// SRKTOYKHM
	this.icons = []; // <--- USE THIS FOR QUICK RM/DEL NODE OPS!!!

	this.#data = opts.data;

	this._getBlob = opts.getBlob;
	this._setBlob = opts.setBlob;

// TEIDJKSDM
	this._mkNewFile = opts.mkNewFile;
	this._mkDir = opts.mkDir;

	this._backendDelNode = opts.backendDelNode;
//	this.#delNode = opts.delNode || del_node;

}//»
mkIcons(){if (NS.Desk) NS.Desk.make_all_icons(this);}
delIcons(keepIcn){//«
	if (keepIcn) {
		for (let icn of this.icons) {
			if (icn !== keepIcn) icn.del();
else {
//cwarn("KEEP", icn);
}
		}
		this.icons = [keepIcn];
	}
	else {
		for (let icn of this.icons) icn.del();
		this.icons = [];
	}
}//»
async del(opts={}){//«
	if (!await del_node(this)) return false;
	_dir_update(2, this.par, this);
	return true;
}//»
canRm(opts={}){//«
	let rtype = this.type;
	let path = this.fullpath;
	if (this.appName !== FOLDER_APP) {//«
//		if (!(rtype==OP_FS_TYPE||rtype==SHM_FS_TYPE)){
		if (!RM_OK_FS_TYPES.includes(rtype)){
			return `${this.name}: not (currently) handling fs type: '${rtype}'`;
		}
		if (!this.par.perm) return `${path}: permission denied`;
		else if (this.isWriteLocked) return `${path} is "write locked"`;
		return true;
	}//»

// Folders...
	if (!(rtype==OP_FS_TYPE||rtype==SHM_FS_TYPE)) return `not removing directory type: '${rtype}': ${path}`;
	if (NS.Desk && (path == globals.user.desk_path)) return `not removing the working desktop path: ${path}`;
	if (this.par.isRoot) return `not removing toplevel directory: ${path}`;
	if (this.isMoveLocked) return `${path}: is "move locked"`;
	if (!opts.doFullDirs && !opts.isEmpty) return `${path}: not an empty folder`;
	if (!this.perm) return `${path}: permission denied`;
	return true;
//};



}//»
getData(key){if (!this.#data) return; return this.#data[key];}

getBlob(){//«
	if (this._getBlob) return this._getBlob(this);
	if (this.mntPar._getBlob) return this.mntPar._getBlob(this);
	return get_local_blob(this)
}//»
setBlob(val, opts){//«
	if (this._setBlob) {
//cwarn(`Got this._setBlob`);
		return this._setBlob(this, val, opts);
	}
	if (this.mntPar._setBlob) {
//cwarn(`Got this.mntPar._setBlob`);
		return this.mntPar._setBlob(this, val, opts);
	}
//cwarn(`Default: set_local_blob`);
	return set_local_blob(this, val, opts)
}//»
mkDir(name, opts={}){//«
if (name.match(/\x2f/)){
cerr(`INVALID NAME IN MKDIR: ${name} (SLASH DETECTED)`);
return;
}
//cwarn("MAKE SURE THIS IS THE RIGHT THING IN FSNode.mkDir (patterned off getBlob/setBlob) !!!!!");
	if (this._mkDir) return this._mkDir(this, name, opts);
	if (this.mntPar._mkDir) return this.mntPar._mkDir(this, name, opts);
	return mkDir(this, name, opts)
//	this.#mkDir = (name, opts={})=>{return mkDir(this, name, opts);};

}//»
mkNewFile(name, opts={}){//«
if (name.match(/\x2f/)){
cerr(`INVALID NAME IN MKNEWFILE: ${name} (SLASH DETECTED)`);
return;
}
//cwarn("PUT THE RIGHT THING IN FSNode.mkNewFile  (patterned off getBlob/setBlob) !!!!!");

	if (this._mkNewFile) {
log("Got: this._mkNewFile");
		return this._mkNewFile(this, name, opts);
	}
	if (this.mntPar._mkNewFile) {
log("Got: mntPar._mkNewFile");
		return this.mntPar._mkNewFile(this, name, opts);
	}
log("Got: default: touchFile");
	return touchFile(this, name, opts)

}//»
backendDelNode(){//«
//cwarn("PUT THE RIGHT THING IN FSNode.mkNewFile  (patterned off getBlob/setBlob) !!!!!");
// This is called *inside* of del_node...
	if (this.type === SHM_FS_TYPE) {
// /dev/shm (Shared memory) has no backend, so this is a no-op
		return true;
	}
	if (this.type === OP_FS_TYPE) return db.removeNode(this.id, this.par.id); 

	if (this._backendDelNode) {
log("Got: this._backendDelNode");
		return this._backendDelNode(this);
	}
	if (this.mntPar._backendDelNode) {
log("Got: mntPar._backendDelNode");
		return this.mntPar._backendDelNode(this);
	}
THROW("CALLED backendDelNode WITHOUT this._backendDelNode or mntPar._backendDelNode!?!?!");

// So calling del_node here might lead to infinite loops.


}//»
//Getters: name|par|ext|id|blobId|fullpath|...«
get fullpath(){//«
	let str = this.name;
	let curobj = this;
	while (true) {
		if (curobj && curobj.par) str = `${curobj.par.name}/${str}`;
		else break;
		curobj = curobj.par;
	}
	let arr = str.split("/");
	while (!arr[0] && arr.length) arr.shift();
	str = arr.join("/");
	return `/${str}`.regpath();
}//»
get size(){return this.#size;}
get par(){return this.#par;}
get type(){//«
	let cur = this;
	while (cur.isRoot !== true) {
		let t = cur._type;
		if (isStr(t)) return t;
		cur = cur.par;
	}
	return "root";
}//»
get mntPar(){//«
	let cur = this;
	while (cur.isRoot !== true) {
		let t = cur._type;
		if (isStr(t)) return cur;
		cur = cur.par;
	}
	return root;
}//»
get name(){	return this.#name;}
get ext(){ return null; }
get id(){	return this.#id;}
get baseName(){	return this.#name;}
get path(){	return this.par.fullpath;}
get isWriteLocked(){return false;}
get blobId(){return this.#blobId;}
get isFile(){return false;}
get isDir(){return false;}
get isLink(){return false;}
//»

static {//«
_node_update = (which, node, val) => {
switch(which){
case 1: { node.#name = val; break }
case 2: { node.#par = val; break }
case 3: { node.#id = val; break }
case 4: { node.#blobId = val; break }
case 5: { node.#size = val; break }
default: THROW(`WHAT WHICH IS THIS: ${which}`);
}
}
}//»

}//»

class FileNode extends FSNode {//«

//SKMTNHGM
// Private «
#lock;
#entry;
#memBlob;
//»
constructor(name, par, opts={}) {//«
	super(name, par, opts);
	this.#lock = {};
}//»
get isWriteLocked(){return LOCKED_BLOBS[`${OP_FS_TYPE}-${this.blobId}`];}
async getRealBlobId(){//«
	let bid = get_blob_id();
	_node_update(4, this, bid);
	if (!await db.setNodeBlobID(this.id, bid)) {
cerr(`(id=${this.id}): Could not set the new node value (blobId=${bid})`);
		return;
	}
	return true;
}//»
async getValue(opts={}){//«
	let getter = this.getBlob;
	return getter(this, opts);
}//»
async setValue(val, opts={}){//«
	let blob = toBlob(val);
	if (!blob){
cerr("Unknown value", val);
		return;
	}
	return this.setBlob(blob, opts);
}//»
write(val, opts){return this.setValue(val, opts);}
unlockFile(){//«
	delete LOCKED_BLOBS[`${OP_FS_TYPE}-${this.blobId}`];
	let par = this.par;
	while (par){
		if (!par.perm) break;
		par.rmMoveLock(this.#lock);
		par = par.par;
	}
}//»
async lockFile(){//«
	if (this.blobId === NULL_BLOB_NODE_TYPE){
		await this.getRealBlobId();
	}
	LOCKED_BLOBS[`${OP_FS_TYPE}-${this.blobId}`] = true;
	let par = this.par;
	while (par){
		if (!par.perm) break;
		par.addMoveLock(this.#lock);
		par = par.par;
	}
}//»
async _getEntry(){//«
	if (this.#entry) return this.#entry;
	let id = this.blobId;
	if (id === NULL_BLOB_NODE_TYPE){
		id = get_blob_id();
		_node_update(4, this, id);
	}
	else if (this.type==SHM_FS_TYPE) return;
	else if (!Number.isFinite(id)) {
cerr(`The node does not have a valid blobId: ${id}`);
log(this);
		return;
	}
	let ent = await get_blob_entry(id);
	this.#entry = ent;
	return ent;
}//»

get writeable(){ return this.par.writeable; }
get isFile(){return true;}
get entry(){return this._getEntry();}
get useMemBlob(){return this.type === SHM_FS_TYPE;}
get memBlob(){//«
	if (this.#memBlob) return this.#memBlob;

if (!this.useMemBlob) {
cerr(`WHY ACCESS node.memBlob IF !node.useMemBlob?!?!`);
}
	return new Blob([]);

}//»

get buffer(){//«
	if (this.useMemBlob) return this.memBlob.buffer;
	return(async()=>{
		let getter = this.getBlob;
		let blob = await getter(this);
		return blob_to_ret_val(blob, {buffer: true});
	})();
}//»
get bytes(){//«
	if (this.useMemBlob) return util.toBytes(this.memBlob);
	return(async()=>{
		let blob = await this.getBlob();
		return blob_to_ret_val(blob, {bytes: true});
	})();
}//»
get text(){//«
	if (this.useMemBlob) return util.toStr(this.memBlob);
	return(async()=>{
		let blob = await this.getBlob();
		return blob_to_ret_val(blob, {text: true});
	})();
}//»

get json(){//«
	return (async ()=>{
		let txt = await this.text;
		if (!isStr(txt)) return;
		if (!txt) return;
		let rv;
		try{
			rv = JSON.parse(txt);
		}
		catch(e){
cwarn(`CAUGHT: ${this.fullpath}`);
cerr(e);
return;
		}
		return rv;
	})();
}//»
get blob(){//«
	if (this.useMemBlob) return this.memBlob;
	return this.getBlob();
}//»
get file(){//«
	if (this.useMemBlob) return this.memBlob;
	return this.getBlob();
}//»

get baseName(){//«
	let arr = getNameExt(this.name);
	if (arr[1]) return arr[0];
	return this.name;
}//»
get ext(){//«
	return getNameExt(this.name)[1] || null;
//	return getNameExt(this.name)[1] || ""; // This would imply that there *is* and extension
}//»
get appName(){//«
	let arr = getNameExt(this.name);
	if (arr[1]) return util.extToApp(arr[1]);
	return "";
}//»

static {//«

_set_mem_blob = (node, blob)=>{
	node.#memBlob = blob;
}

}//»

}//»
class DirNode extends FSNode {//«
//JDPEIO
// Private «
#kids;
#sys;
#perm;
#readOnly;
#appName;
#moveLocks;
#loadKids;
#tryLoadKid;
#done;
//#getBlob;
//#setBlob;
//»
constructor(name, par, opts = {}) {//«

	super(name, par, opts);
	this.#appName = FOLDER_APP;
	if (isBool(opts.perm) || isStr(opts.perm)) this.#perm = opts.perm;
	this.#readOnly = opts.readOnly;
	this.#sys = opts.sys;

	this.#loadKids = opts.loadKids || populate_dirobj;
	this.#tryLoadKid = opts.tryLoadKid || try_get_fs_kid;

	if (ALWAYS_DONE_DIR_FS_TYPES.includes(par.type)){
		this.#done = true;
	}

	this.#kids = {};
	this.#moveLocks = [];

}//»
tryLoadKid(nm){ return this.#tryLoadKid(this, nm); }
rmMoveLock(lockarg){//«
	let locks = this.#moveLocks;
	for (let i=0; i < locks.length; i++){
		if (locks[i]===lockarg){
			locks.splice(i, 1);
			break;
		}
	}
}//»
addMoveLock(lockarg){this.#moveLocks.push(lockarg);}
async loadKids(opts={}) {//«
	if (this.done && !opts.force) return;
	await this.#loadKids(this, opts);
}//»
async _getKids(opts={}) {//«
//	if (!this.#done) await populate_dirobj(this, opts);
	if (!this.#done) await this.#loadKids(this, opts);
	return Object.values(this.#kids);
}//»
get isDir(){return true;}
get nameList() {return Object.keys(this.#kids);}
get kidList(){return Object.values(this.#kids);}
get length() {return Object.keys(this.#kids).length;}
get appName(){return this.#appName;}
get haveKids(){return Object.keys(this.#kids).length > 0;}
get list(){return this._getKids();}
get sys(){return this.#sys;}
get isMoveLocked(){return this.#moveLocks.length > 0;}
get perm(){//«
	let p = this.#perm;
	if (isBool(p)) return p;
	if (isStr(p)) return (globals.user.CURRENT_USER === p);
	let cur = this.par;
	while (cur.isRoot !== true) {
		p = cur.perm;
		if (isBool(p)) return p;
		cur = cur.par;
	}
	return false;
}//»
get writeable(){//«
	if (this.type === SITE_FS_TYPE) return false;
	return true;
}//»
get readonly(){return this.#readOnly;}
get readOnly(){return this.#readOnly;}
get kidsCopy(){//«
cwarn("YOU CALLED kidsCopy, BUT THAT IS A ***HACK***!!!");
	let o = {};
	let kids = this.#kids;
	for (let nm in kids) o[nm] = kids[nm];
	return o;
}//»
get kids(){throw new Error("YOU TRIED TO GET KIDS");}
set kids(arg){throw new Error("YOU TRIED TO SET KIDS");}
get isEmpty(){ return db.checkEmpty(this.id); }
getKid(name){return this.#kids[name];}
mkHardLink(name, blobid){return make_hard_link(this, name, blobid);}
mkSymLink(name, target, fullpath){return make_sym_link(this, name, target, fullpath);}
get done(){return this.#done;}
static {
//HISLKFNF

_dir_update = (which, dir, val) => {//«

switch (which){
	case 1: {// add
		if (!dir.#kids[val.name]) {
			dir.#kids[val.name] = val;
// RNFHTOYL
// The fundamental "choke point" for all icon addition
// val.mkIcons();
		}
		break;
	}
	case 2: {// del
		if (!dir.#kids[val.name]){
cerr(`'${dir.fullpath}/${val.name}': DOES NOT EXIST`);
			return;
		}
		delete dir.#kids[val.name];
// DPLRJTBBM
// The fundamental "choke point" for all icon deletion
// val.rmIcons();
		break;
	}	
	case 3: { // done
		dir.#done = val;
		break;
	}
	default: THROW(`UNKNOWN OP ${which}`);
}

};//»

}

}//»
class LinkNode extends FSNode {//«

#symLink;
#appName;
constructor(name, par, opts={}){//«
	super(name, par, opts);
	this.#appName = LINK_APP;
//	this.isLink = true;
}//»
get link(){//«
	let symlink = this.#symLink;
	if (symlink.match(/^\x2f/)) return symlink;
	return `${this.path}/${symlink}`;
}//»
get linkedNode(){return path_to_node(this.link);}
get isLink(){return true;}
get ref(){return path_to_node(this.link);}
get appName(){return this.#appName;};
get symLink(){return this.#symLink;}
get writeable(){return this.par.writeable;}
static{
_set_sym_link = (node, val) => {node.#symLink = val;};
}

}//»

// This gets passed into the constructors of alterative file systems types
const export_obj = { DirNode, FileNode, nodeUpdate: _node_update, dirUpdate: _dir_update };

//TWKMJORH
//is(Node|Dir|File)«
const isNode=n=>{return (n instanceof FileNode || n instanceof DirNode || n instanceof LinkNode);};
util.isNode = isNode;
const isDir=n=>{return (n instanceof DirNode || n instanceof RootDirNode);};
util.isDir = isDir;
const isFile=n=>{return (n instanceof FileNode);};
util.isFile = isFile;
//»

//»

//Var«

let rootId;

const root = new RootDirNode();
globals.root = root;
this.root = root;
const db = new FsDB();

let VERNUM=1;

let BLOB_DIR;
const MB = 1024*1024;
const MAX_LOCAL_FILE_SIZE = MB;

//EYTKSHRJT
let MAX_REMOTE_SIZE = 1 * MB;
let MAX_FILE_SIZE = 256*MB;

//const root_dirs = ["tmp", "usr", "home", "etc", "var"];
const root_dirs = ["tmp", "home", "var"];

const MAX_DAYS = 90;//Used to determine how to format the date string for file listings
const MAX_LINK_ITERS = 8;

//const sleep = ()=>{return new Promise((Y,N)=>{});};
const NOOP=()=>{};
const THROW = mess =>{throw new Error(mess);}

//»

// Filesystem ops «


const do_move = async(src_node, dest_name, dest_par)=>{//«
	if (util.newPathIsBad(src_node.fullpath, `${dest_par.fullpath}/${dest_name}`)) return;
//Need to update this to allow for moving/renaming arbitrary node types 
//within the same directory type
	let src_id = src_node.id;
	let src_blob_id = src_node.blobId;
//log(`MOVE src_id: ${src_id}`);
if (!src_id){
//MXFBNRHOL
cerr("NO ID IN THE src_node");
log(src_node);
return;
}
	let src_par = src_node.par;
	let src_par_id = src_par.id;
	let dest_par_id = dest_par.id;
	let use_dest_name;
	if (dest_name && (dest_name !== src_node.name)) use_dest_name = dest_name;
	

// This logic is supposed to result in the fact that save_blob === null means
// that we are mv'ing a dir.

	let save_blob = null;

// OIKFBJKB: NEEDS TO BE FULLY GENERIC

/*«
if (src_node.type === dest_par.type && src_node.canDoSimpleMove) {
// Just need the id of the new parent dir, and the new node name
	await src_node.simpleMove(dest_par_id, use_dest_name);
}
else {
//Get blob if isFile and do remove
}
»*/
	if (src_node.type == OP_FS_TYPE) {
		if (dest_par.type == OP_FS_TYPE) {
			if (!await db.moveNode(src_id, src_par_id, dest_par_id, use_dest_name)) {
cerr("db.moveNode: WHYFBSJ!?!?!");
				return 
			}
		}
		else {
			if (src_node.isFile) save_blob = await src_node.blob;
			if (!await db.removeNode(src_id, src_par_id)) {
cerr("db.removeNo: YUREFJKK!?!?!");
				return;
			}
		}
	}
//	else save_blob = await src_node.blob;
	else if (src_node.isFile) save_blob = await src_node.blob;

	_dir_update(2, src_par, src_node); // Delete src_node from src_par

	let dest_node;
	if (src_node.isFile) {
//	if (save_blob === null) {
		dest_node = mk_dir_kid(dest_par, dest_name, {isFile: true});
		if (save_blob) {
			await dest_node.setValue(save_blob);
		}
	}
	else {
		dest_node = mk_dir_kid(dest_par, dest_name, {isDir: true});
//		dest_node = src_node;
		_node_update(1, dest_node, dest_name); // Set: dest_node.#name
		_node_update(2, dest_node, dest_par); // Set: dest_node.#par
	}

	_dir_update(1, dest_par, dest_node); // Add dest_node to dest_par

// XRUIOPKGH
	_node_update(3, dest_node, src_id); // Set: dest_node.#id on dest_node (copy)
	_node_update(4, dest_node, src_blob_id); // Set: dest_node.#blobId on dest_node (copy)

	return dest_node;

};//»
const do_copy = async(from_node, newName, toDir) => {//«
//	let node = this;
	let newpath = `${toDir.fullpath}/${newName}`;
	if (util.newPathIsBad(from_node.fullpath, newpath)) return;
//EYTKFHSC
	let save_blob = await from_node.blob;
	let to_node = await toDir.mkNewFile(newName, {noMakeIcon: true});
	if (!to_node) return;
	await to_node.setValue(save_blob);
	_dir_update(1, toDir, to_node);
	return to_node;
};//»

const getNodesByBlobId = async (blobId) =>{//«
	let rv = await db.getNodesByBlobId(blobId);
	return rv.rows;
};//»

const try_get_fs_kid=async(curpar, nm)=>{//«
	if (curpar.type !== OP_FS_TYPE){
cwarn(`IN try_get_fs_kid, got TYPE==${curpar.type}!`);
		await curpar.loadKids();
		return curpar.getKid(nm);
	}
	let rv = await db.getNodeByNameAndParId(nm, curpar.id);
	let gotrow = rv.rows[0];
	if (!gotrow) return;
	let isDir, isLink, isFile;
	switch(gotrow.value){
		case DIR_NODE_TYPE:
			isDir = true;
			break
		case LINK_NODE_TYPE:
			isLink = true;
			break;
		default:
			isFile = true;
	}
	let kid = mk_dir_kid(curpar, nm,{
		isDir,
		isLink,
		isFile,
		path: curpar.fullpath,
	});
	if (isLink) {
		_set_sym_link(kid, gotrow.data);
	}
//	else if (isData){
//		_node_update(4, kid, IDB_DATA_TYPE);
//		_set_data(kid, gotrow.data);
//	}
	else if (!isDir){
		_node_update(4, kid, gotrow.data);
	}
	_node_update(3, kid, gotrow.id);
	return kid;
};//»

const path_to_node = async(patharg, if_get_link, iter = 0) =>{//«
	const maybe_done = async() => {//«
		if (node && node.isLink && !if_get_link) {
			if (iter > MAX_LINK_ITERS) return null;
			return path_to_node(node.link, false, ++iter);
		}
		else return node;
	};//»
	if (!patharg) return root;
	let node;
	let path = normPath(patharg);
	if (path==="/") return root;
	let parts = path.split("/");
	parts.shift();
	let curpar = root.getKid(parts.shift());
	if (!curpar) return null;
	if (!parts.length) return curpar;
	let fname = parts.pop();
	while(parts.length){//«
		let nm = parts.shift();
		let gotkid = curpar.getKid(nm);
		if (gotkid) curpar = gotkid;
		else {//«
			if (!curpar.done) {
				let kid = await curpar.tryLoadKid(nm); //SHMYILYHG
				if (!kid) {
					kid = curpar.getKid(nm);
					if (!kid) return null;
				}
				_dir_update(1, curpar, kid);
				curpar = kid;
			}
			else curpar = curpar.getKid(nm);
			if (!curpar) return null;
			if (!parts.length) break;
		}//»
		if (curpar.isLink){//«
			if (iter > MAX_LINK_ITERS) return null;
			let gotdir = await curpar.linkedNode;
			if (!(gotdir&&gotdir.isDir)) return null;
			curpar = gotdir;
		}//»
	}//»
	if (curpar.isLink && !if_get_link) {
		let parref = await curpar.linkedNode;
		if (parref && parref.haveKids) curpar = parref;
	}
	if (!curpar.isDir) return maybe_done();
	node = curpar.getKid(fname);
	if (node||curpar.done) return maybe_done();
	node = await curpar.tryLoadKid(fname);//BSGDUGTJK
	if (!node) {
		node = curpar.getKid(fname);
	}
//log(`222 ${curpar.fullpath}  ${fname}: ${!!node}`);
	if (!node) return null;
	_dir_update(1, curpar, node);
	return maybe_done();
};//»

const getPathByDirId=async(idarg)=>{//«
	let id = idarg;
	let path = [];
	while (id) {
		let par = await db.getById(id);
		if (!par) return;
		path.unshift(par.path.split("/")[1]);
		id = par.parId;
	}
	path.shift();
	return "/"+path.join("/");
};//»

const doFsRm = async(args, opts={})=>{//«
//const doFsRm = async(args, errcb, opts={})=>{

	let { done_cb, no_rm_cb, dirsOnly, cwd } = opts;
	let arr = [];
	let no_error = true;
	if (!no_rm_cb){
		no_rm_cb = mess =>{
			cerr(mess);
		};
	}
	for (let path of args){
		let node = await path.toNode({cwd});
		if (!node) {
			no_rm_cb(`could not stat: ${path}`);
			continue;
		}

//OLNDTKJG
// How about node.checkAnyKids (instead of waiting to load *all* kids) ?
		let is_empty;
		if (node.isDir) {
			if (!node.done) is_empty = await node.isEmpty;
			else is_empty = !node.haveKids;
		}
		let rv = node.canRm({isEmpty: is_empty, doFullDirs: opts.doFullDirs });
		if (rv !== true) {//«
			if (isStr(rv)){
				no_rm_cb(rv);
				no_error = false;
				continue;
			}
cwarn("WHAT IS THIS VALUE?");
log(rv);
			THROW("UNKNOWN RV FROM node.canRm!?!?!");
			return;
		}//»
		if (dirsOnly && !node.isDir){
			no_rm_cb(`${node.fullpath}: not a directory`);
			no_error = false;
			continue;
		}
		arr.push(node);
	}
	for (let node of arr) {
// OJNDMFJGH
		if (await del_node(node)) {
			_dir_update(2, node.par, node);// Remove the child
			done_cb(node);
		}
		else {
			no_error = false;
		}
	}
	return no_error;
};//»

const del_node = async (node) => {//«
	if (node.isDir){//«
		await node.loadKids();
		let kids = node.kidList;
		let not_deleted = 0;
		for (let kid of kids){
cwarn(`Recursive delete: ${kid.fullpath}`);
			if (!await kid.del(opts)) not_deleted++;
		}
		if (not_deleted){
cerr(`Could not delete ${not_deleted} kids in the directory: ${node.fullpath}`);
log(node);
			return false;
		}
	}//»
	return node.backendDelNode();
/*«
// EHRJTKML
	switch (node.type){//«
		case OP_FS_TYPE: return db.removeNode(node.id, node.par.id); 
		case FBASE_USER_GRP_FS_TYPE: return node.backendDelNode();
		case SHM_FS_TYPE: return true;
		default:
cwarn(`WHAT TYPE IN del_node: ${node.type}`);
			return false;
	}//»
»*/
};//»

const clearStorage = async ()=>{//«
	let opfs = await navigator.storage.getDirectory();
	await opfs.removeEntry("blobs", { recursive: true });
	let rv = await db.dropDatabase();
	localStorage.clear();
	return true;
};//»

const comMv = async(args, opts={}) => {//«

const no_move_all = () => {//«
	if (!no_move_cb) return;
	for (let arg of args) {
//		no_move_cb(icon_obj[getFullPath(arg, cwd)]);
		no_move_cb(getFullPath(arg, cwd));
	}
}//»

// Var «

//							  BAD IDEA ---->vvvvvvvvvvv
//let { exports, if_recur, if_cp, if_force, dom_objects } = opts;
let { exports, if_recur, if_cp, if_force } = opts;
if (!exports) exports = {};

//Imports from the calling environment (shell or desktop) «

let {
	winf, // Write to info stream
	werr,
	cwd = "/",
// WURBTMYJ
	no_move_cb,
	done_cb 
} = exports;
if (!winf) winf=s=>{log("INF",s);};
if (!werr) werr = s => {log("ERR",s);};

//let icon_obj;

//if (dom_objects) icon_obj = dom_objects.icons;
//else icon_obj = {};

//»

let nargs = args.length;
let dest_arg = args.pop();
let dest_arg_fullpath = getFullPath(dest_arg, cwd);
let dest_arg_node = await path_to_node(dest_arg_fullpath);

let dest_par_path;
let dest_par_node;
let use_dest_name;

if (dest_arg_node) {//«
	if (dest_arg_node.isDir) {
		dest_par_node = dest_arg_node;
		dest_par_path = dest_par_node.fullpath;
	}
	else {
		dest_par_node = dest_arg_node.par;
		dest_par_path = dest_par_node.fullpath;
	}
}//»

else {//«
	let arr = dest_arg_fullpath.split("/");
	use_dest_name = arr.pop();
	dest_par_path = arr.join("/")
	dest_par_node = await path_to_node(dest_par_path);
	if (!dest_par_node) {
		no_move_all();
		werr(`${dest_par_path}: no such directory`);
		return;
	}
	if (!dest_par_node.writeable) {
		no_move_all();
		werr(`${dest_par_path}: read-only`);
		return;
	}
	if (!dest_par_node.perm) {
		no_move_all();
		werr(`${dest_par_path}: permission denied`);
		return;
	}
}//»


let mvarr = [];

// Use this to lock the src & dest par nodes.

const move_lock = {};

//»

// Immediate failure conditions «

if (globals.read_only) {//«
	no_move_all();
	werr("Read only");
	return 
}//»
if (nargs < 2) {//«
	no_move_all();
	werr(`invalid call to comMv: need at least 2 args, but got ${nargs}`);
	return;
}//»
if ((nargs > 2) && (!dest_arg_node || (dest_arg_node.appName != FOLDER_APP))) {//«
// We can only create the dest_arg_node with 2 total args
// With 3+ args, the final arg *must* be a folder
	no_move_all();
	werr(`target '${dest_arg}' is not a directory`);
	return;
}//»
if (dest_arg_node) {//«
	if (!dest_arg_node.writeable) {
		no_move_all();
		return werr(`${dest_arg_fullpath}: read-only`);
	}
	if (!dest_arg_node.perm) {
		no_move_all();
		return werr(`${dest_arg_fullpath}: permission denied`);
	}
}//»

//»

// Create the array of valid sources
for (let arg of args){//«

	let src_path = getFullPath(arg, cwd);//«
	if (!src_path) {
		werr( `getFullPath: returned null for: ${arg}!!!`);
		continue;
	}//»
	let src_node = await path_to_node(src_path, true);//«
	if (!src_node) {
		if (no_move_cb) no_move_cb(src_path);
		werr( `no such entry: ${src_path}`);
		continue;
	}//»

	if (!if_cp && src_node.isRoot) {//«
		if (no_move_cb) no_move_cb(src_path);
		werr( `skipping root directory`);
	}//»
	else if (!if_cp && !src_node.par.writeable) {//«
		if (no_move_cb) no_move_cb(src_path);
		werr( `${src_path}: read-only`);
	}//»
	else if (!if_cp && !src_node.par.perm) {//«
		if (no_move_cb) no_move_cb(src_path);
		werr( `${src_path}: permission denied`);
	}//»
	else if (!if_cp && src_node.isWriteLocked) {//«
//No moving of files that are actively being edited
		if (no_move_cb) no_move_cb(src_path);
		werr( `${src_path}: write-locked`);
	}//»
	else if (!if_cp && src_node.isMoveLocked){//«
//	else if (!if_cp && src_node.isDir && src_node.isMoveLocked){
//No moving of folders that contain files that are actively being edited
		if (no_move_cb) no_move_cb(src_path);
		werr( `${src_path}: move-locked`);
	}//»
	else if (if_cp && src_node.isDir){//«
		if (if_recur) {
			mvarr.push([src_path, src_node]);
		}
		else {
			if (no_move_cb) no_move_cb(src_path);
			werr( `-r not specified; omitting directory '${arg}'`);
		}
	}//»
	else if (src_node.isDir && NS.Desk && src_path == globals.user.desk_path){//«
		if (no_move_cb) no_move_cb(src_path);
		werr(`not modifying the active desktop path: ${src_path}`);
	}//»
	else mvarr.push([src_path, src_node]);

}//»

// Check for overwrites
if (dest_arg_node){//«

// When the destination is a directory, any overwrites will be its *kids*
	if (dest_arg_node.isDir) {//«
		if (!dest_arg_node.done) await dest_arg_node.loadKids();
		if (!dest_arg_node.done) {
			no_move_all();
			werr(`could not populate the destination folder: '${dest_arg_node.name}'`);
			return;
		}
		let okarr = [];
		for (let elm of mvarr){
			let name = elm[1].name;
			let gotkid = dest_arg_node.getKid(name);
			if (gotkid){
// Must NEVER overwrite a directory
				if (gotkid.isDir) {
					if (no_move_cb) no_move_cb(elm[0]);
					werr( `${dest_arg_node.fullpath}: there is already a folder named '${name}'`);
				}
				else if (!if_force){
					if (no_move_cb) no_move_cb(elm[0]);
					werr( `${dest_arg_node.fullpath}/${name}: not clobbering the destination (use -f to override)`);
				}
				else {
// Overwriting non-dirs is OK if -f is specified
					okarr.push(elm);
				}
			}
			else okarr.push(elm);
		}
		mvarr = okarr;
	}//»
	else if (!if_force){//«
		no_move_all();
		werr(`${dest_arg_fullpath}: not clobbering the destination ('-f' not specified)`);
		return;
	}//»

}//»

//MNASYRGK
dest_par_node.addMoveLock(move_lock);

for (let arr of mvarr) {//«

// Var «

	let src_path = arr[0];
	let src_node = arr[1];
//	let src_icon = icon_obj[src_path];
	let src_type = src_node.type;

	let dest_name;
	let dest_path;
	let real_dest_path;

	let dest_node_rv;
//»

	if (dest_arg_node) {//«
		if (dest_arg_node.isDir) {
			dest_name = src_node.name;
			dest_path = `${dest_par_path}/${dest_name}`;
			real_dest_path = dest_path;
		}
		else {
			dest_name = dest_arg_node.name;
			real_dest_path = dest_path = dest_arg_fullpath;
		}
	}//»
	else {//«
		real_dest_path = dest_path = dest_arg_fullpath;
		dest_name = use_dest_name;
	}//»

	if (src_node.isDir && (if_cp || src_type !== dest_par_node.type)){ //«
//	if (app === FOLDER_APP && (if_cp || src_type !== dest_par_node.type)){

// Just because the fs types are the same, it doesn't mean that the 
// move operation is *necessarily* "simple": NEED PREDICATE --------------vvvvvvvvvvvvv
//	if (app === FOLDER_APP && (if_cp || src_type !== dest_par_node.type || !dest_par_node.hasSimpleMove)){

// EHGJGKYE

// Recursion needed for folders when:
// - Copying
// - Moving between different file system types

// Moving within the same type should just require a simple "bookmark" update

		let nm = dest_name;
		if (dest_par_node.getKid(nm)){
			if (no_move_cb) no_move_cb(src_path);
			werr(`refusing to clobber: ${nm}`);
			continue;
		}

		let newpath = `${dest_par_node.fullpath}/${nm}`;
//		if (!await mkDir(dest_par_node.fullpath, nm, {root: is_root, noMakeIcon: !!dom_objects})){
//		if (!await mkDir(dest_par_node.fullpath, nm, {noMakeIcon: !!dom_objects})){

//		if (!await mkDir(dest_par_node, nm, {noMakeIcon: !!dom_objects})){
		if (!await mkDir(dest_par_node, nm, {noMakeIcon: true})){
// BETTER???
//		if (!await dest_par_node.mkDir(nm, {noMakeIcon: !!dom_objects})){

			if (no_move_cb) no_move_cb(src_path);
			werr(`${newpath}: there was a problem creating the folder`);
			continue;
		}

//		if (NS.Desk && !dom_objects) NS.Desk.make_icon_if_new(await path_to_node(newpath));
		winf(`Created: ${newpath}`);
		if (!src_node.done) await loadKids(src_node);
		let arr = [];	
		let kids = src_node.kidList;
		for (let k of kids) arr.push(k.fullpath);
		arr.push(newpath);
		await comMv(arr, {
			exports,
			if_recur: true,
//SUTIYKJ
// Why did we put this here instead of passing the original value?
//			if_cp: true, 
			if_cp,
			if_force

		});
		if (!if_cp) {
//cwarn("DELETE THE DIR...");
// Moving a dir *from* OP_FS_TYPE (to /dev/shm ???)
//XJRJHURJ
			if (src_node.type === OP_FS_TYPE) {
				if (!await db.removeNode(src_node.id, src_node.par.id)) {
cerr("UKFHJKD");
				}
			}
			_dir_update(2, src_node.par, src_node);
		}

		if (done_cb) done_cb(src_path, real_dest_path);

		continue;
	}//»

	if (if_cp) {//«

//		if (!(src_node = await src_node.copy(dest_name, dest_par_node, {noMakeIcon: !!dom_objects}))){
//		if (!await do_copy(src_node, dest_name, dest_par_node, {noMakeIcon: !!dom_objects})){

		dest_node_rv = await do_copy(src_node, dest_name, dest_par_node);
		if (!dest_node_rv){
			if (no_move_cb) no_move_cb(src_path);
			werr(`could not copy from ${src_path} to ${dest_path}`);
			continue;
		}
/*Slot 1 «
if (done_cb && src_icon) done_cb(src_icon);
if (NS.Desk && !dom_objects){
//NS.Desk.make_icon_if_new(src_node);
// or
//src_node.mkIcons();
}
»*/

	}//»
	else {//«

//WYRHTIYK
	 	dest_node_rv = await do_move(src_node, dest_name, dest_par_node);
		if (!dest_node_rv){
			if (no_move_cb) no_move_cb(src_path);
			werr(`could not move from ${src_path} to ${dest_path}`);
			continue;
		}
/*Slot 2 «
if (done_cb && src_icon) done_cb(src_icon);
if (NS.Desk && !dom_objects){
	src_node.mvIcons(real_dest_path);
}
»*/

	}//»

// Move this logic into the above 2 slots«
	if (done_cb) {
		done_cb(src_node, dest_node_rv);
//		done_cb(src_path, real_dest_path);
	}
	if (test_icons) await util.sleep(1000);

//»


}//»


dest_par_node.rmMoveLock(move_lock);

}//»

const set_local_blob = async (node, blob, opts={}) => {//«
	if (node.useMemBlob) {
		_set_mem_blob(node, blob);
		_node_update(5, node, blob.size);
		return {size: blob.size};
	}
	if (node.blobId === NULL_BLOB_NODE_TYPE){//«
		if (!await node.getRealBlobId()){
cerr("Could not getRealBlobId()!?!?!?");
			return;
		}
	}//»
	opts.node = node;
	let rv = await write_blob(await node.entry, blob, opts);
	_node_update(5, node, rv.size);
	return rv;

};//»

const blob_to_ret_val = async (blob, opts={}) => {//«

	let fmt;
	if (opts.buffer) fmt="arraybuffer";
	else if (opts.text) fmt = "text";
	else if (opts.blob) fmt="blob";
	else fmt = "bytes";
	let start=0;
	if (opts.start) start = parseInt(opts.start);
	let end;
	if (opts.end) end = parseInt(opts.end);
	let rv = await get_data_from_fs_file(blob, fmt, start, end);
	if (rv && fmt==="text" && !opts.noChomp) rv = rv.replace(/\n$/, "");
	return rv;

};//»

const get_local_blob = async(node)=>{//«
	const EB = new Blob([]); // Empty Blob
	if (node.type==SHM_FS_TYPE) return node.memBlob;
	if (node.type===SITE_FS_TYPE){//«
		let path = node.fullpath.replace(/^\/site/, "");
		let rv;
		try {
			rv = await fetch(path);
		}
		catch(e){
cerr(e);
			return EB;
		}
		if (!rv.ok) {
cerr("The response is not OK!");
log(rv);
			return EB;
		}
		return await rv.blob();
	}//»
	let bid = node.blobId;
	if (!bid){
		await node.getRealBlobId();
		bid = node.blobId;
cwarn(`No node.blobId (${node.fullpath}), got real id: ${bid}`);
	}
	else if (bid===NULL_BLOB_NODE_TYPE) return EB;
	let ent = await get_blob_entry(`${bid}`);
	if (!ent) {
cerr(`NO ENTRY: ${bid}`);
		return EB;
	}
	return await ent.getFile();
};//»

const get_data_from_fs_file=(file,format,start,end)=>{//«
	return new Promise(async(Y,N)=>{
		const OK_FORMATS=["blob","bytes","text","binarystring","dataurl","arraybuffer"];
		const def_format="arraybuffer";
		if (!format) {
cwarn("Format not given, defaulting to 'arraybuffer'");
			format=def_format;
		}
		if (!OK_FORMATS.includes(format)) return N(`Unrecognized format: ${format}`);
		let reader = new FileReader();
		reader.onloadend = function(e) {
			let val = this.result;
			if (format==="blob") return Y(new Blob([val],{type: "blob"}));
			if (format==="bytes") return Y(new Uint8Array(val));
			return Y(val);
		};
		if (Number.isFinite(start)) {
			if (file.slice) {
				if (Number.isFinite(end)) file = file.slice(start, end);
				else file = file.slice(start);
			}
		}
		if (format==="text") reader.readAsText(file);
		else if (format=="binarystring") reader.readAsBinaryString(file);
		else if (format=="dataurl") reader.readAsDataURL(file);
		else reader.readAsArrayBuffer(file);
	});
};//»
const get_blob_dir=async ()=>{//«
	let opfs = await navigator.storage.getDirectory();
	let blobDir = await opfs.getDirectoryHandle('blobs', {create: true});
	return blobDir;
};//»
const get_blob_entry = async(name)=>{//«
	if (!BLOB_DIR) BLOB_DIR = await get_blob_dir();
	return await BLOB_DIR.getFileHandle(name, {create: true});
};//»
const write_blob = async(fent, blob, opts={}) => {//«
	if (globals.read_only) return;
	let{
		append,
		node
	} = opts;
	let f;
	if (node){
		if (node.useMemBlob){
			if (append&&node.memBlob) blob = new Blob([node.memBlob, blob]);
			_set_mem_blob(node, blob);
			return {size: blob.size};
		}
		f = await opts.node.file;
	}
	let writer = await fent.createWritable({keepExistingData: append});
	if (append) writer.seek(f.size);
	await writer.write(blob);
	await writer.close();
	return {size: blob.size};
}
//»

const make_hard_link = async(parobj, name, blobid) =>{//«
	if (!parobj.done) await loadKids(parobj);
	let got = parobj.getKid(name);
	if (got) return got;

	let parid = parobj.id;
	let rv;
	let id = await db.createNode(name, FILE_NODE_TYPE, parid, blobid);
	if (!id) return cerr("JEMEMEMEIOU");

	let kid = mk_dir_kid(parobj, name, {isFile: true});
	_node_update(4, kid, blobid);
	_node_update(3, kid, id);
	_dir_update(1, parobj, kid);
//	kids[name] = kid;
	return kid;
};//»
const touchFile = async(parobj, name, opts={})=>{//«

	if (globals.read_only)return;

	if (!parobj.done) await loadKids(parobj);
	let gotkid = parobj.getKid(name);
	if (gotkid) return gotkid;
	let parid = parobj.id;
	let rv;
	let id;
	let is_shm = parobj.type == SHM_FS_TYPE;
	if (!is_shm){
		id = await db.createNode(name, NULL_BLOB_NODE_TYPE, parid);
		if (!id) return cerr("ADBNYURL");
	}

	let kid = mk_dir_kid(parobj, name,{ isFile: true });
	if (!is_shm) {
		_node_update(4, kid, NULL_BLOB_NODE_TYPE);
	}
	_node_update(3, kid, id);
	_dir_update(1, parobj, kid);
//	if (NS.Desk&&!opts.noMakeIcon) {
//cwarn(`Not calling make_icon_if_new w/ new node:`);
//log(kid);
//	}
	return kid;

};//»
const mkDir = async(pararg, name, opts={})=>{//«
	if (globals.read_only)return;
	let parobj;
	if (isStr(pararg)) {
		parobj = await pararg.toNode(opts);
		if (!parobj) return;
	}
	else parobj = pararg;
	let fullpath = `${parobj.fullpath}/${name}`;
	let typ = parobj.type;
	if (await path_to_node(fullpath)){//«
//		let kid = parobj.kids[name];
		let kid = parobj.getKid(name);
		if (kid) return kid;
cerr(`WHY IS THERE NO parobj.kids[${name}] in mkDir AFTER SUCCESSFULLY GETTING PATHTONODE("${fullpath}") ???`);
		return;
	}//»
	let id;
	let kid;
	if (typ===OP_FS_TYPE) {
		let parid = parobj.id;
		if (!parid) return cerr("GEJ76GF");
		id = await db.createNode(name, DIR_NODE_TYPE, parid);
		if (!id) return cerr("DEYBGJTU");
	}
//	else {
//	}
	kid = mk_dir_kid(parobj, name, {isDir: true, perm: opts.perm});
	_node_update(3, kid, id);
	_dir_update(1, parobj, kid);
	return kid;

};
//»
const make_sym_link = async(parobj, name, target, fullpath)=>{//«
	if (globals.read_only)return;
	let parid = parobj.id;
	let rv;
	let id = await db.createNode(name, LINK_NODE_TYPE, parid, target);
	if (!id) return cerr("ENHYTDJ");
	let kid = mk_dir_kid(parobj, name, {
		isLink: true,
		size: target.length,
	});
	_set_sym_link(kid, target);
	_node_update(3, kid, id);
	_dir_update(1, parobj, kid);

	if (NS.Desk) {
//		NS.Desk.make_icon_if_new(kid);

cwarn(`Not calling make_icon_if_new w/ new node:`);
log(kid);

	}
	return kid;
};//»

//»
//Init/Populate/Mount Dirs «


// ALL THIS "INIT" STUFF IS STUPID AND MUST BE REFACTORED!!!

/* 

If a certain behavior *ONLY* belongs to the root tree, not matter how
much we *MAY* want to generalize it (such as mounting subtrees), then
we should encapsulate it as a method on the root tree.

*/

// vvvvvvvvvv   FROM HERE   vvvvvvvvvv
const mount_tree = (name, type) => { //«

/*

This is only called for /dev (from make_dev_tree) and /site (from init)

*/

	let dir = new DirNode(name, root, {sys: true, type, perm: false});
	_add_root_kid(dir);

	return dir;
}
//this.mount_tree = mount_tree;
//»
const make_dev_tree = () => { //«
	let par = mount_tree("dev", DEV_FS_TYPE);

//YSXBPMNF
	let dev_null = new FileNode("null", par, {//«
//		getBlob: (node, opts)=>{ return blob_to_ret_val(new Blob([]), opts); },
		getBlob: (node)=>{ return new Blob([]); },
		setBlob: ()=>{ return {size: 0}; }
	});
	_dir_update(1, par, dev_null);
//»
	let dev_log = new FileNode("log", par, {//«
//		getBlob: (node, opts)=>{ return blob_to_ret_val(new Blob([]), opts); },
		getBlob: (node)=>{ return new Blob([]); },
		setBlob: async (node, val, opts)=>{
			let str = await util.toStr(val);
			console.log("[/dev/log]");
			console.log(str);
			return {size: str.length};
		}
	});
	_dir_update(1, par, dev_log);
//»

	let shm = mk_dir_kid(par, "shm", {isDir: true, type: SHM_FS_TYPE, perm: true});
	_dir_update(3, shm , true);
	_dir_update(1, par, shm);
	_dir_update(3, par, true);
};//»
const mk_user_dirs = async () => { //«
	let cur_user = globals.user.CURRENT_USER;
	let home_path = `/home/${cur_user}`;
	globals.user.home_path = home_path;
	globals.user.desk_path = `${home_path}/Desktop`.regpath();
	try{
//		await mkDir("/home", cur_user, {root: true, noMakeIcon: true, perm: cur_user});
		await mkDir("/home", cur_user, {noMakeIcon: true, perm: cur_user});
//		await mkDir(home_path, "Desktop", {root: true, noMakeIcon: true});
		await mkDir(home_path, "Desktop", { noMakeIcon: true});
		await loadKidsByPath('/home');
		await loadKidsByPath(home_path);
	} catch (e) {
cerr(e);
		return;
	}       
	return true;
}           
//»

const init = async () => { //«
	const make_fs_tree = async (name, opts={}) => {//«
		let dirstr = null;
		let tree = new DirNode(name, root, opts);
		_add_root_kid(tree);
		let rv = await db.getNodeByNameAndParId(name, rootId);
	//	if (!check_db_rv(rv)) return;
		let rows = rv.rows;
		if (rows.length){
//			tree.id = rows[0].id;
			_node_update(3, tree, rows[0].id);
			return tree;
		}
		rv = await db.createNode(name, DIR_NODE_TYPE, rootId);
		if (!rv) return;
//		tree.id = rv;
		_node_update(3, tree, rv);
		return tree;
	};//»
	if (!await db.init(root, FS_PREF)) {
		throw new Error("Could not initialize the filesystem database");
	}
	rootId = root.id;
//	mount_tree("loc", "data");
//	mount_tree("glb", "data");
	for (let name of root_dirs){
		let opts={type: OP_FS_TYPE};
		if (name == "tmp") opts.perm = true;
		else opts.perm = false;
		let ret = await make_fs_tree(name, opts);
		if (!ret) return;
		_add_root_kid(ret);
	}
	await mk_user_dirs();
	await mkDir("/var","appdata");
	await make_dev_tree();
	mount_tree("site", SITE_FS_TYPE);
//ESHFKNOI
	let mnt = mount_tree("mnt", MNT_FS_TYPE);
	_dir_update(3, mnt, true);
	if (mnt_fbase){//«
//		if (globals.dev_mode && mnt_fbase){
		await util.loadMod("fs.fbase");
		let mod = new LOTW.mods["fs.fbase"](export_obj);
		if (!await mod.init(mnt)){
cwarn("Could not init: fs.fbase");
		}
	}//»
	return true;
};//»

// ^^^^^^^^^^    TO HERE    ^^^^^^^^^^

//RYSHTKFH

const mk_dir_kid = (par, name, opts={}) => {//«
//	let {isDir, isLink, isData, isFile} = opts;
	let {isDir, isLink, isFile} = opts;
	let kid;
	if (isFile) kid = new FileNode(name, par);
	else if (isDir) {
		if (par.par.isRoot == true) {
			if (par.name == "home") opts.perm = name;
			else if (par.name == "var" && name == "cache") opts.readOnly = true;
		}
		kid = new DirNode(name, par, opts);
	}
	else if (isLink) kid = new LinkNode(name, par);
//	else if (isData) kid = new DataNode(name, par);
	else {
cwarr("HERE ARE OPTS");
log(opts);
		THROW("WHAT KIND OF NODE??? (see opts above)");
	}
	return kid;
}
//»

const loadKids = (dirobj, opts = {}) => {return populate_dirobj(dirobj, opts);};
const loadKidsByPath=(patharg, opts={})=>{return populate_dirobj_by_path(patharg, opts);};

const populate_dirobj_by_path = async(patharg, opts={}) => {//«
	let obj = await path_to_node(patharg);
	if (!obj) return cerr(`${patharg}: not found`);
	if (obj.appName !== FOLDER_APP) return cerr(`${patharg}: not a directory`);
	if (obj.done){
//		if (opts.long && obj.longdone) return obj.kids;
//		else return obj.kids;
		return true;
	}
	return populate_dirobj(obj, opts);
};
//»
const populate_dirobj = async(dirobj, opts = {}) => {//«
	if (dirobj.type == OP_FS_TYPE) return populate_fs_dirobj(dirobj, opts);
	if (!dirobj.done){
		if (dirobj.sys == true) {
if (dirobj.type === SITE_FS_TYPE){
	return populate_site_dir(dirobj, opts);
}
cwarn(`Got unknown dirobj.type = ${dirobj.type}`);
log(dirobj);
		}
		else{
cwarn(`Got dirobj.sys = false: ${dirobj.type}`);
log(dirobj);
		}
		
	}
//	return dirobj.kids;
	return true;
}//»
const populate_fs_dirobj = async(parobj, opts={}) => {//«
let rv;
let dirid = parobj.id;

rv = await db.getAll(dirid);

let rows = rv.rows;
for (let obj of rows){
	let {id, name, type, value} = obj;
//	let isDir, isLink, isData, isFile;
	let isDir, isLink, isFile;
	switch(type){
		case DIR_NODE_TYPE:
			isDir = true;
			break
		case LINK_NODE_TYPE:
			isLink = true;
			break;
//		case IDB_DATA_TYPE:
//			isData = true;
//			break
		default:
			isFile = true;
	}
	let kid = mk_dir_kid(parobj, name, {
		isDir,
		isLink,
//		isData,
		isFile
	});
	_node_update(3, kid, id);
	if (isLink){
		_set_sym_link(kid, value);
	}
//	else if (isData){
//		_node_update(4, kid, IDB_DATA_TYPE);
//		_set_data(kid, value);
//	}
	else if (isFile){
		_node_update(4, kid, value);
	}
	_dir_update(1, parobj, kid);
	if (kid.appName==="Application") kid.appicon = await kid.text;
}

_dir_update(3, parobj, true);
return true;
}//»
const populate_site_dir = async(par, opts={}) => {//«
const domount=(list, par)=>{//«
	for (let i=0; i < list.length; i++){
		let arr = list[i].split("/");
		let nm = arr[0];
		let sz = arr[1];
		if (sz){
			let node = mk_dir_kid(par, nm, {size: parseInt(sz), isFile: true});
			_dir_update(1, par, node);
		}
		else {
			let dir = mk_dir_kid(par, nm, {isDir: true});
			domount(list[i+1], dir);
			_dir_update(1, par, dir);
			i++;
		}
	}
};//»
let rv = await fetch('/list.json');
if (!rv.ok) return;
let list = await rv.json();
domount(list, par);
//par.done = true;
_dir_update(3, par, true);
};//»

//»
//Util«

/*
//let FILE_SAVER_SLICE_SZ = 1 * MB;
let FILE_SAVER_SLICE_SZ = 10;
//Used only by Desk.save_dropped_files«
const FileSaver=function(){//«

let cwd;
let fname;
let basename;
let fullpath;
let ext;
let file;
let fSize;
let fEnt; //This is always what is being written to,and depends on the FileSystem API
let fObj;

let bytesWritten = 0;
let curpos = 0;
let update_cb, done_cb, error_cb;
let stream_started = false, stream_ended = false;
let saving_from_file = false;
let cancelled = false;
const ispos = arg=>{return isNum(arg,true);}
const cerr=str=>{if(error_cb)error_cb(str);else cerr(str);};
const get_new_fname = (cb) => {//«
	const check_fs_by_path = async(fullpath, cb) => {
		if (await path_to_node(fullpath)) return cb(true);
		cb(false);
	}
	if (!basename) return cerr("basename is not set!");
	let iter = 0;
	const check_and_save = (namearg) => {
		if (iter > 10) return cerr("FileSaver:\x20Giving up after:\x20" + iter + " attempts");
//		let patharg = (cwd + "/" + namearg).regpath();
		let patharg = `${cwd}/${namearg}`.regpath();
		check_fs_by_path(patharg, name_is_taken => {
			if (name_is_taken) return check_and_save(`${++iter}~${basename}`);
			cb(namearg);
		});
	};
	check_and_save(basename);
};//»
const append_slice=async(slice)=>{//«
	let writer = await fEnt.createWritable({keepExistingData: true});
//	let writer = await fEnt.createWritable();
	await writer.seek(curpos);
	await writer.write(slice);
	await writer.close();
	return curpos+slice.size;
}//»
const save_file_chunk = async(blobarg, cbarg) => {//«

	if (cancelled) return cwarn("Cancelled!");
	let slice;
	if (blobarg) slice = blobarg;
	else if (file) slice = file.slice(curpos, curpos + FILE_SAVER_SLICE_SZ);
	else {
cerr("save_file_chunk():No blobarg or file!");
		return;
	}
//	let lenret = await append(fEnt, slice);
	let lenret = await append_slice(slice);
	if (blobarg) {
		bytesWritten += blobarg.size;
		if (update_cb) {
			if (fSize) update_cb(Math.floor(100 * bytesWritten / fSize));
			else update_cb(bytesWritten);
		}
		if (cbarg) cbarg();
		return;
	} 
	curpos += FILE_SAVER_SLICE_SZ;
//	if (thisobj.position < fSize) {
	if (lenret < fSize) {
//		if (update_cb) update_cb(Math.floor(100 * thisobj.position / fSize));
		if (update_cb) update_cb(Math.floor(100 * lenret / fSize));
		await save_file_chunk();
	} 
	else {
		if (done_cb) done_cb();
	}
};//»

this.set_cb=(which,cb)=>{if(which=="update")update_cb=cb;else if(which=="done")done_cb=cb;else if(which=="error")error_cb=cb;else cerr("Unknown cb type in set_cb:"+which);};
this.set_cwd = async(arg) => {//«
	if (!(arg && arg.match(/^\x2f/))) {
cerr(`Invalid cwd: ${arg} (must be a fullpath)"`);
		return;
	}
//	let [ret] = await path_to_node(arg);
	let ret = await path_to_node(arg);
	if (!(ret && ret.appName == FOLDER_APP)) {
cerr(`Invalid directory path: ${arg}`);
		return;
	}
	cwd = arg;
	return ret;
};//»
this.set_fsize=(arg)=>{if(!(isInt(arg)&& ispos(arg)))return cerr("Need positive integer for fSize");fSize=arg;};
this.set_ext=(arg)=>{if(!(arg&&arg.match(/^[a-z0-9]+$/)))return cerr("Invalid extension given:need /^[a-z0-9]+$/");ext=arg;};
this.set_filename = (arg) => {//«
return new Promise((Y,N)=>{
	if (!cwd) {
		Y();
cerr("Missing cwd");
		return
	}
	if (!arg) arg = "New_File";
	arg = arg.replace(/[^-._~%+:a-zA-Z0-9 ]/g, "");
	arg = arg.replace(/\x20+/g, "_");
	if (!arg) arg = "New_File";
	basename = arg;
	get_new_fname(ret => {
		if (!ret) return Y();
		fname = ret;
//		fullpath = (cwd + "/" + fname).regpath();
		fullpath = `${cwd}/${fname}`.regpath();
		Y(fname);
	})
});
};//»

this.set_fent = async(cb) => {//«

let arr = fullpath.split("/");
let fname = arr.pop();
let parpath = arr.join("/");
let parobj = await path_to_node(parpath);
if (!parobj) return cb(null, "No parent object!");
//if (parobj.kids[fname]) return cb(null,`${fname}: the name is already taken`);
if (parobj.getKid(fname)) return cb(null,`${fname}: the name is already taken`);
// 7/26/26: Just added noMakeIcon: true here
//The existence of an icon causes save_dropped_files to fail. That operation
//requires that an icon with a position is created.

let node = await saveFsByPath(fullpath, null, {getEntry: true, noMakeIcon: true});//FileSaver.set_fent
if (!(node&&node.entry)) return cb(null, `${fullpath}, Could not get the file entry`);

fObj = node;
fEnt = await node.entry;
fObj.lockFile();
cb(fObj);

};//»
this.save_from_file = (arg) => {//«
	if (saving_from_file) return cerr("Already saving from a File object");
	if (stream_started) return cerr("Already saving from a stream");
//	if (!writer) return cerr("No writer is set!");
	saving_from_file = true;
	fSize = arg.size;
	file = arg;
	if (!update_cb) cwarn("update_cb is NOT set!");
	if (!done_cb) cwarn("done_cb is NOT set!");
//	save_file_chunk();
	setTimeout(async()=>{
		await save_file_chunk();
	},0);
};//»
this.cancel = (cb) => {//«
//	cwarn("Cancelling... cleaning up!");
	cancelled = true;
	fEnt.remove(() => {
//		cwarn("fEnt.remove OK");
		cb();
	}, () => {
		cerr("fEnt.remove ERR");
		cb();
	});
};//»

}
this.FileSaver=FileSaver;
//»
*/

const event_to_files = (e) => {//«
	var dt = e.dataTransfer;
	var files = [];
	if (dt.items) {
		for (var i = 0; i < dt.items.length; i++) {
			if (dt.items[i].kind == "file") files.push(dt.items[i].getAsFile());
		}
	} else files = dt.files;
	return files;
}
this.event_to_files = event_to_files;
//»


//»

const get_blob_id = () => {//«
	let gotid = localStorage['nextBlobId'];
	if (gotid) gotid = parseInt(gotid);
	else gotid = FIRST_BLOB_ID;
	gotid++;
	localStorage['nextBlobId'] = gotid;
	return gotid;
};//»
const get_keys = obj => {//«
	var arr = Object.keys(obj);
	var ret = [];
	for (var i = 0; i < arr.length; i++) {
		if (obj.hasOwnProperty(arr[i])) ret.push(arr[i]);
	}
	return ret;
}//»

const path_to_par_and_name=(path)=>{//«
	let fullpath = getFullPath(path);
	let arr = fullpath.split("/");
	if (!arr[arr.length-1]) arr.pop();
	let name = arr.pop();
	if (arr.length==1 && arr[0]=="") return ["/", name];
	return [arr.join("/"), name];
}
this.path_to_par_and_name=path_to_par_and_name;
/*
const path_to_par_and_name = (path) => {
	let fullpath = getFullPath(path);
	let arr = fullpath.split("/");
	if (!arr[arr.length - 1]) arr.pop();
	let name = arr.pop();
	return [arr.join("/"), name];
}
*/
//»

//STRPROTOS
//String.prototype.regpath|to(Node|Text|Lines|Bytes|Buffer|Blob)«
{
const toNode = async function(opts={}) {//«
	let s = this+"";
	if (s.match(/^\x2f/)){}
	else if (opts.cwd && opts.cwd.match(/^\x2f/)) s = `${opts.cwd}/${s}`
	else {
cerr("Cannot construct a full path!");
		return false;
	}
	let node = await path_to_node(normPath(s), opts.getLink);
	if (!node) {//«
// HSJRKTHTG
		if (!(opts.mkFile || opts.mkDir)) return;
		let arr = s.split("/");
		let name = arr.pop();
		let par;
		let rem = [];
		while (arr.length) {
//Need to "backtrack" to find the first node that exists
			par = await arr.join("/").toNode({getLink: true});
			if (par) break;
			rem.push(arr.pop());
		}
		if (!par.isDir) {
		// Error: can't build a path when one of the elements is not a directory
cerr("can't build a path when one of the elements is not a directory:");
log(par);
			return;
		}

//Need to create DirNode's with the elements of rem, until we have
//the par node that can be used to create the final node, whether it is
// a file or a dir.
		while (rem.length) {
			let nm = rem.pop();
			let gotpar = await mkDir(par, nm);
			if (!gotpar) {
		// Error: couldn't construct the path
cerr(`Can't construct the path: ${par.fullpath}/${nm}/`);
				return;
			}
			par = gotpar;
		}
		if (opts.mkDir) node = await mkDir(par, name);
		else node = await touchFile(par, name);
		if (!node) return;
	}//»
	if (opts.doPopDir && node.isDir===true){
		await loadKids(node, opts);
	}
	return node;
};//»
let _ = String.prototype;
_.toNode=toNode;
_.regpath = function(if_full) {//«
    let str = this;
    if (if_full) str = "/" + str;
    str = str.replace(/\/+/g, "/");
    if (str == "/") return "/";
    return str.replace(/\/$/, "");
}//»
_.toParNodeAndName=async function(opts={}){//«
// EJUPMNHGU
	let s = this+"";
	if (s.match(/^\x2f/)){}
	else if (opts.cwd && opts.cwd.match(/^\x2f/)) s = `${opts.cwd}/${s}`
	s = normPath(s);
	let arr = s.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await path_to_node(parpath);
	if (!(parnode && parnode.isDir)) return;
	if (opts.mkFile) return [parnode, fname, await parnode.mkNewFile(fname)];
	else if (opts.mkDir) return [parnode, fname, await parnode.mkDir(fname)];
	return [parnode, fname, s];

}//»
_.toText = async function(opts = {}) {/*«*/
	let node = await this.toNode(opts);
	if (!node) return;
	if (!node.isFile) return;
	let txt = await node.text;
// Remove the final newlines, unless explicitly requested
	if (txt && !opts.noChomp) txt = txt.replace(/\n$/, "");
	if (opts.lines === true) return txt.split("\n");
	return txt;
};/*»*/
_.hasTextExt = function(opts={}){let ext = this.split(".").pop();return TEXT_EXTENSIONS.includes(ext);}
_.toLines=function(opts={}){opts.lines = true;return this.toText(opts);}
_.toBytes=async function(opts={}){let node=await this.toNode(opts);if(node)return node.bytes;};
_.toBuffer=async function(opts={}){let node=await this.toNode(opts);if(node) return node.buffer;};
_.toBlob=async function(opts={}){//«
	let node = await this.toNode(opts);
	if (!node) return;
	let buf = await node.buffer;
	if (!buf) return;
	if (opts.type) return new Blob([buf], {type: opts.type});
	return new Blob([buf]);
};//»
_.toJson=async function(opts={}){//«
	let node = await this.toNode(opts);
	if (!node) return;
	let text = await node.text;
	if (!text) return;
	try{
		return JSON.parse(text);
	}
	catch(e){
cerr(e);
	}
};//»
_.execute = async function(opts={}){//«
if (!globals.ShellMod) {
	if (!await util.loadMod("lang.shell")) {
		return new Error("Could not load the shell module");
	}
	globals.ShellMod = new LOTW.mods["lang.shell"]();
}
let term = {
	env: {
		vars:{},
		cwd: {
			cwd: globals.user.HOME_PATH
		},
		coms: globals.ShellMod.builtins,
		funcs: {}
	},
	response:(out, opts={})=>{
log(out, opts);
	}
};
const shell = new globals.ShellMod.Shell(term);
let sub_lines = [];
await shell.execute(this, {
	env: term.env,
	isInteractive: false,
	subLines: sub_lines
});
return sub_lines;
}//»

}

//»

//»

this.api = {//«

	init,

	clearStorage,

	doFsRm,

	getBlobDir: get_blob_dir,
	getNodesByBlobId,
	getPathByDirId, 

	comMv,

}
NS.api.fs=this.api;
globals.api.fs=this.api;
//»

//}; end FS«
  }
//»

//»

/*OLD«

const mk_dir = async (fullpath, opts) => {//«

let node = await fullpath.toNode({getLink: true});
if (node) {
cerr(`The file exists: ${fullpath}`);
	return;
}
let arr = fullpath.split("/");
let name = arr.pop();
let parpath = arr.join("/");
if (!parpath) parpath = "/";
let par = await parpath.toNode();
if (!par){
cerr(`Not found: ${parpath}`);
return;
}
if (!par.perm){
cerr(`Permission denied: ${parpath}`);
return;
}
return mkDir(par, name, opts);
};//»
_.mkNewFile = async function(opts={}){//«

let fullpath = normPath(this, opts.cwd);
if (!fullpath) {
cerr(`normPath(${this}, ${opts.cwd}) returned null`);
	return;
}
let node = await fullpath.toNode({getLink: true});
if (node) {
cerr(`The file exists: ${fullpath}`);
	return;
}
return mkFile(fullpath, opts);

}//»
_.mkDir = async function(opts={}) {//«
let fullpath = normPath(this, opts.cwd);
if (!fullpath) {
cerr(`normPath(${this}, ${opts.cwd}) returned null`);
	return;
}
if (fullpath === "/") return;
return mk_dir(fullpath, opts);
}//»
const writeFile = async(path, val, opts = {}) => {//«
	let invalid = () => {
		cerr(`Invalid path: ${path}`);
	};
	if (!(path && path.match(/^\x2f/))) return invalid();
	let arr = path.split("/");
	arr.shift();
	let rootdir = arr.shift();
	if (!rootdir) return invalid();
//	let is_dev_shm;
//	if (rootdir === "dev" && !(is_dev_shm = path.match(/\/dev\/shm/))){//«
//		let name = arr.shift();
//		if (name==="null"){}
//		else if (name==="log") console.log(val);
//		return true;
//	}//»
	let exists = await path_to_node(path);
	if (exists) {
//	if (exists && !opts.append){
cwarn("WRITEFILE was called on an existing file!?!?!");
		if (opts.reject) throw new Error(`The file exists`);
		else return false;
	}
	if (root_dirs.includes(rootdir)){//«
//	if (root_dirs.includes(rootdir)||is_dev_shm){
		let node = await saveFsByPath(path, val, opts);//WRITEFILE
		if (node && !opts.noMakeIcon) {
cwarn(`Not calling move_icon_by_path: null -> ${path} (${node.appName})`);
		}
		return node;
	}//»
	else {
cerr("Invalid or unsupported root dir:\x20" + rootdir);
	}
}//»
const saveFsByPath = async(path, val, opts={})=>{//«

if (globals.read_only) return;

let blob;
let node = await path_to_node(path);
if (!node) {
	let patharr = path.split("/");
	let fname = patharr.pop();
	let parpath = patharr.join("/");
	let parobj = await path_to_node(parpath);
	if (!parobj) return [null, `${parpath}: Bad parent path`];
	node = await touchFile(parobj, fname, opts);
	_node_update(1, node, fname);
}

if (node.blobId === NULL_BLOB_NODE_TYPE){//«
	if (!await node.getRealBlobId()){
cerr(`SAVEFSBYPATH(${path}): could not get a real blob id!?!?!`);
return;
	}
}//»

if (opts.getEntry||opts.data) {
	return node;
}

blob = toBlob(val);
if (!blob){
cerr(`${path}: Unknown type in SAVEFSBYPATH`);
log(val);
	return;
}
opts.node = node;
let rv = await write_blob(await node.entry, blob, opts);
_node_update(5, node, rv.size);
//node.size = rv.size;
if (opts.retObj) {
	rv.node = node;
	return rv;
}
return node;

}//»
const mkFile = async (path, opts) => {//«
	if (!(path && path.match(/^\x2f/))){
cerr("Need a full path");
		return;
	}
	let arr = await path.toParNodeAndName(path);
	if (!arr) return;
//if (!arr[0])
	let par = arr[0];
if (!par.perm){
cerr(`Permission denied: ${par.fullpath}`);
return;
}
	let nm = arr[1];
	return touchFile(par, nm, opts);
};//»

»*/

})();

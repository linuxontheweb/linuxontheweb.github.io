# Linux on the Web (LOTW)

<p align="center">
<img src="https://raw.githubusercontent.com/linuxontheweb/linuxontheweb.github.io/main/www/lotw256.png">
</p>

Linux used to be fun because expectations were low and possibilities were high. 
The online communities that gathered around it were truly pleasurable to be a part of.
I hope to bring those same feelings back in the context of web development.

Try out the current version at 
<a href="https://linuxontheweb.github.io">linuxontheweb.github.io</a>.

<a href="https://app.gitter.im/#/room/#linuxontheweb_community:gitter.im">Here is the chatroom on Gitter.</a>

## Usage

You can program LOTW!!! Just open up a terminal (via the Alt+t shortcut), and type in an awesome 
program like this:

	echo "This is the thing in the time of the place"

Or if want to see all of those words on their own numbered lines:

	SENTENCE="This is the thing in the time of the place";
	i=0;
	for WORD in $SENTENCE; do 
	    echo "$i: $WORD";
	    i=$((i+1)); 
	done 

## Local deployment

Locally deploying LOTW is as simple as simple can be. All you need to do is run
a web server in the root of the project directory. On Linux, this command
should suffice for most people:

	python3 -m http.server

You should then be able to visit the site at localhost:8000.
You can optionally specify a custom port number like so:

	python3 -m http.server 12345

The site should be live at localhost:12345.

But you might have more fun with the Node.js backend. To use it, run the following
command instead (Note: you must run this command from the top-level project directory!).

	node node/server.js

This will run a server at port 8080. Edit the server.js file if you want to use
an alternate port.

## Viewing and editing source code

vim is the recommended text editor, although any editor that allows the usage
of custom fold markers should also work. The lines to put in your ~/.vimrc file
to enable the convenient usage of row folding as it is used in the LOTW project
are as follows.

	set foldmethod=marker
	set foldmarker=«,»
	set foldlevelstart=0
	nmap <enter> za

In command mode, the Enter key is used to toggle between open and closed folds.

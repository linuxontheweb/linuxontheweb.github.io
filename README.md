# Linux on the Web (LOTW)

<p align="center">
<img src="https://raw.githubusercontent.com/linuxontheweb/linuxontheweb.github.io/main/www/lotw256.png">
</p>

Linux used to be fun because expectations were low and possibilities were high. 
The online communities that gathered around it were truly pleasurable to be a part of.
I hope to bring those same feelings back in the context of web development.

Although this project includes a desktop environment, it is not primarily
about that.  It is mainly about the idea that modern browsers now offer a
programmatically accessible file system that exists within domain-specific
"sandboxes."
<a href="https://linuxontheweb.github.io/www/docs/what-it-is.html">Click here</a> to read
more.

Try out the current version at 
<a href="https://linuxontheweb.github.io">linuxontheweb.github.io</a>.

<a href="https://linuxontheweb.github.io/www/docs/help.html">Here is the 
official help page</a> for system users.


## Local deployment

Locally deploying LOTW is as simple as simple can be. All you need to do is run
a web server in the root of the project directory. On Linux, this command
should suffice for most people:

	python3 -m http.server

You should then be able to visit the site at http://localhost:8000.
You can optionally specify a custom port number like so:

	python3 -m http.server 12345

The site should be live at http://localhost:12345.


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

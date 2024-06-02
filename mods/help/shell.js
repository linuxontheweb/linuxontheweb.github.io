

export const help_text={//«

_clearstorage: `Removes everything from the system's storage, so that a reload yields a new state. This requires confirmation from a prompt.`,
_blobs: `Without any arguments, lists out all of the blobs in the underlying file storage. Otherwise, if an argument is an integer, all of the corresponding linked files are listed. For all file path arguments, the corresponding numerical blob id is returned`,
_purge: `Removes the blobs with the given id's from the underlying storage`,

ls:`Prints a simple listing of directories (use 'lsall' to print dotfiles), the sizes of files or the values of symbolic links (if the link points to a directory, and the link name is followed by a forward slash, the directory will be listed instead).`,
lsall: `Same as 'ls', expect that dotfiles are included in directory listings`,
help:`Provides a simple help message (like this) for the given arguments.`,
pwd:`Prints the current working directory`,
appicon: `With no arguments, list the names of all applications. Otherwise, prints the textual version of an application icon which is meant to be saved under a '.app' file extension`,
app: `With no arguments, list the names of all applications. Otherwise, opens the given applications.

Not all applications in the system may be in a working state. Many of the applications are in development, and may not be very helpful for end users; it will be necessary to read the source code (found under /mnt/apps) in these cases.`,
open: `Opens the given file or directory in a window`,
dl: `Saves the given file to the host system's Downloads folder`,
hist: `Prints the shell's history buffer`,
clear: `Clears the screen`,
less: `Invokes the system pager. If a file argument is given, the file's contents are used. Otherwise, either standard input or the terminal's screen buffer is used.`,
vim: `Invokes the system's implementation of the popular *nix text editor`,
grep: `Attempts to match the lines of either file arguments or standard input with the given pattern string`,
mount: `Attempts to mount a given directory under '/mnt', which must be an immediate subfolder of the server root. This subfolder must have a file named 'list.json' within it, which can be generated via the 'DIRGET' command in the 'bin' subfolder of the server root (Node.js is required).`,
unmount: `Removes the given directory from '/mnt'`,
wc: `Prints the number of newlines, words and unicode characters of the given files or the piped input`,
echo: `Prints the given arguments to standard output`,
cd: `Changes the working directory. Without any arguments, the user's home directory will be used`,
touch: `Creates file entries with the given arguments. If the entries exist, this has no effect.`,
mkdir: `Creates directory entries with the given arguments`,
rmdir: `Attempts to remove the given directories. If a given directory is not empty, an error message is reported`,
mv: `Moves or renames the given file system entries`,
cat: `Prints the contents of the given files`,
rm: `Removes the given files or symbolic links. Directories must use the 'rmdir' command.`,
env: `Prints the shell's environment variables to standard output`,
symln:`Creates a symbolic link to a possibly non-existent target`,
ln:`Creates a hard link to a file`

};//»



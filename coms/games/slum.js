/*7/30/25
For all the Deal<N>Cards below, whenevever there is 'new int[n]', 'new int *[n]', 
'new int **[n]', etcI want to use Typed Arrays (e.g. Uint32Array).
*/

/*7/29/25 @WIJGLM: Why would we ever want to output this stuff if we are just trying«
to make files?
»*/
//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;
//»
/*
io:h class Reader, class Writer
*/

//Var«
//Everything in files.h/files.cpp reduces to these 3 strings!
//These are just directories for writing files
const OldCFRBase = ".";
const NewCFRBase = ".";
const StaticBase = ".";

//This is supposed to be Game::NumSuits()
const NUMSUITS = 4;
//#define Rank(card)           (card / Game::NumSuits())
//#define Suit(card)           (card % Game::NumSuits())
//»

//Util«

Factorial(n) {//«
//static int Factorial(int n) {
  if (n == 0) return 1;
  if (n == 1) return 1;
  return n * Factorial(n - 1);
}//»

//»

//io«

//Includes«
//#include <memory>
//#include <string>
//#include <vector>
//#include <dirent.h>
//#include <errno.h>
//#include <fcntl.h>
//#include <sys/stat.h>
//#include <stdlib.h>
//#include <unistd.h>
//»

class Writer {//«
constructor(filename, buf_size_or_modify) {/* « */
	if (isNull(buf_size_or_modify)) this.Init(filename, false, kBufSize);
	else if (isBool(buf_size_or_modify)) this.Init(filename, buf_size_or_modify, kBufSize);
	else if (isNum(buf_size_or_modify)) this.Init(filename, false, buf_size_or_modify);
}/* » */
destroy() {//«
  Flush();
  close(fd_);
}//»
/*
Writer::~Writer(void) {//«
  Flush();
  close(fd_);
}//»
*/
Init(filename, modify, buf_size) {//«
//void Writer::Init(const char *filename, bool modify, int buf_size) {
  filename_ = filename;
  if (modify) {
    fd_ = open(filename, O_WRONLY, 0666);
    if (fd_ < 0 && errno == ENOENT) {
      // If file doesn't exist, open it with creat()
      fd_ = creat(filename, 0666);
    }
  }
  else {
    // creat() is supposedly equivalent to passing
    // O_WRONLY|O_CREAT|O_TRUNC to open().
    fd_ = creat(filename, 0666);
  }
  if (fd_ < 0) {
    // Is this how errors are indicated?
    fprintf(stderr, "Couldn't open %s for writing (errno %i)\n", filename,
	    errno);
    exit(-1);
  }

  buf_size_ = buf_size;
  buf_.reset(new unsigned char[buf_size_]);
  end_buf_ = buf_.get() + buf_size_;
  buf_ptr_ = buf_.get();
}//»
Flush() {//«
//void Writer::Flush(void) {
// Generally write() writes everything in one call.  Haven't seen any cases
// that justify the loop I do below.  Could take it out.
  if (buf_ptr_ > buf_.get()) {
    int left_to_write = (int)(buf_ptr_ - buf_.get());
    while (left_to_write > 0) {
      int written = write(fd_, buf_.get(), left_to_write);
      if (written < 0) {
	fprintf(stderr,
		"Error in flush: tried to write %i, return of %i; errno %i; "
		"fd %i\n", left_to_write, written, errno, fd_);
	exit(-1);
      } else if (written == 0) {
	// Stall for a bit to avoid busy loop
	sleep(1);
      }
      left_to_write -= written;
    }
  }
  buf_ptr_ = buf_.get();
}//»
SeekTo(offset) {//«
//void Writer::SeekTo(long long int offset) {
// Only makes sense to call if we created the Writer with modify=true
  Flush();
  long long int ret = lseek(fd_, offset, SEEK_SET);
  if (ret == -1) {
    fprintf(stderr, "lseek failed, offset %lli, ret %lli, errno %i, fd %i\n",
	    offset, ret, errno, fd_);
    fprintf(stderr, "File: %s\n", filename_.c_str());
    exit(-1);
  }
}//»
Tell() {//«
//long long int Writer::Tell(void) {
  Flush();
  return lseek(fd_, 0LL, SEEK_CUR);
}//»
WriteInt(i) {//«
//void Writer::WriteInt(int i) {
  if (buf_ptr_ + sizeof(int) > end_buf_) {
    Flush();
  }
  // Couldn't we have an alignment issue if we write a char and then an int,
  // for example?
  // *(int *)buf_ptr_ = i;
  memcpy(buf_ptr_, (void *)&i, sizeof(int));
  buf_ptr_ += sizeof(int);
}//»
WriteUnsignedInt(u) {//«
//void Writer::WriteUnsignedInt(unsigned int u) {
  if (buf_ptr_ + sizeof(unsigned int) > end_buf_) {
    Flush();
  }
  *(unsigned int *)buf_ptr_ = u;
  buf_ptr_ += sizeof(unsigned int);
}//»
WriteLong(l) {//«
//void Writer::WriteLong(long long int l) {
  if (buf_ptr_ + sizeof(long long int) > end_buf_) {
    Flush();
  }
  *(long long int *)buf_ptr_ = l;
  buf_ptr_ += sizeof(long long int);
}//»
WriteUnsignedLong(u) {//«
//WriteUnsignedLong(unsigned long long int u) {
  if (buf_ptr_ + sizeof(unsigned long long int) > end_buf_) {
    Flush();
  }
  *(unsigned long long int *)buf_ptr_ = u;
  buf_ptr_ += sizeof(unsigned long long int);
}//»
WriteShort(s) {//«
//WriteShort(short s) {
  if (buf_ptr_ + sizeof(short) > end_buf_) {
    Flush();
  }
  *(short *)buf_ptr_ = s;
  buf_ptr_ += sizeof(short);
}//»
WriteChar(c) {//«
//WriteChar(char c) {
  if (buf_ptr_ + sizeof(char) > end_buf_) {
    Flush();
  }
  *(char *)buf_ptr_ = c;
  buf_ptr_ += sizeof(char);
}//»
WriteUnsignedChar(unsigned char c) {//«
//WriteUnsignedChar(unsigned char c) {
  if (buf_ptr_ + sizeof(unsigned char) > end_buf_) {
    Flush();
  }
  *(unsigned char *)buf_ptr_ = c;
  buf_ptr_ += sizeof(unsigned char);
}//»
WriteUnsignedShort(unsigned short s) {//«
//WriteUnsignedShort(unsigned short s) {
  if (buf_ptr_ + sizeof(unsigned short) > end_buf_) {
    Flush();
  }
  *(unsigned short *)buf_ptr_ = s;
  buf_ptr_ += sizeof(unsigned short);
}//»
WriteFloat(float f) {//«
//WriteFloat(float f) {
  if (buf_ptr_ + sizeof(float) > end_buf_) {
    Flush();
  }
  *(float *)buf_ptr_ = f;
  buf_ptr_ += sizeof(float);
}//»
WriteDouble(double d) {//«
//WriteDouble(double d) {
  if (buf_ptr_ + sizeof(double) > end_buf_) {
    Flush();
  }
  *(double *)buf_ptr_ = d;
  buf_ptr_ += sizeof(double);
}//»
WriteReal(float f) {//«
//WriteReal(float f) {
// Identical to WriteFloat()
  if (buf_ptr_ + sizeof(float) > end_buf_) {
    Flush();
  }
  *(float *)buf_ptr_ = f;
  buf_ptr_ += sizeof(float);
}//»
WriteReal(double d) {//«
//WriteReal(double d) {
// Identical to WriteDouble()
  if (buf_ptr_ + sizeof(double) > end_buf_) {
    Flush();
  }
  *(double *)buf_ptr_ = d;
  buf_ptr_ += sizeof(double);
}//»
Write(unsigned char c) {//«
//Write(unsigned char c) {
  WriteUnsignedChar(c);
}//»
Write(unsigned short s) {//«
//Write(unsigned short s) {
  WriteUnsignedShort(s);
}//»
Write(int i) {//«
//Write(int i) {
  WriteInt(i);
}//»
Write(unsigned int u) {//«
//Write(unsigned int u) {
  WriteUnsignedInt(u);
}//»
Write(double d) {//«
//Write(double d) {
  WriteDouble(d);
}//»
WriteCString(const char *s) {//«
//WriteCString(const char *s) {
  int len = strlen(s);
  if (buf_ptr_ + len + 1 > end_buf_) {
    Flush();
  }
  memcpy(buf_ptr_, s, len);
  buf_ptr_[len] = 0;
  buf_ptr_ += len + 1;
}//»
WriteNBytes(unsigned char *bytes, unsigned int num_bytes) {//«
//WriteNBytes(unsigned char *bytes, unsigned int num_bytes) {
// Does not write num_bytes into file
  if ((int)num_bytes > buf_size_) {
    Flush();
    while ((int)num_bytes > buf_size_) {
      buf_size_ *= 2;
      buf_.reset(new unsigned char[buf_size_]);
      buf_ptr_ = buf_.get();
      end_buf_ = buf_.get() + buf_size_;
    }
  }
  if (buf_ptr_ + num_bytes > end_buf_) {
    Flush();
  }
  memcpy(buf_ptr_, bytes, num_bytes);
  buf_ptr_ += num_bytes;
}//»
WriteBytes(unsigned char *bytes, int num_bytes) {//«
//WriteBytes(unsigned char *bytes, int num_bytes) {
  WriteInt(num_bytes);
  if (num_bytes > buf_size_) {
    Flush();
    while (num_bytes > buf_size_) {
      buf_size_ *= 2;
      buf_.reset(new unsigned char[buf_size_]);
      buf_ptr_ = buf_.get();
      end_buf_ = buf_.get() + buf_size_;
    }
  }
  if (buf_ptr_ + num_bytes > end_buf_) {
    Flush();
  }
  memcpy(buf_ptr_, bytes, num_bytes);
  buf_ptr_ += num_bytes;
}//»
WriteText(const char *s) {//«
//WriteText(const char *s) {
  int len = strlen(s);
  if (buf_ptr_ + len + 1 > end_buf_) {
    Flush();
  }
  memcpy(buf_ptr_, s, len);
  buf_ptr_ += len;
}//»
BufPos(void) {//«
//int Writer::BufPos(void) {
  return (int)(buf_ptr_ - buf_.get());
}//»
}//»
class Reader {//«
constructor(filename, file_size){
if (isNull(file_size)){//«
//Reader::Reader(const char *filename)
  OpenFile(filename);

  buf_size_ = kBufSize;
  if (remaining_ < buf_size_) buf_size_ = remaining_;

  buf_.reset(new unsigned char[buf_size_]);
  buf_ptr_ = buf_.get();
  end_read_ = buf_.get();

  if (! Refresh()) {
    fprintf(stderr, "Warning: empty file: %s\n", filename);
  }
}//»
else{//«
//Reader::Reader(const char *filename, long long int file_size) 
// This constructor for use by NewReaderMaybe().  Doesn't call stat().
// I should clean up this code to avoid redundancy.
  filename_ = filename;
  file_size_ = file_size;
  remaining_ = file_size;

  fd_ = open(filename, O_RDONLY, 0);
  if (fd_ == -1) {
    fprintf(stderr, "Failed to open \"%s\", errno %i\n", filename, errno);
    if (errno == 24) {
      fprintf(stderr, "errno 24 may indicate too many open files\n");
    }
    exit(-1);
  }

  overflow_size_ = 0;
  byte_pos_ = 0;

  buf_size_ = kBufSize;
  if (remaining_ < buf_size_) buf_size_ = remaining_;

  buf_.reset(new unsigned char[buf_size_]);
  buf_ptr_ = buf_.get();
  end_read_ = buf_.get();

  if (! Refresh()) {
    fprintf(stderr, "Warning: empty file: %s\n", filename);
  }
}//»
}
/*
Reader::~Reader(void) {//«
  close(fd_);
}//»
*/
OpenFile(filename) {//«
//OpenFile(const char *filename) {
  filename_ = filename;
  struct stat stbuf;
  if (stat(filename, &stbuf) == -1) {
    fprintf(stderr, "Reader::OpenFile: Couldn't access: %s\n", filename);
    exit(-1);
  }
  file_size_ = stbuf.st_size;
  remaining_ = file_size_;

  fd_ = open(filename, O_RDONLY, 0);
  if (fd_ == -1) {
    fprintf(stderr, "Failed to open \"%s\", errno %i\n", filename, errno);
    if (errno == 24) {
      fprintf(stderr, "errno 24 may indicate too many open files\n");
    }
    exit(-1);
  }

  overflow_size_ = 0;
  byte_pos_ = 0;
}//»
NewReaderMaybe(filename) {//«
//Reader *NewReaderMaybe(const char *filename) {
// Returns NULL if no file by this name exists
  struct stat stbuf;
  if (stat(filename, &stbuf) == -1) {
    return NULL;
  }
  long long int file_size = stbuf.st_size;
  return new Reader(filename, file_size);
}//»
AtEnd() {//«
  // This doesn't work for CompressedReader
  // return byte_pos_ == file_size_;
  return (buf_ptr_ == end_read_ && remaining_ == 0 && overflow_size_ == 0);
}//»
SeekTo(offset) {//«
//SeekTo(long long int offset) {
  long long int ret = lseek(fd_, offset, SEEK_SET);
  if (ret == -1) {
    fprintf(stderr, "lseek failed, offset %lli, ret %lli, errno %i, fd %i\n",
	    offset, ret, errno, fd_);
    fprintf(stderr, "File: %s\n", filename_.c_str());
    exit(-1);
  }
  remaining_ = file_size_ - offset;
  overflow_size_ = 0;
  byte_pos_ = offset;
  Refresh();
}//»
Refresh() {//«
  if (remaining_ == 0 && overflow_size_ == 0) return false;

  if (overflow_size_ > 0) {
    memcpy(buf_.get(), overflow_, overflow_size_);
  }
  buf_ptr_ = buf_.get();
    
  unsigned char *read_into = buf_.get() + overflow_size_;

  int to_read = buf_size_ - overflow_size_;
  if (to_read > remaining_) to_read = remaining_;

  int ret;
  if ((ret = read(fd_, read_into, to_read)) != to_read) {
    fprintf(stderr, "Read returned %i not %i\n", ret, to_read);
    fprintf(stderr, "File: %s\n", filename_.c_str());
    fprintf(stderr, "remaining_ %lli\n", remaining_);
    exit(-1);
  }

  remaining_ -= to_read;
  end_read_ = read_into + to_read;
  overflow_size_ = 0;

  return true;
}//»
GetLine(s) {//«
//GetLine(string *s) {
  s->clear();
  while (true) {
    if (buf_ptr_ == end_read_) {
      if (! Refresh()) {
	return false;
      }
    }
    if (*buf_ptr_ == '\r') {
      ++buf_ptr_;
      ++byte_pos_;
      continue;
    }
    if (*buf_ptr_ == '\n') {
      ++buf_ptr_;
      ++byte_pos_;
      break;
    }
    s->push_back(*buf_ptr_);
    ++buf_ptr_;
    ++byte_pos_;
  }
  return true;
}//»
ReadInt(i) {//«
//ReadInt(int *i) {
  if (buf_ptr_ + sizeof(int) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  char my_buf[4];
  my_buf[0] = *buf_ptr_++;
  my_buf[1] = *buf_ptr_++;
  my_buf[2] = *buf_ptr_++;
  my_buf[3] = *buf_ptr_++;
  byte_pos_ += 4;
  int *int_ptr = reinterpret_cast<int *>(my_buf);
  *i = *int_ptr;
  return true;
}//»
ReadIntOrDie() {//«
  int i;
  if (! ReadInt(&i)) {
    fprintf(stderr, "Couldn't read int; file %s byte pos %lli\n",
	    filename_.c_str(), byte_pos_);
    exit(-1);
  }
  return i;
}//»
ReadUnsignedInt(u) {//«
//ReadUnsignedInt(unsigned int *u) {
  if (buf_ptr_ + sizeof(int) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  char my_buf[4];
  my_buf[0] = *buf_ptr_++;
  my_buf[1] = *buf_ptr_++;
  my_buf[2] = *buf_ptr_++;
  my_buf[3] = *buf_ptr_++;
  byte_pos_ += 4;
  unsigned int *u_int_ptr = reinterpret_cast<unsigned int *>(my_buf);
  *u = *u_int_ptr;
  return true;
}//»
ReadUnsignedIntOrDie() {//«
  unsigned int u;
  if (! ReadUnsignedInt(&u)) {
    fprintf(stderr, "Couldn't read unsigned int\n");
    fprintf(stderr, "File: %s\n", filename_.c_str());
    fprintf(stderr, "Byte pos: %lli\n", byte_pos_);
    exit(-1);
  }
  return u;
}//»
ReadLong(l) {//«
//ReadLong(long long int *l) {
  if (buf_ptr_ + sizeof(long long int) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *l = *(long long int *)buf_ptr_;
  buf_ptr_ += sizeof(long long int);
  byte_pos_ += sizeof(long long int);
  return true;
}//»
ReadLongOrDie() {//«
  long long int l;
  if (! ReadLong(&l)) {
    fprintf(stderr, "Couldn't read long\n");
    exit(-1);
  }
  return l;
}//»
ReadUnsignedLong(u) {//«
//ReadUnsignedLong(unsigned long long int *u) {
  if (buf_ptr_ + sizeof(unsigned long long int) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *u = *(unsigned long long int *)buf_ptr_;
  buf_ptr_ += sizeof(unsigned long long int);
  byte_pos_ += sizeof(unsigned long long int);
  return true;
}//»
ReadUnsignedLongOrDie() {//«
  unsigned long long int u;
  if (! ReadUnsignedLong(&u)) {
    fprintf(stderr, "Couldn't read unsigned long\n");
    exit(-1);
  }
  return u;
}//»
ReadShort(s) {//«
//ReadShort(short *s) {
  if (buf_ptr_ + sizeof(short) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  // Possible alignment issue?
  *s = *(short *)buf_ptr_;
  buf_ptr_ += sizeof(short);
  byte_pos_ += sizeof(short);
  return true;
}//»
ReadShortOrDie() {//«
  short s;
  if (! ReadShort(&s)) {
    fprintf(stderr, "Couldn't read short\n");
    exit(-1);
  }
  return s;
}//»
ReadUnsignedShort(u) {//«
//ReadUnsignedShort(unsigned short *u) {
  if (buf_ptr_ + sizeof(unsigned short) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *u = *(unsigned short *)buf_ptr_;
  buf_ptr_ += sizeof(unsigned short);
  byte_pos_ += sizeof(unsigned short);
  return true;
}//»
ReadUnsignedShortOrDie() {//«
  unsigned short s;
  if (! ReadUnsignedShort(&s)) {
    fprintf(stderr, "Couldn't read unsigned short; file %s byte pos %lli "
	    "file_size %lli\n", filename_.c_str(), byte_pos_, file_size_);
    exit(-1);
  }
  return s;
}//»
ReadChar(c) {//«
//ReadChar(char *c) {
  if (buf_ptr_ + sizeof(char) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *c = *(char *)buf_ptr_;
  buf_ptr_ += sizeof(char);
  byte_pos_ += sizeof(char);
  return true;
}//»
ReadCharOrDie() {//«
  char c;
  if (! ReadChar(&c)) {
    fprintf(stderr, "Couldn't read char\n");
    exit(-1);
  }
  return c;
}//»
ReadUnsignedChar(u) {//«
//ReadUnsignedChar(unsigned char *u) {
  if (buf_ptr_ + sizeof(unsigned char) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *u = *(unsigned char *)buf_ptr_;
  buf_ptr_ += sizeof(unsigned char);
  byte_pos_ += sizeof(unsigned char);
  return true;
}//»
ReadUnsignedCharOrDie() {//«
  unsigned char u;
  if (! ReadUnsignedChar(&u)) {
    fprintf(stderr, "Couldn't read unsigned char\n");
    fprintf(stderr, "File: %s\n", filename_.c_str());
    fprintf(stderr, "Byte pos: %lli\n", byte_pos_);
    exit(-1);
  }
  return u;
}//»
ReadOrDie(c) {//«
//ReadOrDie(unsigned char *c) {
  *c = ReadUnsignedCharOrDie();
}//»
ReadOrDie(s) {//«
//ReadOrDie(unsigned short *s) {
  *s = ReadUnsignedShortOrDie();
}//»
ReadOrDie(u) {//«
//ReadOrDie(unsigned int *u) {
  *u = ReadUnsignedIntOrDie();
}//»
ReadOrDie(i) {//«
//ReadOrDie(int *i) {
  *i = ReadIntOrDie();
}//»
ReadOrDie(d) {//«
//ReadOrDie(double *d) {
  *d = ReadDoubleOrDie();
}//»
ReadNBytesOrDie(num_bytes, buf) {//«
//ReadNBytesOrDie(unsigned int num_bytes, unsigned char *buf) {
  for (unsigned int i = 0; i < num_bytes; ++i) {
    if (buf_ptr_ + 1 > end_read_) {
      if (! Refresh()) {
	fprintf(stderr, "Couldn't read %i bytes\n", num_bytes);
	fprintf(stderr, "Filename: %s\n", filename_.c_str());
	fprintf(stderr, "File size: %lli\n", file_size_);
	fprintf(stderr, "Before read byte pos: %lli\n", byte_pos_);
	fprintf(stderr, "Overflow size: %i\n", overflow_size_);
	fprintf(stderr, "i %i\n", i);
	exit(-1);
      }
    }
    buf[i] = *buf_ptr_++;
    ++byte_pos_;
  }
}//»
ReadEverythingLeft(data) {//«
//ReadEverythingLeft(unsigned char *data) {
  unsigned long long int data_pos = 0ULL;
  unsigned long long int left = file_size_ - byte_pos_;
  while (left > 0) {
    unsigned long long int num_bytes = end_read_ - buf_ptr_;
    memcpy(data + data_pos, buf_ptr_, num_bytes);
    buf_ptr_ = end_read_;
    data_pos += num_bytes;
    if (data_pos > left) {
      fprintf(stderr, "ReadEverythingLeft: read too much?!?\n");
      exit(-1);
    } else if (data_pos == left) {
      break;
    }
    if (! Refresh()) {
      fprintf(stderr, "ReadEverythingLeft: premature EOF?!?\n");
      exit(-1);
    }
  }
}//»
ReadCString(s) {//«
//ReadCString(string *s) {
  *s = "";
  while (true) {
    if (buf_ptr_ + 1 > end_read_) {
      if (! Refresh()) {
	return false;
      }
    }
    char c = *buf_ptr_++;
    ++byte_pos_;
    if (c == 0) return true;
    *s += c;
  }
}//»
ReadDouble(d) {//«
//ReadDouble(double *d) {
  if (buf_ptr_ + sizeof(double) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *d = *(double *)buf_ptr_;
  buf_ptr_ += sizeof(double);
  byte_pos_ += sizeof(double);
  return true;
}//»
ReadFloat(f) {//«
//ReadFloat(float *f) {
  if (buf_ptr_ + sizeof(float) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *f = *(float *)buf_ptr_;
  buf_ptr_ += sizeof(float);
  byte_pos_ += sizeof(float);
  return true;
}//»
ReadReal(d) {//«
//ReadReal(double *d) {
// Identical to ReadDouble()
  if (buf_ptr_ + sizeof(double) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *d = *(double *)buf_ptr_;
  buf_ptr_ += sizeof(double);
  byte_pos_ += sizeof(double);
  return true;
}//»
ReadReal(f) {//«
//ReadReal(float *f) {
// Identical to ReadFloat()
  if (buf_ptr_ + sizeof(float) > end_read_) {
    if (buf_ptr_ < end_read_) {
      overflow_size_ = (int)(end_read_ - buf_ptr_);
      memcpy(overflow_, buf_ptr_, overflow_size_);
    }
    if (! Refresh()) {
      return false;
    }
  }
  *f = *(float *)buf_ptr_;
  buf_ptr_ += sizeof(float);
  byte_pos_ += sizeof(float);
  return true;
}//»
ReadDoubleOrDie() {//«
  double d;
  if (! ReadDouble(&d)) {
    fprintf(stderr, "Couldn't read double: file %s byte pos %lli\n",
	    filename_.c_str(), byte_pos_);
    exit(-1);
  }
  return d;
}//»
ReadCStringOrDie() {//«
  string s;
  if (! ReadCString(&s)) {
    fprintf(stderr, "Couldn't read string\n");
    exit(-1);
  }
  return s;
}//»
ReadFloatOrDie() {//«
  float f;
  if (! ReadFloat(&f)) {
    fprintf(stderr, "Couldn't read float: file %s\n", filename_.c_str());
    exit(-1);
  }
  return f;
}//»
}//»
class ReadWriter {//«
constructor() {//«
//ReadWriter::ReadWriter(const char *filename) {
  filename_ = filename;
  fd_ = open(filename, O_RDWR, 0666);
  if (fd_ < 0 && errno == ENOENT) {
    fprintf(stderr, "Can only create a ReadWriter on an existing file\n");
    fprintf(stderr, "Filename: %s\n", filename);
    exit(-1);
  }
}//»
destroy() {//«
  close(fd_);
}//»
SeekTo(offset) {//«
//SeekTo(long long int offset) {
  long long int ret = lseek(fd_, offset, SEEK_SET);
  if (ret == -1) {
    fprintf(stderr, "lseek failed, offset %lli, ret %lli, errno %i, fd %i\n",
	    offset, ret, errno, fd_);
    fprintf(stderr, "File: %s\n", filename_.c_str());
    exit(-1);
  }
}//»
ReadIntOrDie() {//«
//int ReadWriter::ReadIntOrDie(void) {
  int i, ret;
  if ((ret = read(fd_, &i, 4)) != 4) {
    fprintf(stderr, "ReadWriter::ReadInt returned %i not 4\n", ret);
    fprintf(stderr, "File: %s\n", filename_.c_str());
    exit(-1);
  }
  return i;
}//»
WriteInt(i) {//«
//void ReadWriter::WriteInt(int i) {
  int written = write(fd_, &i, 4);
  if (written != 4) {
    fprintf(stderr, "Error: tried to write 4 bytes, return of %i; fd %i\n",
	    written, fd_);
    exit(-1);
  }
}//»
}//»

const FileExists = (filename) => {//«
//bool FileExists(const char *filename) {
// Note that stat() is very slow.  We've replaced the call to stat() with
// a call to open().
  int fd = open(filename, O_RDONLY, 0);
  if (fd == -1) {
    if (errno == ENOENT) {
      // I believe this is what happens when there is no such file
      return false;
    }
    fprintf(stderr, "Failed to open \"%s\", errno %i\n", filename, errno);
    if (errno == 24) {
      fprintf(stderr, "errno 24 may indicate too many open files\n");
    }
    exit(-1);
  }
  else {
    close(fd);
    return true;
  }
/*
#if 0
  struct stat stbuf;
  int ret = stat(filename, &stbuf);
  if (ret == -1) {
    return false;
  } else {
    return true;
  }
#endif
*/
}//»
const FileSize = (filename) => {//«
//long long int FileSize(const char *filename) {
  struct stat stbuf;
  if (stat(filename, &stbuf) == -1) {
    fprintf(stderr, "FileSize: Couldn't access: %s\n", filename);
    exit(-1);
  }
  return stbuf.st_size;
}//»
const IsADirectory = (path) => {//«
//bool IsADirectory(const char *path) {
  struct stat statbuf;
  if (stat(path, &statbuf) != 0) return 0;
  return S_ISDIR(statbuf.st_mode);
}//»
const GetDirectoryListing = (dir, listing) => {//«
//void GetDirectoryListing(const char *dir, vector<string> *listing) {
// Filenames in listing returned are full paths
  int dirlen = strlen(dir);
  bool ends_in_slash = (dir[dirlen - 1] == '/');
  listing->clear();
  DIR *dfd = opendir(dir);
  if (dfd == NULL) {
    fprintf(stderr, "GetDirectoryListing: could not open directory %s\n", dir);
    exit(-1);
  }
  dirent *dp;
  while ((dp = readdir(dfd))) {
    if (strcmp(dp->d_name, ".") && strcmp(dp->d_name, "..")) {
      string full_path = dir;
      if (! ends_in_slash) {
	full_path += "/";
      }
      full_path += dp->d_name;
      listing->push_back(full_path);
    }
  }
  closedir(dfd);
}//»
const RecursivelyDelete = (path) => {//«
//static void RecursivelyDelete(const string &path) {
// Can handle files or directories
  if (! IsADirectory(path.c_str())) {
    // fprintf(stderr, "Removing file %s\n", path.c_str());
    RemoveFile(path.c_str());
    return;
  }
  vector<string> listing;
  GetDirectoryListing(path.c_str(), &listing);
  unsigned int num = listing.size();
  for (unsigned int i = 0; i < num; ++i) {
    RecursivelyDelete(listing[i]);
  }
  // fprintf(stderr, "Removing dir %s\n", path.c_str());
  RemoveFile(path.c_str());
}//»
const RecursivelyDeleteDirectory = (dir) => {//«
//void RecursivelyDeleteDirectory(const char *dir) {
  // Succeed silently if directory doesn't exist
  if (! FileExists(dir)) return;
  if (! IsADirectory(dir)) {
    fprintf(stderr, "Path supplied is not a directory: %s\n", dir);
    return;
  }
  vector<string> listing;
  GetDirectoryListing(dir, &listing);
  unsigned int num = listing.size();
  for (unsigned int i = 0; i < num; ++i) {
    RecursivelyDelete(listing[i]);
  }
  // fprintf(stderr, "Removing dir %s\n", dir);
  RemoveFile(dir);
}//»
const Mkdir = (dir) => {//«
//void Mkdir(const char *dir) {
// Gives read/write/execute permissions to everyone
  int ret = mkdir(dir, S_IRWXU | S_IRWXG | S_IRWXO);
  if (ret != 0) {
    if (errno == 17) {
      // File or directory by this name already exists.  We'll just assume
      // it's a directory and return successfully.
      return;
    }
    fprintf(stderr, "mkdir returned %i; errno %i\n", ret, errno);
    fprintf(stderr, "Directory: %s\n", dir);
    exit(-1);
  }
}//»
const RemoveFile = (filename) => {//«
//void RemoveFile(const char *filename) {
// FileExists() calls stat() which is very expensive.  Try calling
// remove() without a preceding FileExists() check.
  int ret = remove(filename);
  if (ret) {
    // ENOENT just signifies that there is no file by the given name
    if (errno != ENOENT) {
      fprintf(stderr, "Error removing file: %i; errno %i\n", ret, errno);
      exit(-1);
    }
  }
}//»
const UnlinkFile = (filename) => {//«
//void UnlinkFile(const char *filename) {
// How is this different from RemoveFile()?
  int ret = unlink(filename);
  if (ret) {
    // ENOENT just signifies that there is no file by the given name
    if (errno != ENOENT) {
      fprintf(stderr, "Error unlinking file: %i; errno %i\n", ret, errno);
      exit(-1);
    }
  }
}//»
const MoveFile = (old_location, new_location) => {//«
//void MoveFile(const char *old_location, const char *new_location) {
  if (! FileExists(old_location)) {
    fprintf(stderr, "MoveFile: old location \"%s\" does not exist\n",
	    old_location);
    exit(-1);
  }
  if (FileExists(new_location)) {
    fprintf(stderr, "MoveFile: new location \"%s\" already exists\n",
	    new_location);
    exit(-1);
  }
  int ret = rename(old_location, new_location);
  if (ret != 0) {
    fprintf(stderr, "MoveFile: rename() returned %i\n", ret);
    fprintf(stderr, "Old location: %s\n", old_location);
    fprintf(stderr, "New location: %s\n", new_location);
    exit(-1);
  }
}//»
const CopyFile = (old_location, new_location) => {//«
//void CopyFile(const char *old_location, const char *new_location) {
  Reader reader(old_location);
  Writer writer(new_location);
  unsigned char uc;
  while (reader.ReadUnsignedChar(&uc)) {
    writer.WriteUnsignedChar(uc);
  }
}//»

//»

//Params«

//#include "io.h"
//#include "params.h"

const P_STRING = 1;
const P_INT = 2;
const P_DOUBLE = 3;
const P_BOOLEAN = 4;

class ParamValue{}

class Params {//«
//private:

//std::vector<std::string> param_names_;
#param_names_;
//std::vector<ParamType> param_types_;
#param_types_;
//std::vector<ParamValue> param_values_;
#param_values_;

constructor(){//«
	this.#param_names_=[];
	this.#param_types_=[];
	this.#param_values_=[];
}//»

AddParam(name, ptype) {//«
//void Params::AddParam(const string &name, ParamType ptype) {
	this.#param_names_.push(name);
	this.#param_types_.push(ptype);
//	ParamValue v;
	let v = new ParamValue();
	v.s = "";
	v.i = 0;
	v.d = 0.0;
	v.set = false;
	this.#param_values_.push(v);
}//»
#GetParamIndex(name) {//«
//int Params::GetParamIndex(const char *name) const {
	let i;
	let num_params = this.#param_names_.size();
	for (i = 0; i < num_params; ++i) {
		if (! strcmp(this.#param_names_[i].c_str(), name)) break;
	}
	if (i == num_params) {
		fprintf(stderr, "Unknown param name: %s\n", name);
		exit(-1);
	}
	return i;
}//»
ReadFromFile(filename) {//«
//void Params::ReadFromFile(const char *filename) {
	Reader reader(filename);
//	string line;
	let line;
	while (reader.GetLine(&line)) {
		if (line[0] == '#') continue;
//		let len = line.size();
		let len = line.length;
		let i;
		for (i = 0; i < len && line[i] != ' ' && line[i] != '\t'; ++i) ;
		if (i == len) {
			fprintf(stderr, "Couldn't find whitespace on line\n");
			exit(-1);
		}
		if (i == 0) {
			fprintf(stderr, "Initial whitespace on line\n");
			exit(-1);
		}
//		string param_name(line, 0, i);
		let param_name = lines.substr(0, i);
//		let j = this.#GetParamIndex(param_name.c_str());
		let j = this.#GetParamIndex(param_name);
//		ParamType ptype = param_types_[j];
		let ptype = this.#param_types_[j];
		while (i < len && (line[i] == ' ' || line[i] == '\t')) ++i;
		if (i == len) {
			fprintf(stderr, "No value after whitespace on line\n");
			exit(-1);
		}
//		ParamValue v;
		let v = new ParamValue();
		v.set = true;
		if (ptype == P_STRING) {
//			v.s = string(line, i, len - i);
			v.s = line.substr(i, len-i);
		}
		else if (ptype == P_INT) {
//			if (sscanf(line + i, "%i", &v.i) != 1) {
			v.d = parseInt(line.slice(i));
			if (!Number.isFinite(v.d)) {
				fprintf(stderr, "Couldn't parse int value from line: %s\n", line);
				exit(-1);
			}
		}
		else if (ptype == P_DOUBLE) {
//			if (sscanf(line + i, "%lf", &v.d) != 1) {
			v.d = parseFloat(line.slice(i));
			if (!Number.isFinite(v.d)) {
				fprintf(stderr, "Couldn't parse double value from line: %s\n", line);
				exit(-1);
			}
		}
		else if (ptype == P_BOOLEAN) {
//			if (! strcmp(line + i, "true")) {
			if (line.slice(i) === "true")) {
				v.i = 1;
			}
//			else if (! strcmp(line + i, "false")) {
			else if (line.slice(i) === "false")) {
				v.i = 0;
			}
			else {
				fprintf(stderr, "Couldn't parse boolean value from line: %s\n", line);
				exit(-1);
			}
		}
		this.#param_values_[j] = v;
	}
}//»
GetStringValue(name) {//«
//string Params::GetStringValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_STRING) {
		fprintf(stderr, "Param %s not string\n", name);
		exit(-1);
	}
	return param_values_[i].s;
}//»
GetIntValue(name) {//«
//int Params::GetIntValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_INT) {
		fprintf(stderr, "Param %s not int\n", name);
		exit(-1);
	}
	return param_values_[i].i;
}//»
GetDoubleValue(name) {//«
//double Params::GetDoubleValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_DOUBLE) {
		fprintf(stderr, "Param %s not double\n", name);
		exit(-1);
	}
	return param_values_[i].d;
}//»
GetBooleanValue(name) {//«
//bool Params::GetBooleanValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_BOOLEAN) {
		fprintf(stderr, "Param %s not boolean\n", name);
		exit(-1);
	}
	return (bool)param_values_[i].i;
}//»
IsSet(name) {//«
//bool Params::IsSet(const char *name) const {
	let i = this.#GetParamIndex(name);
	return param_values_[i].set;
}//»

};//»

const CreateGameParams = () => {//«
//unique_ptr<Params> CreateGameParams(void) {
//	unique_ptr<Params> params(new Params());
	let params = new Params();
	params.AddParam("GameName", P_STRING);
	params.AddParam("NumRanks", P_INT);
	params.AddParam("NumSuits", P_INT);
	params.AddParam("StackSize", P_INT);
	params.AddParam("MaxStreet", P_INT);
	params.AddParam("NumHoleCards", P_INT);
	params.AddParam("NumFlopCards", P_INT);
	params.AddParam("Ante", P_INT);
	params.AddParam("SmallBlind", P_INT);
	params.AddParam("FirstToAct", P_STRING);
	params.AddParam("BigBlind", P_INT);
	params.AddParam("NumPlayers", P_INT);
	return params;
}//»

/*
enum ParamType {//«
  P_STRING,
  P_INT,
  P_DOUBLE,
  P_BOOLEAN
};//»
struct ParamValue {//«
  bool set;
  std::string s;
  int i;
  double d;
};//»
class Params {//«
public:
  Params(void);
  ~Params(void);
  void AddParam(const std::string &name, ParamType ptype);
  void ReadFromFile(const char *filename);
  bool IsSet(const char *name) const;
  std::string GetStringValue(const char *name) const;
  int GetIntValue(const char *name) const;
  double GetDoubleValue(const char *name) const;
  bool GetBooleanValue(const char *name) const;
private:
  int GetParamIndex(const char *name) const;

  std::vector<std::string> param_names_;
  std::vector<ParamType> param_types_;
  std::vector<ParamValue> param_values_;
};//»
*/


//»

//Game«
class Game{//«

#game_name_;
#max_street_;
#num_players_;
#num_ranks_;
#num_suits_;
#small_blind_;
#big_blind_;
#ante_;
#num_cards_in_deck_;
#num_card_permutations_;
#first_to_act_;
#num_cards_for_street_;
#num_hole_card_pairs_;
#num_board_cards_;

GameName() {return this.#game_name_;}
MaxStreet() {return this.#max_street_;}
NumPlayers() {return this.#num_players_;}
NumRanks() {return this.#num_ranks_;}
HighRank() {return this.#num_ranks_ - 1;}
NumSuits() {return this.#num_suits_;}
MaxCard() { return MakeCard(num_ranks_ - 1, num_suits_ - 1); }
FirstToAct(st) {return this.#first_to_act_[st];}
SmallBlind() {return this.#small_blind_;}
BigBlind() {return this.#big_blind_;}
Ante() {return this.#ante_;}
NumCardsForStreet(st){return this.#num_cards_for_street_[st];}
NumHoleCardPairs(st){return this.#num_hole_card_pairs_[st];}
NumBoardCards(st){return this.#num_board_cards_[st];}
NumCardsInDeck(void) {return num_cards_in_deck_;}

Initialize(params) {//«
	this.#game_name_ = params.GetStringValue("GameName");
	this.#max_street_ = params.GetIntValue("MaxStreet");
	this.#num_players_ = params.GetIntValue("NumPlayers");
	this.#num_ranks_ = params.GetIntValue("NumRanks");
	if (this.#num_ranks_ == 0) {
		fprintf(stderr, "There must be at least one rank\n");
		exit(-1);
	}
	this.#num_suits_ = params.GetIntValue("NumSuits");
	if (this.#num_suits_ == 0) {
		fprintf(stderr, "There must be at least one suit\n");
		exit(-1);
	}
	this.#num_cards_in_deck_ = this.#num_ranks_ * this.#num_suits_;
	vector<int> ftav;
	ParseInts(params.GetStringValue("FirstToAct"), &ftav);
	if ((int)ftav.size() != this.#max_street_ + 1) {
		fprintf(stderr, "Expected %i values in FirstToAct\n", this.#max_street_ + 1);
		exit(-1);
	}
	this.#first_to_act_.reset(new int[this.#max_street_ + 1]);
	for (let st = 0; st <= this.#max_street_; ++st) {
		this.#first_to_act_[st] = ftav[st];
	}
	this.#num_cards_for_street_.reset(new int[this.#max_street_ + 1]);
	this.#num_cards_for_street_[0] = params.GetIntValue("NumHoleCards");
	if (this.#max_street_ >= 1) {
		if (! params.IsSet("NumFlopCards")) {
			fprintf(stderr, "NumFlopCards param needs to be set\n");
			exit(-1);
		}
		this.#num_cards_for_street_[1] = params.GetIntValue("NumFlopCards");
	}
	if (this.#max_street_ >= 2) this.#num_cards_for_street_[2] = 1;
	if (this.#max_street_ >= 3) this.#num_cards_for_street_[3] = 1;
	this.#ante_ = params.GetIntValue("Ante");
	this.#small_blind_ = params.GetIntValue("SmallBlind");
	this.#big_blind_ = params.GetIntValue("BigBlind");

	// Calculate num_card_permutations_, the number of ways of dealing out
	// the cards to both players and the board.
	// This assumes a two player game.
	this.#num_card_permutations_ = 1ULL;
	let num_cards_left = this.#num_cards_in_deck_;
	for (let p = 0; p < 2; ++p) {
		let num_hole_cards = this.#num_cards_for_street_[0];
		let multiplier = 1;
		for (let n = (num_cards_left - num_hole_cards) + 1;
			n <= num_cards_left; ++n) {
			multiplier *= n;
		}
		this.#num_card_permutations_ *= multiplier / Factorial(num_hole_cards);
		num_cards_left -= num_hole_cards;
	}
	for (let s = 1; s <= this.#max_street_; ++s) {
		let num_street_cards = this.#num_cards_for_street_[s];
		let multiplier = 1;
		for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
			multiplier *= n;
		}
		this.#num_card_permutations_ *= multiplier / Factorial(num_street_cards);
		num_cards_left -= num_street_cards;
	}
	this.#num_hole_card_pairs_.reset(new int[this.#max_street_ + 1]);
	this.#num_board_cards_.reset(new int[this.#max_street_ + 1]);
	let num_board_cards = 0;
	for (let st = 0; st <= this.#max_street_; ++st) {
		if (st >= 1) num_board_cards += this.#num_cards_for_street_[st];
		this.#num_board_cards_[st] = num_board_cards;
		// Num cards left in deck after all board cards dealt
		let num_remaining = this.#num_cards_in_deck_ - num_board_cards;
		if (this.#num_cards_for_street_[0] == 2) {
			this.#num_hole_card_pairs_[st] = (num_remaining * (num_remaining - 1)) / 2;
		}
		else if (this.#num_cards_for_street_[0] == 1) {
			this.#num_hole_card_pairs_[st] = num_remaining;
		}
		else {
			fprintf(stderr, "Game::Game: Expected 1 or 2 hole cards\n");
			exit(-1);
		}
	}
}//»
StreetPermutations(street) {//«
// Assume the hole cards for each player have been dealt out and the board
// cards for any street prior to the given street.  How many ways of dealing
// out the next street are there?
let num_cards_left = this.#num_cards_in_deck_;
num_cards_left -= 2 * this.#num_cards_for_street_[0];
for (let s = 1; s < street; ++s) {
num_cards_left -= this.#num_cards_for_street_[s];
}
let num_street_cards = this.#num_cards_for_street_[street];
let multiplier = 1;
for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
multiplier *= n;
}
return multiplier / Factorial(num_street_cards);
}//»
StreetPermutations2(street) {//«
// Assume the hole cards for *ourselves only* have been dealt out and the board
// cards for any street prior to the given street.  How many ways of dealing
// out the next street are there?
  let num_cards_left = this.#num_cards_in_deck_;
  num_cards_left -= this.#num_cards_for_street_[0];
  for (let s = 1; s < street; ++s) {
    num_cards_left -= this.#num_cards_for_street_[s];
  }
  let num_street_cards = this.#num_cards_for_street_[street];
  let multiplier = 1;
  for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
    multiplier *= n;
  }
  return multiplier / Factorial(num_street_cards);
}//»
StreetPermutations3(street) {//«
// Assume only that the board cards for any street prior to the given street.  How many ways of
// dealing out the next street are there?
  let num_cards_left = this.#num_cards_in_deck_;
  for (let s = 1; s < street; ++s) {
    num_cards_left -= this.#num_cards_for_street_[s];
  }
  let num_street_cards = this.#num_cards_for_street_[street];
  let multiplier = 1;
  for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
    multiplier *= n;
  }
  return multiplier / Factorial(num_street_cards);
}//»
BoardPermutations(street) {//«
// Assume the hole cards for each player have been dealt out and the board
// cards for any street prior to the given street.  How many ways of dealing
// out the remainder of the board are there?
  let num_cards_left = this.#num_cards_in_deck_;
  num_cards_left -= 2 * this.#num_cards_for_street_[0];
  for (let s = 1; s < street; ++s) {
    num_cards_left -= this.#num_cards_for_street_[s];
  }
  let num_permutations = 1;
  for (let s = street; s <= this.#max_street_; ++s) {
    let num_street_cards = this.#num_cards_for_street_[s];
    let multiplier = 1;
    for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
      multiplier *= n;
    }
    num_permutations *= multiplier / Factorial(num_street_cards);
    num_cards_left -= num_street_cards;
  }
  return num_permutations;
}//»

}//»
//»

//Cards«


const OutputRank = (rank) => {//«
//void OutputRank(int rank) {
if (rank < 8) {
	printf("%i", rank + 2);
}
else if (rank == 8) {
	printf("T");
}
else if (rank == 9) {
	printf("J");
}
else if (rank == 10) {
	printf("Q");
}
else if (rank == 11) {
	printf("K");
}
else if (rank == 12) {
	printf("A");
}
else {
	fprintf(stderr, "Illegal rank %i\n", rank);
	exit(-1);
}
}//»
const OutputCard = (card) => {//«
//void OutputCard(Card card) {
	let rank = Math.floor(card / NUMSUITS);
	let suit = card % NUMSUITS;

	OutputRank(rank);
	switch (suit) {
		case 0: printf("c"); break;
		case 1: printf("d"); break;
		case 2: printf("h"); break;
		case 3: printf("s"); break;
		default: 
			fprintf(stderr, "Illegal suit\n");
			exit(-1);
	}
}//»
const CardName = (c, name) => {//«
//void CardName(Card c, string *name) {
  name = "";
  let rank = Math.floor(c / NUMSUITS);
  let suit = c % NUMSUITS;

  if (rank < 8) {
    name += rank + 50;
  }
  else if (rank == 8) {
    name += "T";
  }
  else if (rank == 9) {
    name += "J";
  }
  else if (rank == 10) {
    name += "Q";
  }
  else if (rank == 11) {
    name += "K";
  }
  else if (rank == 12) {
    name += "A";
  }
  switch (suit) {
  case 0:
    name += "c"; break;
  case 1:
    name += "d"; break;
  case 2:
    name += "h"; break;
  case 3:
    name += "s"; break;
  default:
    fprintf(stderr, "Illegal suit\n");
    exit(-1);
  }
}//»
const OutputTwoCards = (c1, c2) => {//«
//void OutputTwoCards(Card c1, Card c2) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
}//»
const OutputTwoCards = (cards) => {//«
//void OutputTwoCards(const Card *cards) {
  OutputTwoCards(cards[0], cards[1]);
}//»
const OutputThreeCards = (c1, c2, c3) => {//«
//void OutputThreeCards(Card c1, Card c2, Card c3) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
}//»
const OutputThreeCards = (cards) => {//«
//void OutputThreeCards(const Card *cards) {
  OutputThreeCards(cards[0], cards[1], cards[2]);
}//»
const OutputFourCards = (c1, c2, c3, c4) => {//«
//void OutputFourCards(Card c1, Card c2, Card c3, Card c4) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
}//»
const OutputFourCards = (cards) => {//«
//void OutputFourCards(const Card *cards) {
  OutputFourCards(cards[0], cards[1], cards[2], cards[3]);
}//»
const OutputFiveCards = (c1, c2, c3, c4, c5) => {//«
//void OutputFiveCards(Card c1, Card c2, Card c3, Card c4, Card c5) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
  printf(" ");
  OutputCard(c5);
}//»
const OutputFiveCards = (cards) => {//«
//void OutputFiveCards(const Card *cards) {
  OutputFiveCards(cards[0], cards[1], cards[2], cards[3], cards[4]);
}//»
const OutputSixCards = (c1, c2, c3, c4, c5, c6) => {//«
//void OutputSixCards(Card c1, Card c2, Card c3, Card c4, Card c5, Card c6) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
  printf(" ");
  OutputCard(c5);
  printf(" ");
  OutputCard(c6);
}//»
const OutputSixCards = (cards) => {//«
//void OutputSixCards(const Card *cards) {
  OutputSixCards(cards[0], cards[1], cards[2], cards[3], cards[4], cards[5]);
}//»
const OutputSevenCards = (c1, c2, c3, c4, c5, c6, c7) => {//«
//void OutputSevenCards(Card c1, Card c2, Card c3, Card c4, Card c5, Card c6, Card c7) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
  printf(" ");
  OutputCard(c5);
  printf(" ");
  OutputCard(c6);
  printf(" ");
  OutputCard(c7);
}//»
const OutputSevenCards = (cards) => {//«
//void OutputSevenCards(const Card *cards) {
  OutputSevenCards(cards[0], cards[1], cards[2], cards[3], cards[4], cards[5], cards[6]);
}//»
const OutputNCards = (cards, n) => {//«
//void OutputNCards(const Card *cards, int n) {
  for (let i = 0; i < n; ++i) {
    if (i > 0) printf(" ");
    OutputCard(cards[i]);
  }
}//»
const MakeCard = (rank, suit) => {//«
//Card MakeCard(int rank, int suit) {
//  return rank * Game::NumSuits() + suit;
//MaxCard -> 12, 3 = 12 * 4 + 3 => 51
	return rank * NUMSUITS + suit;
}//»
const ParseCard = (str) => {//«
//Card ParseCard(const char *str) {
  let c = str[0];
  let rank;
  if (c >= '0' && c <= '9') {
    rank = (c - '0') - 2;
  }
  else if (c == 'A') {
    rank = 12;
  }
  else if (c == 'K') {
    rank = 11;
  }
  else if (c == 'Q') {
    rank = 10;
  }
  else if (c == 'J') {
    rank = 9;
  }
  else if (c == 'T') {
    rank = 8;
  }
  else {
    fprintf(stderr, "Couldn't parse card rank\n");
    fprintf(stderr, "Str %s\n", str);
    exit(-1);
  }
  c = str[1];
  if (c == 'c') {
    return MakeCard(rank, 0);
  }
  else if (c == 'd') {
    return MakeCard(rank, 1);
  }
  else if (c == 'h') {
    return MakeCard(rank, 2);
  }
  else if (c == 's') {
    return MakeCard(rank, 3);
  }
  else {
    fprintf(stderr, "Couldn't parse card suit\n");
    fprintf(stderr, "Str %s\n", str);
    exit(-1);
  }
}//»
const ParseTwoCards = (str, space_separated, cards) => {//«
//void ParseTwoCards(const char *str, bool space_separated, Card *cards) {
	cards[0] = ParseCard(str);
	if (space_separated) {
//		cards[1] = ParseCard(str + 3);
		cards[1] = ParseCard(str.slice(3));
	}
	else {
//	cards[1] = ParseCard(str + 2);
		cards[1] = ParseCard(str.slice(2));
	}
}//»
const ParseThreeCards = (str, space_separated, cards) => {//«
//void ParseThreeCards(const char *str, bool space_separated, Card *cards) {
  cards[0] = ParseCard(str);
  if (space_separated) {
    cards[1] = ParseCard(str + 3);
    cards[2] = ParseCard(str + 6);
  }
  else {
    cards[1] = ParseCard(str + 2);
    cards[2] = ParseCard(str + 4);
  }
}//»
const ParseFourCards = (str, space_separated, cards) => {//«
//void ParseFourCards(const char *str, bool space_separated, Card *cards) {
  cards[0] = ParseCard(str);
  if (space_separated) {
    cards[1] = ParseCard(str + 3);
    cards[2] = ParseCard(str + 6);
    cards[3] = ParseCard(str + 8);
  }
  else {
    cards[1] = ParseCard(str + 2);
    cards[2] = ParseCard(str + 4);
    cards[3] = ParseCard(str + 6);
  }
}//»
const ParseFiveCards = (str, space_separated, cards) => {//«
//void ParseFiveCards(const char *str, bool space_separated, Card *cards) {
  cards[0] = ParseCard(str);
  if (space_separated) {
    cards[1] = ParseCard(str + 3);
    cards[2] = ParseCard(str + 6);
    cards[3] = ParseCard(str + 8);
    cards[4] = ParseCard(str + 12);
  }
  else {
    cards[1] = ParseCard(str + 2);
    cards[2] = ParseCard(str + 4);
    cards[3] = ParseCard(str + 6);
    cards[4] = ParseCard(str + 8);
  }
}//»
const InCards = (c, cards, num_cards) => {//«
//bool InCards(Card c, const Card *cards, int num_cards) {
  for (let i = 0; i < num_cards; ++i) if (c == cards[i]) return true;
  return false;
}//»
const MaxSuit = (board, num_board) => {//«
//int MaxSuit(Card *board, int num_board) {
  let max_suit = Suit(board[0]);
  for (let i = 1; i < num_board; ++i) {
    let s = Suit(board[i]);
    if (s > max_suit) max_suit = s;
  }
  return max_suit;
}//»

//»

//hand_evaluator«

class HandEvaluator {//«
constructor(){}
Create(name) {//«
//HandEvaluator *HandEvaluator::Create(const string &name) {
//	if (! strncmp(name.c_str(), "leduc", 5)) {
	if (name.match/^leduc/) {
		return new LeducHandEvaluator();
	}
	else {
	// Assume some form of Holdem if not leduc
		return new HoldemHandEvaluator();
	}
}//»
};//»

const kMaxHandVal = 775905;
const kStraightFlush = 775892;
const kQuads = 775723;
const kFullHouse = 775554;
const kFlush = 404261;
const kStraight = 404248;
const kThreeOfAKind = 402051;
const kTwoPair = 399854;
const kPair = 371293;
const kNoPair = 0;

// Values for four-card Holdem
const kH4MaxHandVal = 31109;
const kH4Quads = 31096;
const kH4ThreeOfAKind = 30927;
const kH4TwoPair = 30758;
const kH4Pair = 28561;
const kH4NoPair = 0;

class HoldemHandEvaluator {

#ranks_;
#suits_;
#rank_counts_;
#suit_counts_;

constructor(){//«
//	this.super();
	this.#ranks_ = new Array(7);
	this.#suits_ = new Array(7);
	this.#rank_counts_ = new Array(13);
	this.#suit_counts_ = new Array(4);
}//»
destroy(){//«
	delete this.#ranks_;
	delete this.#suits_;
	delete this.#rank_counts_;
	delete this.#suit_counts_;
}//»

EvaluateTwo(cards) {//«
//int HoldemHandEvaluator::EvaluateTwo(Card *cards) {
// Return values between 0 and 90
	let r0 = Math.floor(cards[0] / NUMSUITS);
	let r1 = Math.floor(cards[1] / NUMSUITS);
	if (r0 == r1) {
		return 78 + r0;
	}
	let hr, lr;
	if (r0 > r1) {hr = r0; lr = r1;}
	else {hr = r1; lr = r0;}
	if (hr == 1) {
		return 0;       // 0
	}
	else if (hr == 2) {
		return 1 + lr;  // 1-2
	}
	else if (hr == 3) {
		return 3 + lr;  // 3-5
	}
	else if (hr == 4) {
		return 6 + lr;  // 6-9
	}
	else if (hr == 5) {
		return 10 + lr; // 10-14
	}
	else if (hr == 6) {
		return 15 + lr; // 15-20
	}
	else if (hr == 7) {
		return 21 + lr; // 21-27
	}
	else if (hr == 8) {
		return 28 + lr; // 28-35
	}
	else if (hr == 9) {
		return 36 + lr; // 36-44
	}
	else if (hr == 10) {
		return 45 + lr; // 45-54
	}
	else if (hr == 11) {
		return 55 + lr; // 55-65
	}
	else { // hr == 12
		return 66 + lr; // 66-77
	}
}//»
EvaluateThree(cards) {//«
//int HoldemHandEvaluator::EvaluateThree(Card *cards) {
// Returns values between 0 and 2378 (inclusive)
// 13 trips - 2366-2378
// 169 (13 * 13) pairs (some values not possible) - 2197 - 2365
// 2197 no-pairs (some values not possible) - 0...2196
	let r0 = Math.floor(cards[0] / NUMSUITS);
	let r1 = Math.floor(cards[1] / NUMSUITS);
	let r2 = Math.floor(cards[2] / NUMSUITS);
	if (r0 == r1 && r1 == r2) {
		return 2366 + r0;
	}
	else if (r0 == r1 || r0 == r2 || r1 == r2) {
		let pr_rank, kicker;
		if (r0 == r1) {
			pr_rank = r0;
			kicker = r2;
		}
		else if (r0 == r2) {
			pr_rank = r0;
			kicker = r1;
		}
		else {
			pr_rank = r1;
			kicker = r0;
		}
		return 2197 + pr_rank * 13 + kicker;
	}
	else {
		let hr, mr, lr;
		if (r0 > r1) {
			if (r1 > r2) {
				hr = r0; mr = r1; lr = r2;
			}
			else if (r0 > r2) {
				hr = r0; mr = r2; lr = r1;
			}
			else {
				hr = r2; mr = r0; lr = r1;
			}
		}
		else if (r0 > r2) {
			hr = r1; mr = r0; lr = r2;
		}
		else if (r2 > r1) {
			hr = r2; mr = r1; lr = r0;
		}
		else {
			hr = r1; mr = r2; lr = r0;
		}
		return hr * 169 + mr * 13 + lr;
	}
}//»
EvaluateFour(cards) {//«
//int HoldemHandEvaluator::EvaluateFour(Card *cards) {
// Return values between 0 and 31108
// 31096...31108: quads
// 30927...31095: three-of-a-kind
// 30758...30926: two-pair
// 28561...30757: pair
// 0...28560:     no-pair
// Next 715 (?) for no-pair
	for (let r = 0; r <= 12; ++r) rank_counts_[r] = 0;
	for (let i = 0; i < 4; ++i) {
		++rank_counts_[Math.floor(cards[i] / NUMSUITS)];
	}
	let pair_rank1 = -1, pair_rank2 = -1;
	for (let r = 12; r >= 0; --r) {
		if (rank_counts_[r] == 4) {
			return kH4Quads + r;
		}
		else if (rank_counts_[r] == 3) {
			let kicker = -1;
			for (let r = 12; r >= 0; --r) {
				if (rank_counts_[r] == 1) {
					kicker = r;
					break;
				}
			}
			return kH4ThreeOfAKind + 13 * r + kicker;
		}
		else if (rank_counts_[r] == 2) {
			if (pair_rank1 == -1) {
				pair_rank1 = r;
			}
			else {
				pair_rank2 = r;
				break;
			}
		}
	}
	if (pair_rank2 >= 0) {
		return pair_rank1 * 13 + pair_rank2 + kH4TwoPair;
	}
	if (pair_rank1 >= 0) {
		let kicker1 = -1, kicker2 = -1;
		for (let r = 12; r >= 0; --r) {
			if (rank_counts_[r] == 1) {
				if (kicker1 == -1) {
					kicker1 = r;
				}
				else {
					kicker2 = r;
					break;
				}
			}
		}
		return pair_rank1 * 169 + kicker1 * 13 + kicker2 + kH4Pair;
	}
	let kicker1 = -1, kicker2 = -1, kicker3 = -1, kicker4 = -1;
	for (let r = 12; r >= 0; --r) {
		if (rank_counts_[r] == 1) {
			if (kicker1 == -1) kicker1 = r;
			else if (kicker2 == -1) kicker2 = r;
			else if (kicker3 == -1) kicker3 = r;
			else kicker4 = r;
		}
	}
	return kicker1 * 2197 + kicker2 * 169 + kicker3 * 13 + kicker4;
}//»
Evaluate(cards, num_cards) {//«
//int HoldemHandEvaluator::Evaluate(Card *cards, int num_cards) {
//The tests for num_cards near the bottom don't make sense because of theses tests 
	if (num_cards == 2) {
		return this.EvaluateTwo(cards);
	}
	else if (num_cards == 3) {
		return this.EvaluateThree(cards);
	}
	else if (num_cards == 4) {
		return this.EvaluateFour(cards);
	}
//5 or more
//	for (let r = 0; r <= 12; ++r) this.#rank_counts_[r] = 0;
	this.#rank_counts_ = new Array(12);
	this.#rank_counts_.fill(0);
//	for (let s = 0; s < 4; ++s) this.#suit_counts_[s] = 0;
	this.#suit_counts_ = new Array(4);
	this.#suit_counts_.fill(0);
	for (let i = 0; i < num_cards; ++i) {//«
		let c = cards[i];
		let r = Math.floor(c / NUMSUITS);
		this.#ranks_[i] = r;
		++this.#rank_counts_[r];
		let s = c % NUMSUITS;
		this.#suits_[i] = s;
		++this.#suit_counts_[s];
	}//»
	let flush_suit = -1;
	for (let s = 0; s < 4; ++s) {//«
		if (this.#suit_counts_[s] >= 5) {
			flush_suit = s;
			break;
		}
	}//»
	// Need to handle straights with ace as low
	let r = 12;
	let straight_rank = -1;
	while (true) {//«
	// See if there are 5 ranks (r, r-1, r-2, etc.) such that there is at
	// least one card in each rank.  In other words, there is an r-high
	// straight.
// Rank(5) => r=3
		let r1 = r;
		let end = r - 4;
//Straight test
		if (end > -1) {//Standard consecutive straight (A-high to 6-high)«
			while (r1 >= end && (r1 > -1 && this.#rank_counts_[r1] > 0)) {
				--r1;
			}
		}
		else {//Quick test for 5-high straight
			if (
				this.#rank_counts_[3] > 0 && //5
				this.#rank_counts_[2] > 0 && //4
				this.#rank_counts_[1] > 0 && //3
				this.#rank_counts_[0] > 0 && //2
				this.#rank_counts_[12] > 0   //A
			) { 
				r1 = -2;  // -1 - 1 => -1 + -1 => -2
			}
		}//»

		if (r1 == end - 1) {// We found a straight«
			if (flush_suit >= 0) {// There is a flush on the board«
				if (straight_rank == -1) straight_rank = r;
				// Need to check for straight flush.  Count how many cards between
				// end and r are in the flush suit.
				let num = 0;
				for (let i = 0; i < num_cards; ++i) {
					if (this.#suits_[i] == flush_suit && 
						((this.#ranks_[i] >= end && this.#ranks_[i] <= r) || 
						(end == -1 && this.#ranks_[i] == 12))
					) {// This assumes we have no duplicate cards in input
						++num;
					}
				}
				if (num == 5) {
					return kStraightFlush + r;
				}
				// Can't break yet - there could be a straight flush at a lower rank
				// Can only decrement r by 1.  (Suppose cards are: 4c5c6c7c8c9s.)
				--r;
				if (r < 3) break;
			}//»
			else {
				straight_rank = r;
				break;
			}
		}//»
		else {
		// If we get here, there was no straight ending at r.  We know there
		// are no cards with rank r1.  Therefore r can jump to r1 - 1.
			r = r1 - 1;
			if (r < 3) break;//There are no 4-high straights
		}
	}//»
	let three_rank = -1;
	let pair_rank = -1;
	let pair2_rank = -1;
	for (let r = 12; r >= 0; --r) {//«
		let ct = this.#rank_counts_[r];
		if (ct == 4) {//«
			let hr = -1;
			for (let i = 0; i < num_cards; ++i) {
				let r1 = this.#ranks_[i];
				if (r1 != r && r1 > hr) hr = r1;
			}
			return kQuads + r * 13 + hr;
		}//»
		else if (ct == 3) {//«
			if (three_rank == -1) {
				three_rank = r;
			}
			else if (pair_rank == -1) {//If testing >5 cards, we can have 3 trips, but the lower one gets demoted to the pair to make up a full house
				pair_rank = r;
			}
		}//»
		else if (ct == 2) {//«
			if (pair_rank == -1) {
				pair_rank = r;
			}
			else if (pair2_rank == -1) {
				pair2_rank = r;
			}
		}//»
	}//»
	if (three_rank >= 0 && pair_rank >= 0) return kFullHouse + three_rank * 13 + pair_rank;
	if (flush_suit >= 0) {//«
		let hr1 = -1, hr2 = -1, hr3 = -1, hr4 = -1, hr5 = -1;
		for (let i = 0; i < num_cards; ++i) {
			if (this.#suits_[i] == flush_suit) {
				let r = this.#ranks_[i];
				if (r > hr1) {
					hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = hr1; hr1 = r;
				}
				else if (r > hr2) {
					hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = r;
				}
				else if (r > hr3) {
					hr5 = hr4; hr4 = hr3; hr3 = r;
				}
				else if (r > hr4) {
					hr5 = hr4; hr4 = r;
				}
				else if (r > hr5) {
					hr5 = r;
				}
			}
		}
		return kFlush + hr1 * 28561 + hr2 * 2197 + hr3 * 169 + hr4 * 13 + hr5;
	}//»
	if (straight_rank >= 0) return kStraight + straight_rank;
	if (three_rank >= 0) {//«
		let hr1 = -1, hr2 = -1;
		for (let i = 0; i < num_cards; ++i) {//Sort
			let r = this.#ranks_[i];
			if (r != three_rank) {
				if (r > hr1) {
					hr2 = hr1; hr1 = r;
				}
				else if (r > hr2) {
					hr2 = r;
				}
			}
		}
/*«
		if (num_cards == 3) {
			// No kicker
			return kThreeOfAKind + three_rank * 169;
		}
		else if (num_cards == 4) {
			// Only one kicker
			return kThreeOfAKind + three_rank * 169 + hr1 * 13;
		}
		else {
			// Two kickers
			return kThreeOfAKind + three_rank * 169 + hr1 * 13 + hr2;
		}
»*/
		return kThreeOfAKind + three_rank * 169 + hr1 * 13 + hr2;
	}//»
	if (pair2_rank >= 0) {//«
		let hr1 = -1;
		for (let i = 0; i < num_cards; ++i) {//Sort
			let r = this.#ranks_[i];
			if (r != pair_rank && r != pair2_rank && r > hr1) hr1 = r;
		}
/*«
		if (num_cards < 5) {
			// No kicker
			return kTwoPair + pair_rank * 169 + pair2_rank * 13;
		}
		else {
			// Encode two pair ranks plus kicker
			return kTwoPair + pair_rank * 169 + pair2_rank * 13 + hr1;
		}
»*/
		return kTwoPair + pair_rank * 169 + pair2_rank * 13 + hr1;
	}//»
	if (pair_rank >= 0) {//«
		let hr1 = -1, hr2 = -1, hr3 = -1;
		for (let i = 0; i < num_cards; ++i) {//Sort
			let r = this.#ranks_[i];
			if (r != pair_rank) {
				if (r > hr1) {
					hr3 = hr2; hr2 = hr1; hr1 = r;
				}
				else if (r > hr2) {
					hr3 = hr2; hr2 = r;
				}
				else if (r > hr3) {
					hr3 = r;
				}
			}
		}
		if (num_cards == 3) {
			// One kicker
			return kPair + pair_rank * 2197 + hr1 * 169;
		}
		else if (num_cards == 4) {
			// Two kickers
			return kPair + pair_rank * 2197 + hr1 * 169 + hr2 * 13;
		}
		else {
			// Three kickers
			return kPair + pair_rank * 2197 + hr1 * 169 + hr2 * 13 + hr3;
		}
	}//»

	let hr1 = -1, hr2 = -1, hr3 = -1, hr4 = -1, hr5 = -1;
	for (let i = 0; i < num_cards; ++i) {//Sort«
		let r = this.#ranks_[i];
		if (r > hr1) {
			hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = hr1; hr1 = r;
		}
		else if (r > hr2) {
			hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = r;
		}
		else if (r > hr3) {
			hr5 = hr4; hr4 = hr3; hr3 = r;
		}
		else if (r > hr4) {
			hr5 = hr4; hr4 = r;
		}
		else if (r > hr5) {
			hr5 = r;
		}
	}//»
/*«
	if (num_cards == 3) {//Can't get here
		// Encode top three ranks
		return kNoPair + hr1 * 28561 + hr2 * 2197 + hr3 * 169;
	}
	else if (num_cards == 4) {//Can't get here
		// Encode top four ranks
		return kNoPair + hr1 * 28561 + hr2 * 2197 + hr3 * 169 + hr4 * 13;
	}
	else {
		// Encode top five ranks
		return kNoPair + hr1 * 28561 + hr2 * 2197 + hr3 * 169 + hr4 * 13 + hr5;
	}
»*/
	return kNoPair + hr1 * 28561 + hr2 * 2197 + hr3 * 169 + hr4 * 13 + hr5;
}//»

}


//»
//build_hand_value_tree«

//Headers«

//#include "files.h"
//#include "game_params.h"
//#include "hand_evaluator.h"
//#include "io.h"
//#include "params.h"

//»
const DealOneCard = () => {//«
//const DealOneCard = (void) => {
	let max_card = Game.MaxCard();//51
	let c1;
//	int *tree = new int[max_card + 1];
	let tree = new Array(max_card + 1);// 51 + 1
	for (c1 = 0; c1 <= max_card; ++c1) {
//WIJGLM
		tree[c1] = Math.floor(c1 / NUMSUITS);
	}
//	char fname[500];
//	let fname = new Array(500);
//	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.1", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let fname = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.1"`;
//	Writer writer(fname);
	let writer = new Writer(fname);
	for (int i1 = 0; i1 <= max_card; ++i1) {
		writer.WriteInt(tree[i1]);
	}
}//»
const DealTwoCards = (he) => {//«
//const DealTwoCards = (HandEvaluator *he) => {
	let max_card = Game.MaxCard();
//  Card cards[2];
	let cards = new Array(2);
	let c1, c2;
//	int **tree = new int *[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 1; c1 <= max_card; ++c1) {
		cards[0] = c1;
//		int *tree1 = new int[i1];
		let tree1 = new Array(c1);
		tree[c1] = tree1;
		for (c2 = 0; c2 < c1; ++c2) {
			cards[1] = c2;
			tree1[c2] = he.Evaluate(cards, 2);
		}
	}
//	char fname[500];
//	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.2", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let fname = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.2"`;
//	Writer writer(fname);
	let writer = new Writer(fname);
	for (int i1 = 1; i1 <= max_card; ++i1) {
		int *tree1 = tree[i1];
		for (int i2 = 0; i2 < i1; ++i2) {
			writer.WriteInt(tree1[i2]);
		}
	}
}//»
const DealThreeCards = (he) => {//«
/*
void HandValueTree::ReadThree(void) {//«
	int max_card = Game::MaxCard();
	char fname[500];
	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.3", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	Reader reader(fname);
	int num_cards = max_card + 1;
	tree3_ = new int **[num_cards];//This is private to HandValueTree
	for (int i = 0; i < num_cards; ++i) tree3_[i] = NULL;
	for (int i1 = 2; i1 < num_cards; ++i1) {
		int **tree1 = new int *[i1];
		tree3_[i1] = tree1;
		for (int i2 = 1; i2 < i1; ++i2) {
			int *tree2 = new int[i2];
			tree1[i2] = tree2;
			for (int i3 = 0; i3 < i2; ++i3) {
				tree2[i3] = reader.ReadIntOrDie();
			}
		}
	}
}//»
*/
	let max_card = Game.MaxCard();
	//  Card cards[3];
	let cards = new Array(3);
	let c1, c2, c3;
//	int ***tree = new int **[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 2; c1 <= max_card; ++c1) {
		cards[0] = c1;
//	int **tree1 = new int *[c1];
		let tree1 = new Array(c1);
		tree[c1] = tree1;
		for (c2 = 1; c2 < c1; ++c2) {
			cards[1] = c2;
//	int *tree2 = new int [c2];
			let tree2 = new Array(c2);
			tree1[c2] = tree2;
			for (c3 = 0; c3 < c2; ++c3) {
				cards[2] = c3;
				tree2[c3] = he.Evaluate(cards, 3);
			}
		}
	}
//	char fname[500];
//	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.3", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let fname = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.3"`;
//	Writer writer(fname);
	let writer = new Writer(fname);
	for (int i1 = 2; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 1; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 0; i3 < i2; ++i3) {
				writer.WriteInt(tree2[i3]);
			}
		}
	}
}//»
const DealFourCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[4];
	let cards = new Array(4);
	let c1, c2, c3, c4;
// int ****tree = new int ***[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 3; c1 <= max_card; ++c1) {
		cards[0] = c1;
// int ***tree1 = new int **[i1];
		let tree1 = new Array(c1);
		tree[c1] = tree1;
		for (c2 = 2; c2 < c1; ++c2) {
			cards[1] = c2;
// int **tree2 = new int *[i2];
			let tree2 = new Array(c2);
			tree1[c2] = tree2;
			for (c3 = 1; c3 < c2; ++c3) {
				cards[2] = c3;
// int *tree3 = new int [i3];
				let tree3 = new Array(c3);
				tree2[c3] = tree3;
				for (c4 = 0; c4 < c3; ++c4) {
					cards[3] = c4;
					tree3[c4] = he.Evaluate(cards, 4);
				}
			}
		}
	}
//	char fname[500];
//	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.4", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let fname = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.4"`;
	let writer = new Writer(fname);
//	Writer writer(fname);
	for (int i1 = 3; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 2; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 1; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 0; i4 < i3; ++i4) {
					writer.WriteInt(tree3[i4]);
				}
			}
		}
	}
}//»
// Is this Holdem specific?
const DealFiveCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[7];
	let cards = new Array(7);
	let c1, c2, c3, c4, c5;
// int *****tree = new int ****[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 4; c1 <= max_card; ++c1) {
		cards[0] = c1;
// int ****tree1 = new int ***[i1];
		let tree1 = new Array(c1);
		tree[c1] = tree1;
		for (c2 = 3; c2 < c1; ++c2) {
			cards[1] = c2;
// int ***tree2 = new int **[i2];
			let tree2 = new Array(c2);
			tree1[c2] = tree2;
			for (c3 = 2; c3 < c2; ++c3) {
				cards[2] = c3;
// int **tree3 = new int *[i3];
				let tree3 = new Array(c3);
				tree2[c3] = tree3;
				for (c4 = 1; c4 < c3; ++c4) {
					cards[3] = c4;
// int *tree4 = new int [i4];
					let tree4 = new Array(c4);
					tree3[c4] = tree4;
					for (c5 = 0; c5 < c4; ++c5) {
						cards[4] = c5;
						tree4[c5] = he.Evaluate(cards, 5);
					}
				}
			}
		}
	}
//	char fname[500];
//	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.5", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let fname = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.5"`;
//	Writer writer(fname);
	let writer = new Writer(fname);
	for (int i1 = 4; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 3; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 2; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 1; i4 < i3; ++i4) {
					let tree4 = tree3[i4];
					for (int i5 = 0; i5 < i4; ++i5) {
						writer.WriteInt(tree4[i5]);
					}
				}
			}
		}
	}
}//»
const DealSixCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[7];
// int ******tree = new int *****[max_card + 1];
	let cards = new Array(7);
	let c1, c2, c3, c4, c5, c6;
	let tree = new Array(max_card + 1);
	for (c1 = 5; c1 <= max_card; ++c1) {
		cards[0] = c1;
// int *****tree1 = new int ****[i1];
		let tree1 = new Array(c1);
		tree[c1] = tree1;
		for (c2 = 4; c2 < c1; ++c2) {
			cards[1] = c2;
// int ****tree2 = new int ***[i2];
			let tree2 = new Array(c2);
			tree1[c2] = tree2;
			for (c3 = 3; c3 < c2; ++c3) {
				cards[2] = c3;
// int ***tree3 = new int **[i3];
				let tree3 = new Array(c3);
				tree2[c3] = tree3;
				for (c4 = 2; c4 < c3; ++c4) {
					cards[3] = c4;
// int **tree4 = new int *[i4];
					let tree4 = new Array(c4);
					tree3[c4] = tree4;
					for (c5 = 1; c5 < c4; ++c5) {
						cards[4] = c5;
// int *tree5 = new int [i5];
						let tree5 = new Array(c5);
						tree4[c5] = tree5;
						for (c6 = 0; c6 < c5; ++c6) {
							cards[5] = c6;
							tree5[c6] = he.Evaluate(cards, 6);
						}
					}
				}
			}
		}
	}
//	char fname[500];
//	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.6", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let fname = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.6"`;
//	Writer writer(fname);
	let writer = new Writer(fname);
	for (int i1 = 5; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 4; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 3; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 2; i4 < i3; ++i4) {
					let tree4 = tree3[i4];
					for (int i5 = 1; i5 < i4; ++i5) {
						let tree5 = tree4[i5];
						for (int i6 = 0; i6 < i5; ++i6) {
							writer.WriteInt(tree5[i6]);
						}
					}
				}
			}
		}
	}
}//»
// This is not as general as it could be.  Holdem specific.
const DealSevenCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[7];
	let cards = new Array(7);
	let c1, c2, c3, c4, c5, c6, c7;
// int *******tree = new int ******[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 6; c1 <= max_card; ++c1) {
		cards[0] = c1;
// int ******tree1 = new int *****[i1];
		let tree1 = new Array(c1);
		tree[c1] = tree1;
		for (c2 = 5; c2 < c1; ++c2) {
			cards[1] = c2;
// int *****tree2 = new int ****[i2];
			let tree2 = new Array(c2);
			tree1[c2] = tree2;
			for (c3 = 4; c3 < c2; ++c3) {
				cards[2] = c3;
// int ****tree3 = new int ***[i3];
				let tree3 = new Array(c3);
				tree2[c3] = tree3;
				for (c4 = 3; c4 < c3; ++c4) {
					cards[3] = c4;
// int ***tree4 = new int **[i4];
					let tree4 = new Array(c4);
					tree3[c4] = tree4;
					for (c5 = 2; c5 < c4; ++c5) {
						cards[4] = c5;
// int **tree5 = new int *[i5];
						let tree5 = new Array(c5);
						tree4[c5] = tree5;
						for (c6 = 1; c6 < c5; ++c6) {
							cards[5] = c6;
// int *tree6 = new int [i6];
							let tree6 = new Array(c6);
							tree5[c6] = tree6;
							for (c7 = 0; c7 < c6; ++c7) {
								cards[6] = c7;
								tree6[c7] = he.Evaluate(cards, 7);
							}
						}
					}
				}
			}
		}
	}
//	char fname[500];
//	sprintf(fname, "%s/hand_value_tree.%s.%i.%i.7", Files::StaticBase(),Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let fname = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.7"`;
	let writer = new Writer(fname);
//	Writer writer(fname);
	for (int i1 = 6; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 5; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 4; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 3; i4 < i3; ++i4) {
					let tree4 = tree3[i4];
					for (int i5 = 2; i5 < i4; ++i5) {
						let tree5 = tree4[i5];
						for (int i6 = 1; i6 < i5; ++i6) {
							let tree6 = tree5[i6];
							for (int i7 = 0; i7 < i6; ++i7) {
								writer.WriteInt(tree6[i7]);
							}
						}
					}
				}
			}
		}
	}
}//»
const Usage = (prog_name) => {//«
	fprintf(stderr, "USAGE: %s <config file>\n", prog_name);
	exit(-1);
}//»
const main = (argc, argv) => {//«
//int main(int argc, char *argv[]) {
	if (argc != 2) Usage(argv[0]);
	Files::Init();
	unique_ptr<Params> game_params = CreateGameParams();
	game_params->ReadFromFile(argv[1]);
	Game::Initialize(*game_params);

	HandEvaluator *he = HandEvaluator::Create(Game::GameName());
	int num_cards = 0;
	for (int s = 0; s <= Game::MaxStreet(); ++s) {
		num_cards += Game::NumCardsForStreet(s);
	}
	if (num_cards == 1) {
		DealOneCard();
	}
	else if (num_cards == 2) {
		DealTwoCards(he);
	}
	else if (num_cards == 3) {
		DealThreeCards(he);
	}
	else if (num_cards == 4) {
		DealFourCards(he);
	}
	else if (num_cards == 5) {
		DealFiveCards(he);
	}
	else if (num_cards == 6) {
		DealSixCards(he);
	}
	else if (num_cards == 7) {
		DealSevenCards(he);
	}
	else {
		fprintf(stderr, "Unsupported number of cards: %u\n", num_cards);
		exit(-1);
	}
	delete he;
}//»

//»

//Commands«

const com_slum= class extends Com{
	init(){
	}
	run(){
		const {args}=this;
		this.ok();
	}
}

//»

const coms = {//«
slum: com_slum
}//»

export {coms};





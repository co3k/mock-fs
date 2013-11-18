var path = require('path');

var mock = require('../../lib/index');
var assert = require('../helper').assert;

describe('The API', function() {

  describe('fs()', function() {

    it('configures a fs module with a mock file system', function(done) {

      var fs = mock.fs({
        'path/to/file.txt': 'file content'
      });

      fs.exists('path/to/file.txt', function(exists) {
        assert.isTrue(exists);
        done();
      });

    });

    it('accepts an arbitrary nesting of files and directories', function() {

      var fs = mock.fs({
        'dir-one': {
          'dir-two': {
            'some-file.txt': 'file content here'
          }
        },
        'empty-dir': {}
      });

      assert.isTrue(fs.existsSync('dir-one/dir-two/some-file.txt'));
      assert.isTrue(fs.statSync('dir-one/dir-two/some-file.txt').isFile());
      assert.isTrue(fs.statSync('dir-one/dir-two').isDirectory());
      assert.isTrue(fs.statSync('empty-dir').isDirectory());

    });

    describe('_reconfigure()', function() {

      it('provides a method to reconfigure the mock file system', function() {

        var fs = mock.fs({
          'first-file.txt': 'file content'
        });
        assert.isTrue(fs.existsSync('first-file.txt'));

        fs._reconfigure({
          'second-file.txt': 'new content'
        });

        assert.isFalse(fs.existsSync('first-file.txt'));
        assert.isTrue(fs.existsSync('second-file.txt'));

      });

    });

  });

  describe('file()', function() {

    it('lets you create files with additional properties', function(done) {

      var fs = mock.fs({
        'path/to/file.txt': mock.file({
          content: 'file content',
          mtime: new Date(8675309),
          mode: 0644
        })
      });

      fs.stat('path/to/file.txt', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isTrue(stats.isFile());
        assert.isFalse(stats.isDirectory());
        assert.equal(stats.mtime.getTime(), 8675309);
        assert.equal(stats.mode & 0777, 0644);
        done();
      });

    });

  });

  describe('directory()', function() {

    it('lets you create directories with more properties', function(done) {

      var fs = mock.fs({
        'path/to/dir': mock.directory({
          mtime: new Date(8675309),
          mode: 0644
        })
      });

      fs.stat('path/to/dir', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isFalse(stats.isFile());
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mtime.getTime(), 8675309);
        assert.equal(stats.mode & 0777, 0644);
        done();
      });

    });

  });

});

describe('fs.exists(path, callback)', function() {

  var fs;
  beforeEach(function() {
    fs = mock.fs({
      'path/to/a.bin': new Buffer([1, 2, 3]),
      'empty': {},
      'nested': {
        'dir': {
          'file.txt': ''
        }
      }
    });
  });

  it('calls with true if file exists', function(done) {
    fs.exists(path.join('path', 'to', 'a.bin'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if directory exists', function(done) {
    fs.exists('path', function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if empty directory exists', function(done) {
    fs.exists('empty', function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if nested directory exists', function(done) {
    fs.exists(path.join('nested', 'dir'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if file exists', function(done) {
    fs.exists(path.join('path', 'to', 'a.bin'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if empty file exists', function(done) {
    fs.exists(path.join('nested', 'dir', 'file.txt'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with false for bogus path', function(done) {
    fs.exists(path.join('bogus', 'path'), function(exists) {
      assert.isFalse(exists);
      done();
    });
  });

  it('calls with false for bogus path (II)', function(done) {
    fs.exists(path.join('nested', 'dir', 'none'), function(exists) {
      assert.isFalse(exists);
      done();
    });
  });

});


describe('fs.existsSync(path)', function() {

  var fs;
  beforeEach(function() {
    fs = mock.fs({
      'path/to/a.bin': new Buffer([1, 2, 3]),
      'empty': {},
      'nested': {
        'dir': {
          'file.txt': ''
        }
      }
    });
  });

  it('returns true if file exists', function() {
    assert.isTrue(fs.existsSync(path.join('path', 'to', 'a.bin')));
  });

  it('returns true if directory exists', function() {
    assert.isTrue(fs.existsSync('path'));
  });

  it('returns true if empty directory exists', function() {
    assert.isTrue(fs.existsSync('empty'));
  });

  it('returns true if nested directory exists', function() {
    assert.isTrue(fs.existsSync(path.join('nested', 'dir')));
  });

  it('returns true if file exists', function() {
    assert.isTrue(fs.existsSync(path.join('path', 'to', 'a.bin')));
  });

  it('returns true if empty file exists', function() {
    assert.isTrue(fs.existsSync(path.join('nested', 'dir', 'file.txt')));
  });

  it('returns false for bogus path', function() {
    assert.isFalse(fs.existsSync(path.join('bogus', 'path')));
  });

  it('returns false for bogus path (II)', function() {
    assert.isFalse(fs.existsSync(path.join('nested', 'dir', 'none')));
  });

});

describe('fs.readdirSync(path)', function() {

  var fs;
  beforeEach(function() {
    fs = mock.fs({
      'path/to/file.txt': 'file content',
      'nested': {
        'sub': {
          'dir': {
            'one.txt': 'one content',
            'two.txt': 'two content',
            'empty': {}
          }
        }
      }
    });
  });

  it('lists directory contents', function() {
    var items = fs.readdirSync(path.join('path', 'to'));
    assert.isArray(items);
    assert.deepEqual(items, ['file.txt']);
  });

  it('lists nested directory contents', function() {
    var items = fs.readdirSync(path.join('nested', 'sub', 'dir'));
    assert.isArray(items);
    assert.deepEqual(items, ['empty', 'one.txt', 'two.txt']);
  });

  it('throws for bogus path', function() {
    assert.throws(function() {
      fs.readdirSync('bogus');
    });
  });

});


describe('fs.readdir(path, callback)', function() {

  var fs;
  beforeEach(function() {
    fs = mock.fs({
      'path/to/file.txt': 'file content',
      'nested': {
        'sub': {
          'dir': {
            'one.txt': 'one content',
            'two.txt': 'two content',
            'empty': {}
          }
        }
      }
    });
  });

  it('lists directory contents', function(done) {
    fs.readdir(path.join('path', 'to'), function(err, items) {
      assert.isNull(err);
      assert.isArray(items);
      assert.deepEqual(items, ['file.txt']);
      done();
    });
  });

  it('lists nested directory contents', function(done) {
    fs.readdir(path.join('nested', 'sub', 'dir'), function(err, items) {
      assert.isNull(err);
      assert.isArray(items);
      assert.deepEqual(items, ['empty', 'one.txt', 'two.txt']);
      done();
    });
  });

  it('calls with an error for bogus path', function(done) {
    fs.readdir('bogus', function(err, items) {
      assert.instanceOf(err, Error);
      assert.isUndefined(items);
      done();
    });
  });

});

describe('fs.readdirSync(path)', function() {

  var fs;
  beforeEach(function() {
    fs = mock.fs({
      'path/to/file.txt': 'file content',
      'nested': {
        'sub': {
          'dir': {
            'one.txt': 'one content',
            'two.txt': 'two content',
            'empty': {}
          }
        }
      }
    });
  });

  it('lists directory contents', function() {
    var items = fs.readdirSync(path.join('path', 'to'));
    assert.isArray(items);
    assert.deepEqual(items, ['file.txt']);
  });

  it('lists nested directory contents', function() {
    var items = fs.readdirSync(path.join('nested', 'sub', 'dir'));
    assert.isArray(items);
    assert.deepEqual(items, ['empty', 'one.txt', 'two.txt']);
  });

  it('throws for bogus path', function() {
    assert.throws(function() {
      fs.readdirSync('bogus');
    });
  });

});
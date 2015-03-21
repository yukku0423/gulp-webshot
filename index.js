var gutil = require('gulp-util');
var through = require('through2');
var webshot = require('webshot');
var path = require("path");
var fs = require("fs");
var connect = require("connect");
var serveStatic = require('serve-static');


module.exports = function(opt){

    if (!opt) {
            opt = {};
     }
    
    opt.p = opt.p || 9000 ;  

    var app = connect() 
    app.use(serveStatic(opt.root));

    var server = app.listen(opt.p);

    if( opt.incremental ){
      // IMPROVE: be better code
      var saveDir = opt.dest.replace(/\/$/, '');

      fs.readdir(saveDir, function(err, dirs){
        if (err && err.code === 'ENOENT'){
          opt.dest = path.join(saveDir, '0');
        } else if (dirs.length > 0){
          dirs = dirs.filter(function(dir){
            return /^[1-9]?\d+/.test(dir);
          })
          .sort(function(a, b){ return (~~a > ~~b) ? 1 : -1; })
          .reverse();
          opt.dest = path.join(saveDir, (~~dirs[0] + 1).toString());
        }
      })
    }

    return through.obj(function (file, enc, cb) {

        if(!opt.root){
            this.emit('error', new gutil.PluginError('gulp-webshot', 'Please root directory'));
            gutil.log(gutil.colors.red('Please root directory',' root:"Theme" '));
            return cb();
        }

        if(!opt.screenSize  &&  !opt.dest && !opt.dest){
            opt.screenSize = { width: 1440, height: 900 }
            opt.dest='snapshot/';
        }


        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-webshot', 'Streaming not supported'));
            return cb();
        }

 
       if( opt.root ) {
         var pathArr = path.dirname( file.path ).split( path.sep );
         var baseIndex = pathArr.indexOf( opt.root );
         var basepath = pathArr.slice(baseIndex + 1).join( path.sep ) + '/';
       }


        
        var parsep =path.basename(file.relative);
        var name =path.basename(file.relative, '.html')
        var filename = path.join(opt.dest, basepath, name + '.png');
        var url ='http://localhost:'+opt.p+'/'+basepath+parsep;

        


             webshot(url, filename, opt,function(err,stream) { 

                if (err) {
                    this.emit('error', new gutil.PluginError('gulp-webshot', err));
                }else{
                    gutil.log('gulp-webshot:', gutil.colors.green('✔') + file.relative + gutil.colors.gray(' ( Save screenshot ) '))
                    cb();
                }

                
                

            });

        this.push(file);

    },function(cb){

          server.close(function () {
               gutil.log('gulp-webshot:', gutil.colors.yellow(' Everything is fine :) '));
               cb();
          })

    });

};

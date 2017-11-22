'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var CssDom = require("cssdom");
var sizeOf = require('image-size');
var path = require("path");
var fs = require("fs");

module.exports = function (options) {

    options = options || {
        imageDir: ""
    };

    return through.obj(function (file, enc, cb) {

        var _this = this;

        // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        // 插件不支持对 Stream 对直接操作，抛出异常
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return cb();
        }

        // 将文件内容转成字符串，file.contents.toString();
        // 然后将处理后的字符串，再转成Buffer形式
        var content = file.contents.toString();
        var cssDom = new CssDom(content);

        cssDom.dom.forEach(function(dom, index){

            var hasTag = false;
            var imagePath = null;

            // 检索带有 /* image-auto-size */ 标记的注释
            for (var i in dom.declarations) {
                if (dom.declarations.hasOwnProperty(i)) {

                    if (/comment__\d+/.test(i)) {
                        hasTag = true;
                    }

                    if (["background", "background-image"].indexOf(i) !== -1) {
                        var imageReg = /url\((["'])(.*)(\1)/.exec(dom.declarations[i]);                        
                        if(imageReg){
                            imagePath = imageReg[2];
                        }
                    }
                    
                }

            }

            if(hasTag && imagePath){
                // console.log(imagePath);
                try{
                    var dimensions = sizeOf(path.join(options.imageDir, imagePath));
                    dom.declarations["width"] = dimensions.width + "px";
                    dom.declarations["height"] = dimensions.height + "px";        
                }catch(e){
                    console.log(e);
                }
            }


        });

        file.contents = new Buffer(cssDom.beautify());

        // 下面这两句基本是标配啦，可以参考下 through2 的API
        _this.push(file);

        cb();

    });
};
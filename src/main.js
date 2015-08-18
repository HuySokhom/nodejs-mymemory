var _ = require('underscore');
var csv2json = require('csvtojson');
var fs = require('fs');
var requestPromise = require('request-promise');
var async = require('async');

var fromCsv = function(input, success){
    var converter = new csv2json.Converter();
    var fileStream = fs.createReadStream(input);

    converter.on('end_parsed', function(json){
        success(json);
    });

    fileStream.pipe(converter);
};

module.exports = {
    translateCsvFile: function(inputCsv, success){
        fromCsv(inputCsv, function(json){
            var inputs = json;
            var rowQueue = [];

            _.each(inputs, function(input){
                if( ! input.English ){
                    return false;// blank row; continue
                }

                var colQueue = [];
                var q = input.English;

                _.each(input, function(v, k){
                    switch( k ){
                        case 'English':
                            colQueue.push(function(callback){
                                callback(null, {
                                    English: q
                                });
                            });
                            break;

                        case 'French':
                        case 'German':
                        case 'Italian':
                        case 'Polish':
                        case 'Russian':
                        case 'Spanish':
                            colQueue.push(function(callback){
                                var lang = k;

                                requestPromise({
                                    uri: (
                                        '/get?q=' + q
                                            + '&langpair=English|' + lang
                                    ),
                                    baseUrl: 'http://api.mymemory.translated.net/'
                                }, function(err, inc, res){
                                    if( err ){
                                        callback(err);
                                    }

                                    console.log(res);

                                    var col = {};
                                    col[lang] = JSON.parse(res)
                                        .responseData.translatedText
                                    ;

                                    callback(null, col);
                                })
                            });
                    }
                });

                rowQueue.push(function(callback){
                    async.series(colQueue, function(err, cols){
                        var row = {};

                        // change array of key/val pairs into object
                        _.each(cols, function(col){
                            var key = Object.keys(col)[0];
                            row[key] = col[key];
                        });

                        callback(null, row);
                    });
                });
            });

            async.series(rowQueue, function(err, rows){
                success(rows);
            });
        });
    }
};


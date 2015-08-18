var translator = require('../src/main.js');
var json2csv = require('json2csv');
var fs = require('fs');

translator.translateCsvFile(
    './input/demo.csv',
    function(json){
        console.log(json);

        json2csv({
            data: json
        }, function(err, csv){
            if( err ){
                throw err;
            }

            console.log(csv);

            fs.writeFile('./output/demo.csv', csv, function(err){
                if( err ){
                    throw err;
                }

                console.log('wrote csv file');
            })
        });
    }
);




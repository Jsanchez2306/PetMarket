const fs = require('fs');

exports.generateLog = (filename, logData) => {
    fs.appendFile(filename, logData, (err) => {
        if (err) throw err;
        console.log('Log saved');
    });
};
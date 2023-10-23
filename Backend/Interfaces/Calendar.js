const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

class Calendar {
    constructor() {
        //
    }
    /*
    * calendar event representation (temp)
    * to be stored in user database under user (?)
    * 
    * Event name: name
    * Date: dd/mm/yyyy
    * Time: hour/min/seconds(?)
    */
}

module.exports = Calendar;
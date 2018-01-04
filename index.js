const fs = require('fs');
const readLineSync = require('readline-sync');
const moment = require('moment');
const parse = require('csv-parse/lib/sync');
const log4js = require('log4js');
log4js.configure({
    appenders: { everything : {type: 'file', filename: 'support-bank-log.log'}},
    categories: {default: { appenders: ['everything'], level: 'warn'}}
});
const logger = log4js.getLogger('supportBank');
const XML = require('pixl-xml');

class transaction{
    constructor(date,from,to,narrative,amount){
        this.date = moment(date, "DD/MM/YYYY");
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.amount = Math.round(parseFloat(amount)*100);
    }
}

class person{
    constructor(fName, amount){
        this.fName = fName;
        this.amount = parseInt(amount);
    }
}

    let transactionArray = generateTransactions("C:\\Work\\training2\\SupportBank\\Transactions2012.xml");
    let peopleArray = generatePeople(transactionArray);
let done = false;
while(!done) {
    console.log("Please enter your command");
    console.log("Available commands: 'List All', 'List [Account]'", 'Import File [filename]', 'Exit');
    let response = readLineSync.prompt().toUpperCase();
//let response = "LIST ALL";
    if (response === "LIST ALL") {
        displayAllAccounts();
    }
    else if (response.substring(0, 4) === "LIST") {
        let account = response.substring(5);
        displaySingleAccount(account);
    }
    else if (response === "EXIT"){
        done = true;
    }
    else if (response.substring(0,11) === "IMPORT FILE") {

        let newPath = response.substring(12).toLowerCase();
        console.log("Importing file: " + newPath);
        let newTransactionArray = generateTransactions(newPath);
        transactionArray = transactionArray.concat(newTransactionArray);
        peopleArray.length = 0;
        peopleArray = generatePeople(transactionArray);
    }

}

function generateTransactions(filePath) {
    let file = fs.readFileSync(filePath,"utf8");
    if (filePath.substring(filePath.length-3) === "csv"){

    let records = parse(file);
    let transactionArray = [];
    for (let i = 1; i < records.length; i++) {
        try {
        transactionArray.push(toTransaction(records[i]));
        }
        catch(err) {
            logger.warn("An error occured while generating a transaction: " + err);
        }
    }
    return transactionArray;}
    else if (filePath.substring(filePath.length-4) === "json") {
        records = JSON.parse(file);
        let transactionArray = [];
        for (let i = 0; i < records.length; i++) {
            try {
                transactionArray.push(toTransactionFromJSON(records[i]));
            }
            catch (err) {
                logger.warn("An error occured while generating a transaction: " + err);
            }
        }
        return transactionArray;
    }
    else if (filePath.substring(filePath.length-3) === "xml"){
        let xmlDoc = XML.Parser(file);
        console.log();
    }
}

function generatePeople(transactions){
    let people = [];
    for (let i=0; i < transactions.length;i++){

        let personFrom = people.filter(person => person.fName === transactions[i].from);
        if (personFrom.length === 0){
            let accFrom = new person(transactions[i].from,-transactions[i].amount);
            people.push(accFrom);
        }
        else {
            personFrom[0].amount -= transactions[i].amount;
        }
        let personTo = people.filter(person => person.fName === transactions[i].to);
        if (personTo.length === 0){
            let accTo = new person(transactions[i].to,transactions[i].amount);
            people.push(accTo);
        }
        else {
            personTo[0].amount += transactions[i].amount;
        }
    }
    return people;
}

function displayAllAccounts(){
    for (let i = 0; i < peopleArray.length; i++){
        console.log(peopleArray[i].fName + "   has " + formatMoney(peopleArray[i].amount) );
    }
}

function displaySingleAccount(account){
    console.log("Displaying results for " + account);
    for (let i = 0; i < transactionArray.length; i++){
        let current = transactionArray[i];
        if (account === current.to.toUpperCase() || account === current.from.toUpperCase()){
            console.log(formatDate(current.date) + " From: " + current.from + " To: " + current.to + " Amount: " + formatMoney(current.amount) + " Description: " + current.narrative);
        }
    }
}

function toTransaction(array){
    if (moment(array[0], "DD/MM/YYYY", true).isValid()) {
        if (!isNaN(array[4])) {
            return new transaction(array[0], array[1], array[2], array[3], array[4]);
        }
        else {
            logger.error("This transaction tried to parse NaN as amount. ");
            logger.error(array[0] + " " + array[1] + " " + array[2] + " " + array[3] + " " + array[4]);
            logger.error("This transaction was not counted.");
            throw "Not a Number";
        }
    }
    else {
        logger.error("This transaction tried to parse an invalid date. ");
        logger.error( array[0] + " " + array[1] + " " + array[2] + " " + array[3] + " " + array[4]);
        logger.error("This transaction was not counted.");
        throw "Not a Date";
    }
}

function toTransactionFromJSON(obj){
        if (!isNaN(obj.Amount)) {
            return new transaction(obj.Date, obj.FromAccount, obj.ToAccount, obj.Narrative, obj.Amount);
        }
        else {
            logger.error("This transaction tried to parse NaN as amount. ");
            logger.error(obj.Date + " " + obj.FromAccount + " " + obj.ToAccount + " " + obj.Narrative + " " + obj.Amount);
            logger.error("This transaction was not counted.");
            throw "Not a Number";
        }
}


function formatDate(date){
    return moment(date).format("DD/MM/YYYY");
}

function formatMoney(money){
    let amountstring = money.toString();
    let pence = amountstring.substring(amountstring.length -2 ,amountstring.length);
    let pounds = amountstring.substring(0,amountstring.length-2);
    return "£" + pounds + "." + pence;
}
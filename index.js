var fs = require('fs');
var readlineSync = require('readline-sync')
var moment = require('moment');
var parse = require('csv-parse/lib/sync');

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

function toTransaction(array){
    return new transaction(array[0],array[1],array[2],array[3],array[4]);
}

var file = fs.readFileSync("C:\\Work\\training2\\SupportBank\\Transactions2014.csv", "utf8");
var records = parse(file);
transactionArray = [];
for (i = 1; i < records.length; i++){
    transactionArray.push(toTransaction(records[i]))
}

function generatePeople(transactions){
    let people = [];
    for (i=0; i < transactions.length;i++){

        let personFrom = people.filter(person => person.fName == transactions[i].from);
        if (personFrom.length === 0){
            let accFrom = new person(transactions[i].from,-transactions[i].amount);
            people.push(accFrom);
        }
        else {
            personFrom[0].amount -= transactions[i].amount;
        }
        let personTo = people.filter(person => person.fName == transactions[i].to);
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

let peopleArray = generatePeople(transactionArray);
console.log("Please enter your command");
console.log("Available commands: 'List All' and 'List [Account]'");
let response = readlineSync.prompt().toUpperCase();
if (response === "LIST ALL"){
    for (i = 0; i < peopleArray.length; i++){
        console.log(peopleArray[i].fName + "   has " + formatMoney(peopleArray[i].amount) );
    }
}
else if (response.substring(0,4) === "LIST"){
    let account = response.substring(5);
    console.log("Displaying results for " + account);
    for (i = 0; i < transactionArray.length; i++){
        let current = transactionArray[i];
        if (account === current.to.toUpperCase() || account === current.from.toUpperCase()){
            console.log(formatDate(current.date) + " From: " + current.from + " To: " + current.to + " Amount: " + formatMoney(current.amount) + " Description: " + current.narrative);
        }
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
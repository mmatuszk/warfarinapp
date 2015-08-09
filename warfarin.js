/*
 * Module: warfarin.js
 * Version: 1.0
 * 
 * Description: This modules calculates warfarin dose based on INR results and INR target
 * 
 * Reference: http://www.aafp.org/fpm/2005/0500/p77.html
 * 
 * History: Original revision
 * 
 * API functions
 *      Warfarin.UI.initCalc1() - INR target of 2.0 - 3.0
 * 
 */


var Warfarin;

if (!Warfarin) {
    Warfarin = {};
} else {
    throw new Error('Warfarin already exists');
}

if (!Warfarin.UI) {
    Warfarin.UI = {};
} else {
    throw new Error('Warfarin.UI already exists');
}

Warfarin.dosingSchedule = {
    // "2.5": ["0.5","0","0","0","0","0","0"],
    // "5.0": ["0.5","0","0","0","0.5","0","0"],
    // "7.5": ["0.5","0","0.5","0","0.5","0","0"],
    "10.0": ["0.5","0","0.5","0","0.5","0","0.5"],
    "12.5": ["0.5","0","0.5","0","0.5","0.5","0.5"],
    "15.0": ["0.5","0","0.5","0.5","0.5","0.5","0.5"],
    "17.5": ["0.5","0.5","0.5","0.5","0.5","0.5","0.5"],
    "20.0": ["1","0.5","0.5","0.5","0.5","0.5","0.5"],
    "22.5": ["1","0.5","0.5","0.5","1","0.5","0.5"],
    "25.0": ["1","0.5","1","0.5","1","0.5","0.5"],
    "27.5": ["0.5","1","0.5","1","0.5","1","1"],
    "30.0": ["0.5","1","1","1","0.5","1","1"],
    "32.5": ["0.5","1","1","1","1","1","1"],
    "35.0": ["1","1","1","1","1","1","1"],
    "37.5": ["1.5","1","1","1","1","1","1"],
    "40.0": ["1.5","1","1","1","1.5","1","1"],
    "42.5": ["1.5","1","1.5","1","1.5","1","1"],
    "45.0": ["1","1.5","1","1.5","1","1.5","1.5"],
    "47.5": ["1","1.5","1.5","1.5","1","1.5","1.5"],
    "50.0": ["1","1.5","1.5","1.5","1.5","1.5","1.5"],
    "52.5": ["1.5","1.5","1.5","1.5","1.5","1.5","1.5"],
    "55.0": ["2","1.5","1.5","1.5","1.5","1.5","1.5"],
    "57.5": ["2","1.5","1.5","1.5","2","1.5","1.5"],
    "60.0": ["2","1.5","2","1.5","2","1.5","1.5"],
    "62.5": ["1.5","2","1.5","2","1.5","2","2"],
    "65.0": ["1.5","2","2","2.0","1.5","2","2"],
    "67.5": ["1.5","2","2","2","2","2","2"],
    "70.0": ["2","2","2","2","2","2","2"],
    "72.5": ["2.5","2","2","2","2","2","2"],
    "75.0": ["2.5","2","2","2","2.5","2","2"],
    "77.5": ["2.5","2","2.5","2","2.5","2","2"],
    "80.0": ["2","2.5","2","2.5","2","2.5","2.5"]
};

Warfarin.dosingChange1 = {
  // less than 1.5
  0: {change: "increase", min: 0.1, max: 0.2, nextDateMin: 4, nextDateMax: 8},
  // 1.5 - 2.9
  1: {change: "increase", min: 0.05, max: 0.1, nextDateMin: 7, nextDateMax: 14},
  // 2.0 - 3.0
  2: {change: "no", min: 0, max: 0, nextDateMin: 28, nextDateMax: 28},
  // 3.1 - 3.9
  3: {change: "decrease", min: 0.05, max: 0.1, nextDateMin: 7, nextDateMax: 14},
  // 4.0 - 4.9
  4: {change: "decrease", min: 0.1, max: 0.1, nextDateMin: 4, nextDateMax: 8, holdMin: 0, holdMax: 1},
  // greater or equal 5.0
  5: {chnage: "special", special: "Manage per per your institutions protocol"}
};

/*
 * getDoseString
 * 
 * Returns string with daily warfarin dosing based on a weekly dose
 */
Warfarin.getDoseString = function(dose) {
    var weeklySchedule, str;
    
    if (typeof dose == 'number') {
        dose = dose.toFixed(1);
    }
    
    if (!(dose in Warfarin.dosingSchedule)) {
        throw "getDoseString: Invalid dose: "+dose;
    }
    
    weeklySchedule = Warfarin.dosingSchedule[dose];
    
    str = 'Mon: '+weeklySchedule[0]+', ';
    str += 'Tue: '+weeklySchedule[1]+', ';
    str += 'Wed: '+weeklySchedule[2]+', ';
    str += 'Thr: '+weeklySchedule[3]+', ';
    str += 'Fri: '+weeklySchedule[4]+', ';
    str += 'Sat: '+weeklySchedule[5]+', ';
    str += 'Sun: '+weeklySchedule[6];
    
    return str;
};

/*
 * calcNewDose1
 * 
 * This function will calculate a new weekly warfarin dose and determine schedule
 * for next INR check INR goal of 2.0 - 3.0
 * Reference: http://www.aafp.org/fpm/2005/0500/p77.html
 * 
 * Reteruns
 * { 
 *      dose: - new weekly warfarin dose
 *      nextInr - num of days in which next INR should be drawn
 *      instructions - special instructiosn
 * }
 * 
 */
Warfarin.calcNewDose1 = function(inrRange, dose) {
    var newDose = {dose: null, instructions: null, nextInr: null};
    var min, max;

    if (typeof dose == 'number') {
        dose = dose.toFixed(1);
    }   
    
    if (!(dose in Warfarin.dosingSchedule)) {
        throw "getDoseString: Invalid dose: "+dose;
    }
    
    if (inrRange == '< 1.5') {
        // Increase dose by 10-20%;
        min = dose*1.10;
        max = dose*1.20;
        var a = Math.round(min/2.5)*2.5;
        var b = Math.round(max/2.5)*2.5;
        console.log(min+' '+max);
        console.log(a+' '+b);
        if (a > min) {
            newDose.dose = a;
        } else {
            newDose.dose = b;
        }
        newDose.nextInr = 7;
    } else if (inrRange == '1.5 - 1.9') {
        // Increase dose by 5-10%;
        min = dose*1.05;
        max = dose*1.10;
        var a = Math.round(min/2.5)*2.5;
        var b = Math.round(max/2.5)*2.5;
        console.log(min+' '+max);
        console.log(a+' '+b);
        if (a > min) {
            newDose.dose = a;
        } else {
            newDose.dose = b;
        }
        newDose.nextInr = 14;        
    } else if (inrRange == '2.0 - 3.0') {
        newDose.dose = dose;
        newDose.nextInr = 28;
    } else if (inrRange == '3.1 - 3.9') {
        // Decrease dose by 5-10%;
        min = dose*0.9;
        max = dose*0.95;
        var a = Math.round(min/2.5)*2.5;
        var b = Math.round(max/2.5)*2.5;
        console.log(min+' '+max);
        console.log(a+' '+b);
        if (b < max) {
            newDose.dose = b;
        } else {
            newDose.dose = a;
        }
        newDose.nextInr = 14;        
    } else if (inrRange == '4.0 - 4.9') {
        // Decrease dose by 10%;
        min = dose*0.9;
        newDose.dose = Math.round(min/2.5)*2.5;
        newDose.instructions = "Hold 1 dose";
        newDose.nextInr = 7;
    } else if (inrRange == '>= 5.0') {
        newDose.instructions = "Please check the protocol. Patient may need Vitamin K and/or ER evaluation";
    }
    
    return newDose;
};

/*****************
 * UI FUNCTION
 *****************/

Warfarin.UI.id = {
    dosing5mg: 'dosing-5mg',
    currentWeeklyDose5mg: 'weekly-dose',
    currentWeeklyDoseText: 'N_AFControl_6',
    inrResult: 'inr-result-range',
    inrDate: 'inr-date',
    inrTime: 'N_AFControl_8_Time_dateInput',
    doseAdjustment: 'N_AFControl_9',
    newWeeklyDose5mg: 'new-weekly-dose',
    newWeeklyDoseText: 'N_AFControl_11',
    nextINRDate: 'next-inr-date',
    nextINRTime: 'N_AFControl_12_Time_dateInput',
    nextINRComment: 'N_AFControl_13',
    calcScore: 'calc',
    ref: 'ref',
    today: 'today',
    inrMsg: 'inrMsg'
};

Warfarin.UI.refURI = 'http://www.aafp.org/fpm/2005/0500/p77.html';

// Use with Healthand centriq and Use Telerik for time and date controls
Warfarin.UI.hl = false;


Warfarin.UI.isDosing5mg = function() {
    if ($('#'+Warfarin.UI.id.dosing5mg+' option:selected').text() == 'Yes') {
        return true;
    }
    
    return false;
};


/*
 * status - true or false
 */
Warfarin.UI.setDosing5mg = function(status) {
    var yes = $('#'+Warfarin.UI.id.dosing5mg+' option:eq(1)').val();
    var no = $('#'+Warfarin.UI.id.dosing5mg+' option:eq(0)').val();
    
    if (status) {
        $('#'+Warfarin.UI.id.dosing5mg).val(yes);
    } else {
        $('#'+Warfarin.UI.id.dosing5mg).val(no);
    }
    
    $('#'+Warfarin.UI.id.dosing5mg).flipswitch('refresh');
};

/*
 * Returns current weekly dose base on 5 mg pills in string format
 */
Warfarin.UI.getCurrentWeeklyDose5mg = function() {
    var dose = $('#'+Warfarin.UI.id.currentWeeklyDose5mg+' option:selected').text();
    
    if (dose == '-select-') {
        return;
    } else {
        return dose.split(' ')[0];
    }
};

Warfarin.UI.setCurrentWeeklyDose5mg = function(dose) {
    var val, txt;
    
    dose = parseFloat(dose);
    
   for (var i = 0; i < $('#'+Warfarin.UI.id.currentWeeklyDose5mg+' option').length; i++) {
        txt = $('#'+Warfarin.UI.id.currentWeeklyDose5mg+' option:eq('+i+')').text();
        if (parseFloat(txt) == dose) {
            val = $('#'+Warfarin.UI.id.currentWeeklyDose5mg+' option:eq('+i+')').val();
            $('#'+Warfarin.UI.id.currentWeeklyDose5mg).val(val);
            break;
        }
    } 
    
    $('#'+Warfarin.UI.id.currentWeeklyDose5mg).selectmenu('refresh', true);
};

Warfarin.UI.initCurrentWeeklyDose5mg = function() {
  for (var i = 10; i < 110; i+= 2.5) {
    $('<option value="'+i.toFixed(1)+'">'+i.toFixed(1)+'</option>').appendTo('#'+Warfarin.UI.id.currentWeeklyDose5mg);
  }  
};

Warfarin.UI.setCurrentWeeklyDose = function(dose) {
    $('#'+Warfarin.UI.id.currentWeeklyDoseText).val(dose);
};

Warfarin.UI.onCurrentWeeklyDose5mgChange = function() {
    if (!Warfarin.UI.isDosing5mg()) {
        return;
    }
   
    dose = Warfarin.UI.getCurrentWeeklyDose5mg();
    console.log(dose);
    if (dose) {
        Warfarin.UI.setCurrentWeeklyDose(Warfarin.getDoseString(dose));
    }    
};

/*
 * Returns current weekly dose base on 5 mg pills in string format
 */
Warfarin.UI.getNewWeeklyDose5mg = function() {
    var dose = $('#'+Warfarin.UI.id.newWeeklyDose5mg+' option:selected').text();
    
    if (dose == '-select-') {
        return;
    } else {
        return dose.split(' ')[0];
    }
};

Warfarin.UI.setNewWeeklyDose5mg = function(dose) {
    var val, txt;
    
    dose = parseFloat(dose);
    
   for (var i = 0; i < $('#'+Warfarin.UI.id.newWeeklyDose5mg+' option').length; i++) {
        txt = $('#'+Warfarin.UI.id.newWeeklyDose5mg+' option:eq('+i+')').text();
        if (parseFloat(txt) == dose) {
            val = $('#'+Warfarin.UI.id.newWeeklyDose5mg+' option:eq('+i+')').val();
            $('#'+Warfarin.UI.id.newWeeklyDose5mg).val(val);
            break;
        }
    }
    
    $('#'+Warfarin.UI.id.newWeeklyDose5mg).selectmenu('refresh', true); 
};

Warfarin.UI.initNewWeeklyDose5mg = function() {
  for (var i = 10; i < 110; i+= 2.5) {
    $('<option value="'+i.toFixed(1)+'">'+i.toFixed(1)+'</option>').appendTo('#'+Warfarin.UI.id.newWeeklyDose5mg);
  }  
};

Warfarin.UI.onNewWeeklyDose5mgChange = function () {
    if (!Warfarin.UI.isDosing5mg()) {
        return;
    }
   
    dose = Warfarin.UI.getNewWeeklyDose5mg();
    console.log(dose);
    if (dose) {
        Warfarin.UI.setNewWeeklyDose(Warfarin.getDoseString(dose));
    }    
};

Warfarin.UI.setNewWeeklyDose = function(dose) {
    $('#'+Warfarin.UI.id.newWeeklyDoseText).val(dose);
};

Warfarin.UI.getINRResult = function() {
    return $('#'+Warfarin.UI.id.inrResult+' option:selected').text();
};

Warfarin.UI.setINRResult = function(index) {
    var tmp = $('#'+Warfarin.UI.id.inrResult+' option:eq('+index+')').val();
    
    $('#'+Warfarin.UI.id.inrResult).val(tmp);
    
    $('#'+Warfarin.UI.id.inrResult).selectmenu('refresh', true);
};

Warfarin.UI.getINRDate = function() {
    var dateTxt, date;
    
    dateTxt = $('#'+Warfarin.UI.id.inrDate).val();
    
    return new Date(dateTxt);
};

Warfarin.UI.setINRDate = function(date) {
    console.log(date);

    if (date instanceof Date) {
        // $('#'+Warfarin.UI.id.inrDate).val(date.toLocaleDateString()).change();
        $('#'+Warfarin.UI.id.inrDate)[0].valueAsDate = date;
    } else {
        $('#'+Warfarin.UI.id.inrDate).val(date).change();
    }
};

Warfarin.UI.getDoseAdjustment = function() {
    var yes = $('#'+Warfarin.UI.id.doseAdjustment+' option:eq(1)').val();
    
    return ($('#'+Warfarin.UI.id.doseAdjustment+' option:selected').val() == yes);
};

Warfarin.UI.setDoseAdjustment = function(status) {
    var yes = $('#'+Warfarin.UI.id.doseAdjustment+' option:eq(1)').val();
    var no = $('#'+Warfarin.UI.id.doseAdjustment+' option:eq(2)').val();
    
     $('#'+Warfarin.UI.id.doseAdjustment).val(status ? yes : no);
};

Warfarin.UI.getNextINRDate = function() {
    var dateTxt, date;
    
    dateTxt = $('#'+Warfarin.UI.id.nextINRDate).val();
    
    return new Date(dateTxt);    
};

Warfarin.UI.setNextINRDate = function(date) {
    if (date instanceof Date) {
        $('#'+Warfarin.UI.id.nextINRDate)[0].valueAsDate = date;
    } else {
        $('#'+Warfarin.UI.id.nextINRDate).val(date).change();
    }
};

Warfarin.UI.getNextINRDateComment = function() {
    return  $('#'+Warfarin.UI.id.nextINRComment).val();
};

Warfarin.UI.setNextINRDateComment = function(text) {
    $('#'+Warfarin.UI.id.nextINRComment).val(text);
};

Warfarin.UI.clearNewWekklyDose = function() {
    var val = $('#'+Warfarin.UI.id.newWeeklyDose5mg+' option:eq(0)').val();
    $('#'+Warfarin.UI.id.newWeeklyDose5mg).val(val);
    Warfarin.UI.setNewWeeklyDose('');
    Warfarin.UI.setDoseAdjustment(true);
    Warfarin.UI.setNextINRDate('');
    Warfarin.UI.setNextINRDateComment('');
};

Warfarin.UI.addINRButton1 = function() {
    $('#'+Warfarin.UI.id.newWeeklyDose5mg).after('<input id="'+Warfarin.UI.id.calcScore+'" type="button" value="Calculate Score">');
    $('#'+Warfarin.UI.id.calcScore).bind('click', Warfarin.UI.calcINR1);    
};

Warfarin.UI.addRefButton = function() {
    $('#'+Warfarin.UI.id.calcScore).after('<input id="'+Warfarin.UI.id.ref+'" type="button" value="Reference">');
    $('#'+Warfarin.UI.id.ref).bind('click', Warfarin.UI.onRef);
};

Warfarin.UI.addTodayButton = function() {
    // $('#'+Warfarin.UI.id.inrDate).before('<input id="'+Warfarin.UI.id.today+'" type="button" value="Today">');
    $('#N_AFControl_8_Time_wrapper').after('<input id="'+Warfarin.UI.id.today+'" type="button" value="Today">');
    $('#'+Warfarin.UI.id.today).bind('click', Warfarin.UI.onToday);
};

Warfarin.UI.calcINR1 = function() {
    var dose, doseText, inrRange, newDose, inrDate;
    
    if (!Warfarin.UI.isDosing5mg()) {
        Warfarin.UI.msgInr('To use dosing calculator you must use 5 mg dosing schedule.');
        return;
    }
    
    dose = Warfarin.UI.getCurrentWeeklyDose5mg();
    if (dose == '-select-') {
        Warfarin.UI.msgInr('You must select current dose.');
        return;        
    }
    
    inrRange = Warfarin.UI.getINRResult();
    if (inrRange == '-select-') {
        Warfarin.UI.msgInr('You must select INR result.');
        return;        
    }

    newDose = Warfarin.calcNewDose1(inrRange, dose);
    if (newDose.dose) {
        Warfarin.UI.setNewWeeklyDose5mg(newDose.dose);
        if (newDose.instructions) {
            doseText = newDose.instructions+' then\n';
            doseText += Warfarin.getDoseString(newDose.dose);
        } else {
            doseText = Warfarin.getDoseString(newDose.dose);
        }
        if (newDose.dose-dose > 0) {
            doseText += '\nIncrease: ';
            doseText += ((newDose.dose-dose)/dose*100).toFixed(1)+'%';
        } else if(newDose.dose-dose < 0)  {
            doseText += '\nDecrease: ';
            doseText += ((dose-newDose.dose)/dose*100).toFixed(1)+'%';
        }
        Warfarin.UI.setNewWeeklyDose(doseText);
        
        Warfarin.UI.setDoseAdjustment(dose != newDose.dose);
        if (newDose.nextInr) {
            Warfarin.UI.setNextINRDateComment('Check INR in '+newDose.nextInr+' days');
            inrDate = Warfarin.UI.getINRDate();
            if (inrDate.valueOf() !== NaN) {
                inrDate.setDate(inrDate.getDate()+newDose.nextInr);
                Warfarin.UI.setNextINRDate(inrDate);
            }
            
        }
    } else {
        Warfarin.UI.clearNewWekklyDose();
        Warfarin.UI.msgInr(newDose.instructions);
        return;
    }
};

Warfarin.UI.onRef = function() {
    var win = window.open(Warfarin.UI.refURI);
    win.focus();     
};

Warfarin.UI.onToday = function() {
    Warfarin.UI.setINRDate(new Date());
};

Warfarin.UI.msgInr = function(txt) {
    $('#'+Warfarin.UI.id.inrMsg).dialog('option', 'title', 'INR Message');
    if (typeof txt == 'string') {
        $('#'+Warfarin.UI.id.inrMsg).text(txt);
    }
    $('#'+Warfarin.UI.id.inrMsg).dialog('open');    
};

Warfarin.UI.initINRCalc1 = function() {
    Warfarin.UI.addINRButton1();
    Warfarin.UI.addRefButton();
    Warfarin.UI.addTodayButton();
    
    $('#'+Warfarin.UI.id.currentWeeklyDose5mg).bind('change', Warfarin.UI.onCurrentWeeklyDose5mgChange);
    $('#'+Warfarin.UI.id.newWeeklyDose5mg).bind('change', Warfarin.UI.onNewWeeklyDose5mgChange);
       
    $('<div id="inrMsg"></div>').appendTo('body').dialog({autoOpen: false});
    
    /*
     * Testing initalization
     */
    Warfarin.UI.setDosing5mg(true);
    Warfarin.UI.setCurrentWeeklyDose5mg(30);
    Warfarin.UI.setCurrentWeeklyDose(Warfarin.getDoseString(30));
    Warfarin.UI.setINRResult(3);
    Warfarin.UI.setINRDate(new Date());
};

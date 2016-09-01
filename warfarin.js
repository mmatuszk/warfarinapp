/**
 * @author Marcin Matuszkiewicz
 */

var warfarin;

if (!warfarin) {
    warfarin = {};
} else {
    throw new Error('Warfarin already exists');
}


/*****************************************************************************
 * Warfarin Calculator
 * 
 *****************************************************************************/
warfarin.calc = (function() {
  // Initialize state variables
  var INRGoalIndex = 0;
  var dose5mg = true;
  
  // Other private variables
  var INRGoalStr = {0: '2.0 - 3.0', 1: '2.5 - 3.5'};
  
  var INRResultRangeStr = 
    {0: 
      {0: '&lt; 1.5',
       1: '1.5 - 1.9',
       2: '2.0 - 3.0',
       3: '3.1 - 3.9',
       4: '4.0 - 4.9',
       5: '5.0 - 8.9',
       6: '&ge; 9.0'},
     1:
      {0: '&lt 1.5',
       1: '1.5 - 2.4',
       2: '2.5 - 3.5',
       3: '3.6 - 4.5',
       4: '4.5 - 6.0',
       5: '6.1 - 8.9',
       6: '&ge; 9.0'}  
    };
  
  var dosingSchedule = {
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
    "80.0": ["2","2.5","2","2.5","2","2.5","2.5"],
    "82.5": ["2","2.5","2.5","2.5","2","2.5","2.5"],
    "85.0": ["2","2.5","2.5","2.5","2.5","2.5","2.5"],
    "87.5": ["2.5","2.5","2.5","2.5","2.5","2.5","2.5"],
    "90.0": ["3","2.5","2.5","2.5","2.5","2.5","2.5"],
    "92.5": ["3","2.5","2.5","2.5","3","2.5","2.5"],
    "95.0": ["3","2.5","3","2.5","3","2.5","2.5"],
    "97.5": ["2.5","3","2.5","3","2.5","3","3"],
    "100.0": ["2.5","3","3","2.0","2.5","3","3"],
    "102.5": ["2.5","3","3","3","3","3","3"],
    "105.0": ["3","3","3","3","3","3","3"],
    "107.5": ["3.5","3","3","3","3","3","3"],
    "110.0": ["3.5","3","3","3","3.5","3","3"],
    "112.5": ["3.5","3","3.5","3","3.5","3","3"]
  };
  
  dosingChange = {0:  // dose change definitions for INR goal index 0
    {
      // less than 1.5
      0: {change: "increase", min: 0.1, max: 0.2, nextDate: 7, nextDateMin: 4, nextDateMax: 8},
      // 1.5 - 1.9
      1: {change: "increase", min: 0.05, max: 0.1, nextDate: 14, nextDateMin: 7, nextDateMax: 14},
      // 2.0 - 3.0
      2: {change: "no", min: 0, max: 0, nextDate: 28, nextDateMin: 28, nextDateMax: 28},
      // 3.1 - 3.9
      3: {change: "decrease", min: 0.05, max: 0.1, nextDate: 14, nextDateMin: 7, nextDateMax: 14},
      // 4.0 - 4.9
      4: {change: "decrease", min: 0.1, max: 0.1, nextDate: 7, nextDateMin: 4, nextDateMax: 8, holdMin: 0, holdMax: 1},
      // 5.0 - 8.9
      5: {change: "decrease", min: 0.1, max: 0.2, nextDateComment: 'Monitor frequently.  Alternatively consider vitamin K1 1 to 2.5 mg orally'},
      //  greater than 8.9
      6: {change: "special", special: "Hold warfarin therapy, give vitamin K1 5 to 10 mg orally, monitor frequently.  Resume at lower dose when INR is therapeutic"}
    }, 1:
    {
      // less than 1.5
      0: {change: "increase", min: 0.1, max: 0.2, nextDate: 7, nextDateMin: 4, nextDateMax: 8},
      // 1.5 - 2.4
      1: {change: "increase", min: 0.05, max: 0.1, nextDate: 14, nextDateMin: 7, nextDateMax: 14},
      // 2.5 - 3.5
      2: {change: "no", min: 0, max: 0, nextDate: 28, nextDateMin: 28, nextDateMax: 28},
      // 3.6 - 4.5
      3: {change: "decrease", min: 0.05, max: 0.1, nextDate: 14, nextDateMin: 7, nextDateMax: 14},
      // 4.5 - 6.0
      4: {change: "decrease", min: 0.05, max: 0.15, nextDate: 5, nextDateMin: 2, nextDateMax: 8, holdMin: 0, holdMax: 1},
      // 6.1 - 8.9
      5: {change: "decrease", min: 0.1, max: 0.2, nextDateComment: 'Monitor frequently.  Alternatively consider vitamin K1 1 to 2.5 mg orally'},
      //  greater than 8.9
      6: {change: "special", special: "Hold warfarin therapy, give vitamin K1 5 to 10 mg orally, monitor frequently.  Resume at lower dose when INR is therapeutic"}
    }
  };
  
  // Define public interface
  var pub = {};
  
  pub.init = function(i, d) {
    if (i === undefined) {
      INRGoalIndex = 0;
    } else {
      INRGoalIndex = i;
    }
    if (d === undefined) {
      dose5mg = true;
    } else {
      dose5mg = d;
    }
  };
  
  pub.getBleedingString = function() {
    var str = 'Serious bleeding, any INR: Hold warfarin; give vitamin K1 10 mg slow intravenous (IV) plus fresh plasma or prothrombin complex concentrate, depending on urgency; repeat vitamin K1 every 12 hours as needed.<p>Life-threatening bleeding, any INR: Hold warfarin; give prothrombin complex concentrate (or recombinant factor VIIa as an alternate) supplemented with vitamin K1 (10 mg slow IV); repeat as needed.';
    
    return str;
  };
  
  pub.setINRGoalIndex = function(index) {
    INRGoalIndex = index;
  };
  pub.getINRGoalIndex = function() {
    return INRGoalIndex;
  };
  
  pub.getINRGoalStr = function() {
    return INRGoalStr[INRGoalIndex];
  };
  
  pub.getINRResultRangeStr = function(index) {
    return INRResultRangeStr[index];
  };
  
  pub.setDose5mg = function(state) {
    dose5mg = state;
  };
  
  pub.getDose5mg = function() {
    return dose5mg;
  };
  
  
  /*
   *  getDoseChangeString
   *  Parameters:
   *    index - index of INR results
   *  Return:
   *    Function returns string with instructions on dose change.  Function uses INRGoalIndex
   *    state variable.
   */
  pub.getDoseChangeString = function(index) {
    var dc = dosingChange[INRGoalIndex][index];
    
    var str = '';
    
    if (typeof dc.holdMin !== 'undefined') {
      str += 'Hold '+dc.holdMin+' to '+dc.holdMax+' doses.  ';
    }
    
    if (dc.change == 'increase') {
      str += 'Increase dose by ';
      if (dc.min == dc.max) {
        str += dc.min*100 + '%';
      } else {
        str += dc.min*100 + '% to ' + dc.max*100 + '%';
      }
    } else if (dc.change == 'no') {
      str = 'No change';
    }  else if (dc.change == 'decrease') {
      str += 'Decrease dose by ';
      if (dc.min == dc.max) {
        str += dc.min*100 + '%';
      } else {
        str += dc.min*100 + '% to ' + dc.max*100 + '%';
      }
    } else if (dc.change == 'special') {
      str = dc.special;
    }
    
    return str;
  };

  pub.getNextDateString = function (index) {
    var dc = dosingChange[INRGoalIndex][index];
  
    var str = '';
    if (dc.change == 'special') {
      str = dc.special;
    } else if (dc.nextDateComment) {
      str = dc.nextDateComment;
    } else {
      str += 'Next INR in ';
      if (dc.nextDateMin == dc.nextDateMax) {
        str += dc.nextDateMin + ' days';
      } else {
        str += dc.nextDateMin+ ' to ' + dc.nextDateMax + ' days';
      }
    }
    
    return str;  
  };  
  
  pub.getNextDateDefault = function(index) {
    var dc = dosingChange[INRGoalIndex][index];
    
    return dc.nextDate;
  };
  
  /*
   * getDoseString
   * 
   * Returns string with daily warfarin dosing based on a weekly.
   * Returns weekly dose if not using 5 mg dosing.
   */
  pub.getDoseString = function(dose) {
      var weeklySchedule, str;
      
      if (typeof dose === 'number') {
          dose = dose.toFixed(1);
      }
      
      if (!dose5mg) {
        return 'Weekly dose '+dose+' mg';
      }
      
      if (!(dose in dosingSchedule)) {
          // throw "getDoseString: Invalid dose: "+dose;
          return "Select valid a weekly dose";
      }
      
      weeklySchedule = dosingSchedule[dose];
      
      str = 'Monday: '+weeklySchedule[0]*5+' mg<br> ';
      str += 'Tuesday: '+weeklySchedule[1]*5+' mg<br> ';
      str += 'Wednesday: '+weeklySchedule[2]*5+' mg<br> ';
      str += 'Thursday: '+weeklySchedule[3]*5+' mg<br> ';
      str += 'Friday: '+weeklySchedule[4]*5+' mg<br> ';
      str += 'Saturday: '+weeklySchedule[5]*5+' mg<br> ';
      str += 'Sunday: '+weeklySchedule[6]*5+' mg';
      
      return str;
  };  
  
/*
 * calcNewDose
 * 
 * This function will calculate a new weekly warfarin dose.  It will return
 * null if new dose cannot be calculated.
 * It relies on internal state of INRGoalRangeIndex and dose5mg
 *
 * Reference: http://www.aafp.org/fpm/2005/0500/p77.html
 * 
 * Reteruns
 *    newDose
 * 
 */
  pub.calcNewDose = function(inrRange, dose) {
      var newDose = null;
      var min,  max, a, b, dc;
  
      if (typeof dose === 'number') {
          dose = dose.toFixed(1);
      }   

      if (!dose5mg) {
        throw 'calcNewDose: only calculation for using 5mg dosing curretnly implemented';
      }
      
      if (!(dose in dosingSchedule)) {
          throw "calcNewDose: Invalid dose: "+dose;
      }
      
      dc = dosingChange[INRGoalIndex][inrRange];
      if (dc.change == 'increase') {
        min = dose * (1+dc.min);
        max = dose * (1+dc.max);
        a = Math.round(min/2.5)*2.5;
        b = Math.round(max/2.5)*2.5;      
        console.log(min+' '+max);
        console.log(a+' '+b);
        if (a > min) {
            newDose = a;
        } else {
            newDose = b;
        }
      } else if (dc.change == 'decrease') {
        min = dose * (1 - dc.max);
        max = dose * (1 - dc.min);
        var a = Math.round(min/2.5)*2.5;
        var b = Math.round(max/2.5)*2.5;
        console.log(min+' '+max);
        console.log(a+' '+b);
        if (b < max) {
            newDose = b;
        } else {
            newDose = a;
        }
      } else if (dc.change == 'no') {
        newDose = dose;
      } else if (dc.change = 'special') {
        newDose = null;    
      }
      
      return newDose;
  };
  
  return pub;
})();

/*****************************************************************************
 * Warfarin User Interface
 * 
 *****************************************************************************/
warfarin.ui = (function() {
  var id = {
    bleeding: 'bleeding',
    wrapperCalc: 'wrapper-calc',
    wrapperDosing5mg: 'wrapper-dosing-5mg',
    dosing5mg: 'dosing-5mg',
    inrGoal: 'inr-goal',
    wrapperDosingUI: 'wrapper-dosing-ui',
    currentWeeklyDose5mg: 'weekly-dose',
    currentWeeklyDoseSchedule: 'weekly-dose-schedule',
    wrapperCurrentWeeklyDose5mg: 'wrapper-weekly-dose',
    currentWeeklyDoseTxt: 'weekly-dose-txt',
    wrapperCurrentWeeklyDoseTxt: 'wrapper-weekly-dose-txt',
    inrResult: 'inr-result-range',
    inrDate: 'inr-date',
    doseAdjustment: 'N_AFControl_9',
    newWeeklyDosePanel: 'new-weekly-dose-panel',
    newWeeklyDose5mg: 'new-weekly-dose',
    newWeeklyDoseSchedule: 'new-weekly-dose-schedule',
    wrapperNewWeeklyDose5mg: 'wrapper-new-weekly-dose',
    newWeeklyDoseTxt: 'new-weekly-dose-txt',
    wrapperNewWeeklyDoseTxt: 'wrapper-new-weekly-dose-txt',
    newWeeklyDosePercent: 'new-weekly-dose-percent',
    newWeeklyDoseComment: 'new-weekly-dose-comment',
    nextINRDate: 'next-inr-date',
    nextINRComment: 'next-inr-date-comment',
    newWeeklyDoseMessage: 'new-weekly-dose-message',
    wrapperMsg: 'wrapper-msg',
    msg: 'msg',
    calc: 'calc',
    reset: 'reset',
    ref: 'ref',
    today: 'today',
    inrMsg: 'inrMsg'
  };

  function isBleeding() {
    if ($('#'+id.bleeding+' option:selected').text() == 'Yes') {
        return true;
    }
    
    return false;    
  }
   /*
   * status - true or false
   */
  function setBleeding(status) {
    var yes = $('#'+id.bleeding+' option:eq(1)').val();
    var no = $('#'+id.bleeding+' option:eq(0)').val();
    
    if (status) {
        $('#'+id.bleeding).val(yes);
    } else {
        $('#'+id.bleeding).val(no);
    }
    
    $('#'+id.bleeding).flipswitch('refresh');
  }
  
  function onBleedingChange() {
    if (isBleeding()) {
      calcHide();
      setMsg(warfarin.calc.getBleedingString());
      msgShow();
    } else {
      setMsg('');
      msgHide();
      calcShow();
    }
  }
  
  function calcHide() {
    $('#'+id.wrapperCalc).hide();
  }
  
  function calcShow() {
    $('#'+id.wrapperCalc).show();
  }
  
  function dosing5mgHide() {
    console.log('hidding 5m');
    $('#'+id.wrapperDosing5mg).hide();
  }
  
  function dosing5mgShow() {
    $('#'+id.wrapperDosing5mg).show();
  }
  
  function isDosing5mg() {
    if ($('#'+id.dosing5mg+' option:selected').text() == 'Yes') {
        return true;
    }
    
    return false;    
  }
  /*
   * status - true or false
   */
  function setDosing5mg(status) {
    var yes = $('#'+id.dosing5mg+' option:eq(1)').val();
    var no = $('#'+id.dosing5mg+' option:eq(0)').val();
    
    if (status) {
        $('#'+id.dosing5mg).val(yes);
    } else {
        $('#'+id.dosing5mg).val(no);
    }
    
    $('#'+id.dosing5mg).flipswitch('refresh');
  }
  
  function onDosing5mgChange() {
    if (isDosing5mg()){
      // setUIDosingMode5mg();
      dosingUIShow();
      msgHide();
    } else {
      // setUIDosingModeTxt();
      dosingUIHide();
      setMsg('Only dosing using 5mg tabs currently supported.');
      msgShow();
    }    
  }
  
  function getINRGoal() {
    return $('#'+id.inrGoal+' option:selected').val();
  }
  
  /*
   * inrGoal - value of option; if not set, will  
   */
  function setINRGoal(index) {
    if (typeof index === 'undefined') {
      $('#'+id.inrGoal).val('0');
    } else {
      var tmp = $('#'+id.inrGoal+' option:eq('+index+')').val();
      $('#'+id.inrGoal).val(tmp);
    }
    
    $('#'+id.inrGoal).selectmenu('refresh', true);    
  }
  
  function onINRGoalChange() {
    var goal = getINRGoal();
    
    initINRResultRange(goal);
    warfarin.calc.setINRGoalIndex(goal);
    
    clearNewWeeklyDose();
  }
  
  function dosingUIHide() {
    $('#'+id.wrapperDosingUI).hide();
  }
  
  function dosingUIShow() {
    $('#'+id.wrapperDosingUI).show();
  }

/*
 * Returns current weekly dose base on 5 mg pills in string format
 */
  function getCurrentWeeklyDose5mg() {
    var dose = $('#'+id.currentWeeklyDose5mg+' option:selected').text();
    
    if (dose == '-select-') {
        return 0;
    } else {
        return dose.split(' ')[0];
    }
  }

  function setCurrentWeeklyDose5mg(dose) {
    var val, txt;
      
    if (typeof dose === 'undefined') {
      $('#'+id.currentWeeklyDose5mg).val('0');
    } else {
      dose = parseFloat(dose);
      
     for (var i = 0; i < $('#'+id.currentWeeklyDose5mg+' option').length; i++) {
          txt = $('#'+id.currentWeeklyDose5mg+' option:eq('+i+')').text();
          if (parseFloat(txt) == dose) {
              val = $('#'+id.currentWeeklyDose5mg+' option:eq('+i+')').val();
              $('#'+id.currentWeeklyDose5mg).val(val);
              break;
          }
      }
    } 
      
    $('#'+id.currentWeeklyDose5mg).selectmenu('refresh', true);
  }
  
  function onCurrentWeeklyDose5mgChange() {
      if (!isDosing5mg()) {
          return;
      }
     
      var dose = getCurrentWeeklyDose5mg();
      console.log(dose);
      setCurrentWeeklyDoseSchedule(warfarin.calc.getDoseString(dose));
      
      var inrRange = getINRResult();
      if (inrRange >= 0 && dose > 0) {
        calcINR();
      } else if (dose == 0) {
        setNewWeeklyDose5mg();
        setNewWeeklyDoseComment('');
        setNewWeeklyDosePercent('');
        setNewWeeklyDoseSchedule();
      }
  }
/*
 * Returns current weekly dose base on 5 mg pills in string format
 */
  function getNewWeeklyDose5mg() {
      var dose = $('#'+id.newWeeklyDose5mg+' option:selected').text();
      
      if (dose == '-select-') {
          return 0;
      } else {
          return dose.split(' ')[0];
      }
  }
  
  
  // if dose is not set - reset the control
  function setNewWeeklyDose5mg(dose) {
    var val, txt;
    
    if (typeof dose === 'undefined') {
      $('#'+id.newWeeklyDose5mg).val('0');
    } else {
     dose = parseFloat(dose);
     for (var i = 0; i < $('#'+id.newWeeklyDose5mg+' option').length; i++) {
          txt = $('#'+id.newWeeklyDose5mg+' option:eq('+i+')').text();
          if (parseFloat(txt) == dose) {
              val = $('#'+id.newWeeklyDose5mg+' option:eq('+i+')').val();
              $('#'+id.newWeeklyDose5mg).val(val);
              break;
          }
      }      
    }
  
    $('#'+id.newWeeklyDose5mg).selectmenu('refresh', true); 
  }
    
  /*
   * Add values to current weekly dose control
   */
  function initCurrentWeeklyDose5mg() {
    for (var i = 10; i < 110; i+= 2.5) {
      $('<option value="'+i.toFixed(1)+'">'+i.toFixed(1)+'</option>').appendTo('#'+id.currentWeeklyDose5mg);
    }  
  }
  
  function setCurrentWeeklyDoseSchedule(dose) {
    if (typeof dose === 'undefined') {
      $('#'+id.currentWeeklyDoseSchedule).html('Select a weekly dose');
    } else {
      $('#'+id.currentWeeklyDoseSchedule).html(dose);
    }
  }
  
  function currentWeeklyDose5mgShow() {
    $('#'+id.wrapperCurrentWeeklyDose5mg).show();    
  } 
  
  function currentWeeklyDose5mgHide() {
    $('#'+id.wrapperCurrentWeeklyDose5mg).hide();
  } 
  
  function currentWeeklyDoseTxtShow() {
    $('#'+id.wrapperCurrentWeeklyDoseTxt).show();
  }
  
  function currentWeeklyDoseTxtHide() {
    $('#'+id.wrapperCurrentWeeklyDoseTxt).hide();
  }
  
  function initINRResultRange(index) {
    var range;
    
    // First remove all options
    $('#'+id.inrResult+ ' option').remove();
    
    $('<option value="-1">-select-</option>').appendTo('#'+id.inrResult);
    
    range = warfarin.calc.getINRResultRangeStr(index);
    for (var k in range) {
      $('<option value= "'+k+'">'+range[k]+'</option>').appendTo('#'+id.inrResult);
    }
    
    $('#'+id.inrResult).selectmenu('refresh', true);
  }

  function initNewWeeklyDose5mg() {
    for (var i = 10; i < 110; i+= 2.5) {
      $('<option value="'+i.toFixed(1)+'">'+i.toFixed(1)+'</option>').appendTo('#'+id.newWeeklyDose5mg);
    }  
  }

  function onNewWeeklyDose5mgChange() {
    var currentDose, newDose, delta, str;
    
    if (!isDosing5mg()) {
        return;
    }
   
    newDose = getNewWeeklyDose5mg();
    setNewWeeklyDoseSchedule(warfarin.calc.getDoseString(newDose));
    
    currentDose = getCurrentWeeklyDose5mg();
    
    if (currentDose && newDose) {
      delta = newDose - currentDose;
      if (delta >= 0) {
        str = newDose + ' mg = ';
        str += ((delta/currentDose)*100).toFixed(1);
        str += '% increase';
      } else {
        str = newDose + ' mg = ';
        str += (-(delta/currentDose)*100).toFixed(1);
        str += '% decrease';
      }
      setNewWeeklyDosePercent(str);
    } else {
      setNewWeeklyDosePercent('');
    }
  }
  
  function setNewWeeklyDoseSchedule(dose) {
    if (typeof dose === 'undefined') {
      $('#'+id.newWeeklyDoseSchedule).html('Select a weekly dose');
    } else {
      $('#'+id.newWeeklyDoseSchedule).html(dose);    
    }
  }
  
  function getINRResult() {
      return $('#'+id.inrResult+' option:selected').val();
  }
  
  function setINRResult(index) {
    if (typeof index === 'undefined') {
      $('#'+id.inrResult).val('-1');
    } else {
      var tmp = $('#'+id.inrResult+' option:eq('+index+')').val();
      $('#'+id.inrResult).val(tmp);
    }
    
    $('#'+id.inrResult).selectmenu('refresh', true);
  }
  
  function onINRResultChange() {
    var inrRange, dose;
    
    inrRange = getINRResult();
    dose = getCurrentWeeklyDose5mg();
    
    if (inrRange == '-1') {
      setNextINRDateComment('');
      setNextINRDate();
      clearNewWeeklyDose();
      newWeeklyDosePanelShow();
      setNewWeeklyDoseMessage('');
    } else {
      if (dose > 0) {
        calcINR();      
      }
      setNextINRDateComment(warfarin.calc.getNextDateString(inrRange));
      setNewWeeklyDoseComment(warfarin.calc.getDoseChangeString(inrRange));
    }
  }
  
  function getINRDate() {
      var dateTxt, date;
      
      dateTxt = $('#'+id.inrDate).val();
      
      return new Date(dateTxt);
  }
  
  function setINRDate(date) {
      console.log(date);
  
      if (date instanceof Date) {
          // $('#'+Warfarin.UI.id.inrDate).val(date.toLocaleDateString()).change();
          $('#'+id.inrDate)[0].valueAsDate = date;
      } else {
          $('#'+id.inrDate).val(date).change();
      }
  }
  
  function onINRDateChange(evt) {
    var inrRange, dose;
    
    dose = getCurrentWeeklyDose5mg();
    inrRange = getINRResult();
    
    if (inrRange >= 0 && dose > 0) {
      calcINR();
    }
  }
  
  function getDoseAdjustment() {
      var yes = $('#'+id.doseAdjustment+' option:eq(1)').val();
      
      return ($('#'+id.doseAdjustment+' option:selected').val() == yes);
  }
  
  function setDoseAdjustment(status) {
      var yes = $('#'+id.doseAdjustment+' option:eq(1)').val();
      var no = $('#'+id.doseAdjustment+' option:eq(2)').val();
      
       $('#'+id.doseAdjustment).val(status ? yes : no);
  }
  
  function getNewWeeklyDosePercent() {
    return $('#'+id.newWeeklyDosePercent).html();
  }
  
  function setNewWeeklyDosePercent(text) {
    $('#'+id.newWeeklyDosePercent).html(text);
  }
  
  
  function getNewWeeklyDoseComment() {
    return $('#'+Warfarin.UI.id.newWeeklyDoseComment).html();
  }
  
  function setNewWeeklyDoseComment(text) {
    $('#'+id.newWeeklyDoseComment).html(text);
  }
  
  function getNextINRDate() {
      var dateTxt, date;
      
      dateTxt = $('#'+id.nextINRDate).val();
      
      return new Date(dateTxt);    
  }
  
  function setNextINRDate(date) {
      if (date instanceof Date) {
          $('#'+id.nextINRDate)[0].valueAsDate = date;
      } else {
          $('#'+id.nextINRDate).val(date).change();
      }
  }
  
  function getNextINRDateComment() {
      return  $('#'+id.nextINRComment).html();
  }
  
  function setNextINRDateComment(text) {
      $('#'+id.nextINRComment).html(text);
  }
  
  function clearNewWeeklyDose() {
    setNewWeeklyDose5mg();
    setNewWeeklyDoseComment('');
    setNewWeeklyDosePercent('');
    setNewWeeklyDoseSchedule();
    setNextINRDateComment('');
    setNextINRDate();
  }
  
  function newWeeklyDosePanelShow() {
    $('#'+id.newWeeklyDosePanel).show();
  }

  function newWeeklyDosePanelHide() {
    $('#'+id.newWeeklyDosePanel).hide();
  }
  
  function setNewWeeklyDoseMessage(text) {
    $('#'+id.newWeeklyDoseMessage).html(text);
  }


  function newWeeklyDose5mgShow() {
    $('#'+id.wrapperNewWeeklyDose5mg).show();    
  } 
  
  function newWeeklyDose5mgHide() {
    $('#'+id.wrapperNewWeeklyDose5mg).hide();
  } 
  
  function newWeeklyDoseTxtShow() {
    $('#'+id.wrapperNewWeeklyDoseTxt).show();
  }
  
  function newWeeklyDoseTxtHide() {
    $('#'+id.wrapperNewWeeklyDoseTxt).hide();
  }
  
  function setUIDosingMode5mg() {
    currentWeeklyDose5mgShow();
    currentWeeklyDoseTxtHide();
    newWeeklyDose5mgShow();
    newWeeklyDoseTxtHide();
  }
  
  function setUIDosingModeTxt() {
    currentWeeklyDose5mgHide();
    currentWeeklyDoseTxtShow();
    newWeeklyDose5mgHide();
    newWeeklyDoseTxtShow();    
  }
  
  function msgShow() {
    $('#'+id.wrapperMsg).show();
  }
  
  function msgHide() {
    $('#'+id.wrapperMsg).hide();
  }
  
  function setMsg(msg) {
    $('#'+id.msg).html(msg);
  }
  
  function calcINR() {
    var dose, inrRange, newDose, newDoseComment, nextDateComment, inrDate;
    
    if (!isDosing5mg()) {
      msgInr('To use dosing calculator you must use 5 mg dosing schedule.');
      return;
    }
    
    dose = getCurrentWeeklyDose5mg();
    if (dose == '-select-') {
      msgInr('You must select current dose.');
      return;        
    }
    
    inrRange = getINRResult();
    if (inrRange == '-select-') {
      msgInr('You must select INR result.');
      return;        
    }

    newDose = warfarin.calc.calcNewDose(inrRange, dose);
    if (newDose) {
      newWeeklyDosePanelShow();
      setNewWeeklyDoseMessage('');
      setNewWeeklyDose5mg(newDose);
      onNewWeeklyDose5mgChange();
      var nextINR = warfarin.calc.getNextDateDefault(inrRange);
      if (typeof nextINR !== 'undefined') {
        var inrDate = getINRDate();
        if (inrDate.valueOf() !== NaN) {
          inrDate.setDate(inrDate.getDate()+nextINR);
          setNextINRDate(inrDate);
        }
      } else {
        // Reset INR date
        setNextINRDate();        
      }       
    } else {
      newWeeklyDosePanelHide();
      setNewWeeklyDoseMessage("Hold warfarin therapy, give vitamin K1 5 to 10 mg orally, monitor frequently.  Resume at lower dose when INR is therapeutic");
    }
  }
  
  function reset() {
    // set bleeding to no
    setBleeding(false);
    // defualt goal is 2-3
    setINRGoal(0);
    // default dosing is 5 mg
    setDosing5mg(true);
    
    setCurrentWeeklyDose5mg();
    setCurrentWeeklyDoseSchedule();

    setINRResult();
    setINRDate();
    
    
    newWeeklyDosePanelShow();
    clearNewWeeklyDose();
    setNewWeeklyDoseMessage('');
  }
  
  // function msgInr(txt) {
      // $('#'+id.inrMsg).dialog('option', 'title', 'INR Message');
      // if (typeof txt == 'string') {
          // $('#'+id.inrMsg).text(txt);
      // }
      // $('#'+id.inrMsg).dialog('open');    
  // }
  
  // Public interface
  var pub = {};
  
  pub.initINRCalc = function () {
    initCurrentWeeklyDose5mg();
    initNewWeeklyDose5mg();
    // default mode is 5mg dosing
    setUIDosingMode5mg();
    // Hide the interface to change the dosig mode
    dosing5mgHide();
    // Default INR target is 0
    initINRResultRange(0);
    
    $('#'+id.bleeding).change(onBleedingChange);
    $('#'+id.dosing5mg).change(onDosing5mgChange);
    $('#'+id.inrGoal).change(onINRGoalChange);
    
    $('#'+id.currentWeeklyDose5mg).change(onCurrentWeeklyDose5mgChange);
    $('#'+id.newWeeklyDose5mg).change(onNewWeeklyDose5mgChange);
    $('#'+id.inrResult).change(onINRResultChange);
    $('#'+id.inrDate).change(onINRDateChange);
    // Hide the calculate button.  Not currently used
    $('#'+id.calc).click(calcINR).hide();
    // Bind 
    $('#'+id.reset).click(reset);

  };
  
  pub.t1 = onBleedingChange;
  pub.t2 = calcShow;
  pub.t3 = initINRResultRange;

  
  return pub; 
  
})();

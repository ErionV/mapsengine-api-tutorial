//Javascript file for tutorial
//THE GLOBAL VARIABLES

var userAPIKey = "";
var activeLesson;
var placeholder = "Enter your input here, press enter or click 'Get' to submit.";

//object to store lesson information
function Lesson(divID, options) {
  this.divID = divID;
  this.title = options.title;
  if (options.submit) {
    this.submit = options.submit;
  }
  //done is TRUE if: the user has submitted correctly
  this.done = false;
  this.unlocked = false;
}

Lesson.prototype.update = function() {
  //if the lesson is still unlocked, it can't be accessed
  if (!this.unlocked) return;
  //else, the lesson can be accessed
  $('.response').empty();
  activeLesson = this;
  document.title = this.title;
  $("#"+this.divID).css({display : "block"});

  //update buttons
  if ($("#"+this.divID+'button').is(":hidden")) {
    hideLessons('medium');
    var lesson = this.chapter.lessons;
    lesson.forEach(function(lesson) {
      $('#' + lesson.divID + 'button').show('medium');
    })
  }
  //make text on button for active lesson red, and all others black
  chapters.forEach(function(chapter) {
    chapter.lessons.forEach(function(lesson) {
      $("#"+lesson.divID+'button').removeClass('active');
      if (lesson.unlocked) {
        $("#"+lesson.divID+'button').addClass('unlocked');
      }
    });
  });
  $("#"+this.divID+'button').removeClass('unlocked').addClass('active');
  //display the instruction blurb
  this.displayInstructions();

  localStorage['currentLesson'] = activeLesson.divID;
  $(".url").focusout();
  if (localStorage[this.divID + 'input']){
    $(".url").addClass("url-content")
          .removeClass("placeholder"); 
    $(".url").text(localStorage[this.divID + 'input']);
  } else{
    $(".url").addClass("placeholder")
          .removeClass("url-content");
    $(".url").text(placeholder);
  }
}

// Displays the instructions, possibly loading them from the markdown file.
Lesson.prototype.displayInstructions = function() {
  var me = this;

  // If the instructions aren't loaded, load them.
  if (!this.instructions){
    $.get(this.divID+".md", function(response){
      me.instructions = response;
      me.displayInstructions();
    });
  }

  if (this.instructions) {
    $(".instructions").html(markdown.toHTML(this.instructions));
  }
}

//Give the submit prototype for the lessons that does not have submission function
//the submit button will call the update function for those lessons
Lesson.prototype.submit = function() {
  this.update();
};

Lesson.prototype.complete = function() {
  this.done = true; 
  localStorage[this.divID] = true;
  this.next.unlock();
  this.tick();
  this.chapter.tickIfComplete();
}

Lesson.prototype.tick = function() {
   $('#'+this.divID+'button').css('background-image', 'url(http://www.sxc.hu/assets/183254/1832538623/green-tick-in-circle-1335495-m.jpg)');
}

//marks a lesson as unlocked
Lesson.prototype.unlock = function(){
  this.unlocked = true;
  $("#"+this.divID+'button').removeClass('locked').addClass('unlocked');
  $("#"+this.chapter.divID+'button').removeClass('locked').addClass('unlocked');
};

//Object to store chapter information
function Chapter(divID, options) {
  this.divID = divID;
  this.lessons = options.lessons;
  this.title = options.title;
  this.done = false;
}

//Chapter update, call update for the first lesson in the chapter
Chapter.prototype.update = function() {
  this.lessons.forEach(function(lesson) {
    $('#' + lesson.divID + 'button').toggle('medium');
  })
  this.lessons[0].update();
}

Chapter.prototype.tick = function() {
   $('#'+this.divID+'button').css('background-image', 'url(http://www.sxc.hu/assets/183254/1832538623/green-tick-in-circle-1335495-m.jpg)');
}

//checks if a chapter is complete and, as a result, if the tutorial is also complete
Chapter.prototype.tickIfComplete = function() {
  this.done = true;
  var me = this;
  this.lessons.forEach(function(lesson) {
    if (!lesson.done) {
      me.done = false;
    }
  });
  if (this.done) {
    me.tick();
    me.checkTutorialCompletion();
  }
}

Chapter.prototype.checkTutorialCompletion = function() {
  var finished = true;
  chapters.forEach(function(chapter) {
    if (!chapter.done) {
      finished = false;
    }
  });
  //make sure user only sees completion message once
  if (finished && !localStorage['finished']) {
    alert("Congratulations, you have completed this tutorial!");
    localStorage['finished'] = true;
  }
}

//ARRAY OF CHAPTERS
var chapters = [
  new Chapter('chapter0-intro', {title: 'Introduction', lessons: [
    new Lesson('lesson1-gmeapi', {title: 'GME API', submit: getText}),
    new Lesson('lesson2-apikey', {title: 'API Key', submit: testAPIKey})
  ]}),
  new Chapter('chapter1-read', {title: 'Reading Public Data', lessons: [
    new Lesson('lesson3-gettable', {title: 'Get Table', submit: testGetTable}),
    new Lesson("lesson4-listfeatures", {title: "List Features", submit: executeListInput}),
    new Lesson("lesson5-queries", {title: "Queries", submit: executeQueries}),
  ]})
];

//Determining the next, and chapter for each lesson
var prevLesson = chapters[0].lessons[0]; //first lesson
chapters.forEach(function(chapter){
  chapter.lessons.forEach(function(lesson){
    lesson.chapter = chapter;
    prevLesson.next = lesson;
    prevLesson = lesson;
  });
});
//last lesson
prevLesson.next = prevLesson;

//*****************THE GLOBAL FUNCTIONS**********************//
google.maps.event.addDomListener(window, 'load', function initialize(){
  //create the HTML elements
  chapters.forEach(function(chapter){
    makeButton(chapter, "chapter-button");
    chapter.lessons.forEach(function(lesson){
      makeButton(lesson, "lesson-button");
    });
  });

  var $input = $(".url");
  //create placeholder for the input
  $input.focus(function(){
    if($input.text()===placeholder){
      $input.addClass("url-content")
            .removeClass("placeholder");
      $input.text("");
    }
  })
  .focusout(function(){
    if(!$input.text().length){
      $input.addClass("placeholder")
            .removeClass("url-content");
      $input.text(placeholder);
    }
  });  

  //store the input everytime it changes, to the respective local storage
  //onkeypress
  $input.keypress(function(event){
    //enable submit by enter, not making the enter visible in the input
    if(event.which == 13){
      event.preventDefault();
      activeLesson.submit();
    }
    localStorage[activeLesson.divID+'input'] = $input.text();
  });
  //onkeyup -> handle backspaces
  $input.keyup(function(){
    localStorage[activeLesson.divID+'input'] = $input.text();
  });
  //on cut, and also pasting with mouse
  $input.on('paste cut',function(){
    setTimeout(function(){
      localStorage[activeLesson.divID+'input'] = $input.text();
      $input.text($input.text());
    },0);
  });

  //The first page shown is the first lesson
  hideLessons(0);
  loadState();
});

function loadState() {
  //enable the first lesson on first load
  chapters[0].lessons[0].unlock();
  localStorage[chapters[0].lessons[0].divID] = true;
  var activeLessonId = localStorage['currentLesson'] || 'lesson0-intro';
  chapters.forEach(function(chapter) {
    chapter.lessons.forEach(function(lesson) {
      //if lesson is completed, stored as 'true'
      if (localStorage[lesson.divID]) {
        lesson.complete();
      }
      if (lesson.divID === activeLessonId) {
        lesson.update();
      }
    });
  });
}

//Create the menu button for each lesson & chapter
function makeButton(object, objectClass){
  var button = $(".buttons");
  var newButton = $("<input>")
    .attr("type", "button")
    .attr("id", object.divID+"button")
    .attr("value", object.title)
    .addClass("menu-button " + objectClass + " locked")
    .click(function(){
      object.update();
    });
  button.append(newButton);
}

//Hides the lesson buttons within the chapter
function hideLessons(speed) {
  chapters.forEach(function(chapters) {
    var lessons = chapters.lessons;
    lessons.forEach(function(lessons) {
      $('#' + lessons.divID + 'button').hide(speed);
    })
  })
}

//Trim the pre white spaces in the user input
function trimLeft(string){
  return string.replace(/^\s+/, '');
}

//*****************THE GME API FUNCTIONS**********************//
function getText() {
  var string = $(".url").text();
  var address = trimLeft(string);
  var $data = $('.response');
  $data.css({ whiteSpace: 'pre' });
  var me = this;
  jQuery.ajax({
  url: address,
    dataType: 'html',
    success: function(resource) {
      alert("Nice work! You sent a successful request!");
      $data.append(resource);
      me.complete();
    },
    error: function(response) {
      alert("Sorry that was unsuccessful, try typing 'alice-in-wonderland.txt'.");
    }
  });
}

//*****************THE API Key FUNCTIONS**********************//
function testAPIKey() {
  //get user input
  var userKey = $(".url").text();
  var $data = $('.response');
  var me = this;
  //use user's API Key to do a HTTP request, if it works then it is a valid API Key
  jQuery.ajax({
  url: 'https://www.googleapis.com/mapsengine/v1/tables/15474835347274181123-14495543923251622067/features?version=published&key=' + userKey,
    dataType: 'json',
    success: function(resource) {
      alert("Congrats! Your API Key works. Now continue on to Get Table!");
      userAPIKey = userKey;
      me.complete();
    },
    error: function(response) {
      alert("Sorry your API Key did not work. Try again!");
    }
  });
}

//*****************THE Get Table FUNCTIONS**********************//
  
function testGetTable() {
  //get user input and trim it
  var string = $(".url").text();
  var $data = $('.response');

  var address = trimLeft(string);
  var correctAns = "https://www.googleapis.com/mapsengine/v1/tables/15474835347274181123-14495543923251622067?version=published&key=AIzaSyAllwffSbT4nwGqtUOvt7oshqSHowuTwN0";
  //the Get Table is currently NOT AVAILABLE in v1, will someday be available and this 2 line codes needs to be removed
  address = address.replace("v1","search_tt");
  correctAns = correctAns.replace("v1","search_tt");
  checkCorrectness(this, address, correctAns);
}

//*****************THE List Features FUNCTIONS**********************//
function executeListInput(){
  //get user input and trim it
  var string = $(".url").text();
  var address = trimLeft(string);
  var correctAns = "https://www.googleapis.com/mapsengine/v1/tables/15474835347274181123-14495543923251622067/features?version=published&key=AIzaSyAllwffSbT4nwGqtUOvt7oshqSHowuTwN0";
  checkCorrectness(this, address, correctAns);
}

//*****************THE Query FUNCTIONS**********************//

function executeQueries(){
  //get user input and trim it
  var string = $(".url").text();
  var address = trimLeft(string);
  var correctAns = "https://www.googleapis.com/mapsengine/v1/tables/15474835347274181123-14495543923251622067/features?version=published&key=AIzaSyAllwffSbT4nwGqtUOvt7oshqSHowuTwN0&where=Population<2000000";
  checkCorrectness(this, address, correctAns);
}

//*****************CHECKING CORRECT INPUT*******************//
function checkCorrectness(lesson, addressString, correctAns){
  var $data = $('.response');
  //style the output div
  $data.css({ whiteSpace: 'pre' });
  $data.empty();
  //Get the response with the correct URL
  jQuery.ajax({
    url: correctAns,
    dataType: 'json',
    success: function(resource) {
      var correctResourceString = JSON.stringify(resource, null, 2);
      //Get the response with users's input
      jQuery.ajax({
        url: addressString,
        dataType: 'json',
        success: function(resource2) {
          var resourceString = JSON.stringify(resource2, null, 2);
          $data.append(resourceString);
          //if the response user got is the correct response, then the user is right!
          if(resourceString === correctResourceString){
            alert("Great work! You can move on to the next lesson.");
            lesson.complete();
          } else {
            alert("Oops! You've entered wrong URL! Try again!");
          }
        },
        error: function(response) {
          alert ("Oops! You've entered wrong URL! Try again!");
          $data.append("Wrong URL\n");
          //Output the HTTP status
          $data.append("HTTP Status: "+response.status);
          response = JSON.parse(response.responseText);
          var errorMess = response.error.errors[0];
          //Giving messages for different error reasons
          if (errorMess.reason === "authError") {
            $data.append("\nYour authorization token is invalid. \nPlease check that the table can be viewed by general public\n\n");
          } else if (errorMess.reason === "invalid") {
            var field = errorMess.location;
            $data.append("\nInvalid value in the \""+field+"\" field.\nCheck whether you've given the right tableId\n\n");
          } else {
            $data.append("\nThe data cannot be processed. See the details below for the information regarding the error:\n\n");
          }
          var responseString = JSON.stringify(errorMess, null, 2);
          $data.append(responseString);
        }
      });
    }
  });
}
